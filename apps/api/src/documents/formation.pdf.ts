import {
  dateFr,
  encadre,
  enTete,
  filet,
  garderPlace,
  LARGEUR_UTILE,
  ligne,
  MARGE,
  nomComplet,
  nouveauDocument,
  paragraphe,
  pied,
  tableau,
  titreSection,
} from './pdf';

/**
 * LES PIÈCES DE LA FORMATION.
 *
 * Jusqu'ici, l'attestation d'assiduité et le certificat de réalisation étaient
 * des pages HTML avec un bouton « Imprimer ». Cela suffit pour montrer à
 * l'écran ; cela ne suffit pas pour un organisme de formation.
 *
 * Trois raisons, et aucune n'est esthétique. D'abord le certificat de
 * réalisation est la pièce que le financeur — OPCO, France Travail, Caisse des
 * dépôts pour le CPF — exige au format PDF pour libérer les fonds ; un onglet
 * de navigateur n'est pas un justificatif. Ensuite, une impression dépend du
 * navigateur, de ses marges et de ses réglages : deux stagiaires de la même
 * session peuvent repartir avec deux documents différents. Enfin, en audit
 * Qualiopi, ce qu'on présente est un dossier de pièces archivées, pas une
 * capture d'écran.
 *
 * La feuille d'émargement complète le lot : c'est la preuve de réalisation la
 * plus contrôlée de toutes, et elle n'existait sur aucun support imprimable.
 */

export interface DonneesFormationPdf {
  inscription: {
    id: string;
    learnerName: string | null;
    learnerEmail: string | null;
    learner: { firstName: string | null; lastName: string | null; email: string } | null;
    emargements: { present: boolean; slotDate: Date; slot: string }[];
  };
  session: {
    id: string;
    startDate: Date;
    endDate: Date | null;
    location: string | null;
    trainer: { firstName: string | null; lastName: string | null } | null;
  };
  formation: {
    title: string;
    durationHours: number | null;
    certifying: boolean;
    certificationName: string | null;
    objectives: string | null;
    ownerAccount: { name: string; city: string | null } | null;
  };
}

/** Le nom de l'apprenant, qu'il soit membre de la plateforme ou externe. */
function apprenant(i: DonneesFormationPdf['inscription']): string {
  const membre = nomComplet(i.learner);
  return membre || i.learnerName || i.learner?.email || i.learnerEmail || 'Apprenant';
}

const SLOT: Record<string, string> = { MORNING: 'Matin', AFTERNOON: 'Après-midi' };

/**
 * Attestation d'assiduité et certificat de réalisation.
 *
 * Un seul module pour les deux, parce qu'ils disent la même chose à un mot
 * près — mais ce mot compte. L'attestation constate une présence ; le
 * certificat de réalisation atteste qu'une action de formation au sens de
 * l'article L. 6353-1 du code du travail a été réalisée, et il n'a de sens que
 * pour un programme certifiant.
 */
