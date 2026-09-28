<?php
/**
 * AUDIT DU 28/09/2026 (extension 1.4.2) : ce qui manquait pour que adepa77.fr
 * soit propre, sans toucher au design.
 *
 *  - descriptions des pages qui n'en avaient pas (Rank Math, remplies seulement
 *    si vides) ;
 *  - titres et descriptions des fiches bornés à 65 et 160 caractères ;
 *  - un titre h1 (lu par les lecteurs d'écran et les moteurs) sur les cinq pages
 *    qui n'en avaient aucun ;
 *  - plus d'en-tête « X-Powered-By » ;
 *  - le siège affiché sur l'accueil (Melun, comme l'Insee et le certificat) ;
 *  - « freelances » retiré de l'article de présentation ;
 *  - plus aucun tiret cadratin dans les textes (règle de la fondatrice).
 *
 * Rien n'est supprimé : chaque texte modifié garde sa version d'avant dans une
 * méta `_adepa_cf_avant_142`.
 */
if (!defined('ABSPATH')) {
	exit;
}

/* ---------- En-tête serveur ---------- */
add_action('send_headers', function () {
	if (function_exists('header_remove')) {
		header_remove('X-Powered-By');
	}
});

/* ---------- Titres et descriptions des fiches ---------- */
function adepa_cf_borner($texte, $limite) {
	$texte = trim(preg_replace('/\s+/u', ' ', (string) $texte));
	if (mb_strlen($texte) <= $limite) {
		return $texte;
	}
	$coupe = mb_substr($texte, 0, $limite - 1);
	$espace = mb_strrpos($coupe, ' ');
	if ($espace !== false && $espace > $limite / 2) {
		$coupe = mb_substr($coupe, 0, $espace);
	}
	return rtrim($coupe, " ,;:.-–") . '…';
}

add_filter('rank_math/frontend/title', function ($titre) {
	if (!is_singular(ADEPA_CF_TYPE) && !is_tax()) {
		return $titre;
	}
	if (mb_strlen($titre) <= 65) {
		return $titre;
	}
	// Priorité 100 : après les titres du catalogue (gabarits.php, 99).
	// D'abord le nom du site en suffixe, qui ne dit rien de la formation.
	$sans = preg_replace('/\s+[-|·]\s+(ASSOCIATION AD[ÉE]PA|Formations AD[ÉEée]PA)\s*$/iu', '', $titre);
	return mb_strlen($sans) <= 65 ? $sans : adepa_cf_borner($sans, 65);
}, 100);

add_filter('rank_math/frontend/description', function ($desc) {
	return (is_string($desc) && mb_strlen($desc) > 160) ? adepa_cf_borner($desc, 160) : $desc;
}, 100);

/* ---------- Un h1 sur les pages qui n'en avaient pas ---------- */
function adepa_cf_pages_sans_h1() {
	return array(4620, 5136, 3253, 3256, 2010);
}
add_action('wp_body_open', function () {
	if (is_page(adepa_cf_pages_sans_h1())) {
		echo '<h1 class="screen-reader-text">' . esc_html(wp_strip_all_tags(get_the_title())) . '</h1>';
	}
});

/* ---------- Bandeau cookies compact sur téléphone (1.4.9) ---------- */
/**
 * À 390 px, le bandeau de Cookie Compliance faisait 146 px et recouvrait le
 * bouton « Prendre rendez-vous » du premier écran. Texte et boutons côte à
 * côte : 86 px. La mécanique de consentement n'est pas touchée.
 */
function adepa_cf_css_cookies() {
	return '@media (max-width:640px){#cookie-notice .cookie-notice-container{display:flex;align-items:center;gap:10px;padding:10px 40px 10px 12px;text-align:left}#cookie-notice #cn-notice-text{font-size:12px;line-height:1.35;margin:0;flex:1;display:block}#cookie-notice #cn-notice-buttons{display:flex;flex-direction:column;gap:6px;margin:0;flex:none}#cookie-notice .cn-button{margin:0;padding:6px 12px;font-size:12px;line-height:1.2;white-space:nowrap}#cookie-notice .cn-close-icon{top:8px;right:6px;margin:0}}';
}
add_action('wp_head', function () {
	echo '<style id="adepa-cf-cookies">' . adepa_cf_css_cookies() . '</style>' . "\n";
}, 99);

