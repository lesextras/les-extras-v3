<?php
/**
 * L'ÉCRAN « Import et réglages » (Centre de formation → Import et réglages).
 */
if (!defined('ABSPATH')) {
	exit;
}

add_action('admin_menu', function () {
	add_submenu_page(
		'edit.php?post_type=' . ADEPA_CF_TYPE,
		'Import et réglages',
		'Import et réglages',
		'manage_options',
		'adepa-cf-reglages',
		'adepa_cf_ecran_reglages'
	);
});

add_action('admin_post_adepa_cf_import', function () {
	if (!current_user_can('manage_options') || !check_admin_referer('adepa_cf_import')) {
		wp_die('Action non autorisée.');
	}
	$r = adepa_cf_importer(true);
	$p = adepa_cf_creer_pages();
	set_transient('adepa_cf_message', array($r, $p), 120);
	wp_safe_redirect(admin_url('edit.php?post_type=' . ADEPA_CF_TYPE . '&page=adepa-cf-reglages'));
	exit;
});

add_action('admin_post_adepa_cf_reglages', function () {
	if (!current_user_can('manage_options') || !check_admin_referer('adepa_cf_reglages')) {
		wp_die('Action non autorisée.');
	}
	update_option('adepa_cf_reglages', array(
		'email'     => sanitize_email(wp_unslash($_POST['email'] ?? '')),
		'telephone' => sanitize_text_field(wp_unslash($_POST['telephone'] ?? '')),
	));
	wp_safe_redirect(admin_url('edit.php?post_type=' . ADEPA_CF_TYPE . '&page=adepa-cf-reglages&enregistre=1'));
	exit;
});

function adepa_cf_ecran_reglages() {
	$msg  = get_transient('adepa_cf_message');
	delete_transient('adepa_cf_message');
	$der  = get_option('adepa_cf_import');
	$o    = adepa_cf_organisme();
	echo '<div class="wrap"><h1>Centre de formation : import et réglages</h1>';
	if ($msg) {
		list($r, $p) = $msg;
		echo '<div class="notice notice-success"><p>Import terminé : ' . (int) ($r['creees'] ?? 0) . ' fiche(s) créée(s), ' . (int) ($r['mises_a_jour'] ?? 0) . ' mise(s) à jour, ' . (int) ($r['medias'] ?? 0) . ' fichier(s) copié(s) dans la médiathèque. Pages créées : ' . esc_html($p ? implode(', ', $p) : 'aucune (déjà présentes)') . '.</p>';
		if (!empty($r['erreurs'])) {
			echo '<p>Erreurs : ' . esc_html(implode(' ; ', $r['erreurs'])) . '</p>';
		}
		echo '</div>';
	}
	if (isset($_GET['enregistre'])) { // phpcs:ignore
		echo '<div class="notice notice-success"><p>Réglages enregistrés.</p></div>';
	}

	echo '<h2>Importer les formations de Les Extras</h2>';
	echo '<p>Dix-huit fiches (relevé du 28/09/2026) : quatre formations en établissement et quatorze parcours gratuits, avec leurs couvertures et leurs fiches récap A4. Les pages réglementaires manquantes sont créées au passage.</p>';
	echo '<p><strong>Attention :</strong> une fiche déjà importée puis modifiée ici est écrasée par un nouvel import. Après le premier import, modifiez les fiches dans WordPress et ne relancez plus.</p>';
	if ($der) {
		echo '<p>Dernier import : ' . esc_html($der['date']) . '.</p>';
	}
	echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
	wp_nonce_field('adepa_cf_import');
	echo '<input type="hidden" name="action" value="adepa_cf_import">';
	submit_button($der ? 'Relancer l’import' : 'Importer les formations', 'primary', 'submit', false);
	echo '</form>';

	echo '<h2 style="margin-top:32px">Réglages</h2>';
	echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
	wp_nonce_field('adepa_cf_reglages');
	echo '<input type="hidden" name="action" value="adepa_cf_reglages">';
	echo '<table class="form-table"><tr><th><label for="af-email">E-mail qui reçoit les demandes de devis</label></th><td><input class="regular-text" id="af-email" type="email" name="email" value="' . esc_attr($o['email']) . '"></td></tr>';
	echo '<tr><th><label for="af-tel">Téléphone affiché</label></th><td><input class="regular-text" id="af-tel" type="text" name="telephone" value="' . esc_attr($o['telephone']) . '"></td></tr></table>';
	submit_button('Enregistrer');
	echo '</form>';

	echo '<h2>Les pages</h2><ul>';
	echo '<li><a href="' . esc_url(adepa_cf_url_catalogue()) . '" target="_blank">Catalogue des formations</a></li>';
	foreach (adepa_cf_pages() as $slug => $p) {
		echo '<li><a href="' . esc_url(adepa_cf_url_page($slug)) . '" target="_blank">' . esc_html($p[0]) . '</a></li>';
	}
	echo '</ul><p>Pour insérer des cartes ailleurs sur le site : <code>[adepa_formations type="gratuit" limite="3"]</code> (type : tout, gratuit ou qualiopi).</p></div>';
}
