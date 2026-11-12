import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { isCategory } from "../src/features/status/validate.ts";

assert.equal(
  isCategory({
    id: "1",
    label: "학생회관",
    items: [{ id: "1", label: "식당", value: 50, level: "normal" }],
  }),
  true,
);
for (const bad of [
  null,
  {},
  { id: "1", label: "식당", items: [null] },
  { id: "1", label: "식당", items: [{ id: "1", label: "식당", value: 101 }] },
  {
    id: "1",
    label: "식당",
    items: [{ id: "1", label: "식당", value: 40, level: "invalid" }],
  },
])
  assert.equal(isCategory(bad), false);
const manifest = JSON.parse(
  await readFile(new URL("../dist/manifest.webmanifest", import.meta.url)),
);
assert.equal(manifest.display, "standalone");
for (const icon of manifest.icons) {
  const bytes = await readFile(new URL(`../dist/${icon.src}`, import.meta.url));
  assert.equal(bytes.subarray(1, 4).toString(), "PNG");
  const [width, height] = icon.sizes.split("x").map(Number);
  assert.equal(bytes.readUInt32BE(16), width);
  assert.equal(bytes.readUInt32BE(20), height);
}
for (const file of [
  "sw.js",
  "fonts/SUIT-Variable.woff2",
  "images/student-center-floor.png",
])
  await access(new URL(`../dist/${file}`, import.meta.url));
const font = await readFile(
  new URL("../dist/fonts/SUIT-Variable.woff2", import.meta.url),
);
assert.equal(font.subarray(0, 4).toString(), "wOF2");
console.log(
  "PASS: invalid API data, PWA manifest, icon dimensions, bundled font and floor plan",
);

const { zoneLevel, zoneLabels, floorZones } =
  await import("../src/features/status/zones.ts");
for (const [value, expected] of [
  [0, "normal"],
  [49, "normal"],
  [50, "warning"],
  [79, "warning"],
  [80, "danger"],
  [100, "danger"],
])
  assert.equal(zoneLevel({ id: "0", label: "카페", value }), expected);
assert.equal(
  zoneLevel({ id: "0", label: "카페", value: 99, status: "ready" }),
  "ready",
);
assert.equal(
  zoneLevel({ id: "0", label: "카페", value: 99, level: "normal" }),
  "normal",
);
assert.equal(zoneLevel(undefined), "unknown");
assert.equal(zoneLabels.warning, "보통");
assert.equal(new Set(floorZones.map((z) => z.id)).size, 10);
assert.equal(
  isCategory({
    id: "1",
    label: "학생회관",
    items: [
      { id: "a", zoneId: "0", label: "카페", value: 50 },
      { id: "b", zoneId: "0", label: "중복", value: 10 },
    ],
  }),
  false,
);
assert.equal(
  isCategory({
    id: "1",
    label: "학생회관",
    updatedAt: "not a date",
    items: [],
  }),
  false,
);
assert.equal(
  isCategory({
    id: "1",
    label: "학생회관",
    updatedAt: "2026-11-12T04:28:00Z",
    items: [{ id: "a", zoneId: "0", label: "카페", value: 0, status: "ready" }],
  }),
  true,
);
console.log(
  "PASS: zone color boundaries, ready/unknown states, stable region IDs, timestamps",
);

const { isLesson, formatTime, shareIdentifier } =
  await import("../src/features/timetable/model.ts");
assert.equal(formatTime(13.5), "13:30");
assert.equal(formatTime(22), "22:00");
assert.equal(
  isLesson({ id: "a", title: "수업", day: 0, start: 13.5, end: 15 }),
  true,
);
assert.equal(
  isLesson({ id: "a", title: "수업", day: 6, start: 22, end: 23.5 }),
  true,
);
for (const change of [
  { start: NaN },
  { end: 25 },
  { day: 7 },
  { start: 15, end: 14 },
  { title: "" },
])
  assert.equal(
    isLesson({ id: "a", title: "수업", day: 0, start: 9, end: 10, ...change }),
    false,
  );
assert.equal(
  shareIdentifier("https://everytime.kr/app/@abcdefghij1234"),
  "abcdefghij1234",
);
for (const url of [
  "http://everytime.kr/@abcdefghij1234",
  "https://everytime.kr.evil.test/@abcdefghij1234",
  "https://user@everytime.kr/@abcdefghij1234",
  "https://everytime.kr/login",
])
  assert.throws(() => shareIdentifier(url));
console.log(
  "PASS: half-hour/evening lessons, legacy model, share URL validation",
);
