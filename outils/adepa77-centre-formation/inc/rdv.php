<?php
/**
 * LA PRISE DE RENDEZ-VOUS EN LIGNE (1.3.0, 28/09/2026).
 *
 * Constat de l'audit du 28/09/2026 : « Prendre rendez-vous » menait à une
 * inscription à la newsletter Brevo. Siham veut de vrais créneaux de 20
 * minutes, SANS compte chez un tiers (ni Calendly, ni Brevo meetings) : tout
 * vit ici, dans WordPress.
 *
 * Règles tenues dans ce fichier :
 *  - ⚠ CACHE : la page est servie par LiteSpeed. Les créneaux ne sont JAMAIS
 *    écrits dans le HTML : le navigateur les demande en POST à admin-ajax.php
 *    (un POST n'est mis en cache ni par LiteSpeed ni par un CDN), réponse
 *    marquée « no-cache » en plus.
 *  - Pas de jeton de sécurité (nonce) sur la réservation, comme pour le
 *    devis : une page en cache le rendrait périmé. Protections : champ piège,
 *    délai minimal, plafond par adresse IP.
 *  - ⚠ DOUBLE RÉSERVATION : au moment d'enregistrer, le serveur prend un
 *    verrou sur la JOURNÉE (une ligne unique dans wp_options, INSERT IGNORE :
 *    add_option() n'est pas atomique), puis revérifie tout : créneau dans les
 *    disponibilités, délai minimal, jour non fermé, plafond du jour, créneau
 *    non pris par un rendez-vous non annulé.
 *  - Annulation par lien à jeton aléatoire. Seule son empreinte est stockée.
 *    Le lien ouvre une page qui DEMANDE confirmation (POST) : un antivirus
 *    qui suit les liens d'un e-mail n'annule rien.
 *  - Les horaires par défaut sont PROVISOIRES (lundi au vendredi,
 *    09:30-12:30 et 14:00-17:00) : on n'invente pas les disponibilités de
 *    Siham, l'écran Réglages le dit.
 *  - Aucune suppression automatique des rendez-vous.
 */
if (!defined('ABSPATH')) {
	exit;
}

define('ADEPA_CF_RDV_DUREE', 20); // minutes, fixe (demande de Siham)

/* --------------------------------------------------------------- réglages */

/** L'heure de Paris : l'association reçoit à Melun, quel que soit le réglage du site. */
function adepa_cf_rdv_fuseau() {
	$tz = wp_timezone();
	return $tz->getName() === 'Europe/Paris' ? $tz : new DateTimeZone('Europe/Paris');
}

function adepa_cf_rdv_motifs() {
	return array(
		'bilan'   => array('Bilan de compétences', 'Faire le point, construire un projet professionnel'),
		'equipe'  => array('Formation pour une équipe', 'Former les professionnels de votre structure'),
		'gratuit' => array('Parcours gratuits et attestation', 'Les parcours en ligne, l’attestation de suivi'),
		'autre'   => array('Autre question', 'Nous vous orientons'),
	);
}

function adepa_cf_rdv_modes() {
	return array(
		'telephone' => array('Téléphone', 'Nous vous appelons au numéro indiqué.'),
		'visio'     => array('Visio', 'Nous vous envoyons le lien par e-mail avant le rendez-vous.'),
	);
}

function adepa_cf_rdv_statuts() {
	return array(
		'confirme'    => 'Confirmé',
		'honore'      => 'Honoré',
		'absent'      => 'Personne absente',
		'annule'      => 'Annulé par la personne',
		'annule_asso' => 'Annulé par l’association',
	);
}

/** Un rendez-vous annulé libère son créneau. */
function adepa_cf_rdv_libere($statut) {
	return in_array($statut, array('annule', 'annule_asso'), true);
}

