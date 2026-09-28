<?php
/**
 * L'IMPORT DES FORMATIONS DE LES EXTRAS.
 *
 * `data/formations.json` est un relevé figé du catalogue de Les Extras au
 * 28/09/2026 (dix-huit fiches). L'import est idempotent : la clé est le slug,
 * une fiche existante est mise à jour, jamais dupliquée. Les couvertures et
 * les fiches récap A4 sont copiées dans la médiathèque de ce site, pour ne
 * plus dépendre de Les Extras.
 *
 * ⚠ Une fiche modifiée à la main ici est ÉCRASÉE par un nouvel import. Après
 * le premier import, on édite dans WordPress, et on ne relance plus.
 */
if (!defined('ABSPATH')) {
	exit;
}

function adepa_cf_importer($avec_medias = true) {
	$chemin = ADEPA_CF_DIR . 'data/formations.json';
	$data   = json_decode((string) file_get_contents($chemin), true);
	if (!is_array($data)) {
		return array('erreurs' => array('Fichier de données illisible.'));
	}
	if (function_exists('set_time_limit')) {
		@set_time_limit(600);
	}
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';

	$rapport = array('creees' => 0, 'mises_a_jour' => 0, 'medias' => 0, 'erreurs' => array());

	foreach ($data as $f) {
		$existant = get_page_by_path($f['slug'], OBJECT, ADEPA_CF_TYPE);
		$post     = array(
			'post_type'    => ADEPA_CF_TYPE,
			'post_status'  => 'publish',
			'post_title'   => $f['title'],
			'post_name'    => $f['slug'],
			'post_excerpt' => (string) $f['summary'],
			// Les parcours Qualiopi d'abord, puis les parcours gratuits.
			'menu_order'   => ($f['freeOnline'] ? 100 : 0) + (int) $f['ordre'],
		);
		if ($existant) {
			$post['ID'] = $existant->ID;
			$id = wp_update_post($post, true);
			$rapport['mises_a_jour']++;
		} else {
			$id = wp_insert_post($post, true);
			$rapport['creees']++;
		}
		if (is_wp_error($id)) {
			$rapport['erreurs'][] = $f['slug'] . ' : ' . $id->get_error_message();
			continue;
		}

		foreach (array('targetAudience', 'prerequisites', 'objectives', 'program', 'methodology', 'evaluation', 'city', 'durationHours', 'durationMinutes', 'priceFrom', 'enrollUrl', 'certificationName') as $cle) {
			update_post_meta($id, '_af_' . $cle, isset($f[$cle]) && $f[$cle] !== null ? (string) $f[$cle] : '');
		}
		update_post_meta($id, '_af_freeOnline', $f['freeOnline'] ? '1' : '');
		update_post_meta($id, '_af_certifying', $f['certifying'] ? '1' : '');
		update_post_meta($id, '_af_cpfEligible', $f['cpfEligible'] ? '1' : '');
		update_post_meta($id, '_af_publics', is_array($f['publicTargets']) ? $f['publicTargets'] : array());
		update_post_meta($id, '_af_faq', is_array($f['faq']) ? $f['faq'] : array());
		update_post_meta($id, '_af_sessions', is_array($f['sessions']) ? $f['sessions'] : array());
		// L'attestation reste fermée à la vente tant qu'aucun prix n'est posé.
		update_post_meta($id, '_af_attestationPrix', $f['attestationPrixCents'] ? (int) $f['attestationPrixCents'] : '');

		if (!empty($f['categorie'])) {
			wp_set_object_terms($id, array($f['categorie']), ADEPA_CF_THEME, false);
		}

		if ($avec_medias) {
			$base = 'https://les-extras.fr';
			if (!empty($f['images'][0])) {
				$rapport['medias'] += adepa_cf_copier_media($id, 'cover', $base . $f['images'][0], $f['title'], true);
			}
			if ($f['freeOnline']) {
				$rapport['medias'] += adepa_cf_copier_media($id, 'fiche_jpg', $base . '/fiches/' . $f['slug'] . '.jpg', 'Fiche récap : ' . $f['title'], false);
				$rapport['medias'] += adepa_cf_copier_media($id, 'fiche_pdf', $base . '/fiches/' . $f['slug'] . '.pdf', 'Fiche récap : ' . $f['title'], false);
			}
		}
	}
	update_option('adepa_cf_import', array('date' => current_time('mysql'), 'rapport' => $rapport));
	flush_rewrite_rules();
	return $rapport;
}

/** Copie un fichier dans la médiathèque, une seule fois (la source est retenue). */
function adepa_cf_copier_media($post_id, $cle, $url, $titre, $vignette) {
	$deja = (int) get_post_meta($post_id, '_af_' . $cle, true);
	if ($deja && get_post_meta($deja, '_af_source', true) === $url) {
		return 0;
	}
	$tmp = download_url($url, 60);
	if (is_wp_error($tmp)) {
		return 0;
	}
	$fichier = array('name' => basename(wp_parse_url($url, PHP_URL_PATH)), 'tmp_name' => $tmp);
	$att     = media_handle_sideload($fichier, $post_id, $titre);
	if (is_wp_error($att)) {
		@unlink($tmp);
		return 0;
	}
	update_post_meta($att, '_af_source', $url);
	update_post_meta($post_id, '_af_' . $cle, $att);
	if ($vignette) {
		set_post_thumbnail($post_id, $att);
		update_post_meta($att, '_wp_attachment_image_alt', $titre);
	}
	return 1;
}
