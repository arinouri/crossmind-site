"""One-off diagnostics for the collector (run by janiqueen-debug.yml)."""
import io, re, sys, openpyxl
sys.path.insert(0, __file__.rsplit("/", 1)[0])
import collect as c
from bs4 import BeautifulSoup

for y, iid, t in c.find_items(set(range(2018, 2024))):
    blob = c.download(iid)
    print("==", y, t, iid, "bytes", len(blob or b""), "xlsx" if blob else "NONE")
    if not blob:
        continue
    wb = openpyxl.load_workbook(io.BytesIO(blob), read_only=True, data_only=True)
    print("   sheets:", [(ws.title, ws.max_row) for ws in wb.worksheets][:14])
    ws = wb.worksheets[min(1, len(wb.worksheets) - 1)]
    for i, r in enumerate(ws.iter_rows(values_only=True)):
        print("   ", [str(x)[:40] for x in r][:18])
        if i > 12:
            break
    rows = c.parse_xlsx(blob)
    print("   parsed rows:", len(rows), "with builder:", sum(1 for p in rows if p["builder"]))

for name in ["Minto Communities", "Tamarack Homes", "Caivan"]:
    for url, kw in [("https://html.duckduckgo.com/html/", dict(data={"q": f'"{name}" Ottawa'})),
                    ("https://www.bing.com/search", dict(params={"q": f'"{name}" Ottawa'}))]:
        try:
            r = (c.S.post if "duck" in url else c.S.get)(url, timeout=30, **kw)
            soup = BeautifulSoup(r.text, "html.parser")
            links = [a.get("href", "")[:90] for a in soup.select("a.result__a, li.b_algo h2 a")][:4]
            print("SEARCH", name, url[:30], r.status_code, len(r.text), links)
        except Exception as e:
            print("SEARCH", name, url, "ERR", e)
    print("SITE", name, c.search_site(name))

for u in ["https://gohba.ca/directory/", "https://www.gohba.ca/directory/", "https://gohba.ca/find-a-builder/",
          "https://gohba.ca/directory/page/2/", "https://testing.gohba.ca/directory/page/2/"]:
    try:
        r = c.S.get(u, timeout=30)
        txt = BeautifulSoup(r.text, "html.parser").get_text("\n")
        print("GOHBA", u, r.status_code, r.url, "phones:", txt.count("Phone Number"), repr(txt[:200]))
    except Exception as e:
        print("GOHBA", u, "ERR", e)
print("CONTACTS", c.scrape_contacts("https://www.minto.com"))