function adepa_cf_rdv_jours_semaine() {
	return array(1 => 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche');
}

/** Valeurs par défaut : PROVISOIRES, à ajuster dans Centre de formation → Import et réglages. */
function adepa_cf_rdv_defauts() {
	$semaine = '09:30-12:30, 14:00-17:00';
	return array(
		'plages'    => array(1 => $semaine, 2 => $semaine, 3 => $semaine, 4 => $semaine, 5 => $semaine, 6 => '', 7 => ''),
		'delai_h'   => 24,
		'horizon_j' => 21,
		'max_jour'  => 6,
		'fermes'    => '',
	);
}

function adepa_cf_rdv_reglages() {
	$d = adepa_cf_rdv_defauts();
	$r = get_option('adepa_cf_rdv', array());
	if (!is_array($r)) {
		$r = array();
	}
	$out = array_merge($d, array_intersect_key($r, $d));
	$out['plages'] = (isset($r['plages']) && is_array($r['plages'])) ? $r['plages'] + $d['plages'] : $d['plages'];
	$out['delai_h']   = max(0, (int) $out['delai_h']);
	$out['horizon_j'] = min(120, max(1, (int) $out['horizon_j']));
	$out['max_jour']  = max(1, (int) $out['max_jour']);
	return $out;
}

/**
 * « 09:30-12:30, 14:00-17:00 » → array(array(570, 750), array(840, 1020)) en minutes.
 * Accepte aussi « 9h30-12h30 ». Une plage illisible ou à l'envers est ignorée.
 */
function adepa_cf_rdv_lire_plages($texte) {
	$plages = array();
	if (preg_match_all('/(\d{1,2})\s*[:hH]\s*(\d{2})?\s*(?:-|–|à|a)\s*(\d{1,2})\s*[:hH]\s*(\d{2})?/u', (string) $texte, $m, PREG_SET_ORDER)) {
		foreach ($m as $p) {
			$a = (int) $p[1] * 60 + (int) ($p[2] ?? 0);
			$b = (int) $p[3] * 60 + (int) ($p[4] ?? 0);
			if ($a < $b && $b <= 24 * 60) {
				$plages[] = array($a, $b);
			}
		}
	}
	return $plages;
}

function adepa_cf_rdv_ecrire_plages($plages) {
	$t = array();
	foreach ($plages as $p) {
		$t[] = sprintf('%02d:%02d-%02d:%02d', intdiv($p[0], 60), $p[0] % 60, intdiv($p[1], 60), $p[1] % 60);
	}
	return implode(', ', $t);
}

/** Une date saisie (JJ/MM/AAAA ou AAAA-MM-JJ) → « AAAA-MM-JJ », ou '' si illisible. */
function adepa_cf_rdv_lire_date($s) {
	$s = trim($s);
	if (preg_match('#^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$#', $s, $m)) {
		list(, $j, $mo, $a) = $m;
	} elseif (preg_match('#^(\d{4})-(\d{1,2})-(\d{1,2})$#', $s, $m)) {
		list(, $a, $mo, $j) = $m;
	} else {
		return '';
	}
	return checkdate((int) $mo, (int) $j, (int) $a) ? sprintf('%04d-%02d-%02d', $a, $mo, $j) : '';
}

/**
 * Les jours fermés : une date par ligne, ou une période « 24/12/2026 au 02/01/2027 ».
 * Renvoie un tableau « AAAA-MM-JJ » => true.
 */
function adepa_cf_rdv_jours_fermes($texte = null) {
	if ($texte === null) {
		$texte = adepa_cf_rdv_reglages()['fermes'];
	}
	$fermes = array();
	foreach (preg_split('/[\r\n,;]+/', (string) $texte) as $ligne) {
		$ligne = trim($ligne);
		if ($ligne === '') {
			continue;
		}
		$bornes = preg_split('/\s+au\s+/iu', $ligne);
		$de = adepa_cf_rdv_lire_date($bornes[0]);
		$a  = isset($bornes[1]) ? adepa_cf_rdv_lire_date($bornes[1]) : $de;
		if ($de === '' || $a === '' || $a < $de) {
			continue;
		}
		$j = new DateTimeImmutable($de, adepa_cf_rdv_fuseau());
		for ($i = 0; $i < 400 && $j->format('Y-m-d') <= $a; $i++) {
			$fermes[$j->format('Y-m-d')] = true;
			$j = $j->modify('+1 day');
		}
	}
	return $fermes;
}

/* ------------------------------------------------------------ disponibilités */

/** Les débuts de créneaux THÉORIQUES d'un jour (timestamps), selon les plages de ce jour de semaine. */
function adepa_cf_rdv_creneaux_theoriques(DateTimeImmutable $jour, $reg) {
	$n      = (int) $jour->format('N');
	$plages = adepa_cf_rdv_lire_plages($reg['plages'][$n] ?? '');
	$tz     = adepa_cf_rdv_fuseau();
	$date   = $jour->format('Y-m-d');
	$liste  = array();
	foreach ($plages as $p) {
		for ($m = $p[0]; $m + ADEPA_CF_RDV_DUREE <= $p[1]; $m += ADEPA_CF_RDV_DUREE) {
			$d = new DateTimeImmutable(sprintf('%s %02d:%02d:00', $date, intdiv($m, 60), $m % 60), $tz);
			$liste[$d->getTimestamp()] = true;
		}
	}
	ksort($liste);
	return array_keys($liste);
}

/** Les rendez-vous NON annulés entre deux instants : timestamp => id. */
function adepa_cf_rdv_occupes($de, $a) {
	$ids = get_posts(array(
		'post_type'      => ADEPA_CF_RDV,
		'post_status'    => 'any',
		'posts_per_page' => -1,
		'fields'         => 'ids',
		'no_found_rows'  => true,
		'meta_query'     => array(array(
			'key'     => '_ar_debut',
			'value'   => array((int) $de, (int) $a),
			'compare' => 'BETWEEN',
			'type'    => 'NUMERIC',
		)),
	));
	$occ = array();
	foreach ($ids as $id) {
		if (adepa_cf_rdv_libere((string) get_post_meta($id, '_ar_statut', true))) {
			continue;
		}
		$occ[(int) get_post_meta($id, '_ar_debut', true)] = (int) $id;
	}
	return $occ;
}

/** Libellés français, indépendants de la langue du site. */
function adepa_cf_rdv_date_fr(DateTimeInterface $d) {
	$jours  = array(1 => 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche');
	$courts = array(1 => 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.');
	$mois   = array(1 => 'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre');
	$mc     = array(1 => 'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.');
	$n = (int) $d->format('N');
	$m = (int) $d->format('n');
	$j = (int) $d->format('j');
	$jj = $j === 1 ? '1er' : (string) $j;
	return array(
		'long'  => $jours[$n] . ' ' . $jj . ' ' . $mois[$m] . ' ' . $d->format('Y'),
		'moyen' => $jours[$n] . ' ' . $jj . ' ' . $mois[$m],
		'jour'  => $courts[$n],
		'num'   => (string) $j,
		'mois'  => $mc[$m],
	);
}

/** Le premier et le dernier instant réservables. */
function adepa_cf_rdv_fenetre($reg) {
	$tz    = adepa_cf_rdv_fuseau();
	$min   = time() + $reg['delai_h'] * HOUR_IN_SECONDS;
	$fin   = (new DateTimeImmutable('today', $tz))->modify('+' . ($reg['horizon_j'] + 1) . ' days')->getTimestamp();
	return array($min, $fin);
}

/**
 * Les jours et créneaux libres, pour le navigateur.
 * [ { date, long, moyen, jour, num, mois, creneaux: [ { t, h, fin } ] } ]
 */
function adepa_cf_rdv_disponibles() {
	$reg    = adepa_cf_rdv_reglages();
	$tz     = adepa_cf_rdv_fuseau();
	$fermes = adepa_cf_rdv_jours_fermes($reg['fermes']);
	list($min, $fin) = adepa_cf_rdv_fenetre($reg);
	$occ    = adepa_cf_rdv_occupes(time() - DAY_IN_SECONDS, $fin + DAY_IN_SECONDS);

	// Rendez-vous pris par jour (plafond quotidien).
	$par_jour = array();
	foreach (array_keys($occ) as $t) {
		$k = (new DateTimeImmutable('@' . $t))->setTimezone($tz)->format('Y-m-d');
		$par_jour[$k] = ($par_jour[$k] ?? 0) + 1;
	}

	$jours = array();
	$jour  = new DateTimeImmutable('today', $tz);
	for ($i = 0; $i <= $reg['horizon_j']; $i++, $jour = $jour->modify('+1 day')) {
		$date = $jour->format('Y-m-d');
		if (isset($fermes[$date]) || ($par_jour[$date] ?? 0) >= $reg['max_jour']) {
			continue;
		}
		$creneaux = array();
		foreach (adepa_cf_rdv_creneaux_theoriques($jour, $reg) as $t) {
			if ($t < $min || $t >= $fin || isset($occ[$t])) {
				continue;
			}
			$d = (new DateTimeImmutable('@' . $t))->setTimezone($tz);
			$creneaux[] = array(
				't'   => $t,
				'h'   => $d->format('H:i'),
				'fin' => $d->modify('+' . ADEPA_CF_RDV_DUREE . ' minutes')->format('H:i'),
			);
		}
		if (!$creneaux) {
			continue;
		}
		$jours[] = array_merge(array('date' => $date), adepa_cf_rdv_date_fr($jour), array('creneaux' => $creneaux));
	}
	return $jours;
}

/**
 * La revérification AU MOMENT D'ENREGISTRER (sous verrou).
 * Renvoie '' si le créneau est réservable, sinon « hors », « complet » ou « pris ».
 */
function adepa_cf_rdv_verifier($t) {
	$reg = adepa_cf_rdv_reglages();
	$tz  = adepa_cf_rdv_fuseau();
	list($min, $fin) = adepa_cf_rdv_fenetre($reg);
	if ($t < $min || $t >= $fin) {
		return 'hors';
	}
	$d    = (new DateTimeImmutable('@' . $t))->setTimezone($tz);
	$jour = new DateTimeImmutable($d->format('Y-m-d'), $tz);
	if (isset(adepa_cf_rdv_jours_fermes($reg['fermes'])[$jour->format('Y-m-d')])) {
		return 'hors';
	}
	if (!in_array($t, adepa_cf_rdv_creneaux_theoriques($jour, $reg), true)) {
		return 'hors';
	}
	$occ = adepa_cf_rdv_occupes($jour->getTimestamp(), $jour->modify('+1 day')->getTimestamp() - 1);
	if (isset($occ[$t])) {
		return 'pris';
	}
	if (count($occ) >= $reg['max_jour']) {
		return 'complet';
	}
	return '';
}

/* ------------------------------------------------------------------ verrou */

/**
 * Un verrou par JOURNÉE : une ligne dans wp_options créée par INSERT IGNORE.
 * La clé primaire unique sur option_name fait de l'insertion une opération
 * atomique : une seule requête à la fois obtient la ligne.
 * (add_option() fait « INSERT … ON DUPLICATE KEY UPDATE » : pas un verrou.)
 */
function adepa_cf_rdv_verrouiller($cle) {
	global $wpdb;
	$nom = 'adepa_cf_rdv_verrou_' . $cle;
	for ($i = 0; $i < 25; $i++) {
		$n = $wpdb->query($wpdb->prepare("INSERT IGNORE INTO {$wpdb->options} (option_name, option_value, autoload) VALUES (%s, %s, 'no')", $nom, (string) time()));
		if ((int) $n === 1) {
			return $nom;
		}
		// Verrou abandonné par une requête interrompue : au-delà de 30 s, on le lève.
		$depuis = (int) $wpdb->get_var($wpdb->prepare("SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", $nom));
		if ($depuis && time() - $depuis > 30) {
			$wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->options} WHERE option_name = %s AND option_value = %s", $nom, (string) $depuis));
			continue;
		}
		usleep(200000);
	}
	return false;
}

function adepa_cf_rdv_deverrouiller($nom) {
	global $wpdb;
	if ($nom) {
		$wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->options} WHERE option_name = %s", $nom));
		wp_cache_delete($nom, 'options');
	}
}

/* --------------------------------------------------------- réponses ajax */

/** Ni LiteSpeed, ni un CDN, ni le navigateur ne gardent ces réponses. */
function adepa_cf_rdv_sans_cache() {
	if (!headers_sent()) {
		nocache_headers();
		header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0', true);
		header('X-LiteSpeed-Cache-Control: no-cache');
	}
	do_action('litespeed_control_set_nocache', 'prise de rendez-vous ADéPA');
}

function adepa_cf_rdv_json($donnees) {
	adepa_cf_rdv_sans_cache();
	wp_send_json($donnees);
}

function adepa_cf_rdv_contact_txt() {
	$o = adepa_cf_organisme();
	return 'écrivez-nous à ' . $o['email'] . ' ou appelez le ' . $o['telephone'];
}

foreach (array('creneaux', 'reserver', 'voir', 'annuler') as $adepa_cf_rdv_action) {
	add_action('wp_ajax_nopriv_adepa_cf_rdv_' . $adepa_cf_rdv_action, 'adepa_cf_rdv_ajax_' . $adepa_cf_rdv_action);
	add_action('wp_ajax_adepa_cf_rdv_' . $adepa_cf_rdv_action, 'adepa_cf_rdv_ajax_' . $adepa_cf_rdv_action);
}
unset($adepa_cf_rdv_action);

function adepa_cf_rdv_ajax_creneaux() {
	adepa_cf_rdv_json(array(
		'ok'    => true,
		't'     => time(),
		'jours' => adepa_cf_rdv_disponibles(),
	));
}

/** Ce que la personne voit de son rendez-vous (écran de confirmation, page d'annulation). */
function adepa_cf_rdv_resume($id) {
	$t      = (int) get_post_meta($id, '_ar_debut', true);
	$d      = (new DateTimeImmutable('@' . $t))->setTimezone(adepa_cf_rdv_fuseau());
	$motifs = adepa_cf_rdv_motifs();
	$modes  = adepa_cf_rdv_modes();
	$motif  = (string) get_post_meta($id, '_ar_motif', true);
	$mode   = (string) get_post_meta($id, '_ar_mode', true);
	$statut = (string) get_post_meta($id, '_ar_statut', true);
	return array(
		'date'        => adepa_cf_rdv_date_fr($d)['long'],
		'heure'       => $d->format('H:i'),
		'fin'         => $d->modify('+' . ADEPA_CF_RDV_DUREE . ' minutes')->format('H:i'),
		'motif'       => $motifs[$motif][0] ?? $motif,
		'mode'        => $modes[$mode][0] ?? $mode,
		'mode_detail' => $mode === 'telephone'
			? 'Nous vous appelons au ' . get_post_meta($id, '_ar_telephone', true) . '.'
			: ($modes[$mode][1] ?? ''),
		'statut'      => $statut,
		'annule'      => adepa_cf_rdv_libere($statut),
		'passe'       => $t <= time(),
	);
}

function adepa_cf_rdv_ajax_reserver() {
	if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
		adepa_cf_rdv_json(array('ok' => false, 'message' => 'Requête invalide.'));
	}
	$motifs = adepa_cf_rdv_motifs();
	$modes  = adepa_cf_rdv_modes();
	$d = array(
		'nom'       => sanitize_text_field(wp_unslash($_POST['nom'] ?? '')),
		'email'     => sanitize_email(wp_unslash($_POST['email'] ?? '')),
		'telephone' => sanitize_text_field(wp_unslash($_POST['telephone'] ?? '')),
		'motif'     => sanitize_key(wp_unslash($_POST['motif'] ?? '')),
		'mode'      => sanitize_key(wp_unslash($_POST['mode'] ?? '')),
		'message'   => sanitize_textarea_field(wp_unslash($_POST['message'] ?? '')),
	);
	$t = absint($_POST['creneau'] ?? 0);

	// Robot : champ piège rempli, ou parcours complet en moins de trois secondes
	// (« t0 » est l'heure du serveur au chargement des créneaux). On lui répond
	// comme si tout allait bien, sans rien enregistrer ni envoyer.
	if (!empty($_POST['site_web']) || (time() - (int) ($_POST['t0'] ?? 0)) < 3) {
		adepa_cf_rdv_json(array('ok' => true, 'rdv' => array(
			'date' => '', 'heure' => '', 'fin' => '', 'motif' => $motifs[$d['motif']][0] ?? '', 'mode' => '', 'mode_detail' => '',
		), 'email' => $d['email'], 'mail' => true, 'ics' => ''));
	}

	// Plafond : huit tentatives par heure et par adresse.
	$ip  = isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'])) : '';
	$cle = 'adepa_cf_rdv_' . md5($ip . wp_salt());
	$n   = (int) get_transient($cle);
	if ($n >= 8) {
		adepa_cf_rdv_json(array('ok' => false, 'code' => 'plafond', 'message' => 'Trop de demandes depuis cette connexion. Réessayez dans une heure, ou ' . adepa_cf_rdv_contact_txt() . '.'));
	}
	set_transient($cle, $n + 1, HOUR_IN_SECONDS);

	$chiffres = preg_replace('/\D/', '', $d['telephone']);
	if ($d['nom'] === '' || mb_strlen($d['nom']) > 120 || !is_email($d['email']) || !isset($motifs[$d['motif']]) || !isset($modes[$d['mode']])
		|| ($d['mode'] === 'telephone' && strlen($chiffres) < 9) || ($d['telephone'] !== '' && strlen($chiffres) < 9) || mb_strlen($d['message']) > 2000 || !$t) {
		adepa_cf_rdv_json(array('ok' => false, 'code' => 'champs', 'message' => 'Vérifiez les champs obligatoires : prénom et nom, e-mail valide, et un numéro de téléphone si nous devons vous appeler.'));
	}

	$tz     = adepa_cf_rdv_fuseau();
	$debut  = (new DateTimeImmutable('@' . $t))->setTimezone($tz);
	$verrou = adepa_cf_rdv_verrouiller($debut->format('Ymd'));
	if (!$verrou) {
		adepa_cf_rdv_json(array('ok' => false, 'code' => 'occupe', 'message' => 'Le service est très sollicité. Réessayez dans un instant.'));
	}

	$probleme = adepa_cf_rdv_verifier($t);
	if ($probleme !== '') {
		adepa_cf_rdv_deverrouiller($verrou);
		$messages = array(
			'pris'    => 'Ce créneau vient d’être réservé par quelqu’un d’autre. Voici les créneaux encore libres : choisissez-en un autre.',
			'complet' => 'Cette journée vient d’être complète. Voici les créneaux encore libres : choisissez un autre jour.',
			'hors'    => 'Ce créneau n’est plus disponible. Voici les créneaux encore libres.',
		);
		adepa_cf_rdv_json(array('ok' => false, 'code' => 'pris', 'message' => $messages[$probleme]));
	}

	$jeton = bin2hex(random_bytes(20));
	$id = wp_insert_post(array(
		'post_type'   => ADEPA_CF_RDV,
		'post_status' => 'private',
		'post_title'  => $debut->format('d/m/Y H:i') . ' · ' . $d['nom'],
		'meta_input'  => array(
			'_ar_debut'     => $t,
			'_ar_jour'      => $debut->format('Y-m-d'),
			'_ar_heure'     => $debut->format('H:i'),
			'_ar_nom'       => $d['nom'],
			'_ar_email'     => $d['email'],
			'_ar_telephone' => $d['telephone'],
			'_ar_motif'     => $d['motif'],
			'_ar_mode'      => $d['mode'],
			'_ar_message'   => $d['message'],
			'_ar_statut'    => 'confirme',
			// Seule l'EMPREINTE du jeton est gardée : la base ne permet pas d'annuler.
			'_ar_jeton'     => hash('sha256', $jeton),
			'_ar_origine'   => esc_url_raw(wp_unslash($_POST['origine'] ?? '')),
		),
	), true);
	adepa_cf_rdv_deverrouiller($verrou);
	if (is_wp_error($id) || !$id) {
		adepa_cf_rdv_json(array('ok' => false, 'code' => 'erreur', 'message' => 'Le rendez-vous n’a pas pu être enregistré. Réessayez, ou ' . adepa_cf_rdv_contact_txt() . '.'));
	}

	adepa_cf_rdv_mail_association($id, 'nouveau');
	$envoye = adepa_cf_rdv_mail_personne($id, $jeton);
	update_post_meta($id, '_ar_mail_envoye', $envoye ? '1' : '0');

	adepa_cf_rdv_json(array(
		'ok'    => true,
		'rdv'   => adepa_cf_rdv_resume($id),
		'email' => $d['email'],
		'mail'  => (bool) $envoye,
		'ics'   => adepa_cf_rdv_ics($id),
	));
}

