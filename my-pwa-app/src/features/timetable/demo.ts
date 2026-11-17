import type { Lesson } from "./model";

// Fictional lessons shared by all evaluation participants; never prefill saved timetables.
export const evaluationTimetable: { lessons: Lesson[]; untimed: string[] } = {
  lessons: [
    { id: "demo-mon", title: "평가용 수업 A", day: 0, start: 10.5, end: 12 },
    { id: "demo-wed", title: "평가용 수업 B", day: 2, start: 14, end: 15.5 },
    { id: "demo-night", title: "평가용 야간 수업", day: 4, start: 22, end: 23 },
  ],
  untimed: [],
};
