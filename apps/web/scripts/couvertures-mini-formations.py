#!/usr/bin/env python3
"""
COUVERTURES DES MINI-FORMATIONS GRATUITES — générateur versionné.

Pourquoi un script et pas trois images fabriquées à la main. Le catalogue
`/formations` affiche une carte par fiche, et une carte sans visuel est une
carte qu'on ne clique pas : elle a l'air d'un brouillon à côté des fiches qui
en ont un. Il y a trois mini-formations aujourd'hui, dix-huit sont prévues —
donc dix-huit couvertures. Les dessiner une par une dans un éditeur, c'est
dix-huit occasions de dériver sur la palette, la taille du texte ou la
position du logo, et aucune trace de la façon dont elles ont été produites.

La palette est celle de `carte-partage.py`, relevée au pixel sur la carte de
partage d'origine : les couvertures et l'image de partage viennent du même
monde, sans que personne ait à s'en souvenir.

⚠ LA DURÉE AFFICHÉE S'ADOSSE AU CONTENU MESURÉ, jamais à une intuition. Elle
part dans les fiches publiques et, un jour, dans un dossier de financement.
Après l'enrichissement du 2/09/2026 (modules portés de ~2 500 à ~13 000
caractères), elle est passée de 36-39 min à 45 min — recalculée, pas estimée.

⚠ CE QUE CES COUVERTURES N'ONT PAS, VOLONTAIREMENT :
  — aucune photo de personne. Une couverture de formation sur les
    comportements-défis illustrée par un enfant laisse entendre que cet enfant
    est concerné. C'est la raison pour laquelle `handicap-psychique.jpg` a été
    écartée de la médiathèque (voir `lib/media.ts`) ;
  — aucune mention « certificat » ni « certifiante » : ces formations n'en
    sont pas, et un visuel se recadre moins facilement qu'une phrase ;
  — aucun logo de programme ni de marque tierce.

Usage : python3 couvertures-mini-formations.py <dossier-de-destination>
        (par défaut : apps/web/public/images/mini-formations)
"""

import os
import sys

from PIL import Image, ImageDraw, ImageFont

# 16/10 : c'est le ratio de la carte du catalogue (`aspect-[16/10]`). La fiche
# affiche la même image en 16/9 avec `object-cover`, donc légèrement rognée en
# haut et en bas — d'où une marge verticale généreuse et aucun texte près des
# bords hauts et bas.
L, H = 1280, 800

# Palette reprise de carte-partage.py (relevée au pixel sur l'original).
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

MARGE = 90
# Supersampling ×2 : DejaVu rendu à la taille finale bave sur les accents.
ECHELLE = 2

COUVERTURES = [
    {
        "fichier": "les-quatre-fonctions-d-un-comportement.jpg",
        "surtitre": "TSA, communication et comportement",
        "titre": "Les quatre fonctions d’un comportement",
        "sous": "Identifier à quoi sert un comportement avant de chercher à le modifier",
        "duree": "4 modules + annexes · 45 min",
    },
    {
        "fichier": "apprendre-a-demander-plutot-qu-a-crier.jpg",
        "surtitre": "TSA, communication et comportement",
        "titre": "Apprendre à demander plutôt qu’à crier",
        "sous": "Construire et enseigner un comportement de remplacement",
        "duree": "4 modules + annexes · 45 min",
    },
    {
        "fichier": "decomposer-une-routine-en-etapes.jpg",
        "surtitre": "TSA, communication et comportement",
        "titre": "Décomposer une routine en étapes",
        "sous": "Découper une routine du quotidien et choisir par quelle extrémité l’enseigner",
        "duree": "4 modules + annexes · 45 min",
    },
    {
        "fichier": "rendre-l-environnement-previsible.jpg",
        "surtitre": "TSA, communication et comportement",
        "titre": "Rendre l’environnement prévisible",
        "sous": "Construire un support visuel qui est réellement consulté",
        "duree": "4 modules + annexes · 45 min",
    },
    {
        "fichier": "les-premieres-minutes-d-une-crise.jpg",
        "surtitre": "Comportements-défis et situations de crise",
        "titre": "Les premières minutes d’une crise",
        "sous": "Réduire ce que l’adulte ajoute pendant, et préparer à froid ce qui suit",
        "duree": "4 modules + annexes · 45 min",
    },
    {
        "fichier": "l-enfant-qui-dit-non-a-tout.jpg",
        "surtitre": "Consignes, refus et coopération",
        "titre": "L’enfant qui dit non à tout",
        "sous": "Compter ses consignes, en retirer, et rendre exécutables celles qui restent",
        "duree": "4 modules + annexes · 45 min",
    },
    {
        "fichier": "lire-un-comportement-comme-une-reaction-de-survie.jpg",
        "surtitre": "Protection de l’enfance et conduites d’adaptation",
        "titre": "Lire un comportement comme une réaction de survie",
        "sous": "Relire une conduite, puis en tirer un réglage concret du quotidien",
        "duree": "4 modules + annexes · 45 min",
    },
    {
        "fichier": "preparer-une-equipe-de-suivi-de-la-scolarisation.jpg",
        "surtitre": "Scolarité, MDPH et équipe de suivi (ESS)",
        "titre": "Préparer une équipe de suivi de la scolarisation",
        "sous": "Arriver avec trois éléments écrits, et obtenir qu’ils figurent au GEVA-Sco",
        "duree": "4 modules + annexes · 45 min",
    },
    {
        "fichier": "aider-a-demarrer-une-tache.jpg",
        "surtitre": "Apprentissages et autonomie",
        "titre": "Aider quelqu’un à démarrer une tâche",
        "sous": "Ce n’est presque jamais la tâche qui bloque : c’est l’entrée dans la tâche",
        "duree": "4 modules + annexes · 40 min",
    },
    {
        "fichier": "guider-puis-s-effacer.jpg",
        "surtitre": "TSA, communication et comportement",
        "titre": "Guider puis s’effacer",
        "sous": "Doser une aide, puis la retirer selon un plan décidé à l’avance",
        "duree": "4 modules + annexes · 45 min",
    },
]


