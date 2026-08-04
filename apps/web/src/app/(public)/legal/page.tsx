import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Informations légales',
  description:
    'Mentions légales, conditions générales d’utilisation, politique de confidentialité et RGPD de LES EXTRAS.',
};

const sections = [
  {
    id: 'mentions',
    title: 'Mentions légales',
    body: [
      'LES EXTRAS est un service édité par ADEPA — Association pour le Développement de l’Éducation par l’Animation, association loi 1901, SIRET 820 051 852 00011, dont le siège est situé 7 rue André Malraux, 77000 Melun (adresse administrative : 30 rue Nouvelle, 77190 Dammarie-lès-Lys). Le site met en relation les établissements médico-sociaux et les professionnels indépendants du secteur.',
      'Directeur de la publication : le/la Président(e) en exercice de l’association ADEPA. Contact : contact@les-extras.fr.',
      'Organisme de formation enregistré sous le numéro de déclaration d’activité 11 77 01011 77 (préfecture d’Île-de-France) — cet enregistrement ne vaut pas agrément de l’État. Certification Qualiopi au titre des actions de formation.',
      'Hébergement : Hostinger International Ltd., 61 Lordou Vironos Street, 6023 Larnaca, Chypre.',
    ],
  },
  {
    id: 'remboursements',
    title: 'Remboursements et annulations',
    body: [
      'Une prestation réservée peut être annulée sans frais jusqu’à sept jours calendaires avant la date d’intervention : la facture correspondante est annulée, et aucun montant n’est dû.',
      'Entre sept jours et quarante-huit heures avant l’intervention, la moitié du montant reste due, pour couvrir le temps de préparation déjà engagé par l’intervenant.',
      'À moins de quarante-huit heures, ou en cas d’absence non signalée, le montant reste dû en totalité. Si l’annulation vient de l’intervenant, l’établissement est intégralement remboursé et nous cherchons un remplaçant en priorité.',
      'En cas d’imprévu grave et documenté — hospitalisation, décès, fermeture administrative de l’établissement — ces règles sont suspendues : écrivez-nous, chaque situation est examinée.',
      'Les remboursements sont effectués sur le moyen de paiement d’origine sous quatorze jours. Pour toute demande, contactez-nous depuis votre espace ou via la page Contact.',
    ],
  },
  {
    id: 'cgu',
    title: 'Conditions générales d’utilisation',
    body: [
      'L’utilisation de la plateforme implique l’acceptation pleine et entière des présentes conditions. Elles encadrent l’accès au service, les responsabilités de chacun et les modalités de mise en relation.',
      'Chaque utilisateur s’engage à fournir des informations exactes et à respecter la réglementation applicable à son activité.',
    ],
  },
  {
    id: 'confidentialite',
    title: 'Politique de confidentialité',
    body: [
      'Nous traitons vos données personnelles avec le plus grand soin, uniquement pour les finalités liées au fonctionnement du service : création de compte, mise en relation et communication.',
      'Vos données ne sont jamais revendues. Elles sont conservées pour la durée strictement nécessaire à ces finalités.',
    ],
  },
  {
    id: 'rgpd',
    title: 'RGPD — Vos droits',
    body: [
      'Conformément au Règlement général sur la protection des données, vous disposez d’un droit d’accès, de rectification, d’effacement et de portabilité de vos données, ainsi que d’un droit d’opposition.',
      'Pour exercer ces droits, adressez votre demande depuis votre espace ou à l’adresse de support. Une réponse vous sera apportée dans les meilleurs délais.',
    ],
  },
];

export default function LegalPage() {
  return (
    <article className="mx-auto max-w-2xl">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Informations légales</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette page récapitule nos mentions légales, conditions d’utilisation et engagements en
          matière de protection des données.
        </p>
      </header>

      <nav aria-label="Sommaire" className="mb-10 flex flex-wrap gap-2">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="inline-flex min-h-10 items-center rounded-lg border border-border bg-card px-3.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            {s.title}
          </a>
        ))}
      </nav>

      <div className="space-y-12">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">{s.title}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {s.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
