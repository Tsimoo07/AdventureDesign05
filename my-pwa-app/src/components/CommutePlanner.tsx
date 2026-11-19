import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { IconBackpack, IconChevronDown, IconHome } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { HomeTransit, type Boarding } from "./HomeTransit";
import { useHomeAddress } from "./HomeAddressSettings";
import { NearbyStops } from "./NearbyStops";

export function CommutePlanner() {
  const [boarding,setBoarding] = useState<Boarding|null>(null);
  const [home] = useHomeAddress();
  const [panel,setPanel] = useState<"home"|"school"|null>(null);
  const open = panel === "home";
  const reduced = useReducedMotion();
  const animation = {initial:{height:0,opacity:0},animate:{height:"auto",opacity:1},exit:{height:0,opacity:0},transition:reduced ? {duration:0} : {type:"spring" as const,stiffness:240,damping:21},style:{overflow:"hidden"}};
  const [position,setPosition] = useState<{lat:number;lng:number}|null>(null);
  const [locationNote,note] = useState("");
  function locate() {
    if (!navigator.geolocation) {note("위치를 사용할 수 없어 충남대 주변을 표시해요."); return;}
    note("위치 확인 중…");
    navigator.geolocation.getCurrentPosition(({coords})=>{setPosition({lat:coords.latitude,lng:coords.longitude});note("");},()=>{setPosition(null);note("위치를 확인할 수 없어 충남대 주변을 표시해요.");},{timeout:10000,maximumAge:60000});
  }
  const campus = {lat:36.368,lng:127.344};
  const start = position ?? campus;
  const near = position && Math.hypot((position.lat-campus.lat)*111200,(position.lng-campus.lng)*89500)<=500;
  const schoolStart = position ?? home;
  return <section className="bus-screen">
    <header className="page-heading"><h1>버스</h1></header>
    <div className="commute-card">
      <button aria-expanded={open} aria-controls="home-route" onClick={() => setPanel(open ? null : "home")}>
        <span className="commute-label"><IconHome size={17}/> 집으로 <IconChevronDown size={16}/></span>
        <p>{home ? "집까지 길찾기" : "집 위치 설정"}</p>
      </button>
      {near ? <div className="school-status"><span className="commute-label"><IconBackpack size={17}/> 학교로</span><p>근처에 있습니다.</p></div> : <button aria-expanded={panel==="school"} onClick={()=>setPanel(panel==="school"?null:"school")}><span className="commute-label"><IconBackpack size={17}/> 학교로 <IconChevronDown size={16}/></span><p>학교까지 길찾기</p></button>}
    </div>
    <AnimatePresence mode="wait">{open && <motion.div key="home" {...animation}><div id="home-route" className="commute-planner">
      {home ? <>
        <strong>{position ? "내 위치" : "충남대 캠퍼스"} → 집</strong><span>{home.address}</span>
        <HomeTransit onBoarding={setBoarding} label="집" startLat={start.lat} startLng={start.lng} lat={home.lat} lng={home.lng} />
        <a className="welcome-primary" href={`https://map.kakao.com/link/by/traffic/출발지,${start.lat},${start.lng}/집,${home.lat},${home.lng}`} target="_blank" rel="noreferrer">카카오맵에서 길찾기 ↗</a>
      </> : <><strong>집까지 길찾기</strong><p>집 주소를 등록하면 소요 시간과 승하차 정류장을 볼 수 있어요.</p><Link to="/menu?settings=home">집 주소 설정</Link></>}
    </div></motion.div>}
    {panel==="school" && !near && <motion.div key="school" {...animation}><div className="commute-planner">
      {schoolStart ? <><strong>{position?"내 위치":"저장한 집"} → 충남대 캠퍼스</strong><HomeTransit onBoarding={setBoarding} label="학교" startLat={schoolStart.lat} startLng={schoolStart.lng} {...campus}/></> : <p>내 위치를 확인하거나 집 주소를 저장하면 경로를 볼 수 있어요.</p>}
    </div></motion.div>}</AnimatePresence>
    <div className="commute-direction"><strong>{position?"내 위치":"충남대"} 주변 정류장</strong><button className="text-button" onClick={locate}>내 위치로 보기</button></div>
    {locationNote && <p role="status">{locationNote}</p>}
    <NearbyStops boarding={panel ? boarding : null} key={`${start.lat},${start.lng}`} {...start} />
    <details className="route-key"><summary>노선 색상 안내</summary>
      {["광역","마을","외곽","간선","지선","급행"].map(kind => <span key={kind} className="route-pill" data-kind={kind}>{kind}</span>)}
    </details>
  </section>;
}
