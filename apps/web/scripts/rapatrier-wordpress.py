#!/usr/bin/env python3
"""
RAPATRIER LES IMAGES DE L'ANCIEN WORDPRESS (audit du 28/09/2026).

Les visuels du catalogue, des articles de l'Édublog et quelques illustrations
écrites en dur dans le code sont servis par le WordPress historique
(app.les-extras.fr, relayé par ialexia.fr). On veut pouvoir le fermer : ce
script copie chaque image utilisée dans `public/wp/<chemin sous wp-content/uploads>`
et écrit la liste de ce qui a été rapatrié dans `src/lib/wp-rapatrie.ts`.

La réécriture se fait À LA LECTURE, côté site (`lib/media.ts`, `lib/liens-wordpress.ts`) :
rien n'est écrit en base, et une image absente de la liste garde son adresse
d'origine. Relancer le script est sans risque : il réécrit les mêmes fichiers.

    python3 apps/web/scripts/rapatrier-wordpress.py

⚠ LE SERVEUR RÉPOND 403 SANS AGENT DE NAVIGATEUR, et peut servir du WebP sous
une extension .jpeg si l'on n'annonce pas les formats acceptés : d'où les deux
en-têtes ci-dessous, et la vérification du vrai format avant d'écrire.

⚠ LE POIDS EST BORNÉ : 1 600 px de large au plus, qualité 82. Une image déjà
plus légère que sa version recompressée est gardée telle quelle.
"""
import io
import json
import os
import re
import sys
import urllib.request

from PIL import Image

API = os.environ.get("API_PUBLIQUE", "https://api.les-extras.fr/api")
HOTE_WP = "https://app.les-extras.fr"
AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/128.0 Safari/537.36"
)
ICI = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.dirname(ICI)
PUBLIC = os.path.join(WEB, "public", "wp")
LISTE = os.path.join(WEB, "src", "lib", "wp-rapatrie.ts")

# Écartées par `lib/media.ts` (VISUELS_ECARTES) : inutile de les héberger.
ECARTEES = {"2025/01/handicap-psychique.jpg", "2025/02/handicap-psychique.jpg"}

MEDIA = re.compile(
    r"https?://(?:www\.|app\.)?(?:les-extras\.fr|ialexia\.fr)/wp-content/uploads/([^\s\"'<>)\]\\?#]+)"
)
CODE = re.compile(r"wp\(\s*['\"]/?wp-content/uploads/([^'\"]+)['\"]\s*\)")


def lire(url: str, accepter: str = "application/json") -> bytes:
    requete = urllib.request.Request(url, headers={"User-Agent": AGENT, "Accept": accepter})
    with urllib.request.urlopen(requete, timeout=30) as reponse:
        return reponse.read()


def json_de(chemin: str):
    return json.loads(lire(f"{API}{chemin}"))


def textes_api():
    """Tout ce que l'API publique sert et qui peut porter une image."""
    textes, slugs, skip = [], [], 0
    while True:
        page = json_de(f"/public/catalog?take=50&skip={skip}")
        items = page.get("items", [])
        for fiche in items:
            textes.append(json.dumps(fiche))
            if fiche.get("slug"):
                slugs.append(fiche["slug"])
                textes.append(json.dumps(json_de(f"/public/catalog/{fiche['slug']}")))
        if len(items) < 50:
            break
        skip += 50
    textes.append(json.dumps(json_de("/public/highlights")))
    skip = 0
    while True:
        feed = json_de(f"/articles/feed?take=50&skip={skip}")
        items = feed.get("items", [])
        for article in items:
            textes.append(json.dumps(json_de(f"/articles/feed/{article['slug']}")))
        if len(items) < 50:
            break
        skip += 50
    return textes, slugs


def chemins_du_code():
    trouves = set()
    for racine, dossiers, fichiers in os.walk(os.path.join(WEB, "src")):
        dossiers[:] = [d for d in dossiers if d != "__tests__"]
        for nom in fichiers:
            if nom.endswith((".ts", ".tsx")):
                with open(os.path.join(racine, nom), encoding="utf-8") as f:
                    trouves.update(CODE.findall(f.read()))
    return trouves