def largeur(d, texte, f):
    return d.textbbox((0, 0), texte, font=f)[2]


def decouper(d, texte, f, maxi):
    """Découpe un texte en lignes qui tiennent dans `maxi` pixels."""
    lignes, courante = [], ""
    for mot in texte.split():
        essai = f"{courante} {mot}".strip()
        if largeur(d, essai, f) <= maxi or not courante:
            courante = essai
        else:
            lignes.append(courante)
            courante = mot
    if courante:
        lignes.append(courante)
    return lignes


def construire(spec):
    e = ECHELLE
    img = Image.new("RGB", (L * e, H * e), FOND)
    d = ImageDraw.Draw(img, "RGBA")

    # Deux halos, comme sur la carte de partage : ils donnent la profondeur
    # sans qu'aucun élément décoratif ne vienne se mettre devant le texte.
    d.ellipse(
        [(-260 * e, -300 * e), (560 * e, 420 * e)],
        fill=CERCLE_HG,
    )
    d.ellipse(
        [(820 * e, 440 * e), (1560 * e, 1120 * e)],
        fill=CERCLE_BD,
    )

    marge = MARGE * e
    utile = L * e - 2 * marge

    f_sur = ImageFont.truetype(GRAS, 26 * e)
    f_titre = ImageFont.truetype(GRAS, 68 * e)
    f_sous = ImageFont.truetype(NORMAL, 30 * e)
    f_pied = ImageFont.truetype(GRAS, 26 * e)

    # Filet vertical rose : la signature graphique de la marque.
    d.rectangle(
        [(marge, 150 * e), (marge + 7 * e, 150 * e + 96 * e)],
        fill=ROSE_VIF,
    )

    x = marge + 34 * e
    y = 150 * e

    d.text((x, y), spec["surtitre"].upper(), font=f_sur, fill=TERRE)
    y += 62 * e

    lignes = decouper(d, spec["titre"], f_titre, utile - 34 * e)
    # Un titre qui déborde en bas est un défaut invisible tant qu'on ne
    # regarde pas l'image : on refuse plutôt que de produire une couverture
    # tronquée, comme la pastille coupée de la carte de partage l'a été.
    if len(lignes) > 3:
        raise SystemExit(
            f"Titre trop long pour la couverture : {spec['titre']!r} tient sur "
            f"{len(lignes)} lignes (3 au maximum). Raccourcir le titre."
        )
    for ligne in lignes:
        d.text((x, y), ligne, font=f_titre, fill=TITRE)
        y += 86 * e

    y += 22 * e
    for ligne in decouper(d, spec["sous"], f_sous, utile - 34 * e):
        d.text((x, y), ligne, font=f_sous, fill=CORPS)
        y += 44 * e

    if y > (H - 190) * e:
        raise SystemExit(
            f"Le bloc de texte de {spec['fichier']} descend jusqu'à {y // e} px "
            f"et chevauche le pied de page. Raccourcir le sous-titre."
        )

    # Pied : filet, puis « GRATUIT » à gauche et la durée à droite.
    d.line(
        [(marge, (H - 150) * e), (L * e - marge, (H - 150) * e)],
        fill=BORD,
        width=2 * e,
    )

    py = (H - 118) * e
    d.text((marge, py), "LES EXTRAS", font=f_pied, fill=TITRE)
    largeur_extras = largeur(d, "LES EXTRAS", f_pied)
    d.text((marge + largeur_extras + 16 * e, py), "·", font=f_pied, fill=BORD)
    d.text(
        (marge + largeur_extras + 36 * e, py),
        "FORMATION GRATUITE",
        font=f_pied,
        fill=ORANGE,
    )

    l_duree = largeur(d, spec["duree"], f_pied)
    d.text((L * e - marge - l_duree, py), spec["duree"], font=f_pied, fill=ROSE)

    return img.resize((L, H), Image.LANCZOS)


def main():
    dossier = (
        sys.argv[1]
        if len(sys.argv) > 1
        else os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "..",
            "public",
            "images",
            "mini-formations",
        )
    )
    os.makedirs(dossier, exist_ok=True)
    for spec in COUVERTURES:
        chemin = os.path.join(dossier, spec["fichier"])
        construire(spec).save(chemin, "JPEG", quality=90, optimize=True)
        print(f"{chemin}  ({os.path.getsize(chemin) // 1024} Ko)")


if __name__ == "__main__":
    main()
