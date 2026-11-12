import type { IncomingMessage, ServerResponse } from "node:http";
import { shareIdentifier } from "../src/features/timetable/model.ts";
export async function everytime(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) {
  if (req.url?.split("?")[0] !== "/api/everytime") return next();
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const fail = (status: number, error: string) => {
    res.statusCode = status;
    res.end(JSON.stringify({ error }));
  };
  if (req.method !== "POST") return fail(405, "POST 요청만 지원합니다.");
  if (
    req.headers.origin &&
    req.headers.origin !== `http://${req.headers.host}` &&
    req.headers.origin !== `https://${req.headers.host}`
  )
    return fail(403, "허용되지 않은 요청입니다.");
  let identifier: string;
  try {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
      if (Buffer.byteLength(body) > 4096)
        return fail(413, "링크가 너무 깁니다.");
    }
    identifier = shareIdentifier(JSON.parse(body).url);
  } catch {
    return fail(400, "에브리타임 공개 시간표 링크를 입력해 주세요.");
  }
  try {
    // shortcut: unofficial public-share endpoint; revisit if Everytime changes its API.
    const upstream = await fetch(
      "https://api.everytime.kr/find/timetable/table/friend",
      {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(12000),
        body: new URLSearchParams({ identifier, friendInfo: "false" }),
      },
    );
    if (!upstream.ok)
      return fail(
        502,
        "에브리타임이 요청을 거절했어요. 현재 서버에서는 링크를 가져올 수 없습니다.",
      );
    let xml = "";
    const decoder = new TextDecoder();
    for await (const chunk of upstream.body!) {
      xml += decoder.decode(chunk, { stream: true });
      if (xml.length > 1_000_000)
        return fail(502, "시간표 응답이 너무 큽니다.");
    }
    xml += decoder.decode();
    res.end(JSON.stringify({ xml }));
  } catch {
    fail(502, "시간표 서버에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
  }
}
