# Pourquoi la certification « Hébergeur de données de santé » ne s'applique pas à Les Extras

**Note à l'attention des commissions d'achat et des délégués à la protection des données**
ADéPA77 — 3 août 2026

---

## La question, posée honnêtement

Les établissements sociaux et médico-sociaux ont le réflexe légitime de demander
à tout éditeur : « êtes-vous hébergé HDS ? ». Cette note explique pourquoi la
réponse de Les Extras est : **la certification HDS ne s'applique pas à ce que
fait le logiciel** — et pourquoi c'est une analyse juridique, pas une économie
de moyens.

## Ce que dit le texte

L'article **L. 1111-8 du code de la santé publique** impose la certification
« hébergeur de données de santé » à toute personne qui héberge des **données de
santé à caractère personnel recueillies à l'occasion d'activités de prévention,
de diagnostic, de soins ou de suivi social et médico-social**, pour le compte
des personnes ou établissements qui les produisent.

Deux conditions cumulatives déclenchent donc l'obligation : la nature des
données (données de santé) **et** leur contexte de recueil (une activité de
soin ou de suivi de la personne accompagnée).

## Ce que Les Extras héberge — et n'héberge pas

Les Extras est un outil de **gestion des ressources humaines et de mise en
relation professionnelle**. Les personnes dont il traite les données sont les
**professionnels** — éducateurs, moniteurs, animateurs, formateurs — et les
responsables d'établissements. Concrètement : profils et qualifications,
plannings et heures travaillées, contrats de travail, factures, pièces
administratives (identité, diplôme, bulletin n° 3, IBAN), inscriptions en
formation, évaluations pédagogiques.

Le logiciel **ne détient aucun dossier de personne accompagnée** : ni dossier
d'usager, ni projet personnalisé, ni transmission, ni observation éducative ou
médicale, ni donnée de santé d'un bénéficiaire. Ce n'est pas un angle mort,
c'est un choix de conception, verrouillé à deux endroits :

1. **L'assistant d'écriture (LEX)** — le seul module où un professionnel
   pourrait mentionner une personne accueillie — **pseudonymise les noms avant
   tout traitement et ne stocke pas les notes soumises**. La plateforme ne
   conserve rien qui décrive un bénéficiaire.
2. Aucun module ne propose de champ, de formulaire ou de dépôt de fichier
   rattaché à une personne accompagnée. Le coffre-fort documentaire est celui
   des **professionnels**, pas des usagers.

## Le cas limite, traité plutôt qu'éludé

Un dossier professionnel peut contenir des éléments qui touchent à la santé
**du salarié** (une attestation, une restriction d'aptitude qu'un établissement
saisirait en note). Ces données relèvent du RGPD (article 9) et sont traitées
comme telles — accès restreint aux responsables, minimisation, durées de
conservation définies au registre. Mais elles ne sont **pas recueillies à
l'occasion d'une activité de prévention, de diagnostic, de soins ou de suivi**
de cette personne : c'est de la gestion RH, régime que la doctrine constante
(CNIL, ANS) place hors du champ de l'article L. 1111-8. L'exemple canonique est
la médecine du travail versus le dossier RH : seul le premier relève du soin.

## L'engagement qui protège l'établissement

La frontière est contractuelle autant que technique : les conditions
d'utilisation interdisent d'utiliser la plateforme pour stocker des données de
personnes accompagnées, et aucun écran n'y invite. Si un jour une évolution du
produit devait franchir cette frontière — par exemple un module de transmission
éducative — **cette évolution imposerait un hébergement certifié HDS avant sa
mise en service**, et l'analyse serait refaite à ce moment-là.

## Ce qui est en place, à la place

L'absence d'obligation HDS n'est pas une absence d'exigences : registre des
traitements (article 30) tenu et joint à cette note, cloisonnement strict par
établissement contrôlé côté serveur, chiffrement des échanges, mots de passe
hachés, codes de signature jamais stockés en clair, journal d'audit,
sauvegardes, exercice des droits intégré au produit (export et suppression).

## En une phrase

Les Extras gère **ceux qui accompagnent**, jamais **ceux qui sont
accompagnés** : les deux conditions de l'article L. 1111-8 ne sont pas
réunies, la certification HDS ne s'applique donc pas — et le jour où le
périmètre changerait, l'obligation s'appliquerait avant la fonctionnalité.
