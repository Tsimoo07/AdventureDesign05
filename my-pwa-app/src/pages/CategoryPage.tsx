import { SpringDropdown } from "../components/SpringDropdown";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { IconChevronLeft, IconRefresh, IconStar } from "@tabler/icons-react";
import { fetchCategory, fetchHall2Observation, isDemo } from "../features/status/api";
import { applyHall2Observation, isHall2SensorZone } from "../features/status/hall2";
import { isEvaluation } from "../evaluation";
import { useFetch } from "../features/status/useFetch";
import { FloorPlan } from "../components/FloorPlan";
import { HallBadge } from "../components/HallBadge";
import { ThresholdControl } from "../components/ThresholdControl";
import {
  applyThresholds,
  congestionSummary,
  floorPlans,
  orderedZones,
  zoneLevel,
  zoneLabels,
  zoneSymbol,
} from "../features/status/zones";
import { useSaved } from "../useSaved";
import {
  ZONE_FAVORITES_KEY,
  zoneKey,
  isStringArray,
} from "../features/status/favorites";
import { useThresholds } from "../features/status/useThresholds";

export default function CategoryPage() {
  const navigate = useNavigate();
  const { id = "1" } = useParams<{ id: string }>();
  const plan = floorPlans[id];
  const fetcher = useCallback(
    (signal: AbortSignal) => fetchCategory(id, signal),
    [id],
  );
  const result = useFetch(fetcher);
  const { loading, error, refetch } = result;
  const data = result.data?.id === id ? result.data : undefined;
  const showLive = id === "2" && !isEvaluation;
  const liveFetcher = useCallback(
    (signal: AbortSignal) => showLive ? fetchHall2Observation(signal) : Promise.resolve(null),
    [showLive],
  );
  const { data: liveData, loading: liveLoading, error: liveError, refetch: refetchLive } = useFetch(liveFetcher);
  const live = showLive && !liveError ? liveData : null;
  const { forHall, setForHall } = useThresholds();
const thresholds = forHall(id);
const baseItems = showLive
  ? applyHall2Observation(data?.items ?? [], live)
  : data?.items ?? [];
// ESP32 측정 구역은 값이 "회/5초"라서 퍼센트 기준을 적용하지 않음
const items = applyThresholds(
  baseItems,
  thresholds,
  showLive ? (item) => isHall2SensorZone(item) : undefined,
);
const summary = showLive
  ? live?.level ?? null
  : congestionSummary(items, thresholds);
  useEffect(() => {
    if (isDemo && !showLive) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      if (!isDemo) refetch();
      if (showLive) refetchLive();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [refetch, refetchLive, showLive]);
  const [selected, setSelected] = useState<string | null>(null);
const [favorites, setFavorites, saveError] = useSaved<string[]>(
  ZONE_FAVORITES_KEY,
  [],
  isStringArray,
);

  // 선택된 구역과 그 구역의 즐겨찾기 여부
  const selectedItem = items.find((item) => item.id === selected);
  const selectedKey = selectedItem ? zoneKey(id, selectedItem.id) : null;
  const selectedFavorite =
    selectedKey !== null && favorites.includes(selectedKey);

  const toggleFavorite = () => {
    if (selectedKey === null) return;
    setFavorites(
      selectedFavorite
        ? favorites.filter((value) => value !== selectedKey)
        : [...favorites, selectedKey],
    );
  };

  return (
    <section>
      <header className="detail-header">
        <Link to="/food/places" className="round purple" aria-label="장소 목록">
          <IconChevronLeft size={30} />
        </Link>
        <SpringDropdown
          value={id}
          options={[
            { id: "1", label: "제 1 학생회관" },
            { id: "2", label: "제 2 학생회관" },
          ]}
          onChange={(value) => { setSelected(null); navigate(`/category/${value}`); }}
        />
      </header>
      <h1 className="congestion-heading">전체 혼잡도</h1>
      <p className="timestamp">
        {showLive
          ? live
            ? `${new Date(Date.parse(live.windowStart) + 30000).toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul" })} KST 관측`
            : "측정 정보 없음"
          : isDemo
          ? "10/1 13:28 KST · 예시 데이터"
          : data?.updatedAt
            ? `${new Date(data.updatedAt).toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul" })} KST 관측`
            : !data ? "" : !summary ? "측정 정보 없음" : "측정 시각 미제공"}
      </p>
      {loading && !data && (
        <p role="status" className="empty">
          불러오는 중...
        </p>
      )}
      {error && (
        <div className="notice" role="alert">
          갱신 실패. 표시된 정보는 이전 수신 값입니다.{" "}
          <button onClick={refetch}>다시 시도</button>
        </div>
      )}
      {data && (
        <>
          <div className="congestion-panel">
            <div className="welcome-preview-heading">
              <strong className="hall-title">{data.label}<HallBadge level={summary} /></strong>
              <ThresholdControl
                thresholds={thresholds}
                onChange={(next) => setForHall(id, next)}
                note={showLive ? "ESP32 측정 구역은 기준 설정이 적용되지 않아요." : undefined}
              />
            </div>
            {showLive && (
              <p className="zone-note" role="status">
                {liveError ? "ESP32 측정값을 불러오지 못했어요."
                  : live ? `5초당 평균 · A/B ${live.serving.averageCount.toFixed(1)}회 · 1/2 ${live.dining.averageCount.toFixed(1)}회`
                  : liveLoading ? "ESP32 측정값을 불러오는 중이에요." : "최근 ESP32 측정값이 없어요."}
              </p>
            )}
            {plan && (
              <FloorPlan
                plan={plan}
                items={items}
                selected={selected}
                onSelect={setSelected}
              />
            )}
            <div className="zone-result" key={selectedItem?.id ?? "idle"} data-selected={!!selectedItem}>
              <span role="status">{selectedItem ? <>
                <i style={{ background: `var(--floor-${zoneLevel(selectedItem)})` }} />
                {selectedItem.label} · <strong>{zoneLabels[zoneLevel(selectedItem)]}</strong>
                {showLive && live && isHall2SensorZone(selectedItem) && ` · ${selectedItem.value.toFixed(1)}회/5초`}
              </> : items.length ? "구역을 눌러 확인하세요" : "아직 수신된 구역 정보가 없어요."}</span>
              {selectedItem && <button className="round" aria-label={`${selectedItem.label} 즐겨찾기 ${selectedFavorite ? "해제" : "추가"}`} aria-pressed={selectedFavorite} onClick={toggleFavorite}>
                <IconStar size={20} fill={selectedFavorite ? "currentColor" : "none"} />
              </button>}
            </div>
            <div className="zone-list" style={{ gridTemplateRows: `repeat(${Math.max(1, Math.ceil(items.length / 2))}, 27px)` }}>
              {orderedZones(id, items).map((item) => {
                const level = zoneLevel(item);
                const isFavorite = favorites.includes(zoneKey(id, item.id));
                return (
                  <button
                    key={item.id}
                    className={`zone ${selected === item.id ? "selected" : ""}`}
                    onClick={() =>
                      setSelected(selected === item.id ? null : item.id)
                    }
                    aria-pressed={selected === item.id}
                  >
                    <span className="zone-number">
                      {zoneSymbol(id, item.zoneId ?? item.id)}
                    </span>
                    <span className="zone-name">
                      {item.label}
                      {isFavorite && (
                        <IconStar
                          className="zone-star"
                          size={16}
                          fill="currentColor"
                          aria-label="즐겨찾기한 구역"
                        />
                      )}
                    </span>
                    <span className={`badge ${level}`}>
                      {zoneLabels[level]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          {id === "2" && <p className="zone-note">배식구 A·B는 배식대 주변 공간의 혼잡도를 나타내요. 줄 길이나 대기시간을 뜻하지 않아요.</p>}
          <div className="detail-footer">
            <button
              className="round"
              aria-label="혼잡도 새로고침"
              disabled={loading || (showLive && liveLoading)}
              onClick={() => { refetch(); if (showLive) refetchLive(); }}
            >
              <IconRefresh size={22} className={loading ? "spin" : ""} />
            </button>
          </div>
          {saveError && (
            <p role="alert" className="notice">
              {saveError}
            </p>
          )}
        </>
      )}
    </section>
  );
}
