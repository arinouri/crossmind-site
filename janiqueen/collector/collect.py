#!/usr/bin/env python3
"""Jani Queen lead collector.

Runs weekly on GitHub Actions. It:
  1. finds the City of Ottawa's construction-permit spreadsheets for this year and last year,
  2. keeps the jobs that end in a post-construction clean (new homes, multi-unit, commercial),
  3. places each site on the map (OpenStreetMap Nominatim, cached),
  4. looks up each builder's website, public email and phone (cached, refreshed every 90 days),
  5. writes janiqueen/data/leads.json and janiqueen/data/builders.json for the web app.

Manual additions:
  janiqueen/data/manual-sites.csv     extra sites (e.g. Gatineau) with the same columns as below
  janiqueen/data/builders-manual.json corrections: {"builder name": {"website": "...", "emails": [...], "phones": [...]}}

Contains information licensed under the Open Government Licence - City of Ottawa.
"""
import csv, datetime as dt, io, json, os, re, sys, time, unicodedata
from urllib.parse import urljoin, urlparse, parse_qs, unquote

import requests
from bs4 import BeautifulSoup
import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # janiqueen/
DATA = os.path.join(ROOT, "data")
UA = "JaniQueenLeads/1.0 (+https://crossmind.ca/janiqueen; contact via crossmind.ca)"
S = requests.Session()
S.headers["User-Agent"] = UA
TODAY = dt.date.today()

MAX_GEOCODE = int(os.environ.get("MAX_GEOCODE", "900"))      # ~1 per second (Nominatim policy)
MAX_BUILDERS = int(os.environ.get("MAX_BUILDERS", "120"))     # websites looked up per run
KEEP_MONTHS = 30


def log(*a):
    print(*a, flush=True)


def load(name, default):
    try:
        with open(os.path.join(DATA, name), encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def save(name, obj, compact=False):
    os.makedirs(DATA, exist_ok=True)
    with open(os.path.join(DATA, name), "w", encoding="utf-8") as f:
        if compact:
            json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
        else:
            json.dump(obj, f, ensure_ascii=False, indent=1, sort_keys=True)


def bkey(name):
    s = unicodedata.normalize("NFKD", name or "").encode("ascii", "ignore").decode().lower()
    s = re.sub(r"&", " and ", s)
    s = re.sub(r"[^a-z0-9 ]+", " ", s)
    s = re.sub(r"\b(the|inc|incorporated|ltd|limited|corp|corporation|co|company|llc|ltee|ltée)\b", " ", s)
    return re.sub(r"\s+", "-", s.strip()) or "unknown"


OWNER = re.compile(r"^\W*contractor\W*$", re.I)

# ---------------------------------------------------------------- 1. find + download
SEARCH = "https://open.ottawa.ca/api/search/v1/collections/all/items"


def find_items():
    """Return [(year, item_id, title)] for this year's and last year's permit files."""
    want = {TODAY.year, TODAY.year - 1}
    found = {}
    for q in ["Construction Demolition Pool Permits", "pool enclosure permits monthly"]:
        try:
            r = S.get(SEARCH, params={"q": q, "limit": 50}, timeout=60)
            r.raise_for_status()
            feats = r.json().get("features", [])
        except Exception as e:
            log("search failed:", q, e)
            continue
        for f in feats:
            props = f.get("properties", {}) or {}
            title = props.get("title") or f.get("title") or ""
            iid = f.get("id") or props.get("id")
            if not iid or not re.search(r"permit", title, re.I) or not re.search(r"pool|demolition", title, re.I):
                continue
            years = [int(y) for y in re.findall(r"20\d\d", title)]
            if not years:
                continue
            y = max(years)
            if y in want and y not in found:
                found[y] = (y, iid, title)
    return sorted(found.values())


def download(iid):
    urls = [
        f"https://www.arcgis.com/sharing/rest/content/items/{iid}/data",
        f"https://open.ottawa.ca/api/download/v1/items/{iid}/xlsx",
    ]
    for u in urls:
        try:
            r = S.get(u, timeout=180)
            if r.ok and r.content[:2] == b"PK":
                return r.content
            log("  not an xlsx from", u, r.status_code)
        except Exception as e:
            log("  download failed", u, e)
    return None


# ---------------------------------------------------------------- 2. parse
COLS = {
    "stno": r"^(st(reet)?\s*(#|no|num)|civic|house)",
    "stname": r"^(st(reet)?\s*name|road\s*name)",
    "addr": r"^(address|location|adresse)$",
    "pc": r"postal|code postal",
    "ward": r"^ward|quartier|district",
    "muni": r"municip|former",
    "builder": r"contractor|builder|entrepreneur|applicant",
    "type": r"(b(ui)?ld?g?\.?\s*type|building\s*type|type de b)",
    "desc": r"desc",
    "units": r"^(du|d\.u\.|dwelling|units|# ?units|logements)",
    "value": r"value|valeur",
    "area": r"(ft2|sq\.?\s*f|area|superficie)",
    "id": r"(permit\s*(#|no|num)|^permit$|^folder|num[ée]ro)",
    "kind": r"(appl(ication)?\s*type|permit\s*type|type\s*of\s*work|work\s*type)",
    "issued": r"issue|[ée]mis",
}
HEADER_HINT = re.compile(r"ward|contractor|desc|postal|issue")


def to_date(v):
    if isinstance(v, dt.datetime):
        return v.date().isoformat()
    if isinstance(v, dt.date):
        return v.isoformat()
    if isinstance(v, (int, float)) and 20000 < v < 80000:
        return (dt.date(1899, 12, 30) + dt.timedelta(days=int(v))).isoformat()
    s = str(v or "").strip()
    m = re.search(r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})", s)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    return ""


