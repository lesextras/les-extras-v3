<?php
/**
 * Les types de contenu : la formation, sa thématique, et la demande de devis.
 */
if (!defined('ABSPATH')) {
	exit;
}

/** Les champs d'une fiche, dans l'ordre de l'écran d'édition. */
function adepa_cf_champs() {
	return array(
		'targetAudience' => array('Public visé', 'texte'),
		'prerequisites'  => array('Prérequis', 'texte'),
		'objectives'     => array('Objectifs pédagogiques', 'texte'),
		'program'        => array('Programme', 'texte'),
		'methodology'    => array('Méthodologie pédagogique', 'texte'),
		'evaluation'     => array('Modalités d’évaluation', 'texte'),
		'city'           => array('Lieu', 'ligne'),
		'durationHours'  => array('Durée en heures (laisser vide si la durée est en minutes)', 'ligne'),
		'durationMinutes'=> array('Durée en minutes (parcours courts)', 'ligne'),
		'priceFrom'      => array('Prix « à partir de » en euros (vide = sur devis). Ne publier qu’un prix décidé.', 'ligne'),
		'enrollUrl'      => array('Lien « Commencer la formation » (parcours gratuits)', 'ligne'),
	);
}

add_action('init', 'adepa_cf_enregistrer_types');
function adepa_cf_enregistrer_types() {
	// La thématique AVANT la formation : ses règles d'adresse doivent passer
	// avant celles des fiches, sinon /formations/thematique/x/ est lu comme une fiche.
	register_taxonomy(
		ADEPA_CF_THEME,
		ADEPA_CF_TYPE,
		array(
			'labels'       => array('name' => 'Thématiques', 'singular_name' => 'Thématique'),
			'public'       => true,
			'hierarchical' => true,
			'rewrite'      => array('slug' => 'formations/thematique', 'with_front' => false),
			'show_in_rest' => true,
			'show_admin_column' => true,
		)
	);

	register_post_type(
		ADEPA_CF_TYPE,
		array(
			'labels'       => array(
				'name'          => 'Formations',
				'singular_name' => 'Formation',
				'add_new_item'  => 'Ajouter une formation',
				'edit_item'     => 'Modifier la formation',
				'all_items'     => 'Toutes les formations',
				'menu_name'     => 'Centre de formation',
			),
			'public'       => true,
			'has_archive'  => 'formations',
			'rewrite'      => array('slug' => 'formations', 'with_front' => false),
			'menu_icon'    => 'dashicons-welcome-learn-more',
			'menu_position'=> 21,
			'supports'     => array('title', 'excerpt', 'thumbnail', 'page-attributes'),
			'show_in_rest' => true,
		)
	);

	// Les demandes de devis : jamais publiques, visibles seulement dans l'administration.
	register_post_type(
		ADEPA_CF_DEMANDE,
		array(
			'labels'        => array(
				'name'          => 'Demandes de devis',
				'singular_name' => 'Demande de devis',
				'edit_item'     => 'Demande de devis',
			),
			'public'        => false,
			'show_ui'       => true,
			'show_in_menu'  => 'edit.php?post_type=' . ADEPA_CF_TYPE,
			'supports'      => array('title'),
			'capability_type' => 'post',
			'capabilities'  => array('create_posts' => 'do_not_allow'),
			'map_meta_cap'  => true,
		)
	);
}

/* ----------------------------------------------------- écran d'édition */

add_action('add_meta_boxes', function () {
	add_meta_box('adepa_cf_fiche', 'Contenu de la fiche', 'adepa_cf_boite_fiche', ADEPA_CF_TYPE, 'normal', 'high');
	add_meta_box('adepa_cf_statut', 'Type de formation', 'adepa_cf_boite_statut', ADEPA_CF_TYPE, 'side');
	add_meta_box('adepa_cf_demande', 'La demande', 'adepa_cf_boite_demande', ADEPA_CF_DEMANDE, 'normal', 'high');
});