/** Le rendez-vous désigné par un lien d'annulation, ou null. */
function adepa_cf_rdv_par_jeton() {
	$id    = absint($_POST['id'] ?? 0);
	$jeton = preg_replace('/[^a-f0-9]/', '', (string) wp_unslash($_POST['jeton'] ?? ''));
	if (!$id || strlen($jeton) < 32 || get_post_type($id) !== ADEPA_CF_RDV) {
		return null;
	}
	$empreinte = (string) get_post_meta($id, '_ar_jeton', true);
	return ($empreinte !== '' && hash_equals($empreinte, hash('sha256', $jeton))) ? $id : null;
}

function adepa_cf_rdv_ajax_voir() {
	$id = adepa_cf_rdv_par_jeton();
	if (!$id) {
		adepa_cf_rdv_json(array('ok' => false, 'message' => 'Ce lien d’annulation n’est pas valide. Pour toute question, ' . adepa_cf_rdv_contact_txt() . '.'));
	}
	adepa_cf_rdv_json(array('ok' => true, 'rdv' => adepa_cf_rdv_resume($id)));
}

function adepa_cf_rdv_ajax_annuler() {
	if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
		adepa_cf_rdv_json(array('ok' => false, 'message' => 'Requête invalide.'));
	}
	$id = adepa_cf_rdv_par_jeton();
	if (!$id) {
		adepa_cf_rdv_json(array('ok' => false, 'message' => 'Ce lien d’annulation n’est pas valide. Pour toute question, ' . adepa_cf_rdv_contact_txt() . '.'));
	}
	$r = adepa_cf_rdv_resume($id);
	if ($r['annule']) {
		adepa_cf_rdv_json(array('ok' => true, 'deja' => true, 'rdv' => $r));
	}
	if ($r['passe']) {
		adepa_cf_rdv_json(array('ok' => false, 'message' => 'Ce rendez-vous est déjà passé : il ne peut plus être annulé en ligne.'));
	}
	update_post_meta($id, '_ar_statut', 'annule');
	update_post_meta($id, '_ar_annule_le', time());
	adepa_cf_rdv_mail_association($id, 'annulation');
	adepa_cf_rdv_json(array('ok' => true, 'rdv' => adepa_cf_rdv_resume($id)));
}