/* ---------- Tirets cadratins ---------- */

/** Le texte réduit à ses lettres et chiffres : la preuve qu'aucun mot n'a bougé. */
function adepa_cf_squelette($texte) {
	$t = html_entity_decode((string) $texte, ENT_QUOTES, 'UTF-8');
	return preg_replace('/[^\p{L}\p{N}]+/u', '', $t);
}

/** Un morceau de texte (sans balise) : les tirets deviennent parenthèses, deux-points, virgule ou point. */
function adepa_cf_tirets_morceau($m) {
	$t = str_replace('&mdash;', '—', $m);
	if (strpos($t, '—') === false) {
		return $m;
	}
	$sep = '/[ \x{00A0}\x{202F}]*—[ \x{00A0}\x{202F}]*/u';
	$n = preg_match_all($sep, $t);
	if ($n === 2 && preg_match('/^(.*\S)' . '[ \x{00A0}\x{202F}]*—[ \x{00A0}\x{202F}]*' . '(.+?)' . '[ \x{00A0}\x{202F}]*—[ \x{00A0}\x{202F}]*' . '(.*)$/us', $t, $p)) {
		// Une incise encadrée : entre parenthèses.
		return $p[1] . ' (' . $p[2] . ')' . ($p[3] !== '' && !preg_match('/^[\s,.;:!?)]/u', $p[3]) ? ' ' : '') . $p[3];
	}
	$deuxPoints = strpos($t, ':') !== false;
	$premier = true;
	return preg_replace_callback('/[ \x{00A0}\x{202F}]*—[ \x{00A0}\x{202F}]*(.?)/u', function ($x) use (&$premier, $deuxPoints) {
		$suite = $x[1];
		if ($suite !== '' && preg_match('/\p{Lu}/u', $suite)) {
			$r = '. ' . $suite;
		} elseif ($premier && !$deuxPoints) {
			$r = ' : ' . $suite;
		} else {
			$r = ', ' . $suite;
		}
		$premier = false;
		return $r;
	}, $t);
}

/** Un contenu HTML : on ne touche qu'au texte, jamais aux balises ni aux attributs. */
function adepa_cf_sans_tirets($html) {
	if (!is_string($html) || (strpos($html, '—') === false && strpos($html, '&mdash;') === false)) {
		return $html;
	}
	$parts = preg_split('/(<[^>]*>)/u', $html, -1, PREG_SPLIT_DELIM_CAPTURE);
	if ($parts === false) {
		return $html;
	}
	foreach ($parts as $i => $p) {
		if ($p !== '' && $p[0] !== '<') {
			$parts[$i] = adepa_cf_tirets_morceau($p);
		}
	}
	$apres = implode('', $parts);
	// Preuve : les mêmes lettres, dans le même ordre. Sinon on laisse tel quel.
	return adepa_cf_squelette($apres) === adepa_cf_squelette($html) ? $apres : $html;
}

/** Un titre : le tiret devient un point médian. */
function adepa_cf_titre_sans_tirets($t) {
	if (!is_string($t) || strpos($t, '—') === false) {
		return $t;
	}
	$apres = trim(preg_replace('/\s*—\s*/u', ' · ', $t));
	return adepa_cf_squelette($apres) === adepa_cf_squelette($t) ? $apres : $t;
}

function adepa_cf_tirets_profond(&$v, &$n) {
	if (is_string($v)) {
		$nv = adepa_cf_sans_tirets($v);
		if ($nv !== $v) {
			$v = $nv;
			$n++;
		}
		return;
	}
	if (is_array($v)) {
		foreach ($v as &$x) {
			adepa_cf_tirets_profond($x, $n);
		}
		unset($x);
		return;
	}
	if (is_object($v)) {
		foreach (get_object_vars($v) as $k => $x) {
			adepa_cf_tirets_profond($x, $n);
			$v->$k = $x;
		}
	}
}

