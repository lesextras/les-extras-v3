import type { PrismaService } from '../prisma/prisma.service';
import type { EvenementAgenda } from './agenda.service';

/**
 * CE QUE L'AGENDA LIT CHEZ LES EXTRAS (24/09/2026).
 *
 * Même règle que le reste de l'agenda : on LIT les tables qui portent déjà
 * les dates, on ne recopie rien. Cinq sources, toutes rattachées au compte :
 *
 *  - les RÉSERVATIONS, des deux côtés (celles que le compte a demandées et
 *    celles qu'il reçoit sur ses fiches ou ses missions) ;
 *  - les VISIOS planifiées sur ces réservations ;
 *  - les MISSIONS de renfort publiées ou pourvues ;
 *  - les CRÉNEAUX du planning ;
 *  - les RÉSERVATIONS EN LIGNE payées par des visiteurs sans compte.
 *
 * ⚠ Les annulées ne s'affichent jamais : un agenda qui montre ce qui n'aura
 * pas lieu se lit comme un agenda plein.
 */
export async function evenementsLesExtras(
  prisma: PrismaService,
  accountId: string,
  du: Date,
  au: Date,
): Promise<EvenementAgenda[]> {
  const [reservations, missions, creneaux, enLigne] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: { not: 'CANCELLED' },
        OR: [{ accountId }, { service: { accountId } }, { mission: { accountId } }],
        AND: [
          {
            OR: [
              { scheduledAt: { gte: du, lte: au } },
              { scheduledAt: null, mission: { startDate: { gte: du, lte: au } } },
            ],
          },
        ],
      },
      take: 400,
      select: {
        id: true,
        status: true,
        scheduledAt: true,
        participants: true,
        requestNote: true,
        accountId: true,
        account: { select: { name: true } },
        service: { select: { title: true, durationMinutes: true, city: true, accountId: true, account: { select: { name: true } } } },
        mission: { select: { title: true, startDate: true, endDate: true, startTime: true, endTime: true, city: true, accountId: true, account: { select: { name: true } } } },
        visios: {
          where: { statut: { not: 'ANNULEE' }, debutPrevu: { gte: du, lte: au } },
          select: { id: true, debutPrevu: true, dureeMinutes: true, statut: true },
        },
      },
    }),
    prisma.reliefMission.findMany({
      where: {
        accountId,
        status: { in: ['PUBLISHED', 'FILLED'] },
        startDate: { lte: au },
        OR: [{ endDate: null, startDate: { gte: du } }, { endDate: { gte: du } }],
      },
      take: 200,
      select: { id: true, title: true, startDate: true, endDate: true, startTime: true, endTime: true, city: true, status: true, headcount: true, job: true },
    }),
    prisma.shift.findMany({
      where: { accountId, status: { not: 'CANCELLED' }, startAt: { lte: au }, endAt: { gte: du } },
      take: 400,
      select: { id: true, title: true, startAt: true, endAt: true, status: true, notes: true, freelance: { select: { firstName: true, lastName: true } } },
    }),
    prisma.reservationAtelier.findMany({
      where: { accountId, statut: { in: ['PAYEE', 'CONFIRMEE', 'REALISEE'] }, dateSouhaitee: { gte: du, lte: au } },
      take: 200,
      select: { id: true, dateSouhaitee: true, creneau: true, participants: true, nom: true, organisation: true, email: true, telephone: true, message: true, service: { select: { title: true, durationMinutes: true, city: true } } },
    }),
  ]);

  const sortie: EvenementAgenda[] = [];

  for (const b of reservations) {
    const titreBase = b.service?.title ?? b.mission?.title ?? 'Réservation';
    const jeSuisDemandeur = b.accountId === accountId;
    const autre = jeSuisDemandeur
      ? b.service?.account?.name ?? b.mission?.account?.name ?? null
      : b.account?.name ?? null;
    let debut: Date | null = b.scheduledAt;
    let fin: Date | null = null;
    let journee = false;
    if (debut && b.service?.durationMinutes) fin = new Date(debut.getTime() + b.service.durationMinutes * 60_000);
    if (!debut && b.mission) {
      const h = horaires(b.mission.startDate, b.mission.startTime, b.mission.endTime);
      debut = h.debut;
      fin = h.fin;
      journee = h.journee;
    }
    if (!debut) continue;
    sortie.push({
      id: `resa:${b.id}`,
      source: 'RESERVATION',
      rendezVousId: null,
      titre: titreBase,
      detail: [
        `${LIBELLE_RESA[b.status] ?? b.status}${autre ? (jeSuisDemandeur ? ` · avec ${autre}` : ` · demandée par ${autre}`) : ''}`,
        b.participants ? `${b.participants} participant${b.participants > 1 ? 's' : ''}` : null,
        b.requestNote ? `Note : ${b.requestNote}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
      lieu: b.service?.city ?? b.mission?.city ?? null,
      lien: null,
      debut,
      fin,
      journeeEntiere: journee,
      categorie: null,
      participants: autre ? [autre] : [],
      modifiable: false,
      href: '/dashboard/reservations',
      par: null,
    });
    for (const v of b.visios) {
      sortie.push({
        id: `visio:${v.id}`,
        source: 'VISIO',
        rendezVousId: null,
        titre: `Visio · ${titreBase}`,
        detail: `Rendez-vous à distance${autre ? ` avec ${autre}` : ''}. La salle ouvre 15 minutes avant.`,
        lieu: 'À distance',
        lien: null,
        debut: v.debutPrevu,
        fin: new Date(v.debutPrevu.getTime() + v.dureeMinutes * 60_000),
        journeeEntiere: false,
        categorie: null,
        participants: autre ? [autre] : [],
        modifiable: false,
        href: '/dashboard/visio',
        par: null,
      });
    }
  }

  for (const m of missions) {
    const h = horaires(m.startDate, m.startTime, m.endTime);
    sortie.push({
      id: `mission:${m.id}`,
      source: 'MISSION',
      rendezVousId: null,
      titre: `Renfort · ${m.title}`,
      detail: [m.status === 'FILLED' ? 'Mission pourvue' : 'Mission publiée, en recherche', m.job ? `Métier : ${m.job}` : null, m.headcount > 1 ? `${m.headcount} personnes` : null]
        .filter(Boolean)
        .join('\n'),
      lieu: m.city ?? null,
      lien: null,
      debut: h.debut,
      fin: m.endDate && m.endDate > h.debut ? m.endDate : h.fin,
      journeeEntiere: h.journee || Boolean(m.endDate && m.endDate.toDateString() !== m.startDate.toDateString()),
      categorie: null,
      participants: [],
      modifiable: false,
      href: '/dashboard/renforts',
      par: null,
    });
  }

  for (const s of creneaux) {
    const qui = [s.freelance?.firstName, s.freelance?.lastName].filter(Boolean).join(' ') || null;
    sortie.push({
      id: `creneau:${s.id}`,
      source: 'CRENEAU',
      rendezVousId: null,
      titre: s.title,
      detail: [qui ? `Intervenant : ${qui}` : null, s.notes].filter(Boolean).join('\n') || null,
      lieu: null,
      lien: null,
      debut: s.startAt,
      fin: s.endAt,
      journeeEntiere: false,
      categorie: null,
      participants: qui ? [qui] : [],
      modifiable: false,
      href: '/dashboard/planning',
      par: null,
    });
  }

  for (const r of enLigne) {
    if (!r.dateSouhaitee) continue;
    const debut = r.dateSouhaitee;
    sortie.push({
      id: `enligne:${r.id}`,
      source: 'RESERVATION_EN_LIGNE',
      rendezVousId: null,
      titre: r.service?.title ?? 'Réservation en ligne',
      detail: [
        [r.nom, r.organisation].filter(Boolean).join(' · ') || null,
        r.creneau ? `Créneau : ${r.creneau}` : null,
        r.participants ? `${r.participants} participant${r.participants > 1 ? 's' : ''}` : null,
        r.email,
        r.telephone,
        r.message ? `Message : ${r.message}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
      lieu: r.service?.city ?? null,
      lien: null,
      debut,
      fin: r.service?.durationMinutes ? new Date(debut.getTime() + r.service.durationMinutes * 60_000) : null,
      journeeEntiere: false,
      categorie: null,
      participants: r.nom ? [r.nom] : [],
      modifiable: false,
      href: '/dashboard/encaissement',
      par: null,
    });
  }

  return sortie;
}