def rapatrier(chemin: str) -> bool:
    try:
        brut = lire(f"{HOTE_WP}/wp-content/uploads/{chemin}", "image/jpeg,image/png,image/*")
        image = Image.open(io.BytesIO(brut))
        image.load()
    except Exception as erreur:  # 404, page HTML à la place d'une image…
        print(f"  ABSENTE  {chemin} ({erreur})")
        return False
    extension = chemin.rsplit(".", 1)[-1].lower()
    attendu = {"jpg": "JPEG", "jpeg": "JPEG", "png": "PNG", "webp": "WEBP"}.get(extension)
    largeur, hauteur = image.size
    if largeur > 1600:
        image = image.resize((1600, round(hauteur * 1600 / largeur)), Image.LANCZOS)
    tampon = io.BytesIO()
    # On écrit dans le format qu'annonce l'EXTENSION : un WebP servi sous un
    # nom en .jpeg devient un vrai JPEG, et le chemin reste celui de la base.
    format_sortie = attendu or image.format
    if format_sortie == "JPEG":
        image.convert("RGB").save(tampon, "JPEG", quality=82, optimize=True, progressive=True)
    elif format_sortie == "PNG":
        image.save(tampon, "PNG", optimize=True)
    else:
        image.save(tampon, "WEBP", quality=82)
    sortie = tampon.getvalue()
    if image.format == format_sortie and len(sortie) >= len(brut) and largeur <= 1600:
        sortie = brut
    destination = os.path.join(PUBLIC, chemin)
    os.makedirs(os.path.dirname(destination), exist_ok=True)
    with open(destination, "wb") as f:
        f.write(sortie)
    print(f"  {len(brut):>8} -> {len(sortie):>8}  {chemin}")
    return True


def main():
    textes, slugs = textes_api()
    chemins = set()
    for texte in textes:
        chemins.update(MEDIA.findall(texte))
    chemins.update(chemins_du_code())
    chemins = sorted(c for c in chemins if c not in ECARTEES)
    print(f"{len(chemins)} image(s) référencée(s)")
    rapatries = [c for c in chemins if rapatrier(c)]
    # Ce qui est déjà sur le disque d'un passage précédent reste servi.
    for racine, _, fichiers in os.walk(PUBLIC):
        for nom in fichiers:
            relatif = os.path.relpath(os.path.join(racine, nom), PUBLIC).replace(os.sep, "/")
            if relatif not in rapatries:
                rapatries.append(relatif)
    rapatries.sort()
    slugs = sorted(set(slugs))
    with open(LISTE, "w", encoding="utf-8") as f:
        f.write(
            "// FICHIER ENGENDRÉ par `scripts/rapatrier-wordpress.py` : ne pas le modifier à la main.\n"
            "//\n"
            "// Les images de l'ancien WordPress copiées dans `public/wp/`, par chemin sous\n"
            "// `wp-content/uploads/`. `lib/media.ts` ne réécrit vers `/wp/…` QUE ce qui est\n"
            "// listé ici : une image absente garde son adresse d'origine.\n"
            "export const WP_RAPATRIES: readonly string[] = [\n"
            + "".join(f"  {json.dumps(c)},\n" for c in rapatries)
            + "];\n\n"
            "// Les adresses du catalogue public au moment du relevé. `lib/liens-wordpress.ts`\n"
            "// réécrit `app.les-extras.fr/listing/<slug>/` vers `/ateliers/<slug>` si le slug\n"
            "// y figure, sinon vers `/ateliers`.\n"
            "export const SLUGS_CATALOGUE: readonly string[] = [\n"
            + "".join(f"  {json.dumps(s)},\n" for s in slugs)
            + "];\n"
        )
    print(f"{len(rapatries)} image(s) listée(s), {len(slugs)} slug(s) de catalogue -> {LISTE}")


if __name__ == "__main__":
    sys.exit(main())