/* ------------------------------------------------------------------ e-mails */

function adepa_cf_rdv_lien_annulation($id, $jeton) {
	return add_query_arg(array('annuler' => $id, 'jeton' => $jeton), adepa_cf_url_page('prendre-rendez-vous'));
}

function adepa_cf_rdv_mail_association($id, $quoi) {
	$o = adepa_cf_organisme();
	$r = adepa_cf_rdv_resume($id);
	$m = function ($k) use ($id) {
		return (string) get_post_meta($id, '_ar_' . $k, true);
	};
	if ($quoi === 'annulation') {
		$sujet = 'Rendez-vous annulé : ' . $r['date'] . ' à ' . $r['heure'];
		$corps = "Un rendez-vous pris sur adepa77.fr vient d'être annulé par la personne. Le créneau est de nouveau proposé en ligne.\n\n";
	} else {
		$sujet = 'Nouveau rendez-vous : ' . $r['date'] . ' à ' . $r['heure'] . ' (' . $r['motif'] . ')';
		$corps = "Un rendez-vous vient d'être pris sur adepa77.fr.\n\n";
	}
	$corps .= 'Date : ' . $r['date'] . "\n";
	$corps .= 'Heure : ' . $r['heure'] . ' à ' . $r['fin'] . " (heure de Paris, 20 minutes)\n";
	$corps .= 'Motif : ' . $r['motif'] . "\n";
	$corps .= 'Mode : ' . $r['mode'] . "\n";
	$corps .= 'Nom : ' . $m('nom') . "\n";
	$corps .= 'E-mail : ' . $m('email') . "\n";
	if ($m('telephone') !== '') {
		$corps .= 'Téléphone : ' . $m('telephone') . "\n";
	}
	if ($m('message') !== '') {
		$corps .= "Message :\n" . $m('message') . "\n";
	}
	if ($quoi !== 'annulation') {
		$corps .= "\n" . ($m('mode') === 'visio'
			? "À faire : envoyer le lien de la visio à la personne avant le rendez-vous (elle l'attend par e-mail).\n"
			: "À faire : appeler la personne au numéro indiqué, à l'heure du rendez-vous.\n");
	}
	$corps .= "\nRetrouver le rendez-vous : " . admin_url('post.php?post=' . $id . '&action=edit') . "\n";
	return wp_mail($o['email'], $sujet, $corps, array('Reply-To: ' . $m('nom') . ' <' . $m('email') . '>'));
}

