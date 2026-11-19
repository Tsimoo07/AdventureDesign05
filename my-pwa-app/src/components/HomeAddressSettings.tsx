import { useState } from "react";
import { useSaved } from "../useSaved";
import { loadMap } from "./CampusMap";
type Home = { address: string; lat: number; lng: number };
function validHome(value: unknown): boolean {
  const home = value as Home | null;
  return !!home && typeof home.address === "string" && Number.isFinite(home.lat) && Math.abs(home.lat) <= 90 && Number.isFinite(home.lng) && Math.abs(home.lng) <= 180;
}


export function useHomeAddress() { return useSaved<Home | null>("bapgil-home", null, validHome); }
export function HomeAddressSettings() {
  const [home,save,storageError] = useHomeAddress();
  const [confirm,setConfirm] = useState(false);
  const [editing, edit] = useState(false);
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function findHome() {
    if (!address.trim() || busy) return;
    setBusy(true); setError("");
    try {
      const key = import.meta.env.VITE_KAKAO_MAP_KEY;
      if (!key) throw new Error();
      const maps = await loadMap(key);
      const result = await new Promise<Home>((resolve, reject) =>
        new maps.services.Geocoder().addressSearch(address.trim(), (rows, status) => {
          const first = rows[0];
          const result = first && {address: first.address_name, lat: Number(first.y), lng: Number(first.x)};
          if (status === "OK" && result && validHome(result)) resolve(result);
          else reject(new Error());
        }));
      if (save(result)) { edit(false); setAddress(""); }
    } catch { setError("주소를 확인하지 못했어요. 연결 상태와 도로명·지번 주소를 확인해 주세요."); }
    finally { setBusy(false); }
  }

  return <div className="home-settings">{home && !editing ? <>
    <p>{home.address}</p>
    {confirm ? <><strong>저장한 집 주소를 삭제할까요?</strong><div><button onClick={()=>setConfirm(false)}>취소</button><button onClick={()=>{if(save(null)) setConfirm(false);}}>삭제하기</button></div></> :
    <div><button onClick={()=>{setAddress(home.address);edit(true);}}>주소 변경</button><button onClick={()=>setConfirm(true)}>저장한 집 삭제</button></div>}
  </> : <form onSubmit={event => {event.preventDefault(); void findHome();}}>
        <label htmlFor="home-address">집 주소</label>
        <input id="home-address" required disabled={busy} value={address} onChange={event => setAddress(event.target.value)} placeholder="도로명 또는 지번 주소" />
        <small>카카오에서 주소를 조회하고 이 브라우저에 저장해요. 동·호수는 필요 없어요.</small>
        <button className="primary" disabled={busy || !address.trim()}>{busy ? "주소 확인 중…" : "주소 확인 후 저장"}</button>
        {home && <button type="button" disabled={busy} onClick={() => edit(false)}>취소</button>}
      </form>}
  {(error || storageError) && <small role="alert">{error || storageError}</small>}</div>;
}
