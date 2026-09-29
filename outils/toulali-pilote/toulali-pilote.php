<?php
/**
 * Plugin Name: Toulali, page d'accueil de Pilote
 * Description: toulali.fr n'est plus un organisme de formation (décision du 28/09/2026) : les pages de formation renvoient vers le centre de formation d'ADéPA (adepa77.fr), l'en-tête et le pied de page des pages restantes présentent Pilote.
 * Version: 1.1.3
 * Author: Association ADéPA
 * Requires PHP: 7.4
 *
 * Rien n'est supprimé : les pages de formation restent dans WordPress, elles
 * sont seulement redirigées. Désactiver l'extension rend le site d'avant.
 * ⚠ Le moteur du prof assistant (/wp-json/toulalia/v1/lex) n'est PAS touché :
 * la page adepa77.fr/prof-assistant/ lui relaie les questions.
 */
if (!defined('ABSPATH')) {
	exit;
}

/** Les pages de l'ancien organisme, et où elles vivent désormais. */
function toulali_pilote_redirections() {
	return array(
		'community-manager-ia'          => 'https://adepa77.fr/community-manager/',
		'cm-mobile-100-smartphone'      => 'https://adepa77.fr/formations/',
		'academie'                      => 'https://adepa77.fr/formations/',
		'la-communaute'                 => 'https://adepa77.fr/formations/',
		'se-faire-financer'             => 'https://adepa77.fr/informations-reglementaires/',
		'conseil-financement-formation' => 'https://adepa77.fr/prendre-rendez-vous/',
		'informations-reglementaires'   => 'https://adepa77.fr/informations-reglementaires/',
		'acces-handicap'                => 'https://adepa77.fr/accessibilite-handicap/',
		'conditions-generales-de-vente' => 'https://adepa77.fr/cgv-formation/',
		'notre-histoire'                => 'https://adepa77.fr/notre-histoire/',
		'lex'                           => 'https://adepa77.fr/prof-assistant/',
	);
}

add_action('template_redirect', function () {
	if (is_admin()) {
		return;
	}
	$chemin = trim((string) wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH), '/');
	$r = toulali_pilote_redirections();
	if (isset($r[$chemin])) {
		wp_redirect($r[$chemin], 301, 'Toulali');
		exit;
	}
}, 1);

/* ---------- Plan du site : seulement ce qui reste sur toulali.fr ---------- */
add_filter('wp_sitemaps_posts_query_args', function ($args, $type) {
	if ($type === 'page') {
		$args['post__not_in'] = array_merge((array) ($args['post__not_in'] ?? array()), toulali_pilote_ids_rediriges());
	}
	return $args;
}, 10, 2);
function toulali_pilote_ids_rediriges() {
	$ids = array();
	foreach (array_keys(toulali_pilote_redirections()) as $slug) {
		$p = get_page_by_path($slug);
		if ($p) {
			$ids[] = (int) $p->ID;
		}
	}
	return $ids;
}

/* ---------- Descriptions des pages restantes ---------- */
function toulali_pilote_descriptions() {
	return array(
		'mentions-legales'                  => 'Mentions légales de toulali.fr, édité par l’association ADéPA (loi 1901, Melun) : éditeur, hébergeur, directeur de la publication et contact.',
		'conditions-generales-dutilisation' => 'Conditions générales d’utilisation de toulali.fr, le site de Pilote, édité par l’association ADéPA.',
		'politique-de-confidentialite'      => 'Ce que l’association ADéPA fait de vos données quand vous visitez toulali.fr : finalités, durées de conservation, prestataires et vos droits.',
	);
}

/* ---------- En-tête, pied de page et textes des pages restantes ---------- */
add_action('template_redirect', function () {
	if (is_admin() || is_feed() || wp_doing_ajax() || (defined('REST_REQUEST') && REST_REQUEST)) {
		return;
	}
	ob_start('toulali_pilote_filtrer');
}, 99);

