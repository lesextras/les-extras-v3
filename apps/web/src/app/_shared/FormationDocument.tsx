// Document officiel imprimable (A4) — attestation d'assiduité OU certificat.
// Présentationnel : rendu serveur, bouton d'impression client (PrintButton).
import { PrintButton } from "./PrintButton";

export interface DocInscription {
  id: string;
  learnerName?: string | null;
  learner?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null;
  emargements?: { present?: boolean }[];
  session?: {
    startDate: string;
    endDate?: string | null;
    location?: string | null;
    trainer?: { firstName?: string | null; lastName?: string | null } | null;
    formation?: {
      title?: string | null;
      durationHours?: number | null;
      certifying?: boolean;
      certificationName?: string | null;
      objectives?: string | null;
      ownerAccount?: { name?: string | null; city?: string | null } | null;
    } | null;
  } | null;
}

function fullName(i: DocInscription) {
  if (i.learner) {
    const n = [i.learner.firstName, i.learner.lastName].filter(Boolean).join(" ");
    return n || i.learner.email || "—";
  }
  return i.learnerName || "—";
}

function fmt(d?: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export function FormationDocument({
  inscription,
  kind,
}: {
  inscription: DocInscription;
  kind: "attestation" | "certificat";
}) {
  const s = inscription.session;
  const f = s?.formation;
  const org = f?.ownerAccount?.name ?? "ADéPA";
  const city = f?.ownerAccount?.city ?? "";
  const trainer = s?.trainer
    ? [s.trainer.firstName, s.trainer.lastName].filter(Boolean).join(" ")
    : null;
  const presents = (inscription.emargements ?? []).filter((e) => e.present).length;
  const isCert = kind === "certificat";
  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-neutral-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-4 print:hidden">
        <a href="/dashboard/formations" className="text-sm text-neutral-600 hover:underline">
          ← Retour aux formations
        </a>
        <PrintButton />
      </div>

      {/* Feuille A4 */}
      <div className="mx-auto flex min-h-[297mm] w-full max-w-[210mm] flex-col bg-white px-16 py-14 shadow-lg print:min-h-0 print:shadow-none">
        <header className="flex items-start justify-between border-b border-neutral-200 pb-6">
          <div>
            <p className="text-lg font-bold tracking-tight text-neutral-900">{org}</p>
            <p className="text-xs text-neutral-500">Organisme de formation{city ? ` · ${city}` : ""}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-widest text-neutral-400">
              {isCert ? "Certificat" : "Attestation"}
            </p>
            {isCert && f?.certifying ? (
              <p className="text-[11px] font-medium text-emerald-600">Certifiante · Qualiopi</p>
            ) : null}
          </div>
        </header>

        <div className="flex flex-1 flex-col justify-center py-10 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900">
            {isCert ? "Certificat de réalisation" : "Attestation d'assiduité"}
          </h1>
          <p className="mt-8 text-sm text-neutral-600">
            {org} atteste que
          </p>
          <p className="mt-2 text-xl font-semibold text-neutral-900">{fullName(inscription)}</p>
          <p className="mt-6 text-sm leading-relaxed text-neutral-700">
            a suivi la formation
          </p>
          <p className="mt-1 text-lg font-medium text-neutral-900">« {f?.title ?? "Formation"} »</p>

          <div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-x-8 gap-y-2 text-left text-sm text-neutral-700">
            <span className="text-neutral-500">Dates</span>
            <span className="text-right font-medium">
              {fmt(s?.startDate)}
              {s?.endDate ? ` – ${fmt(s.endDate)}` : ""}
            </span>
            {f?.durationHours ? (
              <>
                <span className="text-neutral-500">Durée</span>
                <span className="text-right font-medium">{f.durationHours} heures</span>
              </>
            ) : null}
            {s?.location ? (
              <>
                <span className="text-neutral-500">Lieu</span>
                <span className="text-right font-medium">{s.location}</span>
              </>
            ) : null}
            {trainer ? (
              <>
                <span className="text-neutral-500">Formateur</span>
                <span className="text-right font-medium">{trainer}</span>
              </>
            ) : null}
            {!isCert ? (
              <>
                <span className="text-neutral-500">Assiduité</span>
                <span className="text-right font-medium">{presents} demi-journée(s) émargée(s)</span>
              </>
            ) : null}
            {isCert && f?.certificationName ? (
              <>
                <span className="text-neutral-500">Certification</span>
                <span className="text-right font-medium">{f.certificationName}</span>
              </>
            ) : null}
          </div>

          {isCert ? (
            <p className="mx-auto mt-8 max-w-lg text-xs leading-relaxed text-neutral-500">
              Action de formation réalisée conformément aux dispositions de l'article L.6353-1 du
              Code du travail.
            </p>
          ) : null}
        </div>

        <footer className="mt-auto flex items-end justify-between border-t border-neutral-200 pt-6 text-sm">
          <div>
            <p className="text-neutral-500">Fait à {city || "Melun"}, le {today}</p>
          </div>
          <div className="text-right">
            <p className="text-neutral-500">Pour {org}</p>
            <div className="mt-8 w-40 border-t border-neutral-300 pt-1 text-xs text-neutral-400">
              Signature & cachet
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
