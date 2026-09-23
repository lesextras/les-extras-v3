import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, Titre } from '../_ui';
import { EmailsAutomatiques, type ModeleEmail } from './EmailsAutomatiques';

export const metadata: Metadata = { title: 'E-mails automatiques', robots: { index: false, follow: false } };

/**
 * `/academie/emails` : LES QUATORZE COURRIELS QUI PARTENT TOUT SEULS.
 *
 * Bienvenue, fin de formation, invitations, relances d'abandon de panier et
 * de décrochage, leçon qui s'ouvre, accès qui expire, récapitulatif du lundi.
 * Chacun s'active, se réécrit et, quand c'est une relance, se décale.
 */
export default async function PageEmails() {
  const s = await sessionAcademie('/academie/emails');
  const { data, error } = await apiAcademie<ModeleEmail[]>(s, '/ecole/emails');
  return (
    <>
      <Titre surtitre="Outils marketing" sousTitre="Les courriels envoyés à tes apprenants, au bon moment, sans que tu y penses. Chacun se coupe, se réécrit et se teste.">
        E-mails automatiques
      </Titre>
      {Array.isArray(data) ? (
        <EmailsAutomatiques initiaux={data} courriel={s.session.user?.email ?? ''} />
      ) : (
        <Encart ton="attention">{error ?? 'Les courriels ne se chargent pas pour le moment.'}</Encart>
      )}
    </>
  );
}