function adepa_cf_rdv_mail_personne($id, $jeton) {
	$o = adepa_cf_organisme();
	$r = adepa_cf_rdv_resume($id);
	$email = (string) get_post_meta($id, '_ar_email', true);
	$corps  = 'Bonjour ' . get_post_meta($id, '_ar_nom', true) . ",\n\n";
	$corps .= "Votre rendez-vous avec l'association ADéPA est enregistré.\n\n";
	$corps .= 'Date : ' . $r['date'] . "\n";
	$corps .= 'Heure : ' . $r['heure'] . ' à ' . $r['fin'] . " (heure de Paris)\n";
	$corps .= 'Motif : ' . $r['motif'] . "\n";
	$corps .= 'Mode : ' . $r['mode'] . '. ' . $r['mode_detail'] . "\n\n";
	$corps .= "L'invitation pour votre agenda est jointe à ce message (fichier .ics).\n\n";
	$corps .= "Un empêchement ? Vous pouvez annuler ce rendez-vous en ligne. Le lien ouvre une page où vous confirmez l'annulation :\n";
	$corps .= adepa_cf_rdv_lien_annulation($id, $jeton) . "\n\n";
	$corps .= 'Pour toute question : ' . $o['email'] . ' ou ' . $o['telephone'] . ".\n\n";
	$corps .= "À bientôt,\nL'équipe d'ADéPA\nOrganisme de formation certifié Qualiopi\n" . $o['siege'] . "\n" . home_url('/') . "\n";

	// La pièce jointe passe par un fichier : certaines extensions d'envoi
	// (Brevo, SMTP) remplacent wp_mail() et n'acceptent que des chemins.
	$dossier = trailingslashit(get_temp_dir()) . 'adepa-rdv-' . wp_generate_password(12, false, false);
	$fichier = $dossier . '/rendez-vous-adepa.ics';
	$pj = array();
	if (wp_mkdir_p($dossier) && file_put_contents($fichier, adepa_cf_rdv_ics($id)) !== false) {
		$pj[] = $fichier;
	}
	$ok = wp_mail($email, 'Votre rendez-vous avec ADéPA le ' . $r['date'] . ' à ' . $r['heure'], $corps, array('Reply-To: ADéPA <' . $o['email'] . '>'), $pj);
	if ($pj) {
		@unlink($fichier); // phpcs:ignore
	}
	@rmdir($dossier); // phpcs:ignore
	return $ok;
}

/* ------------------------------------------------------------ fichier .ics */

function adepa_cf_rdv_ics_texte($s) {
	return str_replace(array('\\', ';', ',', "\r\n", "\n"), array('\\\\', '\;', '\,', '\n', '\n'), (string) $s);
}

/** Replie une ligne à 75 octets sans couper un caractère UTF-8 (RFC 5545, 3.1). */
function adepa_cf_rdv_ics_plier($ligne) {
	$sortie = '';
	$max    = 75;
	while (strlen($ligne) > $max) {
		$morceau = mb_strcut($ligne, 0, $max, 'UTF-8');
		$sortie .= $morceau . "\r\n ";
		$ligne   = substr($ligne, strlen($morceau));
		$max     = 74; // la ligne suivante commence par une espace
	}
	return $sortie . $ligne;
}

function adepa_cf_rdv_ics($id) {
	$debut  = (int) get_post_meta($id, '_ar_debut', true);
	$fin    = $debut + ADEPA_CF_RDV_DUREE * 60;
	$r      = adepa_cf_rdv_resume($id);
	$o      = adepa_cf_organisme();
	$hote   = (string) wp_parse_url(home_url(), PHP_URL_HOST);
	$fmt    = 'Ymd\THis\Z';
	$cree   = (int) get_post_time('U', true, $id);
	$desc   = 'Motif : ' . $r['motif'] . "\nMode : " . $r['mode'] . '. ' . $r['mode_detail'] . "\nContact : " . $o['email'] . ', ' . $o['telephone'];
	$lignes = array(
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//ADePA//Prise de rendez-vous//FR',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'BEGIN:VEVENT',
		// UID stable : le même rendez-vous garde le même identifiant.
		'UID:rdv-' . $id . '-' . $debut . '@' . $hote,
		'DTSTAMP:' . gmdate($fmt, $cree ?: time()),
		'DTSTART:' . gmdate($fmt, $debut),
		'DTEND:' . gmdate($fmt, $fin),
		'SUMMARY:' . adepa_cf_rdv_ics_texte('Rendez-vous ADéPA (20 min)'),
		'DESCRIPTION:' . adepa_cf_rdv_ics_texte($desc),
		'LOCATION:' . adepa_cf_rdv_ics_texte($r['mode']),
		'STATUS:CONFIRMED',
		'TRANSP:OPAQUE',
		'END:VEVENT',
		'END:VCALENDAR',
	);
	return implode("\r\n", array_map('adepa_cf_rdv_ics_plier', $lignes)) . "\r\n";
}

/* ------------------------------------------------------------------- page */

function adepa_cf_rdv_creer_page() {
	if (get_page_by_path('prendre-rendez-vous')) {
		return 0;
	}
	$id = wp_insert_post(array(
		'post_type'    => 'page',
		'post_status'  => 'publish',
		'post_title'   => 'Prendre rendez-vous',
		'post_name'    => 'prendre-rendez-vous',
		'post_content' => '[adepa_rdv]',
	));
	if ($id && !is_wp_error($id)) {
		update_post_meta($id, 'site-post-title', 'disabled');
		update_post_meta($id, 'ast-site-content-layout', 'full-width-container');
		update_post_meta($id, 'site-content-style', 'unboxed');
		update_post_meta($id, 'site-sidebar-layout', 'no-sidebar');
		return (int) $id;
	}
	return 0;
}