function toulali_pilote_filtrer($html) {
	if (!is_string($html) || stripos($html, '<html') === false) {
		return $html;
	}
	/*
	 * 1.1.3 : LES POLICES GOOGLE NE BLOQUENT PLUS L'AFFICHAGE (audit du 28/09,
	 * 4,1 s sur mobile). La feuille est chargée en préchargement puis appliquée
	 * dès qu'elle arrive ; `display=swap` affiche le texte tout de suite dans la
	 * police de repli. Mêmes familles, mêmes graisses : le rendu final est
	 * identique, il arrive seulement plus tôt.
	 */
	$html = preg_replace_callback(
		'#<link href="(https://fonts\.googleapis\.com/css2\?[^"]+)" rel="stylesheet">#',
		function ($m) {
			$u = $m[1];
			return '<link rel="preload" as="style" href="' . $u . '" onload="this.onload=null;this.rel=\'stylesheet\'"><noscript><link rel="stylesheet" href="' . $u . '"></noscript>';
		},
		$html,
		1
	);
	// Menu des pages intérieures (ancien organisme de formation).
	$html = preg_replace(
		'#<ul class="cmia-clean-nav__links">.*?</ul>#s',
		'<ul class="cmia-clean-nav__links"><li><a href="https://toulali.fr/">Accueil</a></li><li><a href="https://toulali.fr/#espaces">Les deux espaces</a></li><li><a href="https://toulali.fr/#ressource">Comment ça marche</a></li><li><a href="https://toulali.fr/#faq">Questions</a></li><li><a href="https://adepa77.fr/" target="_blank" rel="noopener">Nous découvrir</a></li></ul>',
		$html
	);
	$html = preg_replace(
		'#<a class="cmia-clean-nav__cta" href="[^"]*">[^<]*</a>#',
		'<a class="cmia-clean-nav__cta" href="https://pilote.toulali.fr/">Ouvrir Pilote</a>',
		$html
	);
	// Pied de page des pages intérieures.
	$html = preg_replace_callback('#(<footer class="hp-footer">\s*<div class="wrap">)(.*?)(</div>\s*</footer>)#s', function ($m) {
		preg_match('#<a href="[^"]*" class="logo".*?</a>#s', $m[2], $logo);
		return $m[1] . toulali_pilote_pied($logo[0] ?? '') . $m[3];
	}, $html);
	// Textes restés de l'ancien organisme.
	$html = str_replace(
		array(
			'dont le siège social est situé au 30 rue Nouvelle, 77190 Dammarie-lès-Lys',
			'Organisme de formation certifié Qualiopi.',
		),
		array(
			'dont le siège social est situé au 7 rue André Malraux, 77000 Melun',
			'Toulali est un service de l’association ADéPA : ADéPA est l’organisme de formation certifié Qualiopi, sur adepa77.fr.',
		),
		$html
	);
	// Description : ces pages sont rendues par un gabarit qui écrit son propre
	// <head> sans passer par wp_head. On l'ajoute ici, par l'adresse.
	$chemin = trim((string) wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH), '/');
	$d = toulali_pilote_descriptions();
	if (isset($d[$chemin]) && stripos($html, 'name="description"') === false) {
		$html = preg_replace('#<head([^>]*)>#i', '<head$1>' . "\n" . '<meta name="description" content="' . esc_attr($d[$chemin]) . '">', $html, 1);
	}
	// Bandeau cookies compact sur téléphone (146 px → 86 px), même règle qu'adepa77.
	if (stripos($html, 'toulali-pilote-cookies') === false) {
		$html = preg_replace('#</head>#i', '<style id="toulali-pilote-cookies">@media (max-width:640px){#cookie-notice .cookie-notice-container{display:flex;align-items:center;gap:10px;padding:10px 40px 10px 12px;text-align:left}#cookie-notice #cn-notice-text{font-size:12px;line-height:1.35;margin:0;flex:1;display:block}#cookie-notice #cn-notice-buttons{display:flex;flex-direction:column;gap:6px;margin:0;flex:none}#cookie-notice .cn-button{margin:0;padding:6px 12px;font-size:12px;line-height:1.2;white-space:nowrap}#cookie-notice .cn-close-icon{top:8px;right:6px;margin:0}}</style>' . "\n" . '</head>', $html, 1);
	}
	// Un titre h1 pour les lecteurs d'écran quand la page n'en a aucun.
	if (stripos($html, '<h1') === false && preg_match('#<title>(.*?)</title>#s', $html, $t)) {
		$titre = trim(preg_replace('/\s+[–|·-]\s+TOULALI\s*$/iu', '', html_entity_decode(strip_tags($t[1]), ENT_QUOTES, 'UTF-8')));
		$html = preg_replace('#(<body[^>]*>)#i', '$1<h1 style="position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap">' . esc_html($titre) . '</h1>', $html, 1);
	}
	return toulali_pilote_sans_tirets($html);
}

function toulali_pilote_pied($logo) {
	return '<div class="footer-grid"><div>' . $logo
		. '<p>Toulali, un service de l’association ADéPA</p><p>Association loi 1901, SIRET 820 051 852 00011</p><p>Siège : 7 rue André Malraux, 77000 Melun</p><p>assoc.adepa@gmail.com</p></div>'
		. '<div><h4>Pilote</h4><ul><li><a href="https://pilote.toulali.fr/association">Piloter mon association</a></li><li><a href="https://pilote.toulali.fr/academie">Piloter mon académie</a></li><li><a href="https://pilote.toulali.fr/centre-d-aide">Centre d’aide</a></li><li><a href="https://pilote.toulali.fr/nous-contacter">Nous contacter</a></li></ul></div>'
		. '<div><h4>L’association</h4><ul><li><a href="https://adepa77.fr/" target="_blank" rel="noopener">ADéPA</a></li><li><a href="https://adepa77.fr/formations/">Les formations d’ADéPA</a></li><li><a href="https://adepa77.fr/prof-assistant/">ADéPA IA, le prof assistant</a></li><li><a href="mailto:assoc.adepa@gmail.com">Contactez-nous</a></li></ul></div>'
		. '<div><h4>Informations</h4><ul><li><a href="https://toulali.fr/mentions-legales/">Mentions légales</a></li><li><a href="https://toulali.fr/politique-de-confidentialite/">Confidentialité</a></li><li><a href="https://toulali.fr/conditions-generales-dutilisation/">CGU</a></li><li><a href="https://pilote.toulali.fr/legal">Conditions de Pilote</a></li></ul></div></div>'
		. '<div class="footer-bottom"><span>© 2026 Toulali, un service de l’association ADéPA.</span><span>Pilote, le logiciel des créateurs d’activité</span></div>';
}

