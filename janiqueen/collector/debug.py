"""Diagnostics: how many current sites get a builder, and does the contact lookup work."""
import json, os, sys, collections
sys.path.insert(0, __file__.rsplit("/", 1)[0])
import collect as c

hist = c.learn_builders()
print("history builders:", len(hist.get("builders", {})), "streets:", len(hist.get("street", {})), "addresses:", len(hist.get("addr", {})))
top = sorted(hist["builders"].values(), key=lambda v: -v["homes"])[:15]
print("top home builders:", [(v["name"], v["homes"]) for v in top])
sites = json.load(open(os.path.join(c.DATA, "leads.json")))["sites"]
for p in sites:
    p["builder"] = "" if p.get("bsrc") else p.get("builder", "")
c.name_builders(sites, hist)
named = [p for p in sites if p.get("builder")]
print("sites named:", len(named), "of", len(sites))
print("by builder:", collections.Counter(p["builder"] for p in named).most_common(15))
for p in named[:8]:
    print("  ", p["addr"], "->", p["builder"], "|", p.get("bsrc"))
for name in [v["name"] for v in top[:6]]:
    site = c.search_site(name)
    print("LOOKUP", name, site, c.scrape_contacts(site) if site else "")
g = c.gohba_directory()
print("GOHBA sample:", list(g.values())[:5])
