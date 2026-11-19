import { useEffect, useRef, useState } from "react";
import { nearestServices, type Service } from "../features/nearestServices";
import type { Boarding } from "./HomeTransit";
import { CampusMap } from "./CampusMap";

type Point = object;
type MapView = { panTo(point: Point): void; destroy(): void };
type NaverMaps = {
  LatLng: new (lat:number, lng:number) => Point;
  Map: new (el:HTMLElement, options:object) => MapView;
  Marker: new (options:object) => object;
  Event: { addListener(target:object, event:string, fn:()=>void):object; removeListener(listener:object):void };
};
type Stop = {id:string; name:string; lat:number; lng:number; distance:number;services:Service[]};
// Stop-level direction and routes, 2026-11-10: https://makka.co.kr/bus/region/daejeon/stop/{id}
const campusServices: Record<string, [string, string]> = {
  DJB8005587: ["충남대산학연", "48·108"],
  DJB8005588: ["충대농대종점", "48·108"],
  DJB8005589: ["충남대학교", "48·108"],
  DJB8005590: ["충남대도서관", "48·108"],
  DJB8007322: ["북대전세무서/보훈요양원", "117"],
  DJB8002741: ["북대전세무서/보훈요양원", "마을1·마을3·704·708·912"],
  DJB8002742: ["궁동교", "마을1·마을3·117·704·708·912"],
  DJB8001196: ["장대네거리", "마을1·마을3·704·708·912"],
};
let sdk: Promise<NaverMaps> | undefined;
// Same route set AND same travel direction; next-stop names change along the corridor.
const sharedService: Record<string,string> = {
  DJB8005587:"48/108:out", DJB8005589:"48/108:out",
  DJB8005588:"48/108:in", DJB8005590:"48/108:in",
};
async function loadLocalStops(lat:number,lng:number,signal:AbortSignal) {
  const read = async(path:string) => {
    const response = await fetch("/stop-tiles/"+path+".json",{signal});
    if (!response.ok) throw Error();
    return response.json();
  };
  const available = new Set<string>(await read("index"));
  const indexed = new Set<string>(await read("../bus-patterns/index"));
  const services:Record<string,Service[]> = {};
  const tiles:Promise<[string,string,number,number][]>[]=[];
  for(let y=Math.floor((lat-.011)*4);y<=Math.floor((lat+.011)*4);y++)
    for(let x=Math.floor((lng-.015)*4);x<=Math.floor((lng+.015)*4);x++){
      const key=y+"_"+x;
      if(available.has(key))tiles.push(Promise.all([read(key),indexed.has(key)?read("../bus-patterns/"+key):{}]).then(([rows,info])=>{Object.assign(services,info);return rows;}));
    }
  const rows=(await Promise.all(tiles)).flat();
  for(const [id,[towards,numbers]] of Object.entries(campusServices)){
    const known=services[id] ?? [];
    const extra=numbers.split("·").filter(n=>!known.some(([,number])=>number===n)).map((n):Service=>[`campus:${n}:${sharedService[id] ?? id}`,n,towards]);
    services[id]=[...known,...extra];
  }
  return {rows,services};
}
function loadNaver(key:string) {
  return sdk ??= new Promise<NaverMaps>((resolve,reject)=>{
    const script = document.createElement("script");
    const fail = () => { clearTimeout(timer); script.remove(); reject(new Error()); };
    const timer = window.setTimeout(fail,12000);
    script.onerror = fail;
    script.onload = () => {
      clearTimeout(timer);
      const maps = (window as Window & {naver?:{maps:NaverMaps}}).naver?.maps;
      if (maps?.Map) resolve(maps); else fail();
    };
    script.src = "https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId="+encodeURIComponent(key);
    document.head.append(script);
  }).catch(error=>{sdk=undefined;throw error;});
}

