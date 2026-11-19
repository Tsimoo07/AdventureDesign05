import { useEffect, useState } from "react";

type Route = {minutes:number; legs:{title:string; from?:string; to?:string}[]};
export type Boarding = {name:string;lat:number;lng:number};
export function HomeTransit({lat,lng,startLat,startLng,label,onBoarding}:{lat:number;lng:number;startLat:number;startLng:number;label:string;onBoarding:(value:Boarding|null)=>void}) {
  const [route,setRoute] = useState<Route>();
  const [error,setError] = useState("");
  const [attempt,retry] = useState(0);
  useEffect(()=>{
    const controller = new AbortController();
    setError(""); setRoute(undefined); onBoarding(null);
    async function load() {
      try {
        const response = await fetch("/api/transit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lat,lng,startLat,startLng}),signal:controller.signal});
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok) { setError(data.error); return; }
        onBoarding(data.boarding ?? null);
        setRoute(data);
      } catch { if (!controller.signal.aborted) setError("경로를 불러오지 못했어요."); }
    }
    void load();
    return ()=>{controller.abort();onBoarding(null);};
  },[lat,lng,startLat,startLng,attempt,onBoarding]);
  return <div aria-live="polite">{route ? <>
    <strong>{label}까지 약 {route.minutes}분</strong>
    <ol>{route.legs.map((leg,index)=><li key={index}>{leg.title}{leg.from && <> · {leg.from} 승차</>}{leg.to && <> → {leg.to} 하차</>}</li>)}</ol>
  </> : error ? <>{error} <button onClick={()=>retry(attempt+1)}>다시 시도</button></> : "경로를 찾고 있어요…"}</div>;
}
