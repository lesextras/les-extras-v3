<?php
/**
 * Outils communs : réglages, mise en forme des textes, durée, prix.
 */
if (!defined('ABSPATH')) {
	exit;
}

/**
 * L'ADRESSE DE L'ÉCOLE TEACHIZY, écrite une seule fois (28/09/2026).
 * L'école s'appelle encore toulali.teachizy.fr ; le jour où son adresse
 * change dans Teachizy (Paramètres → URL de votre espace), on change ce
 * réglage et tous les liens « Commencer la formation » suivent.
 */
function adepa_cf_teachizy($chemin = '') {
	$base = rtrim(adepa_cf_reglage('teachizy_base', 'https://toulali.teachizy.fr'), '/');
	return $base . '/' . ltrim($chemin, '/');
}
function adepa_cf_lien_teachizy($url) {
	return preg_replace('#^https?://[a-z0-9-]+\.teachizy\.fr#i', rtrim(adepa_cf_teachizy(), '/'), (string) $url);
}

/** Les coordonnées de l'organisme, écrites une seule fois pour toutes les pages. */
function adepa_cf_organisme() {
	return array(
		'nom'           => 'ADéPA, Association pour le Développement de l’Éducation par l’Animation',
		'forme'         => 'Association loi 1901',
		'siege'         => '7 rue André Malraux, 77000 Melun',
		'administratif' => '30 rue Nouvelle, 77190 Dammarie-lès-Lys',
		'siret'         => '820 051 852 00011',
		'nda'           => '11771011677',
		'certificat'    => 'QNW0132',
		'certificateur' => 'QUALIPRO CERTIFICATION',
		'cofrac'        => '5-0681',
		'delivre'       => '10 mars 2026',
		'fin'           => '9 mars 2029',
		'email'         => adepa_cf_reglage('email', 'assoc.adepa@gmail.com'),
		'telephone'     => adepa_cf_reglage('telephone', '06 25 91 35 94'),
		'pdf'           => home_url('/wp-content/uploads/2026/08/certificat-qualiopi-adepa.pdf'),
	);
}

function adepa_cf_reglage($cle, $defaut = '') {
	$r = get_option('adepa_cf_reglages', array());
	return isset($r[$cle]) && $r[$cle] !== '' ? $r[$cle] : $defaut;
}

function adepa_cf_meta($id, $cle, $defaut = '') {
	$v = get_post_meta($id, '_af_' . $cle, true);
	return ($v === '' || $v === null) ? $defaut : $v;
}

/**
 * Un texte tel qu'il est saisi (paragraphes séparés par une ligne vide,
 * puces « • » ou « - » en début de ligne) devient du HTML sûr.
 */
function adepa_cf_texte($texte) {
	$texte = trim((string) $texte);
	if ($texte === '') {
		return '';
	}
	$blocs = preg_split("/\n\s*\n/u", str_replace("\r", '', $texte));
	$html  = '';
	foreach ($blocs as $bloc) {
		$lignes = array_values(array_filter(array_map('trim', explode("\n", $bloc)), 'strlen'));
		$puces  = array();
		$autres = array();
		foreach ($lignes as $l) {
			if (preg_match('/^(?:•|-|–|\*)\s*(.+)$/u', $l, $m)) {
				$puces[] = $m[1];
			} else {
				if ($puces) {
					$html  .= adepa_cf_liste($puces);
					$puces  = array();
				}
				$autres[] = $l;
				$html    .= '<p>' . esc_html($l) . '</p>';
			}
		}
		if ($puces) {
			$html .= adepa_cf_liste($puces);
		}
	}
	return $html;
}

function adepa_cf_liste($puces) {
	$h = '<ul>';
	foreach ($puces as $p) {
		$h .= '<li>' . esc_html($p) . '</li>';
	}
	return $h . '</ul>';
}

/** Durée lisible, dans l'unité saisie : 45 minutes ne deviennent jamais « 1 h ». */
function adepa_cf_duree($id) {
	$min = (int) adepa_cf_meta($id, 'durationMinutes', 0);
	$h   = adepa_cf_meta($id, 'durationHours', '');
	if ($min > 0) {
		return $min . ' min';
	}
	if ($h !== '' && (float) $h > 0) {
		$v = (float) $h;
		return ($v == (int) $v ? (int) $v : str_replace('.', ',', (string) $v)) . ' h';
	}
	return '';
}

function adepa_cf_euros($montant) {
	$n = (float) $montant;
	$s = number_format($n, $n == (int) $n ? 0 : 2, ',', "\u{00A0}");
	return $s . "\u{00A0}€";
}

/** Le prix affiché : « Gratuit », « à partir de … » (seulement s'il est publié), ou « Sur devis ». */
function adepa_cf_prix($id) {
	if (adepa_cf_meta($id, 'freeOnline')) {
		return 'Gratuit';
	}
	$p = adepa_cf_meta($id, 'priceFrom', '');
	if ($p !== '' && (float) $p > 0) {
		return 'À partir de ' . adepa_cf_euros($p);
	}
	return 'Sur devis';
}

function adepa_cf_est_gratuite($id) {
	return (bool) adepa_cf_meta($id, 'freeOnline');
}

/** Première image : la couverture importée, sinon l'image mise en avant. */
function adepa_cf_couverture($id, $taille = 'large') {
	$att = (int) adepa_cf_meta($id, 'cover', 0);
	if (!$att) {
		$att = (int) get_post_thumbnail_id($id);
	}
	return $att ? wp_get_attachment_image_url($att, $taille) : '';
}

function adepa_cf_url_catalogue() {
	return get_post_type_archive_link(ADEPA_CF_TYPE);
}

function adepa_cf_url_page($slug) {
	$p = get_page_by_path($slug);
	return $p ? get_permalink($p) : home_url('/' . $slug . '/');
}

/** Les formations publiées, dans l'ordre du catalogue. */
function adepa_cf_formations($args = array()) {
	$q = array_merge(
		array(
			'post_type'      => ADEPA_CF_TYPE,
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'orderby'        => array('menu_order' => 'ASC', 'title' => 'ASC'),
		),
		$args
	);
	return get_posts($q);
}
