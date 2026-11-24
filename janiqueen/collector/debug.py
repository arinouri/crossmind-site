"""Diagnostics round 2."""
import io, json, re, sys
sys.path.insert(0, __file__.rsplit("/", 1)[0])
import collect as c

u = "https://www.gatineau.ca/portail/default.aspx?p=publications_cartes_statistiques_donnees_ouvertes/statistiques_permis_construction"
t = c.S.get(u, timeout=60).text
i = t.find("contenu-principal-centre-contenu-index")
print("GATHTML", re.sub(r"\s+", " ", t[i:i+6000]))
for q in ["https://www.gatineau.ca/sitemap.xml", "https://www.gatineau.ca/robots.txt"]:
    r = c.S.get(q, timeout=30); print("GATX", q, r.status_code, r.text[:300].replace("\n", " "))

import pdfplumber
blob = c.S.get("https://www.gatineau.ca/upload/documents/ba25c870-60e2-492b-9cb2-b890c86540d1.pdf", timeout=120).content
with pdfplumber.open(io.BytesIO(blob)) as pdf:
    for n in (12, 30, 50):
        print(f"--- page {n} ---"); print((pdf.pages[n].extract_text() or "")[:1600])

j = None
r = c.S.get("https://www.donneesquebec.ca/recherche/api/3/action/package_show", params={"id": "systeme-electronique-dappel-doffres-seao"}, timeout=60)
res = sorted(r.json()["result"]["resources"], key=lambda x: x.get("created") or "")
hebdo = [x for x in res if "hebdo" in (x.get("name") or "")][-1]
j = c.S.get(hebdo["url"], timeout=180).json()
rel = j["releases"]
import collections
print("TAGS", collections.Counter(tuple(x.get("tag", [])) for x in rel))
ten = [x for x in rel if "tender" in x.get("tag", []) and re.search(r"(?i)nettoyage|entretien m[ée]nager|conciergerie|janitor|cleaning", x.get("tender", {}).get("title", ""))]
print("OPEN CLEANING", len(ten))
for x in ten[:3]:
    print(json.dumps(x, ensure_ascii=False)[:3000])
regions = collections.Counter()
for x in rel:
    for p in x.get("parties", []):
        a = p.get("address", {}) or {}
        regions[a.get("region") or a.get("locality") or "?"] += 1
print("REGIONS", regions.most_common(40))

for iid in ["7e5a6428ed674d66a500f87c3ab0b2a1", "5117e01b9ba14415b4a7cbb12e7e0dda", "2cd5d87093564e41a7f381a425601150"]:
    r = c.S.get(f"https://open.ottawa.ca/api/search/v1/collections/all/items/{iid}", timeout=60)
    p = r.json().get("properties", {})
    print("OTT ITEM", p.get("title"), p.get("type"), p.get("url"), str(p.get("modified")))
    url = p.get("url") or ""
    if "FeatureServer" in url or "MapServer" in url:
        base = url.rstrip("/")
        if not re.search(r"/\d+$", base): base += "/0"
        q = c.S.get(base + "/query", params={"where": "1=1", "outFields": "*", "resultRecordCount": 3, "f": "json", "orderByFields": "OBJECTID DESC"}, timeout=60).json()
        print("   FIELDS", [f["name"] for f in q.get("fields", [])])
        for f in q.get("features", [])[:3]:
            print("   ROW", json.dumps(f.get("attributes"), ensure_ascii=False)[:900])
        cnt = c.S.get(base + "/query", params={"where": "1=1", "returnCountOnly": "true", "f": "json"}, timeout=60).json()
        print("   COUNT", cnt)
