"""One-off diagnostics for the collector (run by janiqueen-debug.yml)."""
import io, sys, openpyxl
sys.path.insert(0, __file__.rsplit("/", 1)[0])
import collect as c

for iid in ["c42cca39b76d456e9c22e8343a55b802", "0c19879709c14d008d078f2ae3007e07"]:
    blob = c.download(iid)
    wb = openpyxl.load_workbook(io.BytesIO(blob), read_only=True, data_only=True)
    ws = wb.worksheets[0]
    n = 0
    for i, r in enumerate(ws.iter_rows(values_only=True)):
        if any(x not in (None, "") for x in r):
            print("  ", i, [str(x)[:30] for x in r][:20])
            n += 1
        if n > 14:
            break
for iid in ["54afabbba45a4607a420c6f9d7b88842", "dc3eecea58054e0e90ed25d8988495e1", "6b99841340444f83ba2595190e4e143b"]:
    for u in [f"https://www.arcgis.com/sharing/rest/content/items/{iid}/data", f"https://www.arcgis.com/sharing/rest/content/items/{iid}?f=json"]:
        r = c.S.get(u, timeout=120)
        print(iid, u[-12:], r.status_code, r.headers.get("content-type"), len(r.content), r.content[:300])