export async function formationPdf(
  d: DonneesFormationPdf,
  genre: 'attestation' | 'certificat',
): Promise<Buffer> {
  const { inscription: i, session: s, formation: f } = d;
  const organisme = f.ownerAccount?.name ?? 'ADéPA';
  const ville = f.ownerAccount?.city ?? 'Melun';
  const formateur = nomComplet(s.trainer);
  const presences = i.emargements.filter((e) => e.present);
  const certificat = genre === 'certificat';

  const titre = certificat ? 'Certificat de réalisation' : "Attestation d'assiduité";
  const { doc, termine } = nouveauDocument(`${titre} — ${f.title}`, organisme);

  enTete(
    doc,
    titre,
    `${organisme}${ville ? ` · ${ville}` : ''} · organisme de formation · délivré le ${dateFr(new Date())}`,
  );

  doc.moveDown(0.6);
  paragraphe(doc, `${organisme} atteste que :`);
  doc.moveDown(0.2);
  doc.fillColor('#1b2430').font('Helvetica-Bold').fontSize(15).text(apprenant(i));
  doc.moveDown(0.6);
  paragraphe(
    doc,
    certificat
      ? "a suivi et réalisé l'action de formation suivante :"
      : 'a suivi la formation suivante :',
  );
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#1b2430').text(`« ${f.title} »`);
  doc.moveDown(0.8);
  filet(doc);

  titreSection(doc, 'Déroulement');
  ligne(
    doc,
    'Dates',
    s.endDate && s.endDate.toDateString() !== s.startDate.toDateString()
      ? `du ${dateFr(s.startDate)} au ${dateFr(s.endDate)}`
      : `le ${dateFr(s.startDate)}`,
  );
  ligne(doc, 'Durée', f.durationHours ? `${f.durationHours} heures` : '—');
  ligne(doc, 'Lieu', s.location ?? '—');
  ligne(doc, 'Formateur', formateur || '—');
  ligne(
    doc,
    'Assiduité',
    `${presences.length} demi-journée${presences.length > 1 ? 's' : ''} émargée${presences.length > 1 ? 's' : ''}`,
  );
  if (certificat && f.certificationName) {
    ligne(doc, 'Certification visée', f.certificationName);
  }

  if (f.objectives) {
    titreSection(doc, 'Objectifs de la formation');
    paragraphe(doc, f.objectives, { gris: true });
  }

  if (certificat) {
    encadre(
      doc,
      "Action de formation réalisée conformément aux dispositions de l'article L. 6353-1 du code du travail. Ce certificat de réalisation est la pièce justificative attendue par les financeurs pour le règlement de l'action.",
    );
  } else {
    encadre(
      doc,
      "La présente attestation constate l'assiduité du bénéficiaire au regard des émargements recueillis. Elle ne vaut pas certificat de réalisation : ce dernier n'est délivré que pour les actions relevant d'un programme certifiant.",
    );
  }

  // Le détail des émargements figure sur l'attestation : c'est ce qui la rend
  // vérifiable. Un total sans dates ne prouve rien.
  if (!certificat && presences.length > 0) {
    titreSection(doc, 'Détail des présences');
    tableau(
      doc,
      [
        { titre: 'Date', largeur: 60 },
        { titre: 'Créneau', largeur: 40 },
      ],
      presences
        .slice()
        .sort((a, b) => a.slotDate.getTime() - b.slotDate.getTime())
        .map((e) => [dateFr(e.slotDate), SLOT[e.slot] ?? e.slot]),
    );
  }

  garderPlace(doc, 110);
  doc.moveDown(1.4);
  const y = doc.y;
  doc
    .fillColor('#5b6470')
    .font('Helvetica')
    .fontSize(9.5)
    .text(`Fait à ${ville}, le ${dateFr(new Date())}`, MARGE, y, { width: LARGEUR_UTILE * 0.5 });
  doc
    .fillColor('#5b6470')
    .fontSize(9.5)
    .text(`Pour ${organisme}`, MARGE + LARGEUR_UTILE * 0.55, y, {
      width: LARGEUR_UTILE * 0.45,
      align: 'right',
    });
  doc
    .strokeColor('#d8dde3')
    .lineWidth(0.75)
    .roundedRect(MARGE + LARGEUR_UTILE * 0.55, y + 18, LARGEUR_UTILE * 0.45, 62, 4)
    .stroke();
  doc
    .fillColor('#9aa3ad')
    .fontSize(8)
    .text('Signature et cachet', MARGE + LARGEUR_UTILE * 0.55 + 8, y + 24, {
      width: LARGEUR_UTILE * 0.45 - 16,
    });
  doc.y = y + 92;
  doc.x = MARGE;

  doc.flushPages();
  pied(
    doc,
    `${titre} · ${organisme} · référence ${i.id.slice(-8).toUpperCase()}`,
  );
  doc.end();
  return termine;
}

// ---------------------------------------------------------------------------

export interface DonneesEmargementPdf {
  session: {
    id: string;
    startDate: Date;
    endDate: Date | null;
    location: string | null;
    trainer: { firstName: string | null; lastName: string | null } | null;
    formation: {
      title: string;
      durationHours: number | null;
      ownerAccount: { name: string; city: string | null } | null;
    };
  };
  inscriptions: {
    id: string;
    learnerName: string | null;
    learnerEmail: string | null;
    learner: { firstName: string | null; lastName: string | null; email: string } | null;
  }[];
  emargements: { inscriptionId: string; slotDate: Date; slot: string; present: boolean }[];
}

/**
 * LA FEUILLE D'ÉMARGEMENT.
 *
 * De toutes les pièces d'un dossier de formation, c'est la plus contrôlée :
 * c'est elle qui prouve qu'une action a eu lieu, et c'est sur elle que porte
 * le redressement quand un financeur conteste. Elle doit donc exister sur
 * papier, avec des cases à signer à la main le jour même — l'écran sert à
 * saisir après coup, il ne remplace pas la signature du stagiaire en salle.
 *
 * Deux usages dans un seul document : les cases vides pour faire signer, et le
 * récapitulatif de ce qui a déjà été saisi pour le dossier.
 */