/** Le lien d'annulation ne doit être ni indexé ni mis en cache. */
add_filter('wp_robots', function ($robots) {
	if (isset($_GET['annuler']) && is_singular()) { // phpcs:ignore
		$robots['noindex'] = true;
		$robots['nofollow'] = true;
	}
	return $robots;
});
add_action('template_redirect', function () {
	if (isset($_GET['annuler'], $_GET['jeton']) && is_singular()) { // phpcs:ignore
		$p = get_post();
		if ($p && has_shortcode((string) $p->post_content, 'adepa_rdv')) {
			adepa_cf_rdv_sans_cache();
		}
	}
});

function adepa_cf_rdv_icone($nom) {
	$i = array(
		'bilan'     => '<path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><rect x="3.5" y="7" width="17" height="12.5" rx="2"/><path d="M3.5 12.5h17"/>',
		'equipe'    => '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.6-3.2 2.7-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="16.5" cy="9.5" r="2.3"/><path d="M15.5 14.2c2.5-.3 4.4 1.2 5 4.3"/>',
		'gratuit'   => '<rect x="4" y="4.5" width="16" height="11" rx="1.5"/><path d="M8.5 19.5h7M12 15.5v4"/><path d="M10.5 8.2l3.5 2-3.5 2z"/>',
		'autre'     => '<path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-7l-4.5 3.5v-3.5H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5z"/><path d="M9.8 9.6a2.2 2.2 0 1 1 3 2c-.6.3-.8.7-.8 1.3M12 14.6v.1"/>',
		'horloge'   => '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
		'telephone' => '<path d="M6.5 3.8h2.8l1.4 4.1-2 1.4a11 11 0 0 0 6 6l1.4-2 4.1 1.4v2.8a1.9 1.9 0 0 1-2.1 1.9A15.8 15.8 0 0 1 4.6 5.9 1.9 1.9 0 0 1 6.5 3.8z"/>',
		'calendrier'=> '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
		'etiquette' => '<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1 1 0 0 1 0 1.4l-7.3 7.3a1 1 0 0 1-1.4 0z"/><circle cx="8" cy="8" r="1.4"/>',
		'ok'        => '<circle cx="12" cy="12" r="9"/><path d="M7.8 12.4l2.9 2.9 5.6-6"/>',
	);
	return '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' . ($i[$nom] ?? '') . '</svg>';
}

add_shortcode('adepa_rdv', 'adepa_cf_rdv_shortcode');

