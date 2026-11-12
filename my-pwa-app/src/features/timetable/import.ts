import { isLesson, type Lesson } from "./model";
export function parseTimetable(xml: string) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror") || doc.doctype)
    throw new Error("시간표 응답 형식을 확인할 수 없어요.");
  const table = doc.querySelector("response > table");
  if (!table || Number(table.getAttribute("status")) < 0)
    throw new Error(
      "공개된 시간표가 없어요. 공유 설정과 링크를 확인해 주세요.",
    );
  const lessons: Lesson[] = [];
  const untimed: string[] = [];
  for (const subject of table.querySelectorAll(":scope > subject")) {
    const title = subject.querySelector("name")?.getAttribute("value")?.trim();
    if (!title) throw new Error("수업 이름이 없는 응답입니다.");
    const times = subject.querySelectorAll("time > data");
    if (!times.length) untimed.push(title);
    for (const time of times) {
      for (const key of ["day", "starttime", "endtime"]) {
        if (!/^\d+$/.test(time.getAttribute(key) ?? ""))
          throw new Error("잘못된 수업 시간입니다.");
      }
      const lesson = {
        id: crypto.randomUUID(),
        title,
        day: Number(time.getAttribute("day")),
        start: Number(time.getAttribute("starttime")) / 12,
        end: Number(time.getAttribute("endtime")) / 12,
      };
      if (!isLesson(lesson))
        throw new Error(
          "표시할 수 없는 수업 시간이 있어요. 기존 시간표는 유지됩니다.",
        );
      lessons.push(lesson);
    }
  }
  if (!lessons.length && !untimed.length)
    throw new Error("등록된 수업이 없는 시간표예요.");
  return { lessons, untimed };
}
