#!/usr/bin/env python3
"""
COUVERTURES DES MINI-FORMATIONS GRATUITES — générateur versionné.

Pourquoi un script et pas des images fabriquées à la main. Le catalogue
`/formations` affiche une carte par fiche, et une carte sans visuel est une
carte qu'on ne clique pas. Il y a dix mini-formations aujourd'hui, dix-huit
sont prévues. Les dessiner une par une dans un éditeur, c'est dix-huit
occasions de dériver sur la palette, la taille du texte ou la position du
logo, et aucune trace de la façon dont elles ont été produites.

── POURQUOI CES COUVERTURES SONT CLAIRES, ET NON PLUS SOMBRES ────────────────
La première version reprenait la palette de la carte de partage : fond
#12151C, presque noir. Isolée, elle était juste ; en grille, sur le catalogue
dont le fond est crème, dix vignettes noires formaient un bloc opaque au
milieu de la page — et les trois formations Qualiopi, qui n'ont pas de photo,
apparaissaient en dégradé clair juste à côté. Deux mondes sur la même grille.

On repart donc d'un fond clair et franchement coloré, une couleur par
parcours — la même que celle de sa fiche récap A4, pour que l'un rappelle
l'autre — et un emoji large qui donne à la vignette sa silhouette
reconnaissable à trois mètres.

⚠ CE QUE CES COUVERTURES N'ONT PAS, VOLONTAIREMENT :
  — aucune photo de personne. Une couverture de formation sur les
    comportements-défis illustrée par un enfant laisse entendre que cet enfant
    est concerné. C'est la raison pour laquelle `handicap-psychique.jpg` a été
    écartée de la médiathèque (voir `lib/media.ts`) ;
  — aucune mention « certificat » ni « certifiante » : ces formations n'en
    sont pas, et un visuel se recadre moins facilement qu'une phrase ;
  — aucun logo de programme ni de marque tierce.

⚠ LA DURÉE AFFICHÉE S'ADOSSE AU CONTENU MESURÉ, jamais à une intuition. Elle
part dans les fiches publiques et, un jour, dans un dossier de financement.
Après l'enrichissement du 2/09/2026 (modules portés de ~2 500 à ~13 000
caractères), elle est passée de 36-39 min à 45 min — recalculée, pas estimée.
Elle doit dire le même nombre que le résumé de la fiche et que la fiche récap.

Usage : python3 couvertures-mini-formations.py <dossier-de-destination>
        (par défaut : apps/web/public/images/mini-formations)
"""

import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

# 16/10 : c'est le ratio de la carte du catalogue (`aspect-[16/10]`). La fiche
# affiche la même image en 16/9 avec `object-cover`, donc légèrement rognée en
# haut et en bas — d'où une marge verticale généreuse et aucun texte près des
# bords hauts et bas.
L, H = 1280, 800

ENCRE = (0x16, 0x20, 0x2E)
DOUX = (0x5B, 0x64, 0x72)
BLANC = (0xFF, 0xFF, 0xFF)

# Poppins et Noto Color Emoji sont installées dans le conteneur. Poppins parce
# que c'est déjà la police des fiches récap : couverture et fiche doivent avoir
# l'air d'être sorties du même atelier.
GRAS = "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf"
MOYEN = "/usr/share/fonts/truetype/google-fonts/Poppins-Medium.ttf"
NORMAL = "/usr/share/fonts/truetype/google-fonts/Poppins-Regular.ttf"
# Police bitmap : elle ne se dessine qu'à sa taille native (109 px), puis on
# redimensionne le calque. Toute autre taille passée à truetype() échoue.
EMOJI = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"
EMOJI_NATIF = 109

MARGE = 88
# Supersampling ×2 : le texte rendu directement à la taille finale bave sur les
# accents et les apostrophes typographiques.
ECHELLE = 2


def teinte(couleur, part, fond=(0xFF, 0xFF, 0xFF)):
    """Mélange `couleur` et `fond` — `part` = proportion de couleur (0 à 1)."""
    return tuple(round(c * part + f * (1 - part)) for c, f in zip(couleur, fond))