export async function emargementPdf(d: DonneesEmargementPdf): Promise<Buffer> {
  const { session: s, inscriptions, emargements } = d;
  const organisme = s.formation.ownerAccount?.name ?? 'ADéPA';
  const ville = s.formation.ownerAccount?.city ?? 'Melun';
  const formateur = nomComplet(s.trainer);

  const { doc, termine } = nouveauDocument(
    `Feuille d'émargement — ${s.formation.title}`,
    organisme,
  );

  enTete(
    doc,
    "Feuille d'émargement",
    `${organisme}${ville ? ` · ${ville}` : ''} · éditée le ${dateFr(new Date())}`,
  );

  ligne(doc, 'Formation', s.formation.title);
  ligne(
    doc,
    'Dates',
    s.endDate && s.endDate.toDateString() !== s.startDate.toDateString()
      ? `du ${dateFr(s.startDate)} au ${dateFr(s.endDate)}`
      : `le ${dateFr(s.startDate)}`,
  );
  ligne(doc, 'Durée', s.formation.durationHours ? `${s.formation.durationHours} heures` : '—');
  ligne(doc, 'Lieu', s.location ?? '—');
  ligne(doc, 'Formateur', formateur || '—');
  ligne(doc, 'Inscrits', String(inscriptions.length));

  // --- Les cases à faire signer en salle ---
  titreSection(doc, 'Signatures des stagiaires');
  paragraphe(
    doc,
    "À faire signer par chaque stagiaire, pour chaque demi-journée de présence effective. Une case non signée vaut absence : ne pas la remplir a posteriori.",
    { gris: true },
  );

  const largeurNom = LARGEUR_UTILE * 0.34;
  const largeurCase = (LARGEUR_UTILE - largeurNom) / 2;

  const enTeteTableau = () => {
    garderPlace(doc, 60);
    const y = doc.y;
    doc.fillColor('#5b6470').font('Helvetica-Bold').fontSize(8.5);
    doc.text('STAGIAIRE', MARGE, y, { width: largeurNom - 8 });
    doc.text('MATIN', MARGE + largeurNom, y, { width: largeurCase - 8 });
    doc.text('APRÈS-MIDI', MARGE + largeurNom + largeurCase, y, { width: largeurCase - 8 });
    doc.y = y + 14;
    filet(doc);
    doc.y += 4;
  };

  enTeteTableau();
  for (const insc of inscriptions) {
    if (doc.y + 46 > 842 - MARGE - 24) {
      doc.addPage();
      enTeteTableau();
    }
    const y = doc.y;
    doc
      .fillColor('#1b2430')
      .font('Helvetica')
      .fontSize(9.5)
      .text(apprenant(insc as never), MARGE, y + 12, { width: largeurNom - 10 });
    doc.strokeColor('#d8dde3').lineWidth(0.75);
    doc.roundedRect(MARGE + largeurNom, y + 4, largeurCase - 10, 34, 3).stroke();
    doc.roundedRect(MARGE + largeurNom + largeurCase, y + 4, largeurCase - 10, 34, 3).stroke();
    doc.y = y + 44;
    doc.x = MARGE;
  }

  // --- Le récapitulatif de ce qui a été saisi ---
  const saisis = emargements.filter((e) => e.present);
  if (saisis.length > 0) {
    doc.addPage();
    enTete(doc, 'Présences enregistrées', `${s.formation.title} · ${organisme}`);
    paragraphe(
      doc,
      'Récapitulatif des présences saisies dans le logiciel. À rapprocher des signatures manuscrites en cas de contrôle.',
      { gris: true },
    );

    const nomPar = new Map(inscriptions.map((i) => [i.id, apprenant(i as never)]));
    tableau(
      doc,
      [
        { titre: 'Stagiaire', largeur: 46 },
        { titre: 'Date', largeur: 34 },
        { titre: 'Créneau', largeur: 20 },
      ],
      saisis
        .slice()
        .sort((a, b) => a.slotDate.getTime() - b.slotDate.getTime())
        .map((e) => [
          nomPar.get(e.inscriptionId) ?? 'Stagiaire',
          dateFr(e.slotDate),
          SLOT[e.slot] ?? e.slot,
        ]),
    );
  }

  doc.flushPages();
  pied(doc, `Feuille d'émargement · ${organisme} · session ${s.id.slice(-8).toUpperCase()}`);
  doc.end();
  return termine;
}
