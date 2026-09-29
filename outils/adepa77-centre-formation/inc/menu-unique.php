<?php
/**
 * 1.5.1 : UN SEUL MENU SUR TOUT ADEPA77.FR (demande de Siham, 29/09/2026).
 *
 * L'audit du 28/09 relevait que le menu « changeait d'une page à l'autre ».
 * L'en-tête est déjà le même partout (celui de l'accueil). Ce qui le
 * contredisait : un second menu écrit DANS le contenu de quatre pages
 * (mentions légales, CGU, notre histoire, confidentialités), le bloc
 * `.legal-nav` (logo « ADÉPA. » + Accueil, Notre histoire, Mentions légales,
 * Confidentialités, CGU), affiché juste sous le vrai menu.
 *
 * Ce bloc est retiré du contenu. Le reste de la page ne bouge pas.
 * Réversible : contenu d'avant en méta `_adepa_cf_avant_151`, bilan dans
 * l'option `adepa_cf_migration_151`.
 */
if (!defined('ABSPATH')) {
	exit;
}

/** Le bloc : le logo, puis la liste de liens, dans leur `div.legal-nav`. */
function adepa_cf_motif_legal_nav() {
	return '~<div class="legal-nav">(?:(?!<div class="legal-body"|<div class="histoire-body").)*?<div class="links">.*?</div>\s*</div>~su';
}

/** Retire le bloc `.legal-nav` d'un HTML ; rend le HTML inchangé s'il n'y en a pas. */
function adepa_cf_sans_legal_nav($html, &$compte) {
	$motif = adepa_cf_motif_legal_nav();
	$n = 0;
	$sortie = preg_replace($motif, '', $html, -1, $n);
	if ($sortie === null) {
		return $html;
	}
	$compte += $n;
	return $sortie;
}