# Une couleur et un emoji par parcours, LES MÊMES que sur sa fiche récap A4
# (`fiches-recap-data.js`). C'est ce qui fait qu'on reconnaît la formation
# avant d'avoir lu son titre — sur la carte, sur la fiche, sur la feuille
# imprimée. Ne pas les changer d'un côté sans l'autre.
COUVERTURES = [
    {
        "fichier": "les-quatre-fonctions-d-un-comportement.jpg",
        "surtitre": "TSA, communication et comportement",
        "titre": "Les quatre fonctions d’un comportement",
        "sous": "Identifier à quoi sert un comportement avant de chercher à le modifier",
        "duree": "4 modules + annexes · 45 min",
        "accent": (0x25, 0x63, 0xEB),
        "second": (0x38, 0xBD, 0xF8),
        "emoji": "🔍",
        "confettis": "🧩🗒️🔁🎯",
    },
    {
        "fichier": "apprendre-a-demander-plutot-qu-a-crier.jpg",
        "surtitre": "TSA, communication et comportement",
        "titre": "Apprendre à demander plutôt qu’à crier",
        "sous": "Construire et enseigner un comportement de remplacement",
        "duree": "4 modules + annexes · 45 min",
        "accent": (0x25, 0x63, 0xEB),
        "second": (0xA7, 0x8B, 0xFA),
        "emoji": "💬",
        "confettis": "🔄🙌🗣️✅",
    },
    {
        "fichier": "guider-puis-s-effacer.jpg",
        "surtitre": "Apprentissages et autonomie",
        "titre": "Guider puis s’effacer",
        "sous": "Doser une aide, puis la retirer selon un plan décidé à l’avance",
        "duree": "4 modules + annexes · 45 min",
        "accent": (0x16, 0xA3, 0x4A),
        "second": (0xFB, 0xBF, 0x24),
        "emoji": "🪜",
        "confettis": "🤲⏳📉🎈",
    },
    {
        "fichier": "decomposer-une-routine-en-etapes.jpg",
        "surtitre": "Apprentissages et autonomie",
        "titre": "Décomposer une routine en étapes",
        "sous": "Découper une routine du quotidien et choisir par quelle extrémité l’enseigner",
        "duree": "4 modules + annexes · 45 min",
        "accent": (0x16, 0xA3, 0x4A),
        "second": (0x38, 0xBD, 0xF8),
        "emoji": "🔗",
        "confettis": "🧦👕🧩✅",
    },
    {
        "fichier": "rendre-l-environnement-previsible.jpg",
        "surtitre": "Environnement et repères",
        "titre": "Rendre l’environnement prévisible",
        "sous": "Construire un support visuel qui est réellement consulté",
        "duree": "4 modules + annexes · 45 min",
        "accent": (0x7C, 0x3A, 0xED),
        "second": (0xF4, 0x72, 0xB6),
        "emoji": "🗓️",
        "confettis": "📌🖼️🔔🧲",
    },
    {
        "fichier": "les-premieres-minutes-d-une-crise.jpg",
        "surtitre": "Comportements-défis et situations de crise",
        "titre": "Les premières minutes d’une crise",
        "sous": "Réduire ce que l’adulte ajoute pendant, et préparer à froid ce qui suit",
        "duree": "4 modules + annexes · 45 min",
        "accent": (0xEA, 0x58, 0x0C),
        "second": (0xFB, 0xBF, 0x24),
        "emoji": "⏱️",
        "confettis": "🌡️🫧🤫🧯",
    },
    {
        "fichier": "l-enfant-qui-dit-non-a-tout.jpg",
        "surtitre": "Consignes, refus et coopération",
        "titre": "L’enfant qui dit non à tout",
        "sous": "Compter ses consignes, en retirer, et rendre exécutables celles qui restent",
        "duree": "4 modules + annexes · 45 min",
        "accent": (0xDB, 0x27, 0x77),
        "second": (0xFB, 0x92, 0x3C),
        "emoji": "🙅",
        "confettis": "🗯️🧮🖐️✅",
    },
    {
        "fichier": "lire-un-comportement-comme-une-reaction-de-survie.jpg",
        "surtitre": "Protection de l’enfance et conduites d’adaptation",
        "titre": "Lire un comportement comme une réaction de survie",
        "sous": "Relire une conduite, puis en tirer un réglage concret du quotidien",
        "duree": "4 modules + annexes · 45 min",
        "accent": (0x0D, 0x94, 0x88),
        "second": (0x60, 0xA5, 0xFA),
        "emoji": "🧭",
        "confettis": "🍎🚪🛟🔦",
    },
    {
        "fichier": "preparer-une-equipe-de-suivi-de-la-scolarisation.jpg",
        "surtitre": "Scolarité, MDPH et équipe de suivi (ESS)",
        "titre": "Préparer une équipe de suivi de la scolarisation",
        "sous": "Arriver avec trois éléments écrits, et obtenir qu’ils figurent au GEVA-Sco",
        "duree": "4 modules + annexes · 45 min",
        "accent": (0xC0, 0x26, 0xD3),
        "second": (0x38, 0xBD, 0xF8),
        "emoji": "🏫",
        "confettis": "📄✍️📬🗂️",
    },
    {
        "fichier": "aider-a-demarrer-une-tache.jpg",
        "surtitre": "Apprentissages et autonomie",
        "titre": "Aider quelqu’un à démarrer une tâche",
        "sous": "Ce n’est presque jamais la tâche qui bloque : c’est l’entrée dans la tâche",
        "duree": "4 modules + annexes · 40 min",
        "accent": (0x16, 0xA3, 0x4A),
        "second": (0xFB, 0xBF, 0x24),
        "emoji": "🚀",
        "confettis": "⏲️🧰🎬🪣",
    },
    {
        "fichier": "renforcer-ce-qui-va.jpg",
        "surtitre": "Comportements-défis et opposition",
        "titre": "Renforcer ce qui va",
        "sous": "Un renforçateur se reconnaît à l’effet, jamais à l’intention",
        "duree": "4 modules + annexes · 46 min",
        "accent": (0x0D, 0x94, 0x88),
        "second": (0xF5, 0x9E, 0x0B),
        "emoji": "🌱",
        "confettis": "⭐📈👍📋",
    },
    {
        "fichier": "decrire-un-comportement-sans-le-juger.jpg",
        "surtitre": "Observer et écrire",
        "titre": "Décrire un comportement sans le juger",
        "sous": "Une caméra ne filme ni les intentions, ni les motivations",
        "duree": "4 modules + annexes · 46 min",
        "accent": (0x4F, 0x46, 0xE5),
        "second": (0x06, 0xB6, 0xD4),
        "emoji": "📹",
        "confettis": "📝🔎🗂️✍",
    },
]


