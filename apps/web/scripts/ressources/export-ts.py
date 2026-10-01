"""Après gen2.js et office.py : aperçus JPG + `src/lib/ressources-outils.ts`.

Chaîne complète (depuis apps/web/scripts/ressources) :
  node gen2.js /tmp/out                 # PDF, aperçus PNG, specs.json
  python3 office.py /tmp/out/specs.json /tmp/out/mod   # Word, Excel, PowerPoint
  python3 export-ts.py /tmp/out         # JPG 520 px + ressources-outils.ts
puis copier /tmp/out/*.pdf dans public/ressources/, /tmp/out/apercus-jpg/*
dans public/ressources/apercus/ et /tmp/out/mod/* dans
public/ressources/modifiables/.
⚠ gen2.js lit les polices dans node_modules/@fontsource (poppins, caveat) :
  `npm i playwright @fontsource/poppins @fontsource/caveat` dans un dossier de travail.
"""
import json
import os
import sys

from PIL import Image

OUT = sys.argv[1]
EXT = {"docx": "word", "xlsx": "excel", "pptx": "powerpoint"}
specs = json.load(open(os.path.join(OUT, "specs.json"), encoding="utf-8"))
os.makedirs(os.path.join(OUT, "apercus-jpg"), exist_ok=True)
items = []
for r in specs:
    im = Image.open(os.path.join(OUT, "apercus", r["id"] + ".png")).convert("RGB")
    w = 520
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, "apercus-jpg", r["id"] + ".jpg"), quality=82, optimize=True)
    items.append(dict(id=r["id"], titre=r["titre"], description=r["description"], categorie=r["cat"], theme=r["theme"],
                      format=r["format"], metiers=r["metiers"], publics=r["publics"],
                      modifiables=[EXT[m] for m in r.get("mod", [])], lex=r.get("lex")))
ts = """/**
 * ⚠ FICHIER ENGENDRÉ par `scripts/ressources/gen2.js` (via `export-ts.py`) : ne pas
 * l'éditer à la main. Les textes vivent dans `scripts/ressources/outils/*.js`.
 */
import type { OutilEngendre } from "./ressources";

export const OUTILS_ENGENDRES: OutilEngendre[] = """ + json.dumps(items, ensure_ascii=False, indent=2) + ";\n"
open(os.path.join(OUT, "ressources-outils.ts"), "w", encoding="utf-8").write(ts)
print(len(items), "outils")
