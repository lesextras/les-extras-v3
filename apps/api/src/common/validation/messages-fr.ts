import { BadRequestException, ValidationError } from '@nestjs/common';

/**
 * LES MESSAGES DE VALIDATION, EN FRANÇAIS ET ADRESSÉS À QUELQU'UN.
 *
 * Les messages métier de l'API sont soignés et parlent à la personne qui
 * vient de cliquer (« Cette action est réservée à la direction. Demandez à un
 * responsable de votre établissement de la faire pour vous. »). Mais dès
 * qu'un champ de formulaire était mal rempli, class-validator reprenait la
 * main et renvoyait sa phrase brute, en anglais :
 *
 *   title must be longer than or equal to 3 characters
 *   amount must not be less than 0
 *   property requestNote should not exist
 *
 * C'est ce que voyait l'utilisateur, dans une interface entièrement en
 * français. On traduit donc ici, une fois pour toutes, au lieu d'ajouter un
 * message à la main sur chacune des centaines de règles des DTO.
 *
 * Deux principes :
 *  - on nomme le champ en français quand on le connaît (« Le titre »), sinon
 *    on reste impersonnel (« Ce champ ») plutôt que d'afficher un nom
 *    technique anglais ;
 *  - les erreurs qui ne concernent pas l'utilisateur (un champ inconnu envoyé
 *    par le front, une limite de pagination dépassée) deviennent un message
 *    générique : elles signalent un défaut du logiciel, pas une faute de
 *    saisie, et lui montrer le détail ne l'aide en rien.
 */

/** Nom lisible des champs les plus exposés dans les formulaires. */
const NOMS: Record<string, string> = {
  title: 'Le titre',
  name: 'Le nom',
  firstName: 'Le prénom',
  lastName: 'Le nom',
  email: 'L’adresse e-mail',
  password: 'Le mot de passe',
  phone: 'Le téléphone',
  city: 'La ville',
  postalCode: 'Le code postal',
  address: 'L’adresse',
  description: 'La description',
  summary: 'Le résumé',
  content: 'Le contenu',
  message: 'Le message',
  price: 'Le prix',
  priceHt: 'Le prix',
  amount: 'Le montant',
  hourlyRate: 'Le taux horaire',
  duration: 'La durée',
  durationHours: 'La durée',
  durationMinutes: 'La durée',
  startDate: 'La date de début',
  endDate: 'La date de fin',
  scheduledAt: 'La date',
  maxSeats: 'Le nombre de places',
  headcount: 'Le nombre de personnes',
  siret: 'Le SIRET',
  legalName: 'La raison sociale',
  objectives: 'Les objectifs',
  program: 'Le programme',
  prerequisites: 'Les prérequis',
  targetAudience: 'Le public visé',
  organizationName: 'Le nom de l’établissement',
  role: 'Le rôle',
  status: 'Le statut',
  category: 'La catégorie',
  rating: 'La note',
};

function nomDuChamp(propriete: string): string {
  return NOMS[propriete] ?? 'Ce champ';
}

/**
 * Un message écrit à la main dans le DTO l'emporte toujours sur la traduction
 * générique.
 *
 * Sans cette règle, « Le mot de passe doit contenir au moins un chiffre. » —
 * rédigé exprès pour dire QUOI corriger — était remplacé par le fourre-tout
 * « Le mot de passe n’est pas au bon format. », qui ne dit rien. La traduction
 * est un filet de sécurité pour les centaines de règles sans message, pas un
 * rouleau compresseur sur celles qu'on a pris la peine de rédiger.
 *
 * Reconnaissance : les phrases par défaut de class-validator commencent
 * invariablement par le nom technique du champ (« password must be… »,
 * « title should not be empty »). Une phrase qui ne commence pas ainsi a été
 * écrite par nous.
 */
function messageRedigeALaMain(propriete: string, brut: string): boolean {
  return !new RegExp(`^${propriete}\\b`, 'i').test(brut.trim());
}

/** Traduit UNE contrainte class-validator en phrase française. */
function traduire(propriete: string, contrainte: string, brut: string): string {
  const champ = nomDuChamp(propriete);
  const nombre = brut.match(/(-?\d+(?:[.,]\d+)?)/)?.[1];

  if (contrainte !== 'whitelistValidation' && messageRedigeALaMain(propriete, brut)) {
    return brut;
  }

  switch (contrainte) {
    case 'isNotEmpty':
    case 'isDefined':
      return `${champ} est obligatoire.`;
    case 'minLength':
      return `${champ} doit contenir au moins ${nombre} caractères.`;
    case 'maxLength':
      return `${champ} ne doit pas dépasser ${nombre} caractères.`;
    case 'min':
      return `${champ} ne peut pas être inférieur à ${nombre}.`;
    case 'max':
      return `${champ} ne peut pas dépasser ${nombre}.`;
    case 'isEmail':
      return 'Cette adresse e-mail n’est pas valide.';
    case 'isUrl':
      return `${champ} doit être une adresse web valide.`;
    case 'isInt':
    case 'isNumber':
    case 'isPositive':
      return `${champ} doit être un nombre${contrainte === 'isPositive' ? ' positif' : ''}.`;
    case 'isBoolean':
      return `${champ} doit être « oui » ou « non ».`;
    case 'isDateString':
    case 'isDate':
      return `${champ} n’est pas une date valide.`;
    case 'isString':
      return `${champ} n’est pas au bon format.`;
    case 'isArray':
      return `${champ} doit être une liste.`;
    case 'isEnum':
    case 'isIn':
      return `${champ} a une valeur qui n’est pas autorisée.`;
    case 'matches':
      return `${champ} n’est pas au bon format.`;
    case 'whitelistValidation':
      // Champ inconnu envoyé par le client : défaut du logiciel, pas de l'utilisateur.
      return 'Formulaire incomplet ou obsolète. Rechargez la page et réessayez.';
    default:
      // Une contrainte qu'on n'a pas prévue : on ne montre pas l'anglais brut.
      return `${champ} n’est pas valide.`;
  }
}

/** Aplatit l'arbre d'erreurs (y compris imbriquées) en phrases françaises. */
function aplatir(erreurs: ValidationError[], prefixe = ''): string[] {
  const messages: string[] = [];
  for (const e of erreurs) {
    const propriete = prefixe ? `${prefixe}.${e.property}` : e.property;
    for (const [contrainte, brut] of Object.entries(e.constraints ?? {})) {
      messages.push(traduire(e.property, contrainte, String(brut)));
    }
    if (e.children?.length) messages.push(...aplatir(e.children, propriete));
  }
  // Dédoublonne : deux règles sur le même champ produisent souvent la même phrase.
  return Array.from(new Set(messages));
}

/**
 * Fabrique l'exception renvoyée par la ValidationPipe globale.
 * Conserve la forme attendue par le front (`message` = tableau de phrases).
 */
export function exceptionValidationFr(erreurs: ValidationError[]): BadRequestException {
  const messages = aplatir(erreurs);
  return new BadRequestException({
    statusCode: 400,
    error: 'Bad Request',
    message: messages.length > 0 ? messages : ['Certains champs ne sont pas valides.'],
  });
}