/* ---------- Tirets cadratins (même règle que adepa77.fr) ---------- */
function toulali_pilote_squelette($t) {
	return preg_replace('/[^\p{L}\p{N}]+/u', '', html_entity_decode((string) $t, ENT_QUOTES, 'UTF-8'));
}
function toulali_pilote_morceau($m) {
	$t = str_replace('&mdash;', '—', $m);
	if (strpos($t, '—') === false) {
		return $m;
	}
	$e = '[ \x{00A0}\x{202F}]*';
	if (preg_match_all('/' . $e . '—' . $e . '/u', $t) === 2 && preg_match('/^(.*\S)' . $e . '—' . $e . '(.+?)' . $e . '—' . $e . '(.*)$/us', $t, $p)) {
		return $p[1] . ' (' . $p[2] . ')' . ($p[3] !== '' && !preg_match('/^[\s,.;:!?)]/u', $p[3]) ? ' ' : '') . $p[3];
	}
	$deux = strpos($t, ':') !== false;
	$premier = true;
	return preg_replace_callback('/' . $e . '—' . $e . '(.?)/u', function ($x) use (&$premier, $deux) {
		$s = $x[1];
		$r = ($s !== '' && preg_match('/\p{Lu}/u', $s)) ? '. ' . $s : (($premier && !$deux) ? ' : ' . $s : ', ' . $s);
		$premier = false;
		return $r;
	}, $t);
}
function toulali_pilote_sans_tirets($html) {
	if (strpos($html, '—') === false && strpos($html, '&mdash;') === false) {
		return $html;
	}
	$corps = strpos($html, '<body');
	if ($corps === false) {
		return $html;
	}
	$tete = substr($html, 0, $corps);
	$reste = substr($html, $corps);
	// On protège scripts, styles et zones de texte : seul le texte lu change.
	$parts = preg_split('#(<script\b.*?</script>|<style\b.*?</style>|<textarea\b.*?</textarea>|<[^>]*>)#is', $reste, -1, PREG_SPLIT_DELIM_CAPTURE);
	if ($parts === false) {
		return $html;
	}
	foreach ($parts as $i => $p) {
		if ($p !== '' && $p[0] !== '<') {
			$n = toulali_pilote_morceau($p);
			if (toulali_pilote_squelette($n) === toulali_pilote_squelette($p)) {
				$parts[$i] = $n;
			}
		}
	}
	// Le titre de l'onglet aussi.
	$tete = preg_replace_callback('#<title>(.*?)</title>#s', function ($m) {
		return '<title>' . preg_replace('/\s*(—|&mdash;|&#8212;)\s*/u', ' · ', $m[1]) . '</title>';
	}, $tete);
	return $tete . implode('', $parts);
}

/* ---------- Accueil plus léger ----------
 * La page d'accueil est un gabarit autonome du thème : elle n'utilise ni
 * Tutor LMS, ni WooCommerce, ni Elementor. Leurs feuilles et scripts pesaient
 * l'essentiel des 96 requêtes. On ne les retire QUE de l'accueil : les
 * extensions restent actives (données des anciens apprenants et commandes).
 */
function toulali_pilote_inutile_sur_accueil($src) {
	$src = (string) $src;
	foreach (array('/wp-includes/js/jquery/ui/', '/wp-includes/js/jquery/jquery.ui.touch-punch', '/plugins/tutor', '/plugins/woocommerce/', '/plugins/header-footer-elementor/', '/plugins/elementor/', '/plugins/astra-sites/', '/uploads/elementor/css/', 'fonts.googleapis.com/css?family=Roboto', '/plugins/google-site-kit/dist/assets/js/googlesitekit-events-provider-woocommerce') as $motif) {
		if (strpos($src, $motif) !== false) {
			return true;
		}
	}
	return false;
}
function toulali_pilote_alleger() {
	if (is_admin() || !is_front_page()) {
		return;
	}
	global $wp_styles, $wp_scripts;
	foreach (array($wp_styles, $wp_scripts) as $file) {
		if (!$file) {
			continue;
		}
		foreach ((array) $file->queue as $h) {
			$src = isset($file->registered[$h]) ? $file->registered[$h]->src : '';
			if (toulali_pilote_inutile_sur_accueil($src)) {
				$file === $wp_styles ? wp_dequeue_style($h) : wp_dequeue_script($h);
			}
		}
	}
}
add_action('wp_enqueue_scripts', 'toulali_pilote_alleger', 9999);
add_action('wp_print_styles', 'toulali_pilote_alleger', 9999);
add_action('wp_print_scripts', 'toulali_pilote_alleger', 9999);
add_action('wp_print_footer_scripts', 'toulali_pilote_alleger', 1);