function adepa_cf_migration_151() {
	global $wpdb;
	$ids = $wpdb->get_col("SELECT ID FROM {$wpdb->posts}
		WHERE post_type IN ('page','post') AND post_status IN ('publish','private','draft')
		AND post_content LIKE '%legal-nav%'");
	$bilan = array();
	foreach ($ids as $id) {
		$avant = (string) get_post_field('post_content', $id, 'raw');
		$compte = 0;
		$apres = adepa_cf_sans_legal_nav($avant, $compte);
		if ($compte === 0 || $apres === $avant) {
			continue;
		}
		add_post_meta($id, '_adepa_cf_avant_151', wp_slash($avant), true);
		$wpdb->update($wpdb->posts, array('post_content' => $apres), array('ID' => $id));
		clean_post_cache($id);
		$bilan[$id] = $compte;
	}
	if (function_exists('do_action')) {
		do_action('litespeed_purge_all');
	}
	update_option('adepa_cf_migration_151', array('date' => current_time('mysql'), 'bilan' => $bilan), false);
}

/**
 * 1.5.2 : trois des quatre pages (mentions légales, CGU, confidentialités)
 * sont construites avec Elementor : le bloc vit dans un widget HTML de
 * `_elementor_data`, `post_content` n'en garde qu'une copie en texte. Même
 * retrait, dans les données Elementor cette fois. Copie d'avant en méta
 * `_adepa_cf_elementor_avant_152`, bilan dans `adepa_cf_migration_152`.
 */
function adepa_cf_migration_152() {
	global $wpdb;
	$ids = $wpdb->get_col("SELECT DISTINCT pm.post_id FROM {$wpdb->postmeta} pm JOIN {$wpdb->posts} p ON p.ID = pm.post_id
		WHERE pm.meta_key = '_elementor_data' AND p.post_type <> 'revision' AND pm.meta_value LIKE '%legal-nav%'");
	$bilan = array();
	$regles = array('legal-nav' => array(adepa_cf_motif_legal_nav(), ''));
	foreach ($ids as $id) {
		$brut = get_post_meta($id, '_elementor_data', true);
		$data = is_string($brut) ? json_decode($brut) : null;
		if ($data === null) {
			continue;
		}
		$compte = array();
		adepa_cf_toulali_parcourir($data, $regles, $compte, 'legal-nav');
		if (!$compte) {
			continue;
		}
		$json = wp_json_encode($data);
		if (!$json) {
			continue;
		}
		add_post_meta($id, '_adepa_cf_elementor_avant_152', wp_slash($brut), true);
		update_post_meta($id, '_elementor_data', wp_slash($json));
		delete_post_meta($id, '_elementor_element_cache');
		delete_post_meta($id, '_elementor_css');
		$bilan[$id] = $compte;
	}
	if (class_exists('\\Elementor\\Plugin') && isset(\Elementor\Plugin::$instance->files_manager)) {
		\Elementor\Plugin::$instance->files_manager->clear_cache();
	}
	do_action('litespeed_purge_all');
	update_option('adepa_cf_migration_152', array('date' => current_time('mysql'), 'bilan' => $bilan), false);
}

/**
 * 1.5.3 : LE PIED DE PAGE DE L'ACCUEIL PORTE LES LIENS RÉGLEMENTAIRES.
 *
 * L'accueil (page 4883) a son propre pied de page, dans le widget HTML
 * d'Elementor ; toutes les autres pages portent le menu Astra 22. Le second
 * donnait « Informations réglementaires », « CGV formation », « Nos
 * formations » et « Partenaires associatifs », le premier non : un financeur
 * qui arrivait par l'accueil ne trouvait pas les pages que Qualiopi exige
 * (indicateur 1). On AJOUTE ces liens, rien n'est retiré. Copie d'avant en
 * méta `_adepa_cf_elementor_avant_153`, bilan dans `adepa_cf_migration_153`.
 */
function adepa_cf_regles_153() {
	$u = 'https://adepa77.fr';
	return array(
		// Barre du bas : après « Confidentialité ».
		'bas' => array(
			'~(<a href="' . preg_quote($u, '~') . '/confidentialites/">Confidentialit[^<]*</a>)(\s*</span>)~u',
			'$1 ·' . "\n" . '<a href="' . $u . '/informations-reglementaires/">Informations réglementaires</a> ·' . "\n" . '<a href="' . $u . '/cgv-formation/">CGV formation</a>$2',
		),
		// Colonne « Le site » : après « Notre histoire ».
		'site' => array(
			'~(<li><a href="' . preg_quote($u, '~') . '/notre-histoire/">Notre histoire</a></li>)(\s*</ul>)~u',
			'$1<li><a href="' . $u . '/formations/">Nos formations</a></li><li><a href="' . $u . '/partenaires-associatifs/">Partenaires associatifs</a></li>$2',
		),
	);
}

function adepa_cf_migration_153() {
	$id = (int) get_option('page_on_front');
	if (!$id) {
		$id = 4883;
	}
	$brut = get_post_meta($id, '_elementor_data', true);
	$data = is_string($brut) ? json_decode($brut) : null;
	$bilan = array();
	if ($data !== null && strpos($brut, 'informations-reglementaires') === false) {
		$compte = array();
		adepa_cf_toulali_parcourir($data, adepa_cf_regles_153(), $compte, 'notre-histoire');
		$json = $compte ? wp_json_encode($data) : '';
		if ($json) {
			add_post_meta($id, '_adepa_cf_elementor_avant_153', wp_slash($brut), true);
			update_post_meta($id, '_elementor_data', wp_slash($json));
			delete_post_meta($id, '_elementor_element_cache');
			delete_post_meta($id, '_elementor_css');
			$bilan[$id] = $compte;
		}
	}
	if (class_exists('\\Elementor\\Plugin') && isset(\Elementor\Plugin::$instance->files_manager)) {
		\Elementor\Plugin::$instance->files_manager->clear_cache();
	}
	do_action('litespeed_purge_all');
	update_option('adepa_cf_migration_153', array('date' => current_time('mysql'), 'bilan' => $bilan), false);
}

/**
 * 1.5.4 : « /merci-don/ » GARDE LE MENU DU SITE.
 *
 * La page de remerciement après un don était en gabarit « Elementor Canvas »,
 * sans en-tête ni pied : une personne qui venait de donner arrivait sur une
 * page sans aucun lien pour revenir au site. Elle passe au gabarit « Elementor
 * pleine largeur » : même contenu, avec le menu principal et le pied de page.
 * Les pages embarquées dans les fenêtres (don, newsletter, rendez-vous)
 * restent en Canvas, elles s'affichent DANS une autre page.
 * Gabarit d'avant en méta `_adepa_cf_gabarit_avant_154`.
 */
function adepa_cf_migration_154() {
	$page = get_page_by_path('merci-don');
	$bilan = array();
	if ($page) {
		$avant = (string) get_post_meta($page->ID, '_wp_page_template', true);
		if ($avant === 'elementor_canvas') {
			add_post_meta($page->ID, '_adepa_cf_gabarit_avant_154', $avant, true);
			update_post_meta($page->ID, '_wp_page_template', 'elementor_header_footer');
			$bilan[$page->ID] = $avant . ' -> elementor_header_footer';
		}
	}
	do_action('litespeed_purge_all');
	update_option('adepa_cf_migration_154', array('date' => current_time('mysql'), 'bilan' => $bilan), false);
}
