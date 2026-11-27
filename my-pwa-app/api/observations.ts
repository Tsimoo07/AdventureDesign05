import type { IncomingMessage, ServerResponse } from "node:http";
import { hasObservationCache, readHall2Observation, SCAN_WINDOWS, updateHall2Observation } from "../server/hall2-observation.ts";

const MAX_BODY_BYTES = 8192;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readObservation(body: unknown) {
  if (!isObject(body)) return null;
  const { configVersion, windowStart, durationSec, scanSec, count, rssiCounts,
    averageWindowSec, averageCount, averageRssiCounts } = body;
  if (configVersion !== 3 || durationSec !== 30 || averageWindowSec !== 5 ||
      typeof scanSec !== "number" || !(scanSec > 0 && scanSec <= durationSec)) return null;

  if (typeof windowStart !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:(00|30)Z$/.test(windowStart)) return null;
  const timestamp = new Date(windowStart);
  if (!Number.isFinite(timestamp.getTime()) || timestamp.toISOString() !== windowStart.replace("Z", ".000Z")) return null;

  if (typeof count !== "number" || !Number.isInteger(count) || count < 0 || count > 0xffffffff ||
      typeof averageCount !== "number" || averageCount !== count / SCAN_WINDOWS ||
      !isObject(rssiCounts) || !isObject(averageRssiCounts)) return null;

  const bins = Object.entries(rssiCounts);
  if (bins.length !== Object.keys(averageRssiCounts).length) return null;
  let sum = 0;
  for (const [rssi, hits] of bins) {
    const dbm = Number(rssi);
    if (!Number.isInteger(dbm) || String(dbm) !== rssi || dbm < -127 || dbm > 20 ||
        typeof hits !== "number" || !Number.isInteger(hits) || hits <= 0 || hits > count ||
        !Object.hasOwn(averageRssiCounts, rssi) || averageRssiCounts[rssi] !== hits / SCAN_WINDOWS) return null;
    sum += hits;
  }
  if (sum !== count) return null;

  return { configVersion, windowStart, durationSec, scanSec, count, averageCount, rssiCounts, averageRssiCounts };
}

export default async function observations(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  const send = (status: number, data: unknown) => {
    res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    res.end(JSON.stringify(data));
  };

  if (req.method === "GET") {
    if (!hasObservationCache()) return send(503, { error: "observation_cache_unavailable" });
    try {
      return send(200, { observation: await readHall2Observation() });
    } catch {
      return send(503, { error: "observation_cache_unavailable" });
    }
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return send(405, { error: "method_not_allowed" });
  }
  if (req.headers["content-type"]?.split(";", 1)[0]?.trim().toLowerCase() !== "application/json") {
    return send(415, { error: "expected_json" });
  }
  if (Number(req.headers["content-length"]) > MAX_BODY_BYTES) {
    return send(413, { error: "body_too_large" });
  }

  let body = req.body;
  try {
    if (body === undefined) {
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of req) {
        const bytes = Buffer.from(chunk);
        size += bytes.length;
        if (size > MAX_BODY_BYTES) return send(413, { error: "body_too_large" });
        chunks.push(bytes);
      }
      body = Buffer.concat(chunks);
    }
    if (Buffer.isBuffer(body)) body = body.toString("utf8");
    if (typeof body === "string") {
      if (Buffer.byteLength(body) > MAX_BODY_BYTES) return send(413, { error: "body_too_large" });
      body = JSON.parse(body);
    }
  } catch {
    return send(400, { error: "invalid_json" });
  }

  const observation = readObservation(body);
  if (!observation) return send(400, { error: "invalid_v3_observation" });

  console.info("ESP32 observation received", JSON.stringify(observation));
  let latestUpdated = false;
  if (hasObservationCache()) {
    if (Date.parse(observation.windowStart) + observation.durationSec * 1000 > Date.now() + 5000) {
      return send(400, { error: "observation_in_future" });
    }
    try {
      latestUpdated = await updateHall2Observation({
        windowStart: observation.windowStart,
        rssiCounts: observation.rssiCounts as Record<string, number>,
      });
    } catch {
      return send(503, { error: "observation_cache_unavailable" });
    }
  }
  return send(200, {
    status: "received",
    windowStart: observation.windowStart,
    averageCount: observation.averageCount,
    latestUpdated,
  });
}
