<?php
/**
 * TOULALI N'EST PLUS UN ORGANISME DE FORMATION (décision du 28/09/2026).
 *
 * ADéPA est l'unique centre de formation ; toulali.fr devient la page
 * d'accueil de Pilote (pilote.toulali.fr), le logiciel des créateurs
 * d'activité. Sur adepa77.fr :
 *  - « Community manager » (menu) et « Découvrir Toulali » (centre de
 *    formation) mènent à la formation, via /community-manager/ ;
 *  - la carte Toulali de l'accueil présente le logiciel, plus une formation ;
 *  - le chatbot de l'accueil ne vend plus Toulali comme une formation.
 *
 * /community-manager/ est une redirection TEMPORAIRE vers l'école Teachizy :
 * l'adresse de l'école va changer (toulali.teachizy.fr), et un lien écrit en
 * dur dans Elementor casserait ce jour-là. Elle suit le réglage teachizy_base.
 */
if (!defined('ABSPATH')) {
	exit;
}

add_action('parse_request', function () {
	$chemin = trim((string) wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH), '/');
	if ($chemin !== 'community-manager') {
		return;
	}
	nocache_headers();
	// 1.4.8 : la formation Community Manager IA est offerte aux jeunes de Melun
	// Val de Seine par le studio A2PA ; c'est a2pa.fr qui explique l'accès et
	// renvoie au programme sur Teachizy (demande de Siham, 28/09/2026).
	wp_redirect('https://a2pa.fr/#seformer', 302, 'ADePA');
	exit;
}, 1);

/** Les remplacements, appliqués aux textes des widgets Elementor. Idempotents. */
function adepa_cf_toulali_regles() {
	$cm = 'https://adepa77.fr/community-manager/';
	return array(
		// Menu « Notre académie » de l'en-tête (bureau et mobile).
		'menu' => array(
			'#<a(\s+class="msub")?\s+href="https?://toulali\.fr/?"\s+target="_blank"\s+rel="noopener">\s*Community manager\s*</a>#u',
			'<a$1 href="' . $cm . '">Community manager</a>',
		),
		// Carte « Community Manager » de /centre-de-formation/.
		'centre' => array(
			'#<a class="ub ghost" href="https?://toulali\.fr/?"\s+target="_blank"\s+rel="noopener">\s*Découvrir Toulali\s*(→|&rarr;)\s*</a>#u',
			'<a class="ub ghost" href="' . $cm . '">Voir la formation →</a>',
		),
		// Carte Toulali de l'accueil : le logiciel, plus une formation.
		'carte' => array(
			'#(wm-tl">Toulali<i>\.</i></h3>)\s*<span class="tag">[^<]*</span>(\s*</div>)\s*<p>[^<]*community manager[^<]*</p>\s*<div class="sig">(?:\s*<span>[^<]*</span>)*\s*</div>#iu',
			'$1<span class="tag">Logiciel des créateurs d’activité</span>$2<p>Pilote accompagne les créateurs d’activité, de la création d’une association à celle d’une académie de formation, et réunit leur gestion au même endroit.</p><div class="sig"><span>Création d’association</span><span>Académie de formation</span><span>pilote.toulali.fr</span></div>',
		),
		// Chatbot : les trois réponses qui présentaient Toulali comme une formation.
		'bot-form' => array(
			'#<b>Toulali</b>\s*(—|&mdash;)\s*Community Manager,[^<]*?\.(?=<br>)#u',
			'<b>Community Manager</b> : la formation 100 % en ligne d’ADéPA, dès 190 €.',
		),
		'bot-lien' => array(
			"#\\{l:'Toulali',u:'https?://toulali\\.fr/?'\\}#u",
			"{l:'Community Manager',u:'" . $cm . "'}",
		),
		'bot-prix' => array(
			'#<b>Toulali</b> démarre à 190#u',
			'La formation <b>Community Manager</b> démarre à 190',
		),
		'bot-qui' => array(
			'#notre académie de formation, et Toulali\.#u',
			'notre académie de formation, et Toulali, le logiciel des créateurs d’activité.',
		),
	);
}

