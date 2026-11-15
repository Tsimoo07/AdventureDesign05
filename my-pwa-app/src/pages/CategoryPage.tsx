import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  IconChevronLeft,
  IconChevronDown,
  IconRefresh,
  IconStar,
} from "@tabler/icons-react";
import { fetchCategory, isDemo } from "../features/status/api";
import { useFetch } from "../features/status/useFetch";
import { FloorPlan } from "../components/FloorPlan";
import { zoneLevel, zoneLabels } from "../features/status/zones";
import { useSaved } from "../useSaved";
import {
  ZONE_FAVORITES_KEY,
  zoneKey,
  isStringArray,
} from "../features/status/favorites";

export default function CategoryPage() {
  const { id = "1" } = useParams<{ id: string }>();
  const fetcher = useCallback(
    (signal: AbortSignal) => fetchCategory(id, signal),
    [id],
  );
  const { data, loading, error, refetch } = useFetch(fetcher);
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
        <Link to="/food/places" className="detail-title">
          <h1>{data?.label ?? "장소"} 혼잡도</h1>
          <IconChevronDown size={24} />
        </Link>
      </header>
      <p className="timestamp">
        {isDemo
          ? "10/1 13:28 KST · 예시 데이터"
          : data?.updatedAt
            ? `${new Date(data.updatedAt).toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul" })} KST 관측`
            : "서버 관측 시각 미제공"}
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
            {id === "1" && (
              <FloorPlan
                items={data.items}
                selected={selected}
                onSelect={setSelected}
              />
            )}
            <div className="zone-list">
              {data.items.map((item, index) => {
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
                      {item.zoneId ?? item.id ?? index}
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
          <div className="detail-footer">
            {selectedItem ? (
              <p role="status">
                {selectedItem.label} ·{" "}
                {isDemo
                  ? "화면 시연용 혼잡 정보입니다."
                  : `혼잡도 ${selectedItem.value}%`}
              </p>
            ) : (
              <p>구역을 눌러 자세히 확인하세요</p>
            )}
            <button
              className="round"
              aria-label={
                selectedItem
                  ? selectedFavorite
                    ? `${selectedItem.label} 즐겨찾기 해제`
                    : `${selectedItem.label} 즐겨찾기 추가`
                  : "구역을 선택하면 즐겨찾기에 추가할 수 있습니다"
              }
              aria-pressed={selectedFavorite}
              disabled={!selectedItem}
              onClick={toggleFavorite}
            >
              <IconStar
                fill={selectedFavorite ? "currentColor" : "none"}
                size={22}
              />
            </button>
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