"""Diagnostics for new lead sources."""
import csv, io, re, sys
sys.path.insert(0, __file__.rsplit("/", 1)[0])
import collect as c
from bs4 import BeautifulSoup

u = "https://www.gatineau.ca/portail/default.aspx?p=publications_cartes_statistiques_donnees_ouvertes%2Fstatistiques_permis_construction"
r = c.S.get(u, timeout=60)
soup = BeautifulSoup(r.text, "html.parser")
links = [(a.get_text(" ", strip=True)[:60], a["href"]) for a in soup.find_all("a", href=True) if re.search(r"\.(pdf|xlsx?|csv)|upload", a["href"], re.I)]
print("GATINEAU", r.status_code, len(r.text), links[:30])
if links:
    f = links[0][1] if links[0][1].startswith("http") else "https://www.gatineau.ca" + links[0][1]
    rr = c.S.get(f, timeout=120)
    print("FIRST FILE", f, rr.status_code, rr.headers.get("content-type"), len(rr.content), rr.content[:8])
    if rr.content[:4] == b"%PDF":
        import pdfplumber
        with pdfplumber.open(io.BytesIO(rr.content)) as pdf:
            print("PAGES", len(pdf.pages))
            for pg in pdf.pages[1:3]:
                t = pg.extract_table()
                print("TABLE", (t or [])[:6])
                print("TEXT", (pg.extract_text() or "")[:800])

r = c.S.get("https://canadabuys.canada.ca/opendata/pub/openTenderNotice-ouvertAvisAppelOffres.csv", timeout=180)
print("CANADABUYS", r.status_code, len(r.content))
rows = list(csv.DictReader(io.StringIO(r.content.decode("utf-8-sig", "ignore"))))
print("COLUMNS", list(rows[0].keys()) if rows else None)
hits = [x for x in rows if re.search(r"clean|janitor|custodial|nettoyage|entretien m[ée]nager", " ".join(str(v) for v in x.values()), re.I)]
print("CLEANING HITS", len(hits))
for x in hits[:6]:
    print("  ", {k: (v or "")[:80] for k, v in x.items() if v and re.search(r"title|region|delivery|closing|contact|entity|email|phone|reference|link|url", k, re.I)})