/** Parcourt une valeur Elementor décodée (objets conservés) et remplace dans les chaînes. */
function adepa_cf_toulali_parcourir(&$valeur, $regles, &$compte, $motif = 'toulali') {
	if (is_string($valeur)) {
		if ($motif !== '' && stripos($valeur, $motif) === false) {
			return;
		}
		foreach ($regles as $cle => $r) {
			$n = 0;
			$nouveau = preg_replace($r[0], $r[1], $valeur, -1, $n);
			if ($nouveau === null) {
				continue; // UTF-8 invalide : on ne touche à rien
			}
			$valeur = $nouveau;
			if ($n) {
				$compte[$cle] = ($compte[$cle] ?? 0) + $n;
			}
		}
		return;
	}
	if (is_array($valeur)) {
		foreach ($valeur as $k => &$v) {
			adepa_cf_toulali_parcourir($v, $regles, $compte, $motif);
		}
		unset($v);
		return;
	}
	if (is_object($valeur)) {
		foreach (get_object_vars($valeur) as $k => $v) {
			adepa_cf_toulali_parcourir($v, $regles, $compte, $motif);
			$valeur->$k = $v;
		}
	}
}

/** 1.4.5 : les promesses de l'accueil que le produit ne tient pas (audit du 28/09). */
function adepa_cf_regles_145() {
	return array(
		'verifie1' => array('#Profil vérifié, mission cadrée, bilan écrit\.#u', 'Mission cadrée, devis écrit, bilan écrit.'),
		'verifie2' => array('#nous vous présentons des profils vérifiés sous 7 jours#u', 'nous vous présentons des profils sous 7 jours'),
		'verifie3' => array('#des profils d\'intervenants vérifiés, avec#u', 'des profils d\'intervenants, avec'),
		'verifie4' => array('#>Profils vérifiés<#u', '>Profils présentés<'),
		'quatre'   => array('#renfort éducatif, studio de création, formation en ligne, académie Qualiopi#u', 'renfort éducatif, studio de création, logiciel des créateurs d’activité, académie Qualiopi'),
	);
}
function adepa_cf_migration_145() {
	global $wpdb;
	$ids = $wpdb->get_col("SELECT DISTINCT pm.post_id FROM {$wpdb->postmeta} pm JOIN {$wpdb->posts} p ON p.ID = pm.post_id
		WHERE pm.meta_key = '_elementor_data' AND p.post_type <> 'revision' AND (pm.meta_value LIKE '%rifi%' OR pm.meta_value LIKE '%formation en ligne, acad%')");
	// ⚠ Elementor stocke le JSON avec les accents échappés (\u00e9) : un LIKE sur
	// « vérifié » ne trouve jamais rien. On filtre sur un fragment sans accent.
	$bilan = array();
	foreach ($ids as $id) {
		$brut = get_post_meta($id, '_elementor_data', true);
		$data = is_string($brut) ? json_decode($brut) : null;
		if ($data === null) {
			continue;
		}
		$compte = array();
		adepa_cf_toulali_parcourir($data, adepa_cf_regles_145(), $compte, '');
		if (!$compte) {
			continue;
		}
		$json = wp_json_encode($data);
		if (!$json) {
			continue;
		}
		add_post_meta($id, '_adepa_cf_elementor_avant_145', wp_slash($brut), true);
		update_post_meta($id, '_elementor_data', wp_slash($json));
		delete_post_meta($id, '_elementor_element_cache');
		delete_post_meta($id, '_elementor_css');
		$bilan[$id] = $compte;
	}
	if (class_exists('\Elementor\Plugin') && isset(\Elementor\Plugin::$instance->files_manager)) {
		\Elementor\Plugin::$instance->files_manager->clear_cache();
	}
	update_option('adepa_cf_migration_145', array('date' => current_time('mysql'), 'bilan' => $bilan), false);
}

/**
 * Migration 1.4.7 : un seul menu « Notre académie » sur tout le site.
 * L'en-tête du modèle Elementor (5093) gardait trois entrées que l'accueil
 * n'a plus : bilan en Seine-et-Marne, grille tarifaire, renfort éducatif.
 * Les pages existent toujours ; elles sortent seulement du menu, comme sur
 * l'accueil. Copie d'avant : méta `_adepa_cf_elementor_avant_147`.
 */
function adepa_cf_regles_147() {
	$slugs = 'bilan-de-competences-seine-et-marne|grille-tarifaire-bilans-de-competences|renfort-educatif-en-etablissement-medico-social';
	return array(
		'menu' => array('~\s*<a(?:\s+class="msub")?\s+href="https://adepa77\.fr/(?:' . $slugs . ')/">[^<]*</a>~u', ''),
	);
}

function adepa_cf_migration_147() {
	global $wpdb;
	$ids = $wpdb->get_col("SELECT DISTINCT pm.post_id FROM {$wpdb->postmeta} pm JOIN {$wpdb->posts} p ON p.ID = pm.post_id
		WHERE pm.meta_key = '_elementor_data' AND p.post_type <> 'revision'
		AND pm.meta_value LIKE '%grille-tarifaire-bilans-de-competences%' AND pm.meta_value LIKE '%adepa-hdr%'");
	$bilan = array();
	foreach ($ids as $id) {
		$brut = get_post_meta($id, '_elementor_data', true);
		$data = is_string($brut) ? json_decode($brut) : null;
		if ($data === null) {
			continue;
		}
		$compte = array();
		adepa_cf_toulali_parcourir($data, adepa_cf_regles_147(), $compte, 'adepa-hdr');
		if (!$compte) {
			continue;
		}
		$json = wp_json_encode($data);
		if (!$json) {
			continue;
		}
		add_post_meta($id, '_adepa_cf_elementor_avant_147', wp_slash($brut), true);
		update_post_meta($id, '_elementor_data', wp_slash($json));
		delete_post_meta($id, '_elementor_element_cache');
		delete_post_meta($id, '_elementor_css');
		$bilan[$id] = $compte;
	}
	if (class_exists('\Elementor\Plugin') && isset(\Elementor\Plugin::$instance->files_manager)) {
		\Elementor\Plugin::$instance->files_manager->clear_cache();
	}
	update_option('adepa_cf_migration_147', array('date' => current_time('mysql'), 'bilan' => $bilan), false);
}

/** Migration 1.4.1 : applique les règles à tous les contenus Elementor qui citent Toulali. */
function adepa_cf_migration_141() {
	global $wpdb;
	$ids = $wpdb->get_col(
		"SELECT DISTINCT pm.post_id FROM {$wpdb->postmeta} pm
		 JOIN {$wpdb->posts} p ON p.ID = pm.post_id
		 WHERE pm.meta_key = '_elementor_data' AND pm.meta_value LIKE '%toulali%'
		 AND p.post_type <> 'revision'"
	);
	$bilan = array();
	$regles = adepa_cf_toulali_regles();
	foreach ($ids as $id) {
		$brut = get_post_meta($id, '_elementor_data', true);
		if (!is_string($brut) || $brut === '') {
			continue;
		}
		$data = json_decode($brut); // objets conservés : {} ne devient pas []
		if ($data === null) {
			$bilan[$id] = 'json illisible';
			continue;
		}
		$compte = array();
		adepa_cf_toulali_parcourir($data, $regles, $compte);
		if (!$compte) {
			continue;
		}
		$json = wp_json_encode($data);
		if (!$json) {
			$bilan[$id] = 'encodage impossible';
			continue;
		}
		// Copie de sauvegarde avant écriture (réversible à la main).
		add_post_meta($id, '_adepa_cf_elementor_avant_141', wp_slash($brut), true);
		update_post_meta($id, '_elementor_data', wp_slash($json));
		delete_post_meta($id, '_elementor_element_cache');
		delete_post_meta($id, '_elementor_css');
		$bilan[$id] = $compte;
	}
	if (class_exists('\Elementor\Plugin') && isset(\Elementor\Plugin::$instance->files_manager)) {
		\Elementor\Plugin::$instance->files_manager->clear_cache();
	}
	update_option('adepa_cf_migration_141', array('date' => current_time('mysql'), 'bilan' => $bilan), false);
}
