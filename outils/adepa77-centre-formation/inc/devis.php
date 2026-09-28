<?php
/**
 * LA DEMANDE DE DEVIS.
 *
 * Chaque demande est ENREGISTRÉE dans l'administration (Centre de formation →
 * Demandes de devis) avant l'envoi de l'e-mail : un courriel qui se perd ne
 * fait pas perdre la demande. Trois protections contre les robots : un champ
 * piège invisible, un délai minimal de remplissage, et un plafond de cinq
 * demandes par heure et par adresse.
 */
if (!defined('ABSPATH')) {
	exit;
}

function adepa_cf_formulaire_devis($formation_id = 0) {
	$titre = $formation_id ? get_the_title($formation_id) : '';
	$retour = $formation_id ? get_permalink($formation_id) : adepa_cf_url_catalogue();
	$erreur = isset($_GET['devis']) && $_GET['devis'] === 'erreur'; // phpcs:ignore
	$ok     = isset($_GET['devis']) && $_GET['devis'] === 'ok' && !$formation_id; // phpcs:ignore
	ob_start();
	?>
	<?php if ($erreur) : ?><p class="afc-alerte">La demande n’a pas pu partir. Vérifiez les champs obligatoires, ou écrivez-nous à <?php echo esc_html(adepa_cf_organisme()['email']); ?>.</p><?php endif; ?>
	<?php if ($ok) : ?><p class="afc-alerte afc-alerte--ok">Votre demande est bien partie. Nous revenons vers vous sous 72&nbsp;h ouvrées.</p><?php endif; ?>
	<form class="afc-form" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
		<input type="hidden" name="action" value="adepa_cf_devis">
		<input type="hidden" name="formation" value="<?php echo (int) $formation_id; ?>">
		<input type="hidden" name="retour" value="<?php echo esc_url($retour); ?>">
		<input type="hidden" name="t" value="<?php echo esc_attr((string) time()); ?>">
		<p class="afc-piege" aria-hidden="true"><label>Site web <input type="text" name="site_web" tabindex="-1" autocomplete="off"></label></p>
		<?php if ($titre) : ?><p class="afc-petit">Formation&nbsp;: <strong><?php echo esc_html($titre); ?></strong></p><?php endif; ?>
		<label>Prénom et nom *<input type="text" name="nom" required maxlength="120" autocomplete="name"></label>
		<label>Structure<input type="text" name="structure" maxlength="160" autocomplete="organization"></label>
		<label>Fonction<input type="text" name="fonction" maxlength="120"></label>
		<label>E-mail *<input type="email" name="email" required maxlength="160" autocomplete="email"></label>
		<label>Téléphone<input type="tel" name="telephone" maxlength="30" autocomplete="tel"></label>
		<div class="afc-form__ligne">
			<label>Participants<input type="number" name="participants" min="1" max="500"></label>
			<label>Période souhaitée<input type="text" name="periode" maxlength="80" placeholder="Ex. : janvier 2027"></label>
		</div>
		<label>Votre besoin<textarea name="message" rows="4" maxlength="3000" placeholder="Public accueilli, objectifs, contraintes…"></textarea></label>
		<p class="afc-mini">Vos coordonnées servent uniquement à répondre à cette demande et à établir le devis. Elles ne sont ni cédées ni utilisées pour de la prospection. <a href="<?php echo esc_url(adepa_cf_url_page('confidentialites')); ?>">Confidentialité</a>.</p>
		<button type="submit" class="afc-bouton">Envoyer ma demande</button>
	</form>
	<?php
	return ob_get_clean();
}

add_action('admin_post_nopriv_adepa_cf_devis', 'adepa_cf_recevoir_devis');
add_action('admin_post_adepa_cf_devis', 'adepa_cf_recevoir_devis');

