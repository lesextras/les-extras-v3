import Link from 'next/link';
import type { Metadata } from 'next';
import { Accent, BTN_SECONDAIRE, Encart, Titre } from '../_ui';
import { ListeAgrements, NOMBRE_AGREMENTS, dateAgrements } from '../ListeAgrements';

export const metadata: Metadata = {
  title: 'Nos agréments',
  description:
    "Les agréments qu'une association peut demander — jeunesse, ESUS, éducation nationale, service civique, sport, santé : ce que chacun ouvre, et où le demander.",
  alternates: { canonical: '/agrements' },
};

export default function AgrementsPage() {
  return (
    <>
      <Titre
        surtitre="Nos agréments"
        sousTitre={`${NOMBRE_AGREMENTS} agréments qu'une association peut demander. Pour chacun : ce qu'il ouvre, pour qui c'est, où le demander. La page officielle fait foi.`}
      >
        Se faire <Accent>reconnaître</Accent> par l&apos;État.
      </Titre>

      <ListeAgrements />

      {/* ------------------------------------------------------------ à savoir */}
      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <Encart ton="info">
          <p className="text-lg font-extrabold">Un agrément n&apos;est pas une subvention</p>
          <p className="mt-1 leading-relaxed">
            Il ne garantit pas d&apos;argent : il ouvre des portes et prouve ton sérieux. Les demandes d&apos;argent se suivent dans ton espace.
          </p>
          <Link href="/espace/dossiers" className={`${BTN_SECONDAIRE} mt-4 !bg-white`}>
            Mes subventions et appels à projet →
          </Link>
        </Encart>
        <Encart ton="neutre">
          <p className="text-lg font-extrabold text-[#1D1B5C]">Relu le {dateAgrements()}</p>
          <p className="mt-1 leading-relaxed">
            Les conditions et les procédures changent : c&apos;est toujours la page officielle de l&apos;administration qui fait foi. On n&apos;écrit ici aucune
            condition qui n&apos;en vienne pas.
          </p>
        </Encart>
      </section>
    </>
  );
}
