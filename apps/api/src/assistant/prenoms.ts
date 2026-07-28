/**
 * Prénoms courants en France (souche INSEE, toutes origines confondues).
 * Sert UNIQUEMENT à attraper un prénom qui ouvre une phrase — position où
 * l'heuristique de capitalisation ne peut pas trancher seule.
 * Liste volontairement en minuscules et sans accents : la comparaison
 * normalise avant de chercher.
 */
export const PRENOMS_COURANTS: ReadonlySet<string> = new Set([
  'adam', 'adama', 'adel', 'adele', 'adem', 'adrien', 'ahmed', 'aicha', 'aissa', 'aissatou', 'alain', 'albert',
  'alex', 'alexandre', 'alexia', 'alexis', 'ali', 'alice', 'alicia', 'aline', 'alison', 'alissa', 'allan', 'amadou',
  'amel', 'amelia', 'amelie', 'amina', 'aminata', 'amine', 'amir', 'amira', 'anael', 'anais', 'anas', 'andre',
  'andrea', 'andy', 'angele', 'angelina', 'angelique', 'anis', 'anissa', 'anna', 'anne', 'annie', 'anthony', 'antoine',
  'antonin', 'arthur', 'assia', 'aurelie', 'aurelien', 'aurore', 'axel', 'ayoub', 'aya', 'bakary', 'baptiste', 'bastien',
  'beatrice', 'benjamin', 'benoit', 'bilal', 'bilel', 'billy', 'brahim', 'brandon', 'brice', 'bruno', 'camelia', 'camille',
  'carla', 'carole', 'caroline', 'cassandra', 'catherine', 'cedric', 'celia', 'celine', 'cerise', 'chaima', 'chantal', 'charlene',
  'charles', 'charline', 'charlotte', 'cheick', 'chris', 'christelle', 'christian', 'christine', 'christophe', 'cindy', 'claire', 'clara',
  'clelement', 'clemence', 'clementine', 'cloe', 'corentin', 'coralie', 'corinne', 'cyril', 'cynthia', 'dalila', 'damien', 'dan',
  'dany', 'daniel', 'daniela', 'david', 'deborah', 'denis', 'diane', 'didier', 'dina', 'djibril', 'dorian', 'dounia',
  'dylan', 'eden', 'edouard', 'el', 'elias', 'elie', 'elisa', 'elise', 'elodie', 'eloise', 'elsa', 'emeline',
  'emilie', 'emma', 'emmanuel', 'enzo', 'eric', 'erwan', 'esteban', 'esther', 'ethan', 'eva', 'evan', 'fabien',
  'fabrice', 'fanny', 'farid', 'fatim', 'fatima', 'fatoumata', 'flavie', 'florent', 'florian', 'fode', 'francois', 'franck',
  'fred', 'frederic', 'gabin', 'gabriel', 'gaelle', 'gaetan', 'gauthier', 'geoffrey', 'georges', 'gerald', 'geraldine', 'gerard',
  'gilles', 'gregory', 'guillaume', 'gwendoline', 'habib', 'hafsa', 'hamza', 'hanae', 'hassan', 'helene', 'henri', 'heloise',
  'hicham', 'hugo', 'hussein', 'ibrahim', 'idriss', 'ilan', 'ilyes', 'imane', 'imen', 'ines', 'ismael', 'issa',
  'jacques', 'jade', 'jamel', 'jean', 'jeanne', 'jennifer', 'jeremy', 'jessica', 'joan', 'joel', 'johan', 'johanna',
  'jonas', 'jonathan', 'jordan', 'joris', 'joseph', 'josephine', 'joshua', 'julie', 'julien', 'juliette', 'justine', 'kader',
  'kadiatou', 'kamel', 'karim', 'karima', 'karine', 'kenza', 'kevin', 'khadija', 'kylian', 'lamia', 'lara', 'laura',
  'laure', 'laurent', 'layla', 'lea', 'leila', 'lena', 'leo', 'leon', 'leonie', 'lila', 'lilian', 'liliane',
  'lilou', 'lily', 'lina', 'lino', 'lisa', 'loan', 'loic', 'lola', 'lorenzo', 'lou', 'louane', 'louis',
  'louise', 'louna', 'luc', 'luca', 'lucas', 'lucie', 'lucien', 'ludivine', 'ludovic', 'luna', 'lyna', 'lydia',
  'maelle', 'maelys', 'magalie', 'mahamadou', 'maissa', 'malik', 'malika', 'mamadou', 'manel', 'manon', 'marc', 'marceau',
  'marcel', 'margaux', 'margot', 'maria', 'mariam', 'mariama', 'marianne', 'marie', 'marina', 'marine', 'mario', 'marion',
  'marius', 'marwa', 'marwan', 'maryam', 'mateo', 'matheo', 'matheo', 'mathias', 'mathieu', 'mathilde', 'mathis', 'mathys',
  'matteo', 'mattheo', 'matthias', 'matthieu', 'maud', 'maxence', 'maxime', 'maya', 'mehdi', 'medhi', 'melanie', 'melina',
  'melissa', 'melvin', 'michel', 'mickael', 'mila', 'mina', 'mohamed', 'mohammed', 'moise', 'morgane', 'moussa', 'muriel',
  'mylene', 'myriam', 'nabil', 'nadia', 'nael', 'nahel', 'naim', 'nadege', 'nassim', 'nathalie', 'nathan', 'neila',
  'nesrine', 'nicolas', 'nina', 'ninon', 'noa', 'noah', 'noe', 'noel', 'noemie', 'nolan', 'nora', 'norhane',
  'nour', 'oceane', 'olivia', 'olivier', 'omar', 'ophelie', 'oscar', 'oumou', 'ousmane', 'pablo', 'paola', 'pascal',
  'patricia', 'patrick', 'paul', 'pauline', 'philippe', 'pierre', 'priscilla', 'quentin', 'rachel', 'rachid', 'rafael', 'raphael',
  'rayan', 'rebecca', 'remi', 'remy', 'rachida', 'richard', 'robin', 'romain', 'romane', 'romy', 'rosalie', 'roxane',
  'ryan', 'sabrina', 'sacha', 'safia', 'said', 'salim', 'salima', 'salma', 'samia', 'samir', 'samira', 'samuel',
  'samy', 'sana', 'sandra', 'sandrine', 'sara', 'sarah', 'sasha', 'sebastien', 'selena', 'selma', 'serge', 'severine',
  'shana', 'sherine', 'simon', 'sofia', 'sofiane', 'solene', 'sonia', 'sophia', 'sophie', 'soraya', 'stephane', 'stephanie',
  'steven', 'suzanne', 'sylvain', 'sylvestre', 'sylvie', 'tania', 'tanguy', 'tessa', 'theo', 'thibault', 'thibaut', 'thierry',
  'thomas', 'tiago', 'timeo', 'timothee', 'tom', 'toni', 'tony', 'tristan', 'valentin', 'valentine', 'valerie', 'vanessa',
  'veronique', 'victor', 'victoria', 'vincent', 'virginie', 'walid', 'wassim', 'william', 'yacine', 'yanis', 'yann', 'yannick',
  'yasmine', 'yassine', 'yasser', 'yohan', 'youcef', 'younes', 'yousra', 'youssef', 'youssouf', 'yvan', 'yves', 'zahra',
  'zakaria', 'zayd', 'zoe',
]);