function adepa_cf_boite_fiche($post) {
	wp_nonce_field('adepa_cf_fiche', 'adepa_cf_nonce');
	echo '<p>Le résumé (extrait) est la présentation courte, affichée sur la carte du catalogue et en tête de fiche.</p>';
	foreach (adepa_cf_champs() as $cle => $c) {
		$v = get_post_meta($post->ID, '_af_' . $cle, true);
		echo '<p><label style="font-weight:600;display:block;margin-bottom:4px" for="af_' . esc_attr($cle) . '">' . esc_html($c[0]) . '</label>';
		if ($c[1] === 'texte') {
			echo '<textarea class="widefat" rows="6" id="af_' . esc_attr($cle) . '" name="af[' . esc_attr($cle) . ']">' . esc_textarea($v) . '</textarea>';
		} else {
			echo '<input class="widefat" type="text" id="af_' . esc_attr($cle) . '" name="af[' . esc_attr($cle) . ']" value="' . esc_attr($v) . '">';
		}
		echo '</p>';
	}
	echo '<p class="description">Mise en forme : une ligne vide sépare deux paragraphes ; une ligne qui commence par « • » ou « - » devient une puce.</p>';
}

function adepa_cf_boite_statut($post) {
	$gratuit = (bool) get_post_meta($post->ID, '_af_freeOnline', true);
	$opco    = (bool) get_post_meta($post->ID, '_af_certifying', true);
	echo '<p><label><input type="checkbox" name="af_bool[freeOnline]" value="1" ' . checked($gratuit, true, false) . '> Parcours gratuit en ligne</label></p>';
	echo '<p><label><input type="checkbox" name="af_bool[certifying]" value="1" ' . checked($opco, true, false) . '> Action de formation Qualiopi, finançable OPCO</label></p>';
	echo '<p class="description">Une formation non gratuite affiche le formulaire de demande de devis.</p>';
}

add_action('save_post_' . ADEPA_CF_TYPE, function ($id) {
	if (!isset($_POST['adepa_cf_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['adepa_cf_nonce'])), 'adepa_cf_fiche')) {
		return;
	}
	if ((defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) || !current_user_can('edit_post', $id)) {
		return;
	}
	$af = isset($_POST['af']) ? (array) wp_unslash($_POST['af']) : array();
	foreach (adepa_cf_champs() as $cle => $c) {
		if (!array_key_exists($cle, $af)) {
			continue;
		}
		$v = $c[1] === 'texte' ? sanitize_textarea_field($af[$cle]) : sanitize_text_field($af[$cle]);
		if ($cle === 'enrollUrl') {
			$v = esc_url_raw($v);
		}
		update_post_meta($id, '_af_' . $cle, $v);
	}
	$b = isset($_POST['af_bool']) ? (array) $_POST['af_bool'] : array();
	update_post_meta($id, '_af_freeOnline', empty($b['freeOnline']) ? '' : '1');
	update_post_meta($id, '_af_certifying', empty($b['certifying']) ? '' : '1');
});

function adepa_cf_boite_demande($post) {
	$lignes = array(
		'formation' => 'Formation',
		'nom'       => 'Nom',
		'structure' => 'Structure',
		'fonction'  => 'Fonction',
		'email'     => 'E-mail',
		'telephone' => 'Téléphone',
		'participants' => 'Participants',
		'periode'   => 'Période souhaitée',
		'message'   => 'Message',
		'origine'   => 'Page d’origine',
	);
	echo '<table class="widefat striped"><tbody>';
	foreach ($lignes as $cle => $lib) {
		$v = get_post_meta($post->ID, '_ad_' . $cle, true);
		if ($v === '') {
			continue;
		}
		if ($cle === 'email') {
			$v = '<a href="mailto:' . esc_attr($v) . '">' . esc_html($v) . '</a>';
		} else {
			$v = nl2br(esc_html($v));
		}
		echo '<tr><th style="width:180px">' . esc_html($lib) . '</th><td>' . $v . '</td></tr>';
	}
	echo '</tbody></table>';
}

// Colonnes utiles dans la liste des demandes.
add_filter('manage_' . ADEPA_CF_DEMANDE . '_posts_columns', function ($c) {
	return array(
		'cb'        => $c['cb'],
		'title'     => 'Demande',
		'af_email'  => 'E-mail',
		'af_tel'    => 'Téléphone',
		'date'      => 'Reçue le',
	);
});
add_action('manage_' . ADEPA_CF_DEMANDE . '_posts_custom_column', function ($col, $id) {
	if ($col === 'af_email') {
		echo esc_html(get_post_meta($id, '_ad_email', true));
	}
	if ($col === 'af_tel') {
		echo esc_html(get_post_meta($id, '_ad_telephone', true));
	}
}, 10, 2);
