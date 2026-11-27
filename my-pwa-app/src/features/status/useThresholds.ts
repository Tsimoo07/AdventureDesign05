import { useSaved } from "../../useSaved";
import {
  DEFAULT_THRESHOLDS,
  isThresholdMap,
  type ThresholdMap,
  type Thresholds,
} from "./zones";

// 저장 형식이 달라져서 이전 키("chacha-thresholds")와 구분
export const THRESHOLDS_KEY = "chacha-thresholds-by-hall";

export function useThresholds() {
  const [map, setMap] = useSaved<ThresholdMap>(THRESHOLDS_KEY, {}, isThresholdMap);

  // 아직 바꾸지 않은 학생회관은 기본값
  const forHall = (hallId: string): Thresholds =>
    map[hallId] ?? DEFAULT_THRESHOLDS;

  const setForHall = (hallId: string, next: Thresholds) =>
    setMap({ ...map, [hallId]: next });

  return { forHall, setForHall };
}