def largeur(d, texte, f):
    return d.textbbox((0, 0), texte, font=f)[2]


def decouper(d, texte, f, maxi):
    """Coupe `texte` en lignes tenant dans `maxi` pixels."""
    mots, lignes, courante = texte.split(" "), [], ""
    for mot in mots:
        essai = f"{courante} {mot}".strip()
        if largeur(d, essai, f) <= maxi or not courante:
            courante = essai
        else:
            lignes.append(courante)
            courante = mot
    if courante:
        lignes.append(courante)
    return lignes


def calque_emoji(caractere, taille):
    """Un emoji rendu en RVBA à `taille` pixels, transparence comprise."""
    boite = Image.new("RGBA", (EMOJI_NATIF + 20, EMOJI_NATIF + 20), (0, 0, 0, 0))
    ImageDraw.Draw(boite).text(
        (10, 10), caractere, font=ImageFont.truetype(EMOJI, EMOJI_NATIF), embedded_color=True
    )
    return boite.resize((taille, taille), Image.LANCZOS)


def fond(im, spec, e):
    """Le fond : très clair, deux grosses taches de couleur, un halo diffus."""
    accent, second = spec["accent"], spec["second"]
    im.paste(teinte(accent, 0.10), (0, 0, L * e, H * e))

    taches = Image.new("RGBA", (L * e, H * e), (0, 0, 0, 0))
    d = ImageDraw.Draw(taches)
    # Une grande tache en haut à droite, derrière l'emoji, et une plus petite en
    # bas à gauche : la diagonale guide l'œil du titre vers l'illustration.
    d.ellipse(
        [int(L * 0.52) * e, int(-H * 0.34) * e, int(L * 1.22) * e, int(H * 0.86) * e],
        fill=accent + (105,),
    )
    d.ellipse(
        [int(L * 0.66) * e, int(H * 0.02) * e, int(L * 1.06) * e, int(H * 0.74) * e],
        fill=second + (120,),
    )
    d.ellipse(
        [int(-L * 0.14) * e, int(H * 0.62) * e, int(L * 0.34) * e, int(H * 1.32) * e],
        fill=second + (85,),
    )
    taches = taches.filter(ImageFilter.GaussianBlur(28 * e))
    im.alpha_composite(taches) if im.mode == "RGBA" else im.paste(taches, (0, 0), taches)


