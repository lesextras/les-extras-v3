#!/usr/bin/env bash
# RENDU DES FICHES RÉCAP — Chromium headless.
#
# À lancer APRÈS `node fiches-recap.js` (qui écrit les .html dans build/fiches).
#
# ⚠ DEUX PIÈGES QUI ONT COÛTÉ CHER, ET QUI SONT LA RAISON D'ÊTRE DE CE FICHIER :
#
# 1. `--window-size` N'EST PAS LA HAUTEUR DU VIEWPORT. À 1240×1754 le viewport
#    fait 1240×1667 : la barre du navigateur mange 87 px et le pied de page
#    disparaît du PNG sans la moindre erreur. On rend donc en 1240×1841, puis
#    on recadre à 2480×3508.
# 2. Le PDF vectoriel demande `@page { size: 1240px 1754px }` (c'est écrit dans
#    fiches-recap.js) — avec `size: A4` la page déborde sur une seconde page.
#    On repasse ensuite chaque PDF en A4 réel (595×842 pt) avec PyMuPDF.
#
# Sortie : apps/web/public/fiches/<slug>.pdf (vectoriel) + <slug>.jpg (aperçu)
#          et toutes-les-fiches-recap.pdf.
#
# Usage :  ./rendu-fiches.sh              → toutes les fiches
#          ./rendu-fiches.sh <slug> ...   → seulement celles-là
set -euo pipefail

ICI="$(cd "$(dirname "$0")" && pwd)"
SRC="$ICI/build/fiches"
OUT="$ICI/../../public/fiches"
# Le conteneur n'a pas de `chromium` dans le PATH : celui de Playwright fait
# l'affaire, et PLAYWRIGHT_BROWSERS_PATH dit où il est.
CHROME="${CHROME:-$(command -v chromium || command -v chromium-browser || command -v google-chrome \
  || ls -d "${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}"/chromium-*/chrome-linux/chrome 2>/dev/null | head -1)}"
mkdir -p "$OUT"

if [ "$#" -gt 0 ]; then SLUGS=("$@"); else
  SLUGS=(); for f in "$SRC"/*.html; do SLUGS+=("$(basename "$f" .html)"); done
fi

for slug in "${SLUGS[@]}"; do
  html="$SRC/$slug.html"
  [ -f "$html" ] || { echo "!! $slug : pas de HTML"; continue; }
  echo "→ $slug"

  # PNG : viewport 1240×1841 (87 px de barre), puis recadrage 2480×3508.
  "$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
    --force-device-scale-factor=2 --window-size=1240,1841 \
    --screenshot="$SRC/$slug.png" "file://$html" >/dev/null 2>&1

  # PDF vectoriel, puis passage en A4 réel.
  "$CHROME" --headless --disable-gpu --no-sandbox --no-pdf-header-footer \
    --print-to-pdf="$SRC/$slug.pdf" "file://$html" >/dev/null 2>&1

  python3 - "$slug" "$SRC" "$OUT" <<'PY'
import sys
from PIL import Image
slug, src, out = sys.argv[1], sys.argv[2], sys.argv[3]

im = Image.open(f"{src}/{slug}.png").convert("RGB")
im = im.crop((0, 0, 2480, 3508))                    # la barre du navigateur
im.save(f"{out}/{slug}.jpg", quality=88, optimize=True)

import fitz                                          # PyMuPDF
d = fitz.open(f"{src}/{slug}.pdf")
a4 = fitz.open()
p = a4.new_page(width=595, height=842)               # A4 réel, en points
p.show_pdf_page(p.rect, d, 0)
a4.save(f"{out}/{slug}.pdf", deflate=True, garbage=4)
PY
done

# Le recueil des douze, dans l'ordre du fichier de données.
python3 - "$ICI" "$OUT" <<'PY'
import sys, fitz
sys.path.insert(0, sys.argv[1])
import subprocess, json, os
ici, out = sys.argv[1], sys.argv[2]
slugs = json.loads(subprocess.check_output(
    ["node", "-e",
     "console.log(JSON.stringify(require('%s/fiches-recap-data.js').FICHES.map(f=>f.slug)))" % ici]))
rec = fitz.open()
for s in slugs:
    f = os.path.join(out, s + ".pdf")
    if os.path.exists(f):
        rec.insert_pdf(fitz.open(f))
rec.save(os.path.join(out, "toutes-les-fiches-recap.pdf"), deflate=True, garbage=4)
print(len(rec), "pages dans toutes-les-fiches-recap.pdf")
PY
