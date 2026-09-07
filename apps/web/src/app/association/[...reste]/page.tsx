import { notFound } from 'next/navigation';

/**
 * Toute adresse inconnue sur association.toulali.fr tombe ici, et donc dans
 * la page « introuvable » de CE site — pas dans celle de Les Extras.
 */
export default function AdresseInconnue() {
  notFound();
}
