export type Service = [patternId:string, number:string, direction:string];
export function nearestServices<T extends {distance:number;id:string}>(stops:T[], services:Record<string,Service[]>) {
  const seen = new Set<string>();
  return [...stops].sort((a,b)=>a.distance-b.distance || a.id.localeCompare(b.id)).flatMap(stop=>{
    const known = services[stop.id] ?? [];
    const recommended = known.filter(([id])=>!seen.has(id));
    for(const [id] of recommended) seen.add(id);
    return !known.length || recommended.length ? [{...stop,services:recommended}] : [];
  });
}
