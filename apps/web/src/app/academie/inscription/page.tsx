import Link from 'next/link';
import type { Metadata } from 'next';
import { Accent, CARTE, Encart, Titre } from '../_ui';
import { FormulaireInscription } from './FormulaireInscription';

export const metadata: Metadata = {
  title: 'Ouvrir mon espace',
  description: "Ouvrir l'espace de son organisme de formation : le chemin, les preuves Qualiopi, le catalogue et les apprenants. Gratuit.",
};

export default function InscriptionAcademiePage() {
  return (
    <div className="mx-auto max-w-[680px]">
      <Titre
        surtitre="Gratuit"
        sousTitre="Deux minutes. Ton espace s'ouvre, le chemin démarre, et les étapes se cochent toutes seules à mesure que la donnée arrive."
      >
        Ouvrir l&apos;espace de mon <Accent>académie</Accent>
      </Titre>

      <div className={`${CARTE} p-6 sm:p-8`}>
        <FormulaireInscription />
      </div>

      <div className="mt-6 space-y-4">
        <Encart ton="info">
          <span className="font-bold">Ton organisme n&apos;est pas encore déclaré ?</span> C&apos;est justement le moment. Le
          chemin commence avant la déclaration : il te dit dans quel ordre s&apos;y prendre, y compris l&apos;étape que personne
          ne voit venir — la première convention signée avant de pouvoir déclarer.
        </Encart>
        <p className="text-sm text-[#5E7A6E]">
          Tu as déjà un compte ?{' '}
          <Link href="/academie/connexion" className="font-bold text-[#0F5F3E] underline underline-offset-4">
            Se connecter
          </Link>
          . Tu pilotes aussi une association ?{' '}
          <Link href="/" className="font-bold text-[#0F5F3E] underline underline-offset-4">
            Son espace est ici
          </Link>{' '}
          — un même compte porte les deux.
        </p>
      </div>
    </div>
  );
}
