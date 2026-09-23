/**
 * LA CARTE À INTÉGRER SUR UN AUTRE SITE.
 *
 * Servie dans une iframe (`/integration/...`), elle ne porte que le strict
 * nécessaire : image, titre, prix, un bouton. Le bouton ouvre la page de vente
 * dans un nouvel onglet : un paiement ne se fait jamais dans le cadre d'un
 * site tiers, où l'adresse de la page n'est pas visible.
 */
export function CarteIntegree({
  titre,
  sousTitre,
  imageUrl,
  prixCents,
  prixBarreCents,
  gratuit,
  href,
  couleur,
  texteBouton,
  ecole,
}: {
  titre: string;
  sousTitre: string | null;
  imageUrl: string | null;
  prixCents: number;
  prixBarreCents?: number | null;
  gratuit?: boolean;
  href: string;
  couleur: string;
  texteBouton: string;
  ecole: string | null;
}) {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif', margin: 0 }}>
      <a
        href={href}
        target="_blank"
        rel="noopener"
        style={{
          display: 'block',
          maxWidth: 380,
          textDecoration: 'none',
          color: '#12312A',
          background: '#fff',
          border: '1px solid #DDEBE4',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" style={{ display: 'block', width: '100%', height: 180, objectFit: 'cover' }} />
        ) : (
          <div style={{ height: 120, background: `${couleur}1A` }} />
        )}
        <div style={{ padding: 18 }}>
          {ecole ? <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#5E7A6E', textTransform: 'uppercase', letterSpacing: '.08em' }}>{ecole}</p> : null}
          <p style={{ margin: '6px 0 0', fontSize: 19, fontWeight: 800, lineHeight: 1.2 }}>{titre}</p>
          {sousTitre ? <p style={{ margin: '6px 0 0', fontSize: 15, lineHeight: 1.5, color: '#334A42' }}>{sousTitre}</p> : null}
          <p style={{ margin: '12px 0 0', fontSize: 18, fontWeight: 800, color: couleur }}>
            {gratuit || prixCents === 0 ? 'Gratuit' : euros(prixCents)}
            {prixBarreCents ? <span style={{ marginLeft: 8, fontSize: 14, color: '#5E7A6E', textDecoration: 'line-through' }}>{euros(prixBarreCents)}</span> : null}
          </p>
          <span
            style={{
              display: 'inline-block',
              marginTop: 14,
              padding: '10px 18px',
              borderRadius: 12,
              background: couleur,
              color: '#fff',
              fontWeight: 800,
              fontSize: 15,
            }}
          >
            {texteBouton}
          </span>
        </div>
      </a>
    </div>
  );
}

export function euros(cents: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);
}
