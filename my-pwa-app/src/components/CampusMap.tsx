import { isEvaluation } from "../evaluation";
import { useEffect, useRef, useState } from "react";

type Maps = {
  services: { Places: new () => { keywordSearch(query:string,callback:(rows:{place_name:string;x:string;y:string;category_name:string;distance:string;id:string}[],status:string)=>void,options:Record<string,unknown>):void }; Geocoder: new () => { addressSearch(address: string, callback: (rows: { address_name: string; x: string; y: string }[], status: string) => void): void } };
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
export function loadMap(key: string) {
  if (sdk) return sdk;
  sdk = new Promise<Maps>((resolve, reject) => {
    const script = document.createElement("script");
    const timer = window.setTimeout(() => {
      script.remove();
      reject(new Error("지도 응답 시간이 초과됐어요."));
    }, 15000);
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false&libraries=services`;
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
export function CampusMap({lat=36.368,lng=127.344, nearby=false}:{lat?:number;lng?:number;nearby?:boolean} = {}) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [retry, setRetry] = useState(0);
  const [stops,setStops] = useState<{id:string;name:string;distance:string;url:string}[]>([]);
  const [message,setMessage] = useState("");
  const key = isEvaluation ? undefined : import.meta.env.VITE_KAKAO_MAP_KEY;
  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    setError("");
    setReady(false);
    loadMap(key)
      .then(async (maps) => {
        if (cancelled || !container.current) return;
        const center = new maps.LatLng(lat, lng);
        const map = new maps.Map(container.current, { center, level: 4 });
        new maps.Marker({ map, position: center });
        setReady(true);
        if (nearby) {
          setStops([]); setMessage("주변 정류장 검색 중…");
          const response = await fetch("/daejeon-stops.json");
          if (!response.ok) throw new Error("정류장 정보를 불러오지 못했어요.");
          const stations: [string,string,number,number][] = await response.json();
          if (cancelled) return;
          const local = stations.map(([id,name,y,x])=>({id,name,y,x,d:Math.round(Math.hypot((lat-y)*111200,(lng-x)*111200*Math.cos(lat*Math.PI/180)))}))
            .filter(stop=>stop.d<=1000).sort((a,b)=>a.d-b.d).slice(0,8);
          if (local.length) {
            for(const stop of local) new maps.Marker({map,position:new maps.LatLng(stop.y,stop.x)});
            setStops(local.map(stop=>({...stop,distance:String(stop.d),url:`https://map.kakao.com/link/map/${encodeURIComponent(stop.name)},${stop.y},${stop.x}`})));
            setMessage("");
            return;
          }
          new maps.services.Places().keywordSearch("버스정류장",(rows,status)=>{
            if (cancelled) return;
            const found = rows.filter(row=>/정류장/.test(row.category_name));
            for (const row of found) new maps.Marker({map,position:new maps.LatLng(Number(row.y),Number(row.x))});
            setStops(found.map(row=>({id:row.id,name:row.place_name,distance:row.distance,url:`https://map.kakao.com/link/map/${row.id}`})));
            setMessage(found.length ? "" : status === "ERROR" ? "정류장 검색에 실패했어요." : "반경 1km 안에 검색된 정류장이 없어요.");
          },{location:center,radius:1000,sort:"distance"});
        }
      })
      .catch((error) => {
        if (!cancelled) setError(error.message);
      });
    return () => {
      cancelled = true;
      container.current?.replaceChildren();
    };
  }, [key, retry, lat, lng, nearby]);
  return (
    <><section className="campus-map">
      <div
        ref={container}
        className="map-canvas"
        aria-label="주변 지도"
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
            href={`https://map.kakao.com/link/map/${lat},${lng}`}
            target="_blank"
            rel="noreferrer"
          >
            카카오맵에서 보기
          </a>
        </div>
      )}
    </section>{nearby && ready && <div aria-live="polite">{error || message || <ul>{stops.map(stop=><li key={stop.id}><a href={stop.url} target="_blank" rel="noreferrer">{stop.name} · {stop.distance}m</a></li>)}</ul>}</div>}</>
  );
}