const LIBELLE_RESA: Record<string, string> = {
  REQUESTED: 'Demande en attente',
  ACCEPTED: 'Acceptée',
  CONFIRMED: 'Confirmée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

/** « 09h00 » ou « 9:30 » → heures, minutes. */
export function lireHeure(v?: string | null): [number, number] | null {
  if (!v) return null;
  const m = /^(\d{1,2})\s*[h:.]\s*(\d{0,2})/i.exec(v.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = m[2] ? Number(m[2]) : 0;
  if (h > 23 || mi > 59) return null;
  return [h, mi];
}

/**
 * Une mission porte une date et, parfois, des heures en texte. Sans heure de
 * début, c'est une journée entière ; sans heure de fin, on ne l'invente pas.
 * Les heures sont celles de Paris, où se trouvent les établissements.
 */
export function horaires(jour: Date, debutTxt?: string | null, finTxt?: string | null) {
  const hd = lireHeure(debutTxt);
  if (!hd) return { debut: jour, fin: null as Date | null, journee: true };
  const base = jour.toISOString().slice(0, 10);
  const debut = heureDeParis(base, hd[0], hd[1]);
  const hf = lireHeure(finTxt);
  let fin = hf ? heureDeParis(base, hf[0], hf[1]) : null;
  if (fin && fin <= debut) fin = new Date(fin.getTime() + 24 * 3600_000); // nuit
  return { debut, fin, journee: false };
}

/** Une heure « murale » de Paris convertie en instant UTC, heure d'été comprise. */
export function heureDeParis(jourIso: string, h: number, m: number): Date {
  const approx = new Date(`${jourIso}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`);
  const affiche = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(approx);
  const hp = Number(affiche.find((p) => p.type === 'hour')?.value ?? h);
  const mp = Number(affiche.find((p) => p.type === 'minute')?.value ?? m);
  const decalageMin = (hp * 60 + mp - (h * 60 + m) + 1440) % 1440;
  return new Date(approx.getTime() - decalageMin * 60_000);
}
