"""Diagnostics: Gatineau permit PDFs, SEAO tenders, other Ottawa datasets."""
import io, json, re, sys
sys.path.insert(0, __file__.rsplit("/", 1)[0])
import collect as c

# --- Gatineau listing page: where are the PDF links?
for u in ["https://www.gatineau.ca/portail/default.aspx?p=publications_cartes_statistiques_donnees_ouvertes/statistiques_permis_construction",
          "https://www.gatineau.ca/portail/default.aspx?p=publications_cartes_statistiques_donnees_ouvertes%2Fstatistiques_permis_construction&c=fr-CA"]:
    r = c.S.get(u, timeout=60)
    t = r.text
    print("GAT PAGE", r.status_code, len(t), "upload hits:", len(re.findall(r"upload", t, re.I)))
    for m in re.finditer(r"[^\"'<>\s]*(upload/documents|\.pdf|\.xlsx)[^\"'<>\s]*", t, re.I):
        print("   LINK", m.group(0)[:160])
    i = t.lower().find("relev")
    print("   CONTEXT", re.sub(r"\s+", " ", t[i-300:i+1500]) if i > 0 else "no 'relev'")
    for m in re.finditer(r"<iframe[^>]+>|<script[^>]+src=[^>]+>", t):
        print("   TAG", m.group(0)[:200])

# --- parse the known April 2025 PDF
import pdfplumber
blob = c.S.get("https://www.gatineau.ca/upload/documents/ba25c870-60e2-492b-9cb2-b890c86540d1.pdf", timeout=120).content
print("PDF bytes", len(blob), blob[:5])
with pdfplumber.open(io.BytesIO(blob)) as pdf:
    print("PAGES", len(pdf.pages))
    for n in (0, 3, 8):
        if n < len(pdf.pages):
            pg = pdf.pages[n]
            print(f"--- page {n} text ---"); print((pg.extract_text() or "")[:1800])
            tb = pg.extract_tables()
            print(f"--- page {n} tables: {len(tb)}"); [print("  ROW", r) for r in (tb[0][:12] if tb else [])]

# --- SEAO
r = c.S.get("https://www.donneesquebec.ca/recherche/api/3/action/package_show", params={"id": "systeme-electronique-dappel-doffres-seao"}, timeout=60)
print("SEAO pkg", r.status_code)
try:
    res = r.json()["result"]["resources"]
    res = sorted(res, key=lambda x: x.get("created") or "")
    for x in res[-8:]:
        print("  RES", x.get("name"), x.get("format"), x.get("url"), x.get("created"))
    hebdo = [x for x in res if "hebdo" in (x.get("name") or "")][-1]
    j = c.S.get(hebdo["url"], timeout=180).json()
    rel = j.get("releases", [])
    print("RELEASES", len(rel), list(j.keys())[:6])
    hits = [x for x in rel if re.search(r"(?i)nettoyage|entretien m[ée]nager|conciergerie|janitor|cleaning", json.dumps(x.get("tender", {}), ensure_ascii=False))]
    print("CLEANING", len(hits))
    for x in hits[:3]:
        print(json.dumps({k: x.get(k) for k in ("tag", "date", "tender", "buyer", "parties")}, ensure_ascii=False)[:2500])
except Exception as e:
    print("SEAO err", e, r.text[:300])

# --- Ottawa datasets that could hint at new businesses / buildings
for q in ["business licence", "food premises", "inspection", "development applications", "site plan"]:
    r = c.S.get("https://open.ottawa.ca/api/search/v1/collections/all/items", params={"q": q, "limit": 8}, timeout=60)
    try:
        print("OTTAWA", q, [((f.get("properties") or {}).get("title"), f.get("id")) for f in r.json().get("features", [])])
    except Exception as e:
        print("OTTAWA", q, "err", e)
