<?php
/**
 * ADéPA IA, LE PROF ASSISTANT DES PARCOURS EN LIGNE (28/09/2026).
 *
 * Il vivait sur toulali.fr/lex/ sous le nom TOULALIA. Toulali devient la page
 * d'accueil de Pilote (le CRM des créateurs d'activité) : l'assistant passe
 * sur adepa77.fr/prof-assistant/, sous le nom ADéPA IA.
 *
 * ⚠ LE MOTEUR N'A PAS ENCORE DÉMÉNAGÉ. La page appelle une route de CE site
 * (adepa/v1/prof-assistant), qui relaie la question, côté serveur, au moteur
 * toujours installé sur toulali.fr (codes d'accès, contenu des leçons, clé du
 * modèle). Le jour où le moteur est installé ici, on ne change QUE le réglage
 * « prof_assistant_backend » : la page et ses liens ne bougent plus.
 * Aucune clé ne transite ni n'est stockée ici.
 */
if (!defined('ABSPATH')) {
	exit;
}

function adepa_cf_prof_backend() {
	return adepa_cf_reglage('prof_assistant_backend', 'https://toulali.fr/wp-json/toulalia/v1/lex');
}

add_action('rest_api_init', function () {
	register_rest_route('adepa/v1', '/prof-assistant', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',
		'callback'            => 'adepa_cf_prof_relais',
	));
});

function adepa_cf_prof_relais(WP_REST_Request $req) {
	nocache_headers();
	$ip  = isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'])) : '0';
	$cle = 'adepa_pa_' . md5($ip);
	$n   = (int) get_transient($cle);
	if ($n >= 60) {
		return new WP_REST_Response(array('error' => 'Trop de questions en une heure. Réessaie un peu plus tard.'), 429);
	}
	set_transient($cle, $n + 1, HOUR_IN_SECONDS);

	$code = substr(sanitize_text_field((string) $req->get_param('code')), 0, 60);
	$q    = trim((string) $req->get_param('question'));
	if (mb_strlen($q) < 3 || mb_strlen($q) > 4000) {
		return new WP_REST_Response(array('error' => 'Question trop courte ou trop longue.'), 400);
	}
	$hist = $req->get_param('historique');
	$hist = is_array($hist) ? array_slice($hist, -6) : array();
	$propre = array();
	foreach ($hist as $h) {
		if (is_array($h) && isset($h['role'], $h['contenu'])) {
			$propre[] = array('role' => $h['role'] === 'assistant' ? 'assistant' : 'user', 'contenu' => mb_substr((string) $h['contenu'], 0, 4000));
		}
	}

	$r = wp_remote_post(adepa_cf_prof_backend(), array(
		'timeout' => 45,
		'headers' => array('Content-Type' => 'application/json', 'Origin' => home_url()),
		'body'    => wp_json_encode(array('code' => $code, 'question' => $q, 'historique' => $propre)),
	));
	if (is_wp_error($r)) {
		return new WP_REST_Response(array('error' => 'ADéPA IA ne répond pas pour le moment. Réessaie dans quelques minutes.'), 502);
	}
	$statut = (int) wp_remote_retrieve_response_code($r);
	$json   = json_decode(wp_remote_retrieve_body($r), true);
	if (!is_array($json)) {
		return new WP_REST_Response(array('error' => 'ADéPA IA n’a pas pu répondre.'), 502);
	}
	// Le moteur parle encore de TOULALIA : on renomme au passage.
	array_walk_recursive($json, function (&$v) {
		if (is_string($v)) {
			$v = preg_replace('/\bTOULALIA\b/iu', 'ADéPA IA', $v);
		}
	});
	return new WP_REST_Response($json, $statut ?: 200);
}

add_shortcode('adepa_prof_assistant', function () {
	$html = file_get_contents(ADEPA_CF_DIR . 'inc/prof-assistant.html');
	$formule = adepa_cf_teachizy('formations/toulalia-accompagnement-a-la-certification');
	$html = str_replace(array('%%ENDPOINT%%', '%%FORMULE%%'), array(esc_url(rest_url('adepa/v1/prof-assistant')), esc_url($formule)), $html);
	return '<div class="afc afc-prof">'
		. '<p class="afc-surtitre">Parcours en ligne · formule accompagnée</p>'
		. '<h1 class="afc-h1">ADéPA IA, ton prof assistant</h1>'
		. '<p class="afc-chapo">Il connaît le contenu des six parcours en ligne. Pose-lui tes questions quand tu bloques, à toute heure : il t’explique, il ne fait pas à ta place.</p>'
		. $html . '</div>';
});
