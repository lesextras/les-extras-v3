import {
  dateFr,
  encadre,
  enTete,
  euros,
  ligne,
  nomComplet,
  nouveauDocument,
  paragraphe,
  pied,
  tableau,
  titreSection,
} from './pdf';

/**
 * LA PROPOSITION D'ENGAGEMENT, EN PAPIER.
 *
 * Ce document remplace ce qui s'appelait « contrat de mission de renfort ».
 * Le mot était faux, et le faux mot portait un risque : un document signé par
 * les deux parties via la plateforme, fixant une rémunération et annonçant une
 * facturation, ressemble à s'y méprendre à une mise à disposition de personnel.
 * Le Conseil d'État, le 11 février 2025, a jugé qu'un indépendant intervenant
 * dans les horaires, les locaux et sous l'encadrement d'un établissement est
 * en lien de subordination.
 *
 * Ce que la plateforme fait réellement, elle le dit donc ici : elle a trouvé
 * quelqu'un, elle chiffre ce que coûterait son engagement, et elle s'arrête.
 * L'établissement embauche lui-même, avec son propre contrat de travail.
 */

export interface DonneesPropositionPdf {
  booking: { id: string; status: string; createdAt: Date };
  etablissement: {
    name: string;
    legalName: string | null;
    siret: string | null;
    address: string | null;
    postalCode: string | null;
    city: string | null;
  } | null;
  candidat: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    profile?: { job: string | null; city: string | null } | null;
  } | null;
  mission: {
    title: string;
    description: string | null;
    job: string | null;
    startDate: Date;
    endDate: Date | null;
    startTime: string | null;
    endTime: string | null;
    city: string | null;
    postalCode: string | null;
    headcount: number;
  };
  chiffrage: {
    heuresParJour: number | null;
    jours: number;
    heuresTotales: number | null;
    tauxHoraire: number | null;
    brutEstime: number | null;
    avertissement: string;
  };
}

export async function propositionPdf(d: DonneesPropositionPdf): Promise<Buffer> {
  const { etablissement: e, candidat: c, mission: m, chiffrage: ch } = d;
  const personne = nomComplet(c) || c?.email || 'Personne proposée';

  const { doc, termine } = nouveauDocument(
    `Proposition d'engagement — ${m.title}`,
    'Les Extras — ADéPA77',
  );

  enTete(
    doc,
    "Proposition d'engagement",
    `Établie le ${dateFr(new Date())} · Référence ${d.booking.id.slice(-8).toUpperCase()}`,
  );

  paragraphe(
    doc,
    "Ce document n'est pas un contrat de travail. Il présente la personne trouvée pour votre besoin de renfort et chiffre ce que représenterait son engagement. Si vous l'acceptez, votre établissement conclut directement un contrat à durée déterminée avec elle : vous en êtes l'employeur, et la plateforme n'intervient ni dans la rémunération ni dans le lien de subordination.",
  );

  titreSection(doc, 'Établissement demandeur');
  ligne(doc, 'Structure', e?.legalName ?? e?.name ?? '—');
  ligne(
    doc,
    'Adresse',
    [e?.address, [e?.postalCode, e?.city].filter(Boolean).join(' ')].filter(Boolean).join(', ') ||
      '—',
  );
  ligne(doc, 'SIRET', e?.siret ?? '—');

  titreSection(doc, 'Personne proposée');
  ligne(doc, 'Nom', personne);
  ligne(doc, 'Métier', c?.profile?.job ?? m.job ?? '—');
  ligne(doc, 'Contact', [c?.email, c?.phone].filter(Boolean).join(' · ') || '—');
  ligne(doc, 'Secteur', c?.profile?.city ?? '—');

  titreSection(doc, 'Besoin à couvrir');
  ligne(doc, 'Intitulé', m.title);
  ligne(doc, 'Métier recherché', m.job ?? '—');
  ligne(
    doc,
    'Période',
    m.endDate
      ? `du ${dateFr(m.startDate)} au ${dateFr(m.endDate)}`
      : `le ${dateFr(m.startDate)}`,
  );
  ligne(
    doc,
    'Horaires',
    m.startTime || m.endTime ? `${m.startTime ?? '?'} – ${m.endTime ?? '?'}` : '—',
  );
  ligne(
    doc,
    'Lieu',
    [m.city, m.postalCode ? `(${m.postalCode})` : null].filter(Boolean).join(' ') || '—',
  );
  ligne(doc, 'Postes à pourvoir', String(m.headcount));
  if (m.description) {
    doc.moveDown(0.3);
    paragraphe(doc, m.description, { gris: true });
  }

  titreSection(doc, 'Estimation');
  tableau(
    doc,
    [
      { titre: 'Élément', largeur: 52 },
      { titre: 'Détail', largeur: 28 },
      { titre: 'Montant', largeur: 20, alignement: 'right' },
    ],
    [
      [
        'Heures de travail estimées',
        ch.heuresParJour !== null
          ? `${ch.heuresParJour} h × ${ch.jours} jour${ch.jours > 1 ? 's' : ''}${m.headcount > 1 ? ` × ${m.headcount} postes` : ''}`
          : 'horaires non précisés',
        ch.heuresTotales !== null ? `${ch.heuresTotales} h` : '—',
      ],
      [
        'Taux horaire brut annoncé',
        ch.tauxHoraire !== null ? 'proposé par votre établissement' : 'à convenir',
        ch.tauxHoraire !== null ? euros(ch.tauxHoraire) : '—',
      ],
      [
        'Rémunération brute estimée',
        'hors cotisations patronales',
        ch.brutEstime !== null ? euros(ch.brutEstime) : 'à chiffrer',
      ],
    ],
  );

  encadre(doc, ch.avertissement);

  titreSection(doc, 'Ce qui se passe ensuite');
  paragraphe(
    doc,
    "1. Vous acceptez cette proposition. 2. Votre établissement établit le contrat à durée déterminée : depuis l'écran Contrats CDD, les éléments ci-dessus sont repris automatiquement et il ne reste qu'à compléter les mentions qui relèvent de vous — convention collective, caisse de retraite complémentaire, organisme de prévoyance. 3. L'outil vérifie que rien ne manque au regard de l'article L. 1242-12 avant de vous laisser transmettre le contrat au salarié, calcule la période d'essai, l'indemnité de fin de contrat et le délai de carence, et contrôle que les plafonds de durée du travail sont respectés — tous employeurs confondus.",
  );

  doc.flushPages();
  pied(
    doc,
    `Proposition ${d.booking.id.slice(-8).toUpperCase()} · Les Extras — ADéPA77 · ce document n'est pas un contrat de travail`,
  );
  doc.end();
  return termine;
}