function adepa_cf_recevoir_devis() {
	$retour = isset($_POST['retour']) ? esc_url_raw(wp_unslash($_POST['retour'])) : home_url('/');
	// La page de retour doit être sur ce site.
	if (wp_parse_url($retour, PHP_URL_HOST) !== wp_parse_url(home_url(), PHP_URL_HOST)) {
		$retour = home_url('/');
	}
	$echec = function () use ($retour) {
		wp_safe_redirect(add_query_arg('devis', 'erreur', $retour) . '#devis');
		exit;
	};

	// Pas de jeton de sécurité (nonce) : les pages sont servies depuis le cache
	// LiteSpeed, un jeton y serait périmé au bout d'un jour et chaque demande
	// échouerait. Un formulaire anonyme n'a rien à protéger d'une falsification :
	// le piège, le délai et le plafond suffisent.
	// Robot : champ piège rempli, ou formulaire rempli en moins de trois secondes.
	if (!empty($_POST['site_web']) || (time() - (int) ($_POST['t'] ?? 0)) < 3) {
		wp_safe_redirect(add_query_arg('devis', 'ok', $retour) . '#devis');
		exit;
	}
	$ip  = isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'])) : '';
	$cle = 'adepa_cf_devis_' . md5($ip . wp_salt());
	$n   = (int) get_transient($cle);
	if ($n >= 5) {
		$echec();
	}
	set_transient($cle, $n + 1, HOUR_IN_SECONDS);

	$d = array(
		'nom'          => sanitize_text_field(wp_unslash($_POST['nom'] ?? '')),
		'structure'    => sanitize_text_field(wp_unslash($_POST['structure'] ?? '')),
		'fonction'     => sanitize_text_field(wp_unslash($_POST['fonction'] ?? '')),
		'email'        => sanitize_email(wp_unslash($_POST['email'] ?? '')),
		'telephone'    => sanitize_text_field(wp_unslash($_POST['telephone'] ?? '')),
		'participants' => (string) absint($_POST['participants'] ?? 0),
		'periode'      => sanitize_text_field(wp_unslash($_POST['periode'] ?? '')),
		'message'      => sanitize_textarea_field(wp_unslash($_POST['message'] ?? '')),
		'origine'      => $retour,
	);
	if ($d['participants'] === '0') {
		$d['participants'] = '';
	}
	if ($d['nom'] === '' || !is_email($d['email'])) {
		$echec();
	}
	$fid = absint($_POST['formation'] ?? 0);
	$d['formation'] = ($fid && get_post_type($fid) === ADEPA_CF_TYPE) ? get_the_title($fid) : 'Besoin sur mesure';

	$id = wp_insert_post(array(
		'post_type'   => ADEPA_CF_DEMANDE,
		'post_status' => 'private',
		'post_title'  => $d['formation'] . ' · ' . $d['nom'] . ($d['structure'] ? ' (' . $d['structure'] . ')' : ''),
	));
	if (is_wp_error($id) || !$id) {
		$echec();
	}
	foreach ($d as $k => $v) {
		update_post_meta($id, '_ad_' . $k, $v);
	}

	$o     = adepa_cf_organisme();
	$corps = "Nouvelle demande de devis sur adepa77.fr\n\n";
	foreach (array('formation' => 'Formation', 'nom' => 'Nom', 'structure' => 'Structure', 'fonction' => 'Fonction', 'email' => 'E-mail', 'telephone' => 'Téléphone', 'participants' => 'Participants', 'periode' => 'Période', 'message' => 'Message') as $k => $lib) {
		if ($d[$k] !== '') {
			$corps .= $lib . ' : ' . $d[$k] . "\n";
		}
	}
	$corps .= "\nRetrouver la demande : " . admin_url('post.php?post=' . $id . '&action=edit') . "\n";
	wp_mail($o['email'], 'Demande de devis : ' . $d['formation'], $corps, array('Reply-To: ' . $d['nom'] . ' <' . $d['email'] . '>'));

	wp_safe_redirect(add_query_arg('devis', 'ok', $retour) . '#devis');
	exit;
}