def num(v):
    try:
        return float(re.sub(r"[$,\s]", "", str(v))) if v not in (None, "") else 0.0
    except ValueError:
        return 0.0


def title_case(s):
    s = s.lower()
    s = re.sub(r"\b([a-zà-ÿ])", lambda m: m.group(1).upper(), s)
    return re.sub(r"\b(Nw|Ne|Sw|Se|N|S|E|W)\b", lambda m: m.group(1).upper(), s)


def nice_name(n):
    if OWNER.match(n) or not n.isupper():
        return n
    t = title_case(n)
    return re.sub(r"\b(Inc|Ltd|Ltée|Corp|Llc)\b\.?", lambda m: m.group(1) + ".", t).replace("..", ".")


def parse_rows(rows, city="Ottawa"):
    out, cmap = [], None
    for row in rows:
        cells = ["" if c is None else c for c in row]
        low = [str(c).strip().lower() for c in cells]
        if sum(1 for c in low if HEADER_HINT.search(c)) >= 3:
            cmap = {}
            for i, c in enumerate(low):
                for k, rx in COLS.items():
                    if k not in cmap and re.search(rx, c):
                        cmap[k] = i
                        break
            continue
        if not cmap:
            continue
        g = lambda k: cells[cmap[k]] if k in cmap and cmap[k] < len(cells) else ""
        if "addr" in cmap:
            addr = str(g("addr"))
        else:
            no = g("stno")
            if isinstance(no, float) and no.is_integer():
                no = int(no)
            addr = f"{no} {g('stname')}"
        addr = re.sub(r"\s+", " ", addr).strip()
        issued = to_date(g("issued"))
        if not addr or not issued or addr.lower().startswith("total"):
            continue
        pid = g("id")
        if isinstance(pid, float) and pid.is_integer():
            pid = int(pid)
        out.append({
            "addr": title_case(addr), "pc": str(g("pc") or "").upper().strip(),
            "ward": re.sub(r"(?i)ward\s*", "", str(g("ward") or "")).strip(),
            "muni": str(g("muni") or "").strip().title(), "city": city,
            "builder": nice_name(str(g("builder") or "").strip()), "type": str(g("type") or "").strip(),
            "desc": str(g("desc") or "").strip(), "units": max(0, int(num(g("units")))),
            "value": round(num(g("value"))), "area": round(num(g("area"))),
            "id": str(pid or f"{addr}|{issued}"), "issued": issued, "kind": str(g("kind") or "").strip(),
        })
    return out


