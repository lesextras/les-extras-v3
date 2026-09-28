// FICHIER ENGENDRÉ par `scripts/rapatrier-wordpress.py` : ne pas le modifier à la main.
//
// Les images de l'ancien WordPress copiées dans `public/wp/`, par chemin sous
// `wp-content/uploads/`. `lib/media.ts` ne réécrit vers `/wp/…` QUE ce qui est
// listé ici : une image absente garde son adresse d'origine.
export const WP_RAPATRIES: readonly string[] = [
  "2021/09/apprendre-par-le-dessin-scaled.jpg",
  "2021/09/article-apprentissage-par-jeu.jpeg",
  "2021/09/article-echec-scolaire.jpeg",
  "2021/09/article-ecole-seconde-chance-scaled.jpg",
  "2021/09/article-fiche-revision.jpeg",
  "2023/02/PSYCHO-BOXE.png",
  "2023/02/aide-soignant.jpg",
  "2023/02/cerf-volant-game-enfant-400x400.jpg",
  "2023/02/educateur-2.jpeg",
  "2023/02/educatheure.jpeg",
  "2023/03/adulte-pris-en-charge.jpg",
  "2023/03/video-atelier.webp",
  "2023/03/younes.jpeg",
  "2023/04/cropped-groupe-id-2.jpg",
  "2023/04/cropped-groupe-id-3-1.jpg",
  "2023/04/groupe-id-2.jpg",
  "2025/01/school.jpeg",
  "2025/02/handisport.jpeg",
  "2025/02/lever-vous.jpeg",
  "2025/02/mineur-protection-de-lenfance.jpg",
  "2025/02/musicotherapie.jpg",
  "2025/02/prev-reseaux-sociaux.jpg",
  "2025/06/DSC_6974-scaled.jpg",
  "2025/08/gestion-violence.jpg",
  "2026/04/etoile-mec.jpeg",
  "2026/04/school.jpeg",
  "2026/04/sih-lexia.jpeg",
];

// Les adresses du catalogue public au moment du relevé. `lib/liens-wordpress.ts`
// réécrit `app.les-extras.fr/listing/<slug>/` vers `/ateliers/<slug>` si le slug
// y figure, sinon vers `/ateliers`.
export const SLUGS_CATALOGUE: readonly string[] = [
  "accompagnement-des-jeunes-majeurs",
  "accueil-du-public-difficile-et-ou-en-difficulte-sociale",
  "analyse-des-pratiques-professionnelles",
  "animation-de-soirees-thematiques",
  "atelier-de-musicotherapie",
  "atelier-digital-photo-video-montage",
  "atelier-estime-de-soi-via-la-photo-video",
  "atelier-prevention-securite-incendie-et-gestes-qui-sauvent",
  "atelier-psycho-boxe",
  "atelier-slam",
  "atelier-socio-esthetique",
  "atelier-theatre",
  "gestion-de-la-violence-anticiper-et-gerer-les-conflits",
  "histoires-zen",
  "le-papa-plan-d-activite-physique-adapte",
  "mon-ile-paradisiaque",
  "notre-conte-en-duo",
];
