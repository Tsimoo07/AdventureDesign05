import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import {
  THRESHOLD_MAX,
  THRESHOLD_MIN,
  THRESHOLD_STEP,
  type Thresholds,
} from "../features/status/zones";

export function ThresholdControl({
  thresholds,
  onChange,
  note,
  title,
}: {
  thresholds: Thresholds;
  onChange: (next: Thresholds) => void;
  note?: string;
  title?: string;
}) {
  const prefix = title ? `${title} ` : "";
  const rows = [
    {
      key: "warning",
      label: "보통 기준",
      min: THRESHOLD_MIN,
      max: thresholds.danger - THRESHOLD_STEP,
    },
    {
      key: "danger",
      label: "혼잡 기준",
      min: thresholds.warning + THRESHOLD_STEP,
      max: THRESHOLD_MAX,
    },
  ] as const;

  return (
    <div
      className="threshold-control"
      role="group"
      aria-label={title ?? "혼잡도 기준 설정"}
    >
      {title && <strong className="threshold-title">{title}</strong>}
      {rows.map(({ key, label, min, max }) => {
        const value = thresholds[key];
        const change = (delta: number) =>
          onChange({ ...thresholds, [key]: value + delta });
        return (
          <div className="threshold-row" key={key}>
            <span className="threshold-label">{label}</span>
            <strong className="threshold-value" aria-live="polite">
              {value}
            </strong>
            <small>이상</small>
            <button
              type="button"
              className="threshold-step"
              aria-label={`${prefix}${label} ${THRESHOLD_STEP} 올리기`}
              disabled={value + THRESHOLD_STEP > max}
              onClick={() => change(THRESHOLD_STEP)}
            >
              <IconChevronUp size={18} />
            </button>
            <button
              type="button"
              className="threshold-step"
              aria-label={`${prefix}${label} ${THRESHOLD_STEP} 내리기`}
              disabled={value - THRESHOLD_STEP < min}
              onClick={() => change(-THRESHOLD_STEP)}
            >
              <IconChevronDown size={18} />
            </button>
          </div>
        );
      })}
      {note && <small className="threshold-note">{note}</small>}
    </div>
  );
}