export type Lesson = {
  id: string;
  title: string;
  day: number;
  start: number;
  end: number;
};
export function isLesson(value: unknown): value is Lesson {
  if (!value || typeof value !== "object") return false;
  const v = value as Lesson;
  return (
    typeof v.id === "string" &&
    typeof v.title === "string" &&
    !!v.title.trim() &&
    Number.isInteger(v.day) &&
    v.day >= 0 &&
    v.day <= 6 &&
    Number.isInteger(v.start * 12) &&
    Number.isInteger(v.end * 12) &&
    v.start >= 0 &&
    v.end <= 24 &&
    v.start < v.end
  );
}
export function formatTime(hour: number) {
  const minutes = Math.round(hour * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
export function shareIdentifier(input: string) {
  const url = new URL(input.trim());
  const match = url.pathname.match(/^\/(?:app\/)?@([a-zA-Z0-9]{10,80})\/?$/);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "everytime.kr" ||
    url.port ||
    url.username ||
    url.password ||
    !match
  )
    throw new Error("에브리타임 공개 시간표 링크를 입력해 주세요.");
  return match[1];
}

export function koreaTime(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return (
    Number(parts.find((p) => p.type === "hour")?.value) +
    Number(parts.find((p) => p.type === "minute")?.value) / 60
  );
}

export function lessonConnections(lessons: Lesson[]) {
  return lessons.flatMap(left => lessons.filter(right =>
    right.day === left.day + 1 && right.title.trim() === left.title.trim() &&
    Math.max(left.start, right.start) < Math.min(left.end, right.end)
  ).map(right => ({
    id: `${left.id}:${right.id}`, title: left.title.trim(), day: right.day,
    start: Math.max(left.start, right.start), end: Math.min(left.end, right.end),
  })));
}