function adepa_cf_rdv_shortcode($a) {
	$a = shortcode_atts(array('motif' => ''), $a, 'adepa_rdv');
	wp_enqueue_style('adepa-cf');
	wp_enqueue_style('adepa-cf-rdv');
	wp_enqueue_script('adepa-cf-rdv');

	$o      = adepa_cf_organisme();
	$motifs = adepa_cf_rdv_motifs();
	$modes  = adepa_cf_rdv_modes();
	$motif  = isset($motifs[$a['motif']]) ? $a['motif'] : '';
	$get    = isset($_GET['motif']) ? sanitize_key(wp_unslash($_GET['motif'])) : ''; // phpcs:ignore
	if (isset($motifs[$get])) {
		$motif = $get;
	}
	$ajax  = admin_url('admin-ajax.php');
	$contact = '<a href="mailto:' . esc_attr($o['email']) . '">' . esc_html($o['email']) . '</a> ou au <a href="tel:' . esc_attr(preg_replace('/[^0-9+]/', '', $o['telephone'])) . '">' . esc_html($o['telephone']) . '</a>';

	/* ---- la page d'annulation (lien reçu par e-mail) ---- */
	if (isset($_GET['annuler'], $_GET['jeton'])) { // phpcs:ignore
		$id    = absint($_GET['annuler']); // phpcs:ignore
		$jeton = preg_replace('/[^a-f0-9]/', '', (string) wp_unslash($_GET['jeton'])); // phpcs:ignore
		ob_start();
		?>
		<div class="afc afc-rdv" id="afc-rdv" data-vue="annulation" data-ajax="<?php echo esc_url($ajax); ?>" data-id="<?php echo (int) $id; ?>" data-jeton="<?php echo esc_attr($jeton); ?>">
			<header class="afc-rdv__tete">
				<p class="afc-surtitre">Centre de formation ADéPA</p>
				<h1 class="afc-h1 afc-rdv__titre">Annuler un rendez-vous</h1>
			</header>
			<div class="afc-rdv__carte afc-rdv__carte--seule">
				<div class="afc-rdv__corps">
					<div class="afc-rdv__annul" aria-live="polite">
						<p class="afc-rdv__charge">Recherche du rendez-vous…</p>
					</div>
					<noscript><p>L’annulation en ligne a besoin de JavaScript. Vous pouvez aussi nous prévenir à <?php echo $contact; // phpcs:ignore ?>.</p></noscript>
				</div>
			</div>
		</div>
		<?php
		return ob_get_clean();
	}

	/* ---- la prise de rendez-vous ---- */
	ob_start();
	?>
	<div class="afc afc-rdv" id="afc-rdv" data-vue="reserver" data-ajax="<?php echo esc_url($ajax); ?>" data-motif="<?php echo esc_attr($motif); ?>">
		<header class="afc-rdv__tete">
			<p class="afc-surtitre">Centre de formation ADéPA · Melun, Seine-et-Marne</p>
			<h1 class="afc-h1 afc-rdv__titre">Prendre rendez-vous</h1>
			<p class="afc-chapo afc-rdv__chapo">Un échange de 20 minutes avec l’équipe d’ADéPA, par téléphone ou en visio, pour parler de votre projet. Choisissez l’objet, puis le jour et l’heure qui vous conviennent.</p>
		</header>

		<div class="afc-rdv__carte">
			<aside class="afc-rdv__resume" aria-label="Votre rendez-vous">
				<p class="afc-rdv__org">Association ADéPA<br><span>Organisme de formation certifié Qualiopi</span></p>
				<h2 class="afc-rdv__resume-titre">Échange de 20 minutes</h2>
				<ul class="afc-rdv__infos">
					<li><?php echo adepa_cf_rdv_icone('horloge'); // phpcs:ignore ?><span>20 minutes</span></li>
					<li><?php echo adepa_cf_rdv_icone('telephone'); // phpcs:ignore ?><span data-info="mode">Téléphone ou visio</span></li>
					<li data-info-ligne="motif" hidden><?php echo adepa_cf_rdv_icone('etiquette'); // phpcs:ignore ?><span data-info="motif"></span></li>
					<li data-info-ligne="date" hidden><?php echo adepa_cf_rdv_icone('calendrier'); // phpcs:ignore ?><span data-info="date"></span></li>
				</ul>
				<p class="afc-rdv__fuseau">Horaires à l’heure de Paris.</p>
			</aside>

			<div class="afc-rdv__corps">
				<ol class="afc-rdv__fil">
					<li data-pas="1" aria-current="step"><span aria-hidden="true">1</span>Objet</li>
					<li data-pas="2"><span aria-hidden="true">2</span>Date et heure</li>
					<li data-pas="3"><span aria-hidden="true">3</span>Coordonnées</li>
				</ol>

				<p class="afc-rdv__alerte" role="alert" hidden></p>

				<section class="afc-rdv__etape" data-etape="1" aria-labelledby="afc-rdv-e1">
					<h2 class="afc-rdv__h" id="afc-rdv-e1" tabindex="-1">Quel est l’objet du rendez-vous&nbsp;?</h2>
					<div class="afc-rdv__motifs" role="group" aria-labelledby="afc-rdv-e1">
						<?php foreach ($motifs as $k => $m) : ?>
						<button type="button" class="afc-rdv__motif" data-motif="<?php echo esc_attr($k); ?>" aria-pressed="<?php echo $k === $motif ? 'true' : 'false'; ?>">
							<?php echo adepa_cf_rdv_icone($k); // phpcs:ignore ?>
							<strong><?php echo esc_html($m[0]); ?></strong>
							<small><?php echo esc_html($m[1]); ?></small>
						</button>
						<?php endforeach; ?>
					</div>
				</section>

				<section class="afc-rdv__etape" data-etape="2" aria-labelledby="afc-rdv-e2" hidden>
					<button type="button" class="afc-rdv__retour" data-aller="1"><span aria-hidden="true">←</span> Changer l’objet</button>
					<h2 class="afc-rdv__h" id="afc-rdv-e2" tabindex="-1">Choisissez un jour</h2>
					<p class="afc-rdv__charge" aria-live="polite">Chargement des créneaux…</p>
					<div class="afc-rdv__jours-cadre" hidden>
						<button type="button" class="afc-rdv__defile afc-rdv__defile--g" data-defile="-1" aria-label="Jours précédents"><span aria-hidden="true">‹</span></button>
						<div class="afc-rdv__jours" role="group" aria-labelledby="afc-rdv-e2"></div>
						<button type="button" class="afc-rdv__defile afc-rdv__defile--d" data-defile="1" aria-label="Jours suivants"><span aria-hidden="true">›</span></button>
					</div>
					<h3 class="afc-rdv__h3" id="afc-rdv-e2h" hidden>Choisissez une heure <span></span></h3>
					<div class="afc-rdv__heures" role="group" aria-labelledby="afc-rdv-e2h"></div>
					<button type="button" class="afc-rdv__suite" data-aller="3" hidden disabled>Continuer</button>
				</section>

				<section class="afc-rdv__etape" data-etape="3" aria-labelledby="afc-rdv-e3" hidden>
					<button type="button" class="afc-rdv__retour" data-aller="2"><span aria-hidden="true">←</span> Changer la date ou l’heure</button>
					<h2 class="afc-rdv__h" id="afc-rdv-e3" tabindex="-1">Vos coordonnées</h2>
					<p class="afc-rdv__rappel"></p>
					<form class="afc-rdv__form" novalidate>
						<p class="afc-piege" aria-hidden="true"><label>Site web <input type="text" name="site_web" tabindex="-1" autocomplete="off"></label></p>
						<div class="afc-rdv__champ">
							<label for="afc-rdv-nom">Prénom et nom <span aria-hidden="true">*</span></label>
							<input type="text" id="afc-rdv-nom" name="nom" required maxlength="120" autocomplete="name" aria-describedby="afc-rdv-nom-err">
							<p class="afc-rdv__err" id="afc-rdv-nom-err" hidden></p>
						</div>
						<div class="afc-rdv__ligne">
							<div class="afc-rdv__champ">
								<label for="afc-rdv-email">E-mail <span aria-hidden="true">*</span></label>
								<input type="email" id="afc-rdv-email" name="email" required maxlength="160" autocomplete="email" aria-describedby="afc-rdv-email-err">
								<p class="afc-rdv__err" id="afc-rdv-email-err" hidden></p>
							</div>
							<div class="afc-rdv__champ">
								<label for="afc-rdv-tel">Téléphone <span class="afc-rdv__oblig" aria-hidden="true">*</span></label>
								<input type="tel" id="afc-rdv-tel" name="telephone" maxlength="30" autocomplete="tel" aria-describedby="afc-rdv-tel-aide afc-rdv-tel-err" required>
								<p class="afc-rdv__aide" id="afc-rdv-tel-aide">Obligatoire pour un rendez-vous par téléphone.</p>
								<p class="afc-rdv__err" id="afc-rdv-tel-err" hidden></p>
							</div>
						</div>
						<fieldset class="afc-rdv__modes">
							<legend>Comment souhaitez-vous échanger&nbsp;? <span aria-hidden="true">*</span></legend>
							<?php $premier = true; foreach ($modes as $k => $m) : ?>
							<label class="afc-rdv__mode">
								<input type="radio" name="mode" value="<?php echo esc_attr($k); ?>"<?php echo $premier ? ' checked' : ''; ?>>
								<span><strong><?php echo esc_html($m[0]); ?></strong><small><?php echo esc_html($m[1]); ?></small></span>
							</label>
							<?php $premier = false; endforeach; ?>
						</fieldset>
						<div class="afc-rdv__champ">
							<label for="afc-rdv-msg">Votre message <span class="afc-rdv__facultatif">(facultatif)</span></label>
							<textarea id="afc-rdv-msg" name="message" rows="3" maxlength="2000" placeholder="Votre situation, vos questions…"></textarea>
						</div>
						<p class="afc-rdv__rgpd">Vos coordonnées servent uniquement à organiser ce rendez-vous. Elles ne sont ni cédées ni utilisées pour de la prospection. <a href="<?php echo esc_url(adepa_cf_url_page('confidentialites')); ?>">Politique de confidentialité</a>.</p>
						<p class="afc-rdv__erreur" role="alert" hidden></p>
						<button type="submit" class="afc-rdv__confirmer">Confirmer le rendez-vous</button>
					</form>
				</section>

				<section class="afc-rdv__etape afc-rdv__fin" data-etape="4" aria-labelledby="afc-rdv-e4" hidden>
					<span class="afc-rdv__ok"><?php echo adepa_cf_rdv_icone('ok'); // phpcs:ignore ?></span>
					<h2 class="afc-rdv__h" id="afc-rdv-e4" tabindex="-1">Votre rendez-vous est enregistré</h2>
					<dl class="afc-rdv__recap"></dl>
					<p class="afc-rdv__mailinfo"></p>
					<p><a class="afc-rdv__ics" href="#" download="rendez-vous-adepa.ics" hidden>Ajouter à mon agenda (.ics)</a></p>
				</section>

				<noscript><p class="afc-rdv__noscript">La prise de rendez-vous en ligne a besoin de JavaScript. Vous pouvez aussi nous écrire à <?php echo $contact; // phpcs:ignore ?>.</p></noscript>
			</div>
		</div>
		<p class="afc-rdv__autre">Vous préférez nous écrire ou nous appeler&nbsp;? <?php echo str_replace(' ou au ', ' ou ', $contact); // phpcs:ignore ?></p>
	</div>
	<?php
	return ob_get_clean();
}

