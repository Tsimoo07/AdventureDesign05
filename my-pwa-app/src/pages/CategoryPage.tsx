import { SpringDropdown } from "../components/SpringDropdown";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { IconChevronLeft, IconRefresh, IconStar } from "@tabler/icons-react";
import { fetchCategory, isDemo } from "../features/status/api";
import { useFetch } from "../features/status/useFetch";
import { FloorPlan } from "../components/FloorPlan";
import { HallBadge } from "../components/HallBadge";
import { congestionSummary, floorPlans, orderedZones, zoneLevel, zoneLabels, zoneSymbol } from "../features/status/zones";
import { useSaved } from "../useSaved";
import {
  ZONE_FAVORITES_KEY,
  zoneKey,
  isStringArray,
} from "../features/status/favorites";

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
  const summary = congestionSummary(data?.items ?? []);
  useEffect(() => {
    if (isDemo) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) refetch();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [refetch]);
  const [selected, setSelected] = useState<string | null>(null);
const [favorites, setFavorites, saveError] = useSaved<string[]>(
  ZONE_FAVORITES_KEY,
  [],
  isStringArray,
);

  // 선택된 구역과 그 구역의 즐겨찾기 여부
  const selectedItem = data?.items.find((item) => item.id === selected);
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
        {isDemo
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
              <small>{isDemo ? "예시 데이터" : "구역별 혼잡도"}</small>
            </div>
            {plan && (
              <FloorPlan
                plan={plan}
                items={data.items}
                selected={selected}
                onSelect={setSelected}
              />
            )}
            <div className="zone-result" key={selectedItem?.id ?? "idle"} data-selected={!!selectedItem}>
              <span role="status">{selectedItem ? <>
                <i style={{ background: `var(--floor-${zoneLevel(selectedItem)})` }} />
                {selectedItem.label} · <strong>{zoneLabels[zoneLevel(selectedItem)]}</strong>
              </> : data.items.length ? "구역을 눌러 확인하세요" : "아직 수신된 구역 정보가 없어요."}</span>
              {selectedItem && <button className="round" aria-label={`${selectedItem.label} 즐겨찾기 ${selectedFavorite ? "해제" : "추가"}`} aria-pressed={selectedFavorite} onClick={toggleFavorite}>
                <IconStar size={20} fill={selectedFavorite ? "currentColor" : "none"} />
              </button>}
            </div>
            <div className="zone-list" style={{ gridTemplateRows: `repeat(${Math.max(1, Math.ceil(data.items.length / 2))}, 27px)` }}>
              {orderedZones(id, data.items).map((item) => {
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
              disabled={loading}
              onClick={refetch}
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
