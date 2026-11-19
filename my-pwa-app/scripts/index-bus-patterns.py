"""Build the stop-to-directed-service index from Geofabrik South Korea (requires osmium)."""
import collections
import json
import math
import pathlib
import re
import sys
import osmium

public = pathlib.Path(__file__).resolve().parents[1] / "public"
patterns = []
members = set()
nodes = {}

class Relations(osmium.SimpleHandler):
    def relation(self, rel):
        if rel.tags.get("route") != "bus" or not rel.tags.get("ref"):
            return
        platforms = [m.ref for m in rel.members if m.type == "n" and m.role in ("platform","platform_entry_only","platform_exit_only")]
        stops = [m.ref for m in rel.members if m.type == "n" and m.role in ("stop","stop_entry_only","stop_exit_only")]
        no_board = {m.ref for m in rel.members if m.role.endswith("exit_only")}
        sequence = platforms if len(platforms) >= 2 else stops
        if len(sequence) >= 2:
            members.update(sequence)
            patterns.append((str(rel.id), rel.tags["ref"], sequence,rel.tags.get("to",""),no_board))

class Nodes(osmium.SimpleHandler):
    def node(self,node):
        if node.id in members:
            nodes[node.id] = (node.tags.get("name:ko") or node.tags.get("name",""),node.location.lat,node.location.lon)

Relations().apply_file(sys.argv[1])
Nodes().apply_file(sys.argv[1])
def norm(name):
    return re.sub(r"[\s.·ㆍ]","",name)
places = collections.defaultdict(list)
for file in (public/"stop-tiles").glob("*_*.json"):
    for stop,name,y,x in json.loads(file.read_text()):
        places[norm(name)].append((stop,y,x))
matches = {}
for node,(name,y,x) in nodes.items():
    ranked = sorted((math.hypot((sy-y)*111200,(sx-x)*111200*math.cos(math.radians(y))),stop)
                    for stop,sy,sx in places.get(norm(name),[]))
    if ranked and ranked[0][0]<=25 and (len(ranked)==1 or ranked[1][0]-ranked[0][0]>=10):
        matches[node]=ranked[0][1]
index = collections.defaultdict(dict)
for route,number,sequence,terminal,no_board in patterns:
    for pos,node in enumerate(sequence[:-1]):
        stop = matches.get(node)
        if not stop or sequence.count(node)>1 or node in no_board:
            continue
        towards=terminal or nodes.get(sequence[-1],("",))[0] or nodes.get(sequence[pos+1],("",))[0]
        if towards:
            index[stop][route]=[route,number,towards]
if not index: raise SystemExit("No matching directed bus services")
out=public/"bus-patterns"
out.mkdir(exist_ok=True)
keys=[]
for file in (public/"stop-tiles").glob("*_*.json"):
    tile={s:list(index[s].values()) for s,*_ in json.loads(file.read_text()) if s in index}
    if tile:
        keys.append(file.stem)
        (out/file.name).write_text(json.dumps(tile,ensure_ascii=False,separators=(",",":")))
(out/"index.json").write_text(json.dumps(sorted(keys)))
print(len(index),"matched stops;",len({key for rows in index.values() for key in rows}),"directed routes")