def parse_xlsx(blob):
    wb = openpyxl.load_workbook(io.BytesIO(blob), read_only=True, data_only=True)
    rows = []
    for ws in wb.worksheets:
        rows += parse_rows(ws.iter_rows(values_only=True))
    return rows


SKIP = re.compile(r"pool|demoli|\bsign\b|\bshed\b|\bdeck\b|fence|solar|\btent\b|retaining wall|signage", re.I)
ICI = re.compile(r"commerc|office|retail|industr|instit|mercantile|assembly|restaurant|school|hotel|clinic|warehouse", re.I)


def relevant(p):
    t = f"{p['kind']} {p['desc']} {p['type']}"
    if SKIP.search(t) or re.match(r"(?i)^(demolish|enclos)", p["desc"]):
        return False
    return p["units"] >= 1 or p["value"] >= 150000 or (ICI.search(t) and p["value"] >= 50000)


# ---------------------------------------------------------------- 3. geocode
def geocode(sites, cache):
    done = 0
    for p in sites:
        k = f"{p['addr']}|{p['city']}".lower()
        if k in cache:
            hit = cache[k]
        elif done < MAX_GEOCODE:
            addr = re.split(r"\s*(,|unit|#|suite)\s*", p["addr"], flags=re.I)[0]
            prov = "Quebec" if p["city"].lower() == "gatineau" else "Ontario"
            try:
                r = S.get("https://nominatim.openstreetmap.org/search", timeout=30, params={
                    "street": addr, "city": p["city"], "state": prov, "country": "Canada",
                    "format": "jsonv2", "limit": 1})
                js = r.json() if r.ok else []
                hit = [round(float(js[0]["lat"]), 6), round(float(js[0]["lon"]), 6)] if js else None
            except Exception:
                hit = None
            cache[k] = hit
            done += 1
            time.sleep(1.05)
        else:
            continue
        if hit:
            p["lat"], p["lng"] = hit
    log(f"geocoded {done} new addresses")


# ---------------------------------------------------------------- 4. builder contact lookup
BLOCK = re.compile(r"facebook|linkedin|instagram|twitter|x\.com|youtube|yelp|yellowpages|houzz|homestars|bbb\.org|"
                   r"gohba|ottawa\.ca|tarion|hcra|canada411|zoominfo|google|wikipedia|indeed|glassdoor|kijiji|"
                   r"mapquest|opencorporates|bizapedia|411\.ca|duckduckgo|bing\.com|trustedpros|dnb\.com|"
                   r"cylex|hotfrog|ourbis|canadacompanyregistry|newhomesottawa|rentals|realtor|zillow", re.I)
EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE = re.compile(r"(?:\+?1[\s.-]?)?\(?(613|343|819|873)\)?[\s.-]?\d{3}[\s.-]?\d{4}")
BAD_EMAIL = re.compile(r"\.(png|jpe?g|gif|webp|svg)$|sentry|wixpress|example\.|domain\.com|godaddy|@email\.|"
                       r"yourname|name@|user@|squarespace|cloudflare", re.I)


def tokens(name):
    return [t for t in bkey(name).split("-") if len(t) > 2 and t not in
            {"construction", "homes", "builders", "building", "group", "ottawa", "development", "developments",
             "contracting", "general", "contractors", "services", "and", "design", "renovations", "properties"}]


def search_site(name):
    try:
        r = S.post("https://html.duckduckgo.com/html/", data={"q": f'"{name}" Ottawa'}, timeout=30)
        soup = BeautifulSoup(r.text, "html.parser")
    except Exception:
        return None
    toks = tokens(name)
    for a in soup.select("a.result__a")[:8]:
        href = a.get("href", "")
        if "uddg=" in href:
            href = unquote(parse_qs(urlparse(href).query).get("uddg", [""])[0])
        host = urlparse(href).netloc.lower()
        if not host or BLOCK.search(host):
            continue
        hay = (host + " " + a.get_text(" ")).lower()
        if not toks or any(t in hay for t in toks):
            return f"{urlparse(href).scheme}://{host}"
    return None


