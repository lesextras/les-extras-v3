<?php
/**
 * ÉTIQUETTES DES FORMULAIRES DE DON ET D'ADHÉSION.
 *
 * Les formulaires [adepa_don] et [adepa_adhesion] viennent de l'extrait
 * WPCode « ADéPA — Dons & Adhésions (Stripe) ». Leurs champs n'ont qu'un
 * texte indicatif (placeholder), que les lecteurs d'écran ne lisent pas
 * toujours. Plutôt que de toucher au code de paiement, on complète ici le
 * HTML produit : chaque champ sans étiquette reçoit un aria-label égal à son
 * texte indicatif. Rien ne change à l'écran, ni dans ce qui est envoyé.
 */
if (!defined('ABSPATH')) {
	exit;
}

add_filter('do_shortcode_tag', function ($html, $tag) {
	if (!in_array($tag, array('adepa_don', 'adepa_adhesion'), true) || !is_string($html) || $html === '') {
		return $html;
	}
	return adepa_cf_etiqueter_champs($html);
}, 20, 2);

function adepa_cf_etiqueter_champs($html) {
	return preg_replace_callback('/<(input|textarea|select)\b([^>]*)>/i', function ($m) {
		$attrs = $m[2];
		if (preg_match('/\baria-label(ledby)?\s*=/i', $attrs)) {
			return $m[0];
		}
		if (preg_match('/\btype\s*=\s*["\']?(hidden|submit|button|radio|checkbox)\b/i', $attrs)) {
			return $m[0];
		}
		if (!preg_match('/\bplaceholder\s*=\s*"([^"]*)"/i', $attrs, $p) && !preg_match("/\\bplaceholder\\s*=\\s*'([^']*)'/i", $attrs, $p)) {
			return $m[0];
		}
		// La valeur est déjà échappée dans l'attribut d'origine : on la reprend telle quelle.
		return '<' . $m[1] . ' aria-label="' . str_replace('"', '&quot;', $p[1]) . '"' . $attrs . '>';
	}, $html);
}