export function NearbyStops({lat,lng,boarding}:{lat:number;lng:number;boarding:Boarding|null}) {
  const [stops,setStops] = useState<Stop[]>([]);
  const [showAll,setShowAll] = useState(false);
  const [selected,select] = useState<Stop>();
  const [status,setStatus] = useState("정류장 확인 중…");
  const [mapError,setMapError] = useState(false);
  const canvas = useRef<HTMLDivElement>(null);
  const view = useRef<{map:MapView;maps:NaverMaps} | null>(null);
  const key = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;
  useEffect(()=>{
    const abort = new AbortController();
    setStops([]); select(undefined); setStatus("정류장 확인 중…");
    loadLocalStops(lat,lng,abort.signal).then(({rows,services})=>{
      if(abort.signal.aborted) return;
      const list = rows.map(([id,name,y,x])=>({id,name,lat:y,lng:x,distance:Math.round(Math.hypot((lat-y)*111200,(lng-x)*111200*Math.cos(lat*Math.PI/180)))}))
        .filter(stop=>stop.distance<=1000).sort((a,b)=>a.distance-b.distance);
      const nearest = nearestServices(list,services);
      setStops(nearest); setStatus(nearest.length ? "" : "반경 1km 안에 등록된 정류장이 없어요.");
    }).catch(()=>{if(!abort.signal.aborted)setStatus("정류장 정보를 불러오지 못했어요.");});
    return ()=>abort.abort();
  },[lat,lng]);
  useEffect(()=>{
    if(!key) return;
    let disposed=false;
    const listeners:object[]=[];
    setMapError(false);
    loadNaver(key).then(maps=>{
      if(disposed || !canvas.current) return;
      const map=new maps.Map(canvas.current,{center:new maps.LatLng(lat,lng),zoom:15});
      view.current={map,maps};
      for(const stop of stops){
        const marker=new maps.Marker({map,position:new maps.LatLng(stop.lat,stop.lng),title:stop.name});
        listeners.push(maps.Event.addListener(marker,"click",()=>select(stop)));
      }
      if(boarding) {
        const point=new maps.LatLng(boarding.lat,boarding.lng);
        const badge=document.createElement("strong");
        badge.className="boarding-marker";badge.textContent="승차 · "+boarding.name;
        new maps.Marker({map,position:point,title:badge.textContent,zIndex:1000,icon:{content:badge}});
        map.panTo(point);
      }
    }).catch(()=>{if(!disposed)setMapError(true);});
    return ()=>{disposed=true;const active=view.current;if(active){listeners.forEach(l=>active.maps.Event.removeListener(l));active.map.destroy();view.current=null;}};
  },[key,lat,lng,stops,boarding]);
  useEffect(()=>{const active=view.current;if(active && selected)active.map.panTo(new active.maps.LatLng(selected.lat,selected.lng));},[selected]);
  return <section className="stop-explorer" aria-label="주변 정류장 지도">
    {boarding && <a className="boarding-link" href={`https://map.kakao.com/link/map/${encodeURIComponent(boarding.name)},${boarding.lat},${boarding.lng}`} target="_blank" rel="noreferrer">승차 · {boarding.name} 위치 보기 ↗</a>}
    {boarding && (!key || mapError) && <CampusMap lat={boarding.lat} lng={boarding.lng} />}
    {key && !mapError && <div className="naver-canvas" ref={canvas} aria-label="네이버 지도" />}
    <div className="stop-sheet">{selected && <strong>{selected.name}</strong>}
      {selected && <a href={`https://map.naver.com/p/search/${encodeURIComponent(selected.name+" 버스정류장")}`} target="_blank" rel="noreferrer">네이버지도에서 검색 ↗</a>}
      <small>{status || (selected ? `기준 위치에서 직선 ${selected.distance}m` : "반경 1km · 가까운 순")}</small>
      {mapError && <small>지도를 열 수 없어 목록으로 표시해요.</small>}
      <ul>{(showAll ? stops : stops.slice(0,8)).map(stop=>{
        return <li key={stop.id}><button aria-pressed={selected?.id===stop.id} onClick={()=>select(stop)}>
          <div className="stop-description">{stop.name}{stop.services.length ? [...new Set(stop.services.map(s=>s[2]))].map(direction=><small key={direction}>{direction} 방면 · {[...new Set(stop.services.filter(s=>s[2]===direction).map(s=>s[1]))].join("·")}</small>) : <small>방향 정보 없음 · {stop.id}</small>}</div>
          <span>{stop.distance} m</span>
        </button></li>;
      })}</ul>{stops.length>8 && <button onClick={()=>setShowAll(!showAll)} aria-expanded={showAll}>{showAll?"간략히 보기":`나머지 ${stops.length-8}곳 보기`}</button>}<small>노선 자료: <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a></small>
    </div>
  </section>;
}
