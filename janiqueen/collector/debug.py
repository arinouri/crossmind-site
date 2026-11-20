"""Diagnostics: builder naming coverage and contact lookup."""
import json, os, sys, collections
sys.path.insert(0, __file__.rsplit("/", 1)[0])
import collect as c
hist = c.learn_builders()
sites = json.load(open(os.path.join(c.DATA, "leads.json")))["sites"]
for p in sites:
    p["builder"] = "" if p.get("bsrc") else p.get("builder", "")
c.name_builders(sites, hist)
named = [p for p in sites if p.get("builder")]
print("sites named:", len(named), "of", len(sites))
print("by builder:", collections.Counter(c.bkey(p["builder"]) for p in named).most_common(25))
for name in ["Minto Communities Inc.", "Mattamy Homes Limited", "Richcraft Homes Limited", "Claridge Homes Inc.", "Tamarack Homes",
             "Urbandale Construction", "Caivan Ltd.", "Cardel Homes Inc.", "Prisma Construction", "Tartan Homes Corporation", "Valecraft Homes Limited", "Glenview Homes"]:
    site = c.search_site(name)
    print("LOOKUP", name, "|", site, "|", c.scrape_contacts(site) if site else "")
