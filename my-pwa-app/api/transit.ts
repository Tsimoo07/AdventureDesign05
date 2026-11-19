import type { IncomingMessage, ServerResponse } from "node:http";

export default async function transit(req: IncomingMessage & {body?: unknown}, res: ServerResponse, key = process.env.KAKAO_REST_API_KEY) {
  const send = (status: number, data: unknown) => {
    res.writeHead(status, {"Content-Type":"application/json", "Cache-Control":"no-store"});
    res.end(JSON.stringify(data));
  };
  if (req.method !== "POST") return send(405, {error:"POST 요청만 지원합니다."});
  if (!req.headers["content-type"]?.startsWith("application/json")) return send(415, {error:"JSON 요청이 필요해요."});
  let lat: number, lng: number, startLat: number, startLng: number;
  try {
    let body = req.body;
    if (body === undefined) {
      let raw = "";
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 1024) return send(413, {error:"요청이 너무 커요."});
      }
      body = raw;
    }
    ({lat,lng,startLat = 36.368,startLng = 127.344} = typeof body === "string" ? JSON.parse(body) : body);
    if (!Number.isFinite(startLat) || Math.abs(startLat)>90 || !Number.isFinite(startLng) || Math.abs(startLng)>180 || !Number.isFinite(lat) || Math.abs(lat)>90 || !Number.isFinite(lng) || Math.abs(lng)>180) throw Error();
  } catch { return send(400,{error:"집 위치를 다시 확인해 주세요."}); }
  if (!key) return send(503,{error:"길찾기 연결을 준비 중이에요."});
  try {
    const params = new URLSearchParams({start_x:String(startLng),start_y:String(startLat),end_x:String(lng),end_y:String(lat)});
    const response = await fetch("https://dapi.kakao.com/v2/routing/publictraffic?"+params,{headers:{Authorization:"KakaoAK "+key},signal:AbortSignal.timeout(10000)});
    if (!response.ok) throw Error();
    const data = await response.json() as {status:string;routes?:{properties:{totalTime:number};steps:{properties:{type:string;guidance?:string;vehicles?:{name:string}[];stops?:{name:string}[];time:number}}[]}[]};
    const route = data.routes?.[0];
    if (data.status !== "OK" || !route) return send(404,{error:"이 구간의 대중교통 경로를 찾지 못했어요."});
    if (!Number.isFinite(route.properties.totalTime) || !Array.isArray(route.steps)) throw Error();
    const boardingStep = route.steps.find(step => ["BUS","SUBWAY"].includes(step.properties.type)) as (typeof route.steps[number] & {path?:{points?:number[][]}}) | undefined;
    const point = boardingStep?.path?.points?.[0];
    const name = boardingStep?.properties.stops?.[0]?.name;
    const boarding = name && point && Number.isFinite(point[0]) && Number.isFinite(point[1]) && Math.abs(point[0])<=180 && Math.abs(point[1])<=90
      ? {name,lng:point[0],lat:point[1]} : null;
    const legs = route.steps.map(({properties:p}: {properties:{type:string; guidance?:string; vehicles?:{name:string}[]; stops?:{name:string}[]; time:number}}) =>
      p.type === "WALKING" ? {title:"도보 "+Math.ceil(p.time/60)+"분"} : {
        title:p.vehicles?.map(v=>v.name).join(" / ") || p.guidance || "대중교통",
        from:p.stops?.[0]?.name, to:p.stops?.at(-1)?.name,
      });
    send(200,{minutes:Math.ceil(route.properties.totalTime/60),legs,boarding});
  } catch { send(502,{error:"경로를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요."}); }
}
