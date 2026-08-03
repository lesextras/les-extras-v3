# Registre des activités de traitement

**Les Extras — plateforme éditée par l'association ADéPA77**
Document tenu au titre de l'article 30 du règlement (UE) 2016/679 (RGPD).
Version du 3 août 2026 — à relire à chaque évolution fonctionnelle du logiciel.

---

## Identité du responsable de traitement

| | |
|---|---|
| Responsable de traitement | Association ADéPA77 (loi 1901) |
| Adresse administrative | 30 rue Nouvelle, 77190 Dammarie-lès-Lys |
| Représentante | La présidente de l'association |
| Contact données personnelles | assoc.adepa@gmail.com |
| Délégué à la protection des données | Non désigné — la désignation n'est obligatoire (art. 37 RGPD) ni par la taille ni par l'activité de l'association ; le point de contact ci-dessus en tient lieu |

**Rôle selon les traitements.** Pour les données des comptes, du catalogue et de la
mise en relation, ADéPA77 est **responsable de traitement**. Pour les données que
chaque établissement gère dans son propre espace (équipe, contrats, conformité de
ses intervenants), l'établissement est responsable de traitement et ADéPA77 agit
en **sous-traitant** au sens de l'article 28 — le présent registre vaut alors
registre du sous-traitant (art. 30 § 2).

---

## Traitement n° 1 — Comptes et profils

| | |
|---|---|
| Finalité | Création et gestion des comptes (établissements et intervenants), profils professionnels, annuaire public des intervenants |
| Base légale | Exécution du contrat (art. 6 § 1 b) |
| Personnes concernées | Intervenants indépendants, salariés et responsables d'établissements |
| Données | Identité, coordonnées, métier, qualifications et expériences déclarées, ville, rayon d'intervention, taux horaire, disponibilité, photographie (avatar) |
| Destinataires | L'intéressé ; les établissements pour les profils publiés dans l'annuaire ; les responsables du compte pour les membres d'une équipe |
| Durée de conservation | Durée de vie du compte, puis 3 ans après la dernière activité ; suppression sur demande (parcours « Mes données personnelles ») |
| Sécurité | Authentification par jeton, mots de passe hachés, cloisonnement par compte (garde serveur), journal d'audit |

## Traitement n° 2 — Dossier de conformité des professionnels

| | |
|---|---|
| Finalité | Vérification des pièces exigées pour intervenir auprès de publics vulnérables : identité, diplôme, bulletin n° 3 du casier judiciaire, permis, IBAN, attestation URSSAF |
| Base légale | Obligation légale de l'établissement (art. 6 § 1 c) : l'article L. 133-6 du code de l'action sociale et des familles interdit l'exercice en ESSMS aux personnes condamnées pour certaines infractions — la vérification du bulletin n° 3 est le moyen de s'y conformer |
| Particularité | Le bulletin n° 3 relève de l'**article 10 du RGPD** (données relatives aux condamnations). Son traitement est ici autorisé par le droit français au titre de l'obligation ci-dessus. Accès strictement limité : la personne elle-même et les seuls responsables du compte (direction, administration, chef de service) — jamais l'équipe |
| Personnes concernées | Intervenants et salariés des établissements |
| Destinataires | La personne concernée ; les responsables de l'établissement qui suit le dossier |
| Durée de conservation | Durée de la collaboration, puis 5 ans (prescription civile) ; le bulletin n° 3 est renouvelé annuellement et la version périmée peut être supprimée dès remplacement |
| Sécurité | Fichiers accessibles par liaison authentifiée uniquement ; principe « la personne fournit, la structure valide » ; statut jamais auto-validable par l'intéressé |

## Traitement n° 3 — Mise en relation, planning et pointage

| | |
|---|---|
| Finalité | Publication des besoins de renfort, candidatures, réservation d'ateliers, planning des créneaux, déclaration et validation des heures |
| Base légale | Exécution du contrat (art. 6 § 1 b) |
| Données | Missions, candidatures, créneaux horaires, heures déclarées et validées, disponibilités |
| Destinataires | Les deux parties de chaque mise en relation ; les responsables du compte |
| Durée de conservation | 5 ans après la fin de la relation (prescription) ; les heures validées suivent la durée des pièces comptables qu'elles fondent (10 ans) |

## Traitement n° 4 — Contrats à durée déterminée