def scrape_contacts(site):
    emails, phones, seen = [], [], set()
    try:
        home = S.get(site, timeout=25)
    except Exception:
        return emails, phones
    pages = [home]
    try:
        soup = BeautifulSoup(home.text, "html.parser")
        links = [urljoin(home.url, a["href"]) for a in soup.find_all("a", href=True)
                 if re.search(r"contact|about|team|careers|trade", a["href"] + a.get_text(" "), re.I)]
        host = urlparse(home.url).netloc
        for u in list(dict.fromkeys(links))[:3]:
            if urlparse(u).netloc == host:
                try:
                    pages.append(S.get(u, timeout=25))
                    time.sleep(0.5)
                except Exception:
                    pass
    except Exception:
        pass
    domain = re.sub(r"^www\.", "", urlparse(home.url).netloc.lower())
    for pg in pages:
        text = pg.text.replace("[at]", "@").replace("(at)", "@")
        for e in EMAIL.findall(text):
            e = e.lower().strip(".")
            if e not in seen and not BAD_EMAIL.search(e):
                seen.add(e)
                emails.append(e)
        for m in PHONE.finditer(BeautifulSoup(pg.text, "html.parser").get_text(" ")):
            d = re.sub(r"\D", "", m.group(0))[-10:]
            f = f"{d[:3]}-{d[3:6]}-{d[6:]}"
            if f not in phones:
                phones.append(f)
    # same-domain addresses first, then sales/info-style inboxes
    rank = lambda e: (0 if e.endswith(domain) else 1,
                      0 if re.match(r"(sales|info|contact|office|admin|projects|estimat)", e) else 1)
    return sorted(emails, key=rank)[:4], phones[:3]


def gohba_directory():
    """Best effort: names, phones and websites from the Greater Ottawa Home Builders' Association directory."""
    out = {}
    for base in ["https://gohba.ca/directory/page/{}/", "https://www.gohba.ca/directory/page/{}/"]:
        for n in range(1, 40):
            try:
                r = S.get(base.format(n), timeout=30)
                if not r.ok:
                    break
            except Exception:
                break
            lines = [l.strip() for l in BeautifulSoup(r.text, "html.parser").get_text("\n").split("\n") if l.strip()]
            for i, l in enumerate(lines):
                if l.startswith("Phone Number:"):
                    name = lines[i - 1] if i else ""
                    web = next((x.split(":", 1)[1].strip() for x in lines[i + 1:i + 3] if x.startswith("Website:")), "")
                    if name:
                        out[bkey(name)] = {"name": name, "phone": l.split(":", 1)[1].strip(), "website": web}
            time.sleep(0.5)
        if out:
            break
    log(f"GOHBA directory: {len(out)} members")
    return out


def enrich_builders(sites, builders):
    manual = {bkey(k): v for k, v in load("builders-manual.json", {}).items()}
    counts = {}
    for p in sites:
        if p.get("owner"):
            continue
        counts[p["bkey"]] = counts.get(p["bkey"], 0) + 1
        builders.setdefault(p["bkey"], {"name": p["builder"]})
    gohba = gohba_directory() if any(k not in builders or "checked" not in builders[k] for k in counts) else {}
    todo = sorted(counts, key=lambda k: -counts[k])
    looked = 0
    for k in todo:
        b = builders[k]
        b["sites"] = counts[k]
        if k in manual:
            b.update(manual[k])
            b["source"] = "manual"
            continue
        g = gohba.get(k)
        if g and not b.get("website"):
            b["website"] = g.get("website") or b.get("website")
            if g.get("phone"):
                b["phones"] = list(dict.fromkeys([g["phone"]] + b.get("phones", [])))
        last = b.get("checked")
        age = (TODAY - dt.date.fromisoformat(last)).days if last else 9999
        stale = age > (90 if b.get("emails") else 30)
        if not stale or looked >= MAX_BUILDERS:
            continue
        looked += 1
        site = b.get("website") or search_site(b["name"])
        time.sleep(1.5)
        if site:
            b["website"] = site
            emails, phones = scrape_contacts(site)
            if emails:
                b["emails"] = emails
            if phones:
                b["phones"] = list(dict.fromkeys(b.get("phones", []) + phones))[:3]
            b["source"] = "website"
        b["checked"] = TODAY.isoformat()
        log(f"  {b['name']}: {b.get('website') or 'no site'} {b.get('emails') or ''}")
    log(f"looked up {looked} builders")
    return {k: v for k, v in builders.items() if k in counts}