/* ---------- La migration ---------- */
function adepa_cf_migration_142() {
	global $wpdb;
	$bilan = array('descriptions' => 0, 'contenus' => 0, 'titres' => 0, 'elementor' => 0, 'metas' => 0, 'options' => 0, 'siege' => 0, 'freelance' => 0);

	// 1. Descriptions manquantes (jamais par-dessus une saisie).
	$descriptions = array(
		5260 => 'ADéPA IA, le prof assistant des parcours en ligne : il répond à vos questions sur le contenu des cours, à toute heure. Inclus dans la formule accompagnée.',
		5246 => 'Réservez en ligne un échange de 20 minutes avec ADéPA : bilan de compétences, formation, financement. Confirmation immédiate par e-mail.',
		5149 => 'Informations réglementaires du centre de formation ADéPA : déclaration d’activité, certification Qualiopi, accès, évaluation et réclamation.',
		5150 => 'Conditions générales de vente des formations ADéPA : devis, convention, tarifs, paiement, annulation, rétractation et attestation de suivi.',
		5151 => 'Réclamation auprès du centre de formation ADéPA : qui peut réclamer, comment faire, accusé de réception sous 5 jours ouvrés et suites données.',
		5152 => 'Formations ADéPA et situation de handicap : échange préalable, aménagements du parcours et référent handicap. Réponse sous 48 h ouvrées.',
	);
	foreach ($descriptions as $id => $texte) {
		if (get_post($id) && trim((string) get_post_meta($id, 'rank_math_description', true)) === '') {
			update_post_meta($id, 'rank_math_description', $texte);
			$bilan['descriptions']++;
		}
	}
	$categories = array(
		'nos-actions'      => 'Les actions de l’association ADéPA en Île-de-France : éducation par l’animation, insertion par le numérique et projets avec les jeunes.',
		'action-sportives' => 'Les actions sportives de l’association ADéPA : l’activité physique comme outil d’éducation, de prévention et d’inclusion.',
		'studio-ugc-a2pa'  => 'Studio A2PA, le studio de création d’ADéPA : vidéo, réseaux sociaux et création de contenu pour l’insertion des jeunes.',
		'digital'          => 'Le numérique au service de l’insertion : les projets digitaux de l’association ADéPA, dont le Studio A2PA.',
	);
	foreach ($categories as $slug => $texte) {
		$terme = get_term_by('slug', $slug, 'category');
		if ($terme && trim((string) get_term_meta($terme->term_id, 'rank_math_description', true)) === '') {
			update_term_meta($terme->term_id, 'rank_math_description', $texte);
			$bilan['descriptions']++;
		}
	}

	// 2. Contenus, titres et extraits.
	$types = "'post','page','wp_block','elementor_library'";
	$lignes = $wpdb->get_results("SELECT ID, post_title, post_content, post_excerpt FROM {$wpdb->posts}
		WHERE post_type IN ($types) AND post_status NOT IN ('trash','auto-draft','inherit')
		AND (post_content LIKE '%—%' OR post_content LIKE '%&mdash;%' OR post_title LIKE '%—%' OR post_excerpt LIKE '%—%'
		  OR post_content LIKE '%30 rue Nouvelle, 77190 Dammarie-lès-Lys — actions%' OR post_content LIKE '%réservation de freelances%')");
	foreach ($lignes as $l) {
		$contenu = $l->post_content;
		$avant = array('post_title' => $l->post_title, 'post_content' => $l->post_content, 'post_excerpt' => $l->post_excerpt);
		$c1 = str_replace('Siège</b><span>30 rue Nouvelle, 77190 Dammarie-lès-Lys — actions', 'Siège</b><span>7 rue André Malraux, 77000 Melun · actions', $contenu, $s);
		$bilan['siege'] += $s;
		$c1 = str_replace('la réservation de freelances qualifiés', 'la réservation d’intervenants qualifiés', $c1, $f);
		$bilan['freelance'] += $f;
		$c2 = adepa_cf_sans_tirets($c1);
		$titre = adepa_cf_titre_sans_tirets($l->post_title);
		$extrait = adepa_cf_sans_tirets($l->post_excerpt);
		$maj = array();
		if ($c2 !== $contenu) {
			$maj['post_content'] = $c2;
			$bilan['contenus']++;
		}
		if ($titre !== $l->post_title) {
			$maj['post_title'] = $titre;
			$bilan['titres']++;
		}
		if ($extrait !== $l->post_excerpt) {
			$maj['post_excerpt'] = $extrait;
		}
		if ($maj) {
			add_post_meta($l->ID, '_adepa_cf_avant_142', wp_slash(wp_json_encode($avant)), true);
			$wpdb->update($wpdb->posts, $maj, array('ID' => $l->ID));
			clean_post_cache($l->ID);
		}
	}

	// 3. Les contenus Elementor (même règle, et le siège de l'accueil).
	$ids = $wpdb->get_col("SELECT DISTINCT pm.post_id FROM {$wpdb->postmeta} pm JOIN {$wpdb->posts} p ON p.ID = pm.post_id
		WHERE pm.meta_key = '_elementor_data' AND p.post_type <> 'revision'
		AND (pm.meta_value LIKE '%—%' OR pm.meta_value LIKE '%\\\\u2014%' OR pm.meta_value LIKE '%&mdash;%' OR pm.meta_value LIKE '%rue Nouvelle%')");
	foreach ($ids as $id) {
		$brut = get_post_meta($id, '_elementor_data', true);
		$data = is_string($brut) ? json_decode($brut) : null;
		if ($data === null) {
			continue;
		}
		$n = 0;
		$siege = 0;
		adepa_cf_142_siege($data, $siege);
		adepa_cf_tirets_profond($data, $n);
		if (!$n && !$siege) {
			continue;
		}
		$json = wp_json_encode($data);
		if (!$json) {
			continue;
		}
		add_post_meta($id, '_adepa_cf_elementor_avant_142', wp_slash($brut), true);
		update_post_meta($id, '_elementor_data', wp_slash($json));
		delete_post_meta($id, '_elementor_element_cache');
		delete_post_meta($id, '_elementor_css');
		$bilan['elementor']++;
		$bilan['siege'] += $siege;
	}

	// 4. Titres et descriptions saisis dans Rank Math.
	$metas = $wpdb->get_results("SELECT meta_id, post_id, meta_key, meta_value FROM {$wpdb->postmeta}
		WHERE meta_key IN ('rank_math_title','rank_math_description','rank_math_facebook_title','rank_math_facebook_description','rank_math_twitter_title','rank_math_twitter_description')
		AND meta_value LIKE '%—%'");
	foreach ($metas as $m) {
		$nv = (substr($m->meta_key, -5) === 'title') ? adepa_cf_titre_sans_tirets($m->meta_value) : adepa_cf_sans_tirets($m->meta_value);
		if ($nv !== $m->meta_value) {
			add_post_meta($m->post_id, '_adepa_cf_avant_142_' . $m->meta_key, wp_slash($m->meta_value), true);
			update_post_meta($m->post_id, $m->meta_key, $nv);
			$bilan['metas']++;
		}
	}
	foreach (array('rank-math-options-titles', 'rank-math-options-general') as $opt) {
		$val = get_option($opt);
		if (is_array($val)) {
			$avant = $val;
			array_walk_recursive($val, function (&$x) {
				if (is_string($x) && strpos($x, '—') !== false) {
					$x = adepa_cf_titre_sans_tirets($x);
				}
			});
			if ($val !== $avant) {
				update_option('_adepa_cf_avant_142_' . $opt, $avant, false);
				update_option($opt, $val);
				$bilan['options']++;
			}
		}
	}
	foreach (array('blogname', 'blogdescription') as $opt) {
		$v = get_option($opt);
		$nv = adepa_cf_titre_sans_tirets($v);
		if ($nv !== $v) {
			update_option('_adepa_cf_avant_142_' . $opt, $v, false);
			update_option($opt, $nv);
			$bilan['options']++;
		}
	}

	if (class_exists('\Elementor\Plugin') && isset(\Elementor\Plugin::$instance->files_manager)) {
		\Elementor\Plugin::$instance->files_manager->clear_cache();
	}
	update_option('adepa_cf_migration_142', array('date' => current_time('mysql'), 'bilan' => $bilan), false);
}

/** Le siège de l'accueil, dans les données Elementor. */
function adepa_cf_142_siege(&$v, &$n) {
	if (is_string($v)) {
		$c = 0;
		$v = str_replace('Siège</b><span>30 rue Nouvelle, 77190 Dammarie-lès-Lys — actions', 'Siège</b><span>7 rue André Malraux, 77000 Melun · actions', $v, $c);
		$n += $c;
		return;
	}
	if (is_array($v)) {
		foreach ($v as &$x) {
			adepa_cf_142_siege($x, $n);
		}
		unset($x);
		return;
	}
	if (is_object($v)) {
		foreach (get_object_vars($v) as $k => $x) {
			adepa_cf_142_siege($x, $n);
			$v->$k = $x;
		}
	}
}
