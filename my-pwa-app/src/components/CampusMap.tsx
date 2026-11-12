import { useEffect, useRef, useState } from "react";

type Maps = {
  load: (callback: () => void) => void;
  LatLng: new (lat: number, lng: number) => unknown;
  Map: new (
    element: HTMLElement,
    options: { center: unknown; level: number },
  ) => unknown;
  Marker: new (options: { map: unknown; position: unknown }) => unknown;
};
declare global {
  interface Window {
    kakao?: { maps: Maps };
  }
}
let sdk: Promise<Maps> | undefined;
function loadMap(key: string) {
  if (sdk) return sdk;
  sdk = new Promise<Maps>((resolve, reject) => {
    const script = document.createElement("script");
    const timer = window.setTimeout(() => {
      script.remove();
      reject(new Error("지도 응답 시간이 초과됐어요."));
    }, 15000);
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`;
    script.onerror = () => {
      clearTimeout(timer);
      script.remove();
      reject(new Error("지도를 불러오지 못했어요."));
    };
    script.onload = () => {
      if (!window.kakao) {
        clearTimeout(timer);
        reject(new Error("지도 인증을 확인해 주세요."));
        return;
      }
      window.kakao.maps.load(() => {
        clearTimeout(timer);
        resolve(window.kakao!.maps);
      });
    };
    document.head.appendChild(script);
  }).catch((error) => {
    sdk = undefined;
    throw error;
  });
  return sdk;
}
export function CampusMap() {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [retry, setRetry] = useState(0);
  const key = import.meta.env.VITE_KAKAO_MAP_KEY;
  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    setError("");
    setReady(false);
    loadMap(key)
      .then((maps) => {
        if (cancelled || !container.current) return;
        const center = new maps.LatLng(36.368, 127.344);
        const map = new maps.Map(container.current, { center, level: 4 });
        new maps.Marker({ map, position: center });
        setReady(true);
      })
      .catch((error) => {
        if (!cancelled) setError(error.message);
      });
    return () => {
      cancelled = true;
      container.current?.replaceChildren();
    };
  }, [key, retry]);
  return (
    <section className="campus-map">
      <div
        ref={container}
        className="map-canvas"
        aria-label="충남대학교 캠퍼스 지도"
      />
      {!ready && (
        <div className="map-message">
          <p>
            {!key
              ? "캠퍼스 지도 연결 준비 중"
              : error || "지도를 불러오는 중..."}
          </p>
          {error && (
            <button onClick={() => setRetry((value) => value + 1)}>
              다시 시도
            </button>
          )}
          <a
            href="https://map.kakao.com/link/map/36.368,127.344"
            target="_blank"
            rel="noreferrer"
          >
            카카오맵에서 보기
          </a>
        </div>
      )}
    </section>
  );
}
