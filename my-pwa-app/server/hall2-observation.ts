const KEY = "bapgil:hall2:latest:rssi";
const FRESH_SECONDS = 120;
export const SCAN_WINDOWS = 5;
const WRITE_LATEST = `
local previous = redis.call("GET", KEYS[1])
if previous and cjson.decode(previous).windowStart >= ARGV[1] then return 0 end
redis.call("SET", KEYS[1], ARGV[2], "EX", ARGV[3])
return 1
`;

export interface Hall2Observation {
  windowStart: string;
  rssiCounts: Record<string, number>;
}

export function hasObservationCache() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function redisCommand(command: (string | number)[]) {
  const response = await fetch(process.env.UPSTASH_REDIS_REST_URL!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(3000),
  });
  if (!response.ok) throw new Error("Observation cache request failed");
  const body = await response.json() as { result?: unknown; error?: string };
  if (body.error || !Object.hasOwn(body, "result")) throw new Error("Invalid observation cache response");
  return body.result;
}

export async function updateHall2Observation(observation: Hall2Observation) {
  const result = await redisCommand([
    "EVAL", WRITE_LATEST, 1, KEY, observation.windowStart, JSON.stringify(observation), FRESH_SECONDS,
  ]);
  if (result !== 0 && result !== 1) throw new Error("Invalid observation write response");
  return result === 1;
}

export async function readHall2Observation() {
  const result = await redisCommand(["GET", KEY]);
  if (result === null) return null;
  if (typeof result !== "string") throw new Error("Invalid cached observation");
  const { windowStart, rssiCounts } = JSON.parse(result) as Hall2Observation;
  const end = Date.parse(windowStart) + 30000;
  if (!Number.isFinite(end) || !rssiCounts) throw new Error("Invalid cached observation");
  if (Date.now() - end >= FRESH_SECONDS * 1000) return null;

  const configuredSplit = Number(process.env.HALL2_RSSI_SPLIT_DBM || "-70");
  const split = Number.isFinite(configuredSplit) && configuredSplit >= -127 && configuredSplit <= 20
    ? configuredSplit : -70;
  let moderate = Number(process.env.HALL2_MODERATE_MIN || "500");
  let busy = Number(process.env.HALL2_BUSY_MIN || "1000");
  if (!Number.isFinite(moderate) || !Number.isFinite(busy) || moderate <= 0 || busy <= moderate) {
    moderate = 500;
    busy = 1000;
  }

  let diningCount = 0;
  let servingCount = 0;
  for (const [rssi, count] of Object.entries(rssiCounts)) {
    if (Number(rssi) > split) diningCount += count;
    else servingCount += count;
  }
  const level = (value: number) => value >= busy ? "danger" : value >= moderate ? "warning" : "normal";
  const dining = diningCount / SCAN_WINDOWS;
  const serving = servingCount / SCAN_WINDOWS;
  return {
    windowStart,
    averageCount: (diningCount + servingCount) / SCAN_WINDOWS,
    level: level(Math.max(dining, serving)),
    dining: { averageCount: dining, level: level(dining) },
    serving: { averageCount: serving, level: level(serving) },
  };
}
