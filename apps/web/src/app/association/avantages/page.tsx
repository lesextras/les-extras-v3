import { redirect } from 'next/navigation';

/**
 * « Ce à quoi j'ai droit » vit désormais au bout du chemin (`/chemin#droits`) :
 * une seule entrée de menu, une seule page. Les anciens liens `/avantages#canva`
 * tombent ici ; le navigateur conserve le fragment à travers la redirection, et
 * les ancres (`#canva`, `#helloasso`…) existent sur la page du chemin.
 * Décision de Siham, 28/09/2026 : « fusionne ce à quoi j'ai droit et le chemin ».
 */
export default function AvantagesPage() {
  redirect('/chemin#droits');
}