def construire(spec):
    e = ECHELLE
    im = Image.new("RGB", (L * e, H * e), BLANC)
    fond(im, spec, e)
    d = ImageDraw.Draw(im)
    accent = spec["accent"]

    # ── l'emoji, grand, à droite ──────────────────────────────────────────
    grand = calque_emoji(spec["emoji"], 300 * e)
    im.paste(grand, (int(L * 0.70) * e, int(H * 0.30) * e), grand)

    # ── les confettis : petits, dispersés, jamais sur le texte ────────────
    # Positions choisies pour ne croiser ni la colonne de texte (à gauche de
    # 0,56) ni le bandeau du bas (au-delà de 0,66).
    places = [(0.60, 0.05), (0.94, 0.09), (0.575, 0.50), (0.60, 0.72)]
    for caractere, (px, py) in zip(spec["confettis"], places):
        petit = calque_emoji(caractere, 66 * e)
        # Un voile blanc par-dessus laisserait un carré gris visible : c'est le
        # canal alpha de l'emoji qu'on atténue, pas un calque ajouté.
        alpha = petit.getchannel("A").point(lambda v: int(v * 0.72))
        petit.putalpha(alpha)
        im.paste(petit, (int(L * px) * e, int(H * py) * e), petit)

    # ── le texte, à gauche ────────────────────────────────────────────────
    colonne = int(L * 0.56) - MARGE
    f_sur = ImageFont.truetype(GRAS, 25 * e)
    f_titre = ImageFont.truetype(GRAS, 58 * e)
    f_sous = ImageFont.truetype(NORMAL, 27 * e)
    f_pied = ImageFont.truetype(MOYEN, 23 * e)

    y = int(H * 0.19) * e
    # Un trait de couleur avant le surtitre : la même signature que sur la
    # fiche récap, où le bandeau de thématique porte la barre d'accent.
    d.rounded_rectangle([MARGE * e, y + 4 * e, (MARGE + 6) * e, y + 30 * e], 3 * e, fill=accent)
    d.text(((MARGE + 20) * e, y), spec["surtitre"].upper(), font=f_sur, fill=accent)
    y += 60 * e

    # Un titre long réduit sa taille plutôt que de déborder : trois lignes au
    # maximum, sinon la vignette devient un pavé de texte et l'emoji, qui est
    # ce qui la rend reconnaissable, disparaît sous les mots.
    corps, interligne = 58, 70
    lignes = decouper(d, spec["titre"], f_titre, colonne * e)
    while len(lignes) > 3 and corps > 40:
        corps -= 3
        interligne -= 4
        f_titre = ImageFont.truetype(GRAS, corps * e)
        lignes = decouper(d, spec["titre"], f_titre, colonne * e)
    if len(lignes) > 3:
        raise SystemExit(f"titre irreductible ({len(lignes)} lignes) : {spec['titre']}")
    for ligne in lignes:
        d.text((MARGE * e, y), ligne, font=f_titre, fill=ENCRE)
        y += interligne * e
    y += 12 * e

    for ligne in decouper(d, spec["sous"], f_sous, colonne * e)[:2]:
        d.text((MARGE * e, y), ligne, font=f_sous, fill=DOUX)
        y += 38 * e

    # ── le bandeau du bas ─────────────────────────────────────────────────
    hb = 62
    yb = H - MARGE - hb + 30
    d.rounded_rectangle(
        [MARGE * e, yb * e, (L - MARGE) * e, (yb + hb) * e], 18 * e, fill=BLANC
    )
    tx = (MARGE + 26) * e
    ty = (yb + 18) * e
    d.text((tx, ty), "LES EXTRAS", font=f_pied, fill=ENCRE)
    tx += largeur(d, "LES EXTRAS", f_pied) + 14 * e
    d.text((tx, ty), "·", font=f_pied, fill=DOUX)
    tx += largeur(d, "·", f_pied) + 14 * e
    d.text((tx, ty), "FORMATION GRATUITE", font=f_pied, fill=accent)
    droite = spec["duree"]
    d.text(
        ((L - MARGE - 26) * e - largeur(d, droite, f_pied), ty), droite, font=f_pied, fill=DOUX
    )

    if yb < y / e + 24:
        raise SystemExit(f"le texte touche le bandeau : {spec['titre']}")

    return im.resize((L, H), Image.LANCZOS)


def main():
    dossier = (
        sys.argv[1]
        if len(sys.argv) > 1
        else os.path.join(os.path.dirname(__file__), "..", "public", "images", "mini-formations")
    )
    os.makedirs(dossier, exist_ok=True)
    for spec in COUVERTURES:
        chemin = os.path.join(dossier, spec["fichier"])
        construire(spec).save(chemin, "JPEG", quality=90, optimize=True)
        print("ecrit", chemin)
    print(f"\n{len(COUVERTURES)} couverture(s).")


if __name__ == "__main__":
    main()
