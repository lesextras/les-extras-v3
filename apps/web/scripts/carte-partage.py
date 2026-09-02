#!/usr/bin/env python3
"""
CARTE DE PARTAGE 1200x630 — refabrication du 2 septembre 2026.

Pourquoi ce script existe. L'image `partage-les-extras.jpg` est ce que
LinkedIn, Facebook et X affichent quand on partage n'importe quelle page du
site : c'est le visuel le plus vu de toute la marque. Or elle portait trois
affirmations qu'on ne tient plus :

  1. la pastille « Intervenants vérifiés » — mention retirée du site en neuf
     endroits parce qu'elle n'était pas soutenable, et remplacée partout par
     « dossier de conformité par intervenant » ;
  2. « animés par des indépendants vérifiés du médico-social » — le mot
     « indépendants » est celui que le Conseil d'État a sanctionné le
     11/02/2025 (n° 491128) pour les remplacements en établissement, ET
     « vérifiés » y revenait une seconde fois ;
  3. la troisième pastille « Devis sous 48 h » était COUPÉE par le bord droit.

La composition, la palette et les proportions sont reprises à l'identique de
l'image d'origine (couleurs relevées au pixel sur le fichier existant) : seul
le texte fautif change, et la mise en page est resserrée pour que plus rien ne
déborde. Le script est versionné pour que la prochaine correction ne reparte
pas d'un fichier binaire qu'on ne sait plus régénérer.

Usage : python3 carte-partage.py <destination.jpg>
"""

import sys
from PIL import Image, ImageDraw, ImageFont

L, H = 1200, 630

# Palette relevée au pixel sur l'image d'origine.
FOND = (0x12, 0x15, 0x1C)
CERCLE_HG = (0x28, 0x16, 0x22)
CERCLE_BD = (0x23, 0x1D, 0x1F)
ROSE = (0xE8, 0x2E, 0x60)
ROSE_VIF = (0xF1, 0x32, 0x66)
ORANGE = (0xF9, 0x73, 0x16)
TITRE = (0xF7, 0xF4, 0xED)
TERRE = (0xCF, 0x6F, 0x56)
CORPS = (0xA6, 0xAA, 0xB3)
BORD = (0x3C, 0x3F, 0x46)

RACINE = "/usr/share/fonts/truetype/dejavu/"
GRAS = RACINE + "DejaVuSans-Bold.ttf"
NORMAL = RACINE + "DejaVuSans.ttf"

MARGE = 84


def police(chemin, taille):
    return ImageFont.truetype(chemin, taille)


def largeur(d, texte, f):
    return d.textbbox((0, 0), texte, font=f)[2]


def construire():
    # On dessine en double résolution puis on réduit : les cercles et les
    # arrondis des pastilles sortent lisses, sans crénelage.
    E = 2
    im = Image.new("RGB", (L * E, H * E), FOND)
    d = ImageDraw.Draw(im)

    # Les deux masses de couleur, partiellement hors cadre, exactement comme
    # sur l'original : une chaude en haut à gauche, une plus brune en bas à
    # droite. Elles ne portent aucune information — elles cassent le fond.
    d.ellipse(
        [(-250 * E, -310 * E), (430 * E, 370 * E)], fill=CERCLE_HG
    )
    d.ellipse(
        [(850 * E, 330 * E), (1510 * E, 990 * E)], fill=CERCLE_BD
    )

    # ── Bloc de marque ────────────────────────────────────────────────────
    # Badge « LEX » arrondi, avec la pastille orange en haut à droite.
    bx, by, bc = MARGE, 72, 74
    d.rounded_rectangle(
        [(bx * E, by * E), ((bx + bc) * E, (by + bc) * E)],
        radius=22 * E,
        fill=ROSE,
    )
    f_lex = police(GRAS, 26 * E)
    lw = largeur(d, "LEX", f_lex)
    d.text(
        ((bx + bc / 2) * E - lw / 2, (by + bc / 2) * E - 17 * E),
        "LEX",
        font=f_lex,
        fill=(255, 255, 255),
    )
    d.ellipse(
        [((bx + bc - 16) * E, (by - 6) * E), ((bx + bc + 4) * E, (by + 14) * E)],
        fill=ORANGE,
    )

    f_marque = police(GRAS, 40 * E)
    d.text(((bx + bc + 26) * E, (by + 16) * E), "LES EXTRAS", font=f_marque, fill=TITRE)

    # ── Titre ─────────────────────────────────────────────────────────────
    f_titre = police(GRAS, 48 * E)
    d.text((MARGE * E, 206 * E), "Des interventions à fort impact,", font=f_titre, fill=TITRE)
    d.text((MARGE * E, 274 * E), "portées par ceux qui font le terrain.", font=f_titre, fill=TERRE)

    # ── Sous-titre ────────────────────────────────────────────────────────
    # Le texte fautif. « animés par des indépendants vérifiés du médico-social »
    # devient une phrase qui dit à qui l'offre s'adresse, sans employer ni
    # « indépendants » ni « vérifiés ».
    f_corps = police(NORMAL, 25 * E)
    d.text((MARGE * E, 366 * E), "Ateliers éducatifs, formations Qualiopi et renfort d’équipe", font=f_corps, fill=CORPS)
    d.text((MARGE * E, 404 * E), "pour les établissements du médico-social.", font=f_corps, fill=CORPS)

    # ── Pastilles ─────────────────────────────────────────────────────────
    # « Intervenants vérifiés » devient « Dossier de conformité » : c'est le
    # libellé exact retenu sur l'accueil (app/page.tsx). Les trois pastilles
    # sont mesurées puis posées de façon à finir avant la marge droite —
    # l'original débordait.
    f_pill = police(NORMAL, 21 * E)
    labels = ["Dossier de conformité", "Qualiopi · finançable OPCO", "Devis sous 48 h"]
    pad_x, ecart, haut = 20, 18, 52
    y = 500

    largeurs = [largeur(d, t, f_pill) / E + pad_x * 2 + 24 for t in labels]
    total = sum(largeurs) + ecart * (len(labels) - 1)
    if MARGE + total > L - MARGE:
        raise SystemExit(f"pastilles trop larges : {MARGE + total:.0f} px pour {L - MARGE}")

    x = MARGE
    for texte, w in zip(labels, largeurs):
        d.rounded_rectangle(
            [(x * E, y * E), ((x + w) * E, (y + haut) * E)],
            radius=(haut / 2) * E,
            outline=BORD,
            width=2 * E,
        )
        cy = (y + haut / 2) * E
        d.ellipse(
            [((x + pad_x) * E - 5 * E, cy - 5 * E), ((x + pad_x) * E + 5 * E, cy + 5 * E)],
            fill=ROSE_VIF,
        )
        d.text(((x + pad_x + 16) * E, cy - 15 * E), texte, font=f_pill, fill=TITRE)
        x += w + ecart

    return im.resize((L, H), Image.LANCZOS)


if __name__ == "__main__":
    sortie = sys.argv[1] if len(sys.argv) > 1 else "partage-les-extras.jpg"
    construire().save(sortie, "JPEG", quality=92, optimize=True, progressive=True)
    print("écrit :", sortie)