| | |
|---|---|
| Finalité | Aide à l'établissement du CDD par l'établissement employeur : mentions obligatoires, période d'essai, indemnité de fin de contrat, délai de carence, contrôle des plafonds de durée du travail |
| Base légale | Pour l'établissement : obligation légale et exécution du contrat de travail. Pour la plateforme : sous-traitance (art. 28) pour le compte de l'établissement |
| Données | Identité du salarié, poste, qualification, rémunération, dates, motif de recours, signatures |
| Durée de conservation | 5 ans après la fin du contrat (art. L. 3243-4 du code du travail pour les bulletins ; prescription civile pour le contrat) |

## Traitement n° 5 — Facturation et paiement

| | |
|---|---|
| Finalité | Devis, factures, règlements ; abonnement et adhésion via Stripe |
| Base légale | Obligation légale (art. 6 § 1 c — code de commerce, CGI) et exécution du contrat |
| Données | Coordonnées de facturation, montants, numéros de facture en séquence continue. Les données de carte ne transitent jamais par la plateforme : elles sont saisies chez Stripe |
| Destinataires | Les parties ; Stripe (sous-traitant de paiement, clauses contractuelles types pour les transferts hors UE) |
| Durée de conservation | 10 ans (art. L. 123-22 du code de commerce) |

## Traitement n° 6 — Formation professionnelle

| | |
|---|---|
| Finalité | Sessions, inscriptions, émargements, évaluations à chaud et à froid, attestations et certificats, registre et bilan pédagogique et financier |
| Base légale | Exécution du contrat de formation ; obligations de l'organisme de formation (code du travail, référentiel national qualité) |
| Données | Identité des stagiaires, présences, résultats d'évaluation, appréciations |
| Durée de conservation | Le temps de la certification Qualiopi et des contrôles des financeurs : 6 ans recommandés pour les preuves de réalisation |

## Traitement n° 7 — Signature électronique

| | |
|---|---|
| Finalité | Recueil de signatures électroniques simples avec faisceau de preuves |
| Base légale | Exécution du contrat ; intérêt légitime pour la constitution de preuve |
| Données | Nom et adresse électronique du signataire, empreinte du document, horodatage, adresse IP, navigateur, journal des étapes. Le code à usage unique n'est jamais conservé en clair |
| Durée de conservation | Durée de conservation du document signé (5 à 10 ans selon sa nature) : le dossier de preuve n'a de valeur qu'avec lui |

## Traitement n° 8 — Assistant d'écriture (LEX)

| | |
|---|---|
| Finalité | Aide à la rédaction d'écrits professionnels |
| Particularité | Les noms des personnes accompagnées sont **pseudonymisés avant tout envoi** au modèle de langage, et les notes brutes **ne sont pas stockées**. C'est un choix de conception : la plateforme n'a pas vocation à détenir d'informations sur les personnes accueillies |
| Base légale | Exécution du contrat (fonctionnalité réservée aux adhérents) |
| Durée de conservation | Aucune conservation des notes soumises |

## Traitement n° 9 — Journal d'audit et sécurité

| | |
|---|---|
| Finalité | Traçabilité des actions sensibles, détection d'anomalies, preuve en cas de litige |
| Base légale | Intérêt légitime (art. 6 § 1 f) |
| Durée de conservation | 12 mois glissants |

---

## Sous-traitants de la plateforme

| Sous-traitant | Rôle | Localisation |
|---|---|---|
| Hébergeur du serveur (VPS) | Hébergement de l'application et de la base | Union européenne |
| Stripe | Paiements | Irlande / États-Unis (clauses contractuelles types) |
| Prestataire d'envoi de courriels | Notifications transactionnelles | Union européenne |
| Mistral AI | Modèle de langage de l'assistant LEX (données pseudonymisées) | France |

## Droits des personnes

Chaque compte dispose d'un parcours « Mes données personnelles » : export complet
au format lisible par machine (art. 20) et demande de suppression (art. 17).
Les autres droits (accès, rectification, limitation, opposition) s'exercent par
courriel au contact ci-dessus ; réponse sous un mois. Réclamation possible
auprès de la CNIL (cnil.fr).

## Violations de données

Toute violation est documentée ; notification à la CNIL sous 72 heures lorsque
la violation présente un risque pour les droits et libertés (art. 33), et
information des personnes en cas de risque élevé (art. 34).
