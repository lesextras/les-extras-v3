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
		'hero_image' => esc_url_raw(wp_unslash($_POST['hero_image'] ?? '')),
	));

	// La prise de rendez-vous (1.3.0).
	$plages = array();
	$rdv_plages = isset($_POST['rdv_plages']) ? (array) wp_unslash($_POST['rdv_plages']) : array();
	foreach (array_keys(adepa_cf_rdv_jours_semaine()) as $n) {
		$plages[$n] = adepa_cf_rdv_ecrire_plages(adepa_cf_rdv_lire_plages(sanitize_text_field($rdv_plages[$n] ?? '')));
	}
	$fermes = array();
	foreach (preg_split('/[\r\n]+/', sanitize_textarea_field(wp_unslash($_POST['rdv_fermes'] ?? ''))) as $ligne) {
		$ligne = trim($ligne);
		if ($ligne !== '' && adepa_cf_rdv_jours_fermes($ligne)) {
			$fermes[] = $ligne;
		}
	}
	update_option('adepa_cf_rdv', array(
		'plages'    => $plages,
		'delai_h'   => max(0, min(720, (int) ($_POST['rdv_delai_h'] ?? 24))),
		'horizon_j' => max(1, min(120, (int) ($_POST['rdv_horizon_j'] ?? 21))),
		'max_jour'  => max(1, min(50, (int) ($_POST['rdv_max_jour'] ?? 6))),
		'fermes'    => implode("\n", $fermes),
		'enregistre_le' => time(),
	), false);
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
	echo '<table class="form-table"><tr><th><label for="af-email">E-mail qui reçoit les demandes de devis et les rendez-vous</label></th><td><input class="regular-text" id="af-email" type="email" name="email" value="' . esc_attr($o['email']) . '"></td></tr>';
	echo '<tr><th><label for="af-tel">Téléphone affiché</label></th><td><input class="regular-text" id="af-tel" type="text" name="telephone" value="' . esc_attr($o['telephone']) . '"></td></tr>';
	echo '<tr><th><label for="af-hero">Photo de fond du haut de /formations/</label></th><td><input class="regular-text" id="af-hero" type="url" name="hero_image" value="' . esc_attr(adepa_cf_reglage('hero_image', '')) . '"><p class="description">Adresse d’une image de la médiathèque (une vraie photo de formation, en paysage, 1 920 px de large). Vide : dégradé aux couleurs du site.</p></td></tr></table>';
	adepa_cf_ecran_reglages_rdv();
	submit_button('Enregistrer');
	echo '</form>';

	echo '<h2>Les pages</h2><ul>';
	echo '<li><a href="' . esc_url(adepa_cf_url_page('prendre-rendez-vous')) . '" target="_blank">Prendre rendez-vous</a> (les rendez-vous pris arrivent dans Centre de formation → Rendez-vous)</li>';
	echo '<li><a href="' . esc_url(adepa_cf_url_catalogue()) . '" target="_blank">Catalogue des formations</a></li>';
	foreach (adepa_cf_pages() as $slug => $p) {
		echo '<li><a href="' . esc_url(adepa_cf_url_page($slug)) . '" target="_blank">' . esc_html($p[0]) . '</a></li>';
	}
	echo '</ul><p>Pour insérer des cartes ailleurs sur le site : <code>[adepa_formations type="gratuit" limite="3"]</code> (type : tout, gratuit ou qualiopi).</p></div>';
}

/** Les réglages de la prise de rendez-vous, dans le même formulaire que les autres. */
function adepa_cf_ecran_reglages_rdv() {
	$r = adepa_cf_rdv_reglages();
	$enregistre = get_option('adepa_cf_rdv');
	echo '<h2 style="margin-top:32px" id="rendez-vous">Prise de rendez-vous (page « Prendre rendez-vous »)</h2>';
	if (!$enregistre) {
		echo '<div class="notice notice-warning inline"><p><strong>Horaires provisoires, à ajuster.</strong> Les disponibilités ci-dessous (du lundi au vendredi, 09:30-12:30 et 14:00-17:00) ont été mises par défaut à l’installation : elles ne viennent pas de votre agenda. Corrigez-les puis enregistrez.</p></div>';
	}
	echo '<p>Chaque rendez-vous dure <strong>' . (int) ADEPA_CF_RDV_DUREE . ' minutes</strong> (durée fixe). Les créneaux se calculent à l’heure de Paris. Un rendez-vous annulé libère son créneau.</p>';
	echo '<table class="form-table">';
	echo '<tr><th>Jours et horaires<p class="description" style="font-weight:400">À ajuster selon vos disponibilités réelles.</p></th><td>';
	echo '<table><tbody>';
	foreach (adepa_cf_rdv_jours_semaine() as $n => $jour) {
		echo '<tr><td style="padding:4px 12px 4px 0"><label for="rdv-j' . (int) $n . '">' . esc_html($jour) . '</label></td><td style="padding:4px 0"><input class="regular-text" id="rdv-j' . (int) $n . '" type="text" name="rdv_plages[' . (int) $n . ']" value="' . esc_attr($r['plages'][$n] ?? '') . '" placeholder="Fermé"></td></tr>';
	}
	echo '</tbody></table><p class="description">Une ou plusieurs plages par jour, séparées par une virgule : <code>09:30-12:30, 14:00-17:00</code>. Vide : pas de rendez-vous ce jour-là.</p></td></tr>';
	echo '<tr><th><label for="rdv-delai">Délai minimal avant un créneau</label></th><td><input class="small-text" id="rdv-delai" type="number" min="0" max="720" name="rdv_delai_h" value="' . (int) $r['delai_h'] . '"> heures<p class="description">Un créneau plus proche que ce délai n’est pas proposé.</p></td></tr>';
	echo '<tr><th><label for="rdv-horizon">Horizon</label></th><td><input class="small-text" id="rdv-horizon" type="number" min="1" max="120" name="rdv_horizon_j" value="' . (int) $r['horizon_j'] . '"> jours<p class="description">Jusqu’où la réservation est ouverte.</p></td></tr>';
	echo '<tr><th><label for="rdv-max">Rendez-vous par jour, au plus</label></th><td><input class="small-text" id="rdv-max" type="number" min="1" max="50" name="rdv_max_jour" value="' . (int) $r['max_jour'] . '"></td></tr>';
	echo '<tr><th><label for="rdv-fermes">Jours fermés</label></th><td><textarea class="large-text" rows="4" id="rdv-fermes" name="rdv_fermes" placeholder="11/11/2026&#10;24/12/2026 au 02/01/2027">' . esc_textarea($r['fermes']) . '</textarea><p class="description">Une date par ligne (JJ/MM/AAAA), ou une période « JJ/MM/AAAA au JJ/MM/AAAA » : congés, jours fériés, formations.</p></td></tr>';
	echo '</table>';
}
