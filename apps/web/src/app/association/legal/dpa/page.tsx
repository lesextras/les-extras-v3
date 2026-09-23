import Link from 'next/link';
import type { Metadata } from 'next';
import { Carte, Titre } from '../../_ui';

export const metadata: Metadata = {
  title: 'Accord de traitement des données (DPA)',
  description: "L'accord de sous-traitance au sens de l'article 28 du RGPD entre chaque école et ADéPA, qui édite Piloter.",
  alternates: { canonical: '/legal/dpa' },
};

/**
 * L'ACCORD DE TRAITEMENT (article 28 du RGPD).
 *
 * Une école qui vend ses cours sur Piloter confie à ADéPA les données de ses
 * apprenants : la loi exige que ce rôle soit écrit. Ce texte s'applique à
 * toute école dès l'ouverture de son espace ; il ne remplace pas les
 * conditions de vente de l'école, qui restent les siennes.
 */
const ARTICLES: { titre: string; texte: string[] }[] = [
  {
    titre: '1. Les parties et leur rôle',
    texte: [
      "L'école (l'organisme qui ouvre un espace « Piloter mon académie ») est responsable du traitement des données de ses apprenants. ADéPA, association loi 1901, SIRET 820 051 852 00011, 7 rue André Malraux, 77000 Melun, qui édite Piloter, agit comme sous-traitant.",
    ],
  },
  {
    titre: '2. Objet et durée',
    texte: [
      "ADéPA héberge et fait fonctionner, pour le compte de l'école, sa page de vente, ses formations en ligne, l'espace apprenant, la communauté, les classes virtuelles, les courriels automatiques et l'API. L'accord dure tant que l'espace de l'école est ouvert.",
    ],
  },
  {
    titre: '3. Les données et les personnes concernées',
    texte: [
      'Personnes : les apprenants, prospects et acheteurs de l’école, et les membres de son équipe.',
      "Données : identité, adresse e-mail, inscriptions et progression, résultats aux quiz, devoirs rendus et leur correction, publications et commentaires dans la communauté, historique d'achat (sans numéro de carte, traité par Stripe). Aucune donnée de santé n'est demandée ; l'école s'engage à ne pas en collecter par l'outil.",
    ],
  },
  {
    titre: '4. Les engagements d’ADéPA',
    texte: [
      "Ne traiter les données que pour faire fonctionner le service, selon les instructions de l'école, et jamais pour son propre compte : pas de revente, pas de prospection, pas de profilage.",
      "Garantir la confidentialité : seules les personnes qui ont besoin d'y accéder pour faire fonctionner le service y accèdent, et elles y sont tenues.",
      "Mettre en place des mesures de sécurité adaptées (article 32 du RGPD) : connexions chiffrées, mots de passe stockés sous forme d'empreinte, accès cloisonnés par école, sauvegardes.",
      "Aider l'école à répondre aux demandes d'exercice des droits de ses apprenants, et à ses obligations de sécurité et d'analyse d'impact lorsqu'elles s'appliquent.",
      "Notifier à l'école toute violation de données la concernant dans les meilleurs délais après en avoir pris connaissance, avec les informations utiles à sa propre notification.",
    ],
  },
  {
    titre: '5. Les sous-traitants ultérieurs',
    texte: [
      "ADéPA fait appel à : Hostinger International Ltd. (hébergement des serveurs et envoi des courriels, serveurs situés dans l'Union européenne) ; LiveKit (acheminement du son et de l'image des classes virtuelles intégrées, sans aucun enregistrement). Les paiements sont traités par Stripe, que l'école choisit et avec qui elle contracte directement.",
      "ADéPA informe les écoles avant tout changement de sous-traitant ultérieur ; une école peut s'y opposer en fermant son espace. Lorsqu'un sous-traitant ultérieur traite des données hors de l'Union européenne, le transfert est encadré par les garanties du chapitre V du RGPD.",
    ],
  },
  {
    titre: '6. La fin de l’accord',
    texte: [
      "À la fermeture de l'espace, ADéPA restitue sur demande les données de l'école dans un format courant, puis les supprime, sauf obligation légale de conservation. Les sauvegardes s'effacent à leur rotation normale.",
    ],
  },
  {
    titre: '7. Contrôle',
    texte: [
      "ADéPA met à la disposition de l'école les informations nécessaires pour démontrer le respect de ces obligations. Contact : assoc.adepa@gmail.com.",
    ],
  },
];

export default function PageDpa() {
  return (
    <>
      <Titre surtitre="Piloter · RGPD" sousTitre="Ce qu'ADéPA s'engage à faire, et à ne jamais faire, des données des apprenants que chaque école lui confie.">
        Accord de traitement des données
      </Titre>
      <div className="grid gap-4">
        {ARTICLES.map((a) => (
          <Carte key={a.titre}>
            <h2 className="text-lg font-extrabold text-[#1D1B5C]">{a.titre}</h2>
            {a.texte.map((t) => (
              <p key={t} className="mt-2.5 leading-relaxed text-[#3B3A66]">
                {t}
              </p>
            ))}
          </Carte>
        ))}
      </div>
      <p className="mt-6 text-sm text-[#6B6A8A]">
        Version du 24 septembre 2026.{' '}
        <Link href="/legal" className="font-bold underline underline-offset-4">
          Mentions légales et confidentialité
        </Link>
      </p>
    </>
  );
}
