<?php
/**
 * LES MIGRATIONS DE DONNÉES, UNE SEULE FOIS PAR VERSION.
 *
 * Quand la version enregistrée (option adepa_cf_version) diffère de celle de
 * l'extension, les étapes manquantes tournent, puis la version est notée.
 * Chaque étape est idempotente : la relancer ne change plus rien.
 * Rien n'est supprimé : on remplace un texte, on remplit un champ vide.
 */
if (!defined('ABSPATH')) {
	exit;
}

add_action('init', 'adepa_cf_migrer', 30);

function adepa_cf_migrer() {
	$enregistree = (string) get_option('adepa_cf_version', '');
	if ($enregistree === ADEPA_CF_VERSION) {
		return;
	}
	// Un seul passage à la fois, même si plusieurs visites arrivent ensemble.
	if (get_transient('adepa_cf_migration_en_cours')) {
		return;
	}
	set_transient('adepa_cf_migration_en_cours', 1, 120);

	if (version_compare($enregistree === '' ? '0' : $enregistree, '1.1.0', '<')) {
		adepa_cf_migration_110();
	}
	if (version_compare($enregistree === '' ? '0' : $enregistree, '1.3.0', '<')) {
		// 1.3.0 : la page /prendre-rendez-vous/, créée seulement si elle manque.
		adepa_cf_rdv_creer_page();
	}

	update_option('adepa_cf_version', ADEPA_CF_VERSION, true);
	delete_transient('adepa_cf_migration_en_cours');
}

/** Remplace des textes dans une valeur (chaîne ou tableau imbriqué, comme la FAQ). */
function adepa_cf_remplacer_recursif($valeur, $remplacements) {
	if (is_string($valeur)) {
		return strtr($valeur, $remplacements);
	}
	if (is_array($valeur)) {
		foreach ($valeur as $k => $v) {
			$valeur[$k] = adepa_cf_remplacer_recursif($v, $remplacements);
		}
	}
	return $valeur;
}

/**
 * 1.1.0 (audit du 28/09/2026)
 *  - les fiches parlent du site courant : « le site Les Extras » devient
 *    « le site d’ADéPA » (la plateforme Les Extras n'est pas citée ailleurs) ;
 *  - les couvertures et aperçus de fiche récap sans texte alternatif en
 *    reçoivent un (le titre de la formation).
 */
function adepa_cf_migration_110() {
	$remplacements = array(
		'Vous quittez le site Les Extras' => 'Vous quittez le site d’ADéPA',
		'vous quittez le site Les Extras' => 'vous quittez le site d’ADéPA',
	);
	$ids = get_posts(array(
		'post_type'      => ADEPA_CF_TYPE,
		'post_status'    => 'any',
		'posts_per_page' => -1,
		'fields'         => 'ids',
	));
	foreach ($ids as $id) {
		foreach (array_keys((array) get_post_meta($id)) as $cle) {
			if (strpos($cle, '_af_') !== 0) {
				continue;
			}
			$avant = get_post_meta($id, $cle, true);
			if (!is_string($avant) && !is_array($avant)) {
				continue;
			}
			$apres = adepa_cf_remplacer_recursif($avant, $remplacements);
			if ($apres !== $avant) {
				update_post_meta($id, $cle, $apres);
			}
		}

		$titre = get_the_title($id);
		$couvertures = array_unique(array_filter(array(
			(int) get_post_meta($id, '_af_cover', true),
			(int) get_post_thumbnail_id($id),
		)));
		foreach ($couvertures as $att) {
			if (trim((string) get_post_meta($att, '_wp_attachment_image_alt', true)) === '') {
				update_post_meta($att, '_wp_attachment_image_alt', $titre);
			}
		}
		$jpg = (int) get_post_meta($id, '_af_fiche_jpg', true);
		if ($jpg && trim((string) get_post_meta($jpg, '_wp_attachment_image_alt', true)) === '') {
			update_post_meta($jpg, '_wp_attachment_image_alt', 'Aperçu de la fiche récapitulative A4 « ' . $titre . ' »');
		}
	}
}
