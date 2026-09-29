<?php
/**
 * 1.5.0 : L'ÉDU BLOG QUITTE ADEPA77.FR (demande de Siham, 29/09/2026).
 *
 * L'Édu Blog est le blog de Les Extras (les-extras.fr/edublog). adepa77.fr y
 * renvoyait à quatre endroits : l'entrée « L'Édu Blog » du menu (bureau et
 * mobile), la colonne « Le site » du pied de page, et, sur l'accueil, la
 * section « L'Édu Blog · Nos actualités » avec son bouton « Voir tous les
 * articles ». Tout est retiré ; les articles d'adepa77.fr eux-mêmes restent en
 * ligne (ils ne sont pas l'Édu Blog) et gardent leurs adresses.
 *
 * Réversible : copie de chaque contenu Elementor d'avant en méta
 * `_adepa_cf_elementor_avant_150` ; les entrées de menu WordPress qui
 * pointaient vers l'Édu Blog passent en brouillon (elles ne s'affichent plus),
 * jamais supprimées. Bilan dans l'option `adepa_cf_migration_150`.
 */
if (!defined('ABSPATH')) {
	exit;
}

function adepa_cf_regles_150() {
	$edublog = 'https?://(?:www\.)?les-extras\.fr/edublog[^"\']*';
	return array(
		// Pied de page : l'entrée de liste entière, sinon il reste une puce vide.
		'pied' => array('~\s*<li>\s*<a\s[^>]*href="' . $edublog . '"[^>]*>[^<]*</a>\s*</li>~u', ''),
		// Menu de l'en-tête, bureau et mobile.
		'menu' => array('~\s*<a\s[^>]*href="' . $edublog . '"[^>]*>[^<]*</a>~u', ''),
		// Section « Nos actualités » de l'accueil (elle ne présente que l'Édu Blog).
		'section' => array('~\s*<section id="actu"[^>]*>.*?</section>~su', ''),
		// Liens internes vers cette section, s'il en reste.
		'ancre' => array('~\s*<a\s[^>]*href="(?:https://adepa77\.fr/)?#actu"[^>]*>[^<]*</a>~u', ''),
		// Chatbot : un lien éventuel vers l'Édu Blog dans une liste de raccourcis.
		'bot' => array("~,?\\s*\\{l:'[^']*',u:'https?://(?:www\\.)?les-extras\\.fr/edublog[^']*'\\}~u", ''),
	);
}

function adepa_cf_migration_150() {
	global $wpdb;
	$ids = $wpdb->get_col("SELECT DISTINCT pm.post_id FROM {$wpdb->postmeta} pm JOIN {$wpdb->posts} p ON p.ID = pm.post_id
		WHERE pm.meta_key = '_elementor_data' AND p.post_type <> 'revision'
		AND (pm.meta_value LIKE '%edublog%' OR pm.meta_value LIKE '%id=\\\\\"actu\\\\\"%' OR pm.meta_value LIKE '%#actu%')");
	$bilan = array();
	foreach ($ids as $id) {
		$brut = get_post_meta($id, '_elementor_data', true);
		$data = is_string($brut) ? json_decode($brut) : null;
		if ($data === null) {
			continue;
		}
		$compte = array();
		adepa_cf_toulali_parcourir($data, adepa_cf_regles_150(), $compte, '');
		if (!$compte) {
			continue;
		}
		$json = wp_json_encode($data);
		if (!$json) {
			continue;
		}
		add_post_meta($id, '_adepa_cf_elementor_avant_150', wp_slash($brut), true);
		update_post_meta($id, '_elementor_data', wp_slash($json));
		delete_post_meta($id, '_elementor_element_cache');
		delete_post_meta($id, '_elementor_css');
		$bilan[$id] = $compte;
	}

	// Menus WordPress : l'entrée passe en brouillon, elle ne s'affiche plus.
	$items = get_posts(array(
		'post_type'      => 'nav_menu_item',
		'post_status'    => 'publish',
		'posts_per_page' => -1,
		'meta_key'       => '_menu_item_url',
		'meta_value'     => '',
		'meta_compare'   => '!=',
	));
	foreach ($items as $item) {
		$url = (string) get_post_meta($item->ID, '_menu_item_url', true);
		if (stripos($url, 'les-extras.fr/edublog') === false) {
			continue;
		}
		wp_update_post(array('ID' => $item->ID, 'post_status' => 'draft'));
		$bilan['menu-' . $item->ID] = $url;
	}

	if (class_exists('\Elementor\Plugin') && isset(\Elementor\Plugin::$instance->files_manager)) {
		\Elementor\Plugin::$instance->files_manager->clear_cache();
	}
	if (function_exists('do_action')) {
		do_action('litespeed_purge_all');
	}
	update_option('adepa_cf_migration_150', array('date' => current_time('mysql'), 'bilan' => $bilan), false);
}