# ---------------------------------------------------------------- main
def main():
    old = load("leads.json", {"sites": []})
    by_id = {s["id"]: s for s in old.get("sites", [])}
    sources = []
    items = find_items()
    log("permit files:", items)
    for year, iid, title in items:
        blob = download(iid)
        if not blob:
            continue
        rows = parse_xlsx(blob)
        if not rows:
            wb = openpyxl.load_workbook(io.BytesIO(blob), read_only=True, data_only=True)
            for ws in wb.worksheets[:1]:
                log("  sheet", ws.title)
                for i, r in enumerate(ws.iter_rows(values_only=True)):
                    log("   ", [c for c in r][:20])
                    if i > 45:
                        break
        kept = [p for p in rows if relevant(p)]
        log(f"{title}: {len(rows)} rows, {len(kept)} kept")
        for p in kept:
            prev = by_id.get(p["id"])
            if prev and "lat" in prev:
                p["lat"], p["lng"] = prev["lat"], prev["lng"]
            by_id[p["id"]] = p
        sources.append({"name": title, "rows": len(rows), "kept": len(kept),
                        "url": "https://open.ottawa.ca/datasets/construction-demolition-and-pool-permits-" + str(year)})

    manual_csv = os.path.join(DATA, "manual-sites.csv")
    if os.path.exists(manual_csv):
        with open(manual_csv, encoding="utf-8") as f:
            for i, r in enumerate(csv.DictReader(f)):
                if not r.get("addr"):
                    continue
                p = {"addr": r["addr"], "pc": r.get("pc", ""), "ward": "", "muni": r.get("city", ""),
                     "city": r.get("city") or "Ottawa", "builder": r.get("builder", ""), "type": r.get("type", ""),
                     "desc": r.get("desc", ""), "units": int(num(r.get("units"))), "value": round(num(r.get("value"))),
                     "area": round(num(r.get("area"))), "id": r.get("id") or f"manual-{i}",
                     "issued": to_date(r.get("issued")) or TODAY.isoformat(), "kind": "Manual"}
                by_id[p["id"]] = p
        sources.append({"name": "Manually added sites", "url": ""})

    cutoff = (TODAY - dt.timedelta(days=KEEP_MONTHS * 30)).isoformat()
    sites = [s for s in by_id.values() if s["issued"] >= cutoff]
    if not sites:
        log("No permits collected — keeping existing data.")
        sys.exit(0)
    for p in sites:
        p["owner"] = bool(OWNER.match(p["builder"] or "")) or not p["builder"]
        p["bkey"] = "" if p["owner"] else bkey(p["builder"])

    cache = load("geocache.json", {})
    geocode(sorted(sites, key=lambda p: p["issued"], reverse=True), cache)
    save("geocache.json", cache)

    builders = enrich_builders(sites, load("builders.json", {}))
    save("builders.json", builders)

    sites.sort(key=lambda p: p["issued"], reverse=True)
    save("leads.json", {"updated": dt.datetime.utcnow().strftime("%Y-%m-%dT%H:%MZ"), "sources": sources or old.get("sources", []),
                        "sites": sites}, compact=True)
    log(f"wrote {len(sites)} sites, {len(builders)} builders "
        f"({sum(1 for b in builders.values() if b.get('emails'))} with email)")


if __name__ == "__main__":
    main()