/* ------------------------------------------------------- administration */

add_action('add_meta_boxes', function () {
	add_meta_box('adepa_cf_rdv', 'Le rendez-vous', 'adepa_cf_rdv_boite', ADEPA_CF_RDV, 'normal', 'high');
	add_meta_box('adepa_cf_rdv_statut', 'Statut', 'adepa_cf_rdv_boite_statut', ADEPA_CF_RDV, 'side', 'high');
});

function adepa_cf_rdv_boite($post) {
	$r = adepa_cf_rdv_resume($post->ID);
	$m = function ($k) use ($post) {
		return (string) get_post_meta($post->ID, '_ar_' . $k, true);
	};
	$lignes = array(
		'Créneau'   => esc_html($r['date'] . ', ' . $r['heure'] . ' à ' . $r['fin'] . ' (heure de Paris)'),
		'Motif'     => esc_html($r['motif']),
		'Mode'      => esc_html($r['mode']) . ($m('mode') === 'visio' ? ' <em>(envoyer le lien de la visio par e-mail avant le rendez-vous)</em>' : ''),
		'Nom'       => esc_html($m('nom')),
		'E-mail'    => '<a href="mailto:' . esc_attr($m('email')) . '">' . esc_html($m('email')) . '</a>',
		'Téléphone' => $m('telephone') !== '' ? '<a href="tel:' . esc_attr(preg_replace('/[^0-9+]/', '', $m('telephone'))) . '">' . esc_html($m('telephone')) . '</a>' : '',
		'Message'   => nl2br(esc_html($m('message'))),
		'Statut'    => esc_html(adepa_cf_rdv_statuts()[$r['statut']] ?? $r['statut']),
		'Réservé le' => esc_html(get_the_date('d/m/Y à H:i', $post)),
		'Annulé le' => $m('annule_le') !== '' ? esc_html(wp_date('d/m/Y à H:i', (int) $m('annule_le'))) : '',
		'E-mail de confirmation' => $m('mail_envoye') === '0' ? 'n’a pas pu partir : prévenez la personne' : ($m('mail_envoye') === '1' ? 'envoyé' : ''),
		'Page d’origine' => esc_html($m('origine')),
	);
	echo '<table class="widefat striped"><tbody>';
	foreach ($lignes as $lib => $v) {
		if ($v === '') {
			continue;
		}
		echo '<tr><th style="width:190px">' . esc_html($lib) . '</th><td>' . $v . '</td></tr>'; // phpcs:ignore
	}
	echo '</tbody></table>';
}

function adepa_cf_rdv_boite_statut($post) {
	wp_nonce_field('adepa_cf_rdv_statut', 'adepa_cf_rdv_nonce');
	$s = (string) get_post_meta($post->ID, '_ar_statut', true);
	echo '<p><label for="ar-statut" class="screen-reader-text">Statut</label><select id="ar-statut" name="ar_statut" style="width:100%">';
	foreach (adepa_cf_rdv_statuts() as $k => $lib) {
		echo '<option value="' . esc_attr($k) . '" ' . selected($s, $k, false) . '>' . esc_html($lib) . '</option>';
	}
	echo '</select></p><p class="description">Un rendez-vous annulé libère son créneau en ligne. Aucun e-mail ne part quand vous changez le statut ici : si vous annulez, prévenez la personne.</p>';
}

add_action('save_post_' . ADEPA_CF_RDV, function ($id) {
	if (!isset($_POST['adepa_cf_rdv_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['adepa_cf_rdv_nonce'])), 'adepa_cf_rdv_statut')) {
		return;
	}
	if ((defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) || !current_user_can('edit_post', $id)) {
		return;
	}
	$s = sanitize_key(wp_unslash($_POST['ar_statut'] ?? ''));
	if (isset(adepa_cf_rdv_statuts()[$s])) {
		$avant = (string) get_post_meta($id, '_ar_statut', true);
		update_post_meta($id, '_ar_statut', $s);
		if (adepa_cf_rdv_libere($s) && !adepa_cf_rdv_libere($avant)) {
			update_post_meta($id, '_ar_annule_le', time());
		}
	}
});

add_filter('manage_' . ADEPA_CF_RDV . '_posts_columns', function ($c) {
	return array(
		'cb'         => $c['cb'],
		'ar_creneau' => 'Créneau',
		'ar_nom'     => 'Nom',
		'ar_motif'   => 'Motif',
		'ar_mode'    => 'Mode',
		'ar_statut'  => 'Statut',
		'ar_recu'    => 'Réservé le',
	);
});
add_filter('list_table_primary_column', function ($col, $ecran) {
	return $ecran === 'edit-' . ADEPA_CF_RDV ? 'ar_creneau' : $col;
}, 10, 2);
add_action('manage_' . ADEPA_CF_RDV . '_posts_custom_column', function ($col, $id) {
	$r = adepa_cf_rdv_resume($id);
	switch ($col) {
		case 'ar_creneau':
			echo '<strong><a class="row-title" href="' . esc_url(get_edit_post_link($id)) . '">' . esc_html($r['date'] . ', ' . $r['heure']) . '</a></strong>';
			if ($r['passe'] && !$r['annule']) {
				echo '<br><small>passé</small>';
			}
			break;
		case 'ar_nom':
			echo esc_html(get_post_meta($id, '_ar_nom', true)) . '<br><small>' . esc_html(get_post_meta($id, '_ar_email', true)) . '</small>';
			break;
		case 'ar_motif':
			echo esc_html($r['motif']);
			break;
		case 'ar_mode':
			echo esc_html($r['mode']);
			if (get_post_meta($id, '_ar_telephone', true) !== '') {
				echo '<br><small>' . esc_html(get_post_meta($id, '_ar_telephone', true)) . '</small>';
			}
			break;
		case 'ar_recu':
			echo esc_html(get_the_date('d/m/Y à H:i', $id));
			break;
		case 'ar_statut':
			$lib = adepa_cf_rdv_statuts()[$r['statut']] ?? $r['statut'];
			echo $r['annule'] ? '<span style="color:#b32d2e">' . esc_html($lib) . '</span>' : esc_html($lib);
			break;
	}
}, 10, 2);
add_filter('manage_edit-' . ADEPA_CF_RDV . '_sortable_columns', function ($c) {
	$c['ar_creneau'] = 'ar_creneau';
	return $c;
});
/** La liste s'ordonne par créneau, le plus lointain en haut. */
add_action('pre_get_posts', function ($q) {
	if (!is_admin() || !$q->is_main_query() || $q->get('post_type') !== ADEPA_CF_RDV) {
		return;
	}
	$o = $q->get('orderby');
	if ($o === '' || $o === 'ar_creneau') {
		$q->set('meta_key', '_ar_debut');
		$q->set('orderby', 'meta_value_num');
		if (!$q->get('order') || $o === '') {
			$q->set('order', isset($_GET['order']) ? sanitize_key(wp_unslash($_GET['order'])) : 'DESC'); // phpcs:ignore
		}
	}
});
