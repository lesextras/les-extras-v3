<?php
/**
 * L'AFFICHAGE : catalogue, fiche, cartes, feuille de style.
 *
 * Les gabarits appellent get_header() et get_footer() : l'en-tête et le pied
 * de page du site restent ceux d'adepa77.fr. Seul le contenu est dessiné ici,
 * dans la charte du site (fond nuit, or, crème, Playfair Display + DM Sans).
 */
if (!defined('ABSPATH')) {
	exit;
}

/* ------------------------------------------------------------- gabarits */

add_filter('template_include', function ($gabarit) {
	if (is_singular(ADEPA_CF_TYPE)) {
		return ADEPA_CF_DIR . 'inc/gabarit-fiche.php';
	}
	if (is_post_type_archive(ADEPA_CF_TYPE) || is_tax(ADEPA_CF_THEME)) {
		return ADEPA_CF_DIR . 'inc/gabarit-catalogue.php';
	}
	return $gabarit;
}, 99);

function adepa_cf_page_concernee() {
	if (is_singular(ADEPA_CF_TYPE) || is_post_type_archive(ADEPA_CF_TYPE) || is_tax(ADEPA_CF_THEME)) {
		return true;
	}
	if (is_singular()) {
		// Seuls NOS shortcodes : [adepa_don], [adepa_adhesion] et
		// [adepa_merci_don] viennent d'un extrait WPCode et gardent leur
		// propre apparence (le préfixe « [adepa_ » les attrapait aussi).
		$p = get_post();
		if (!$p) {
			return false;
		}
		foreach (array('adepa_formations', 'adepa_prof_assistant', 'adepa_informations_reglementaires', 'adepa_cgv_formation', 'adepa_reclamation', 'adepa_accessibilite', 'adepa_rdv') as $code) {
			if (has_shortcode((string) $p->post_content, $code)) {
				return true;
			}
		}
		return false;
	}
	return false;
}

add_filter('body_class', function ($c) {
	if (adepa_cf_page_concernee()) {
		$c[] = 'afc-page';
	}
	return $c;
});

add_action('wp_enqueue_scripts', function () {
	wp_register_style('adepa-cf-polices', 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@600;700&display=swap', array(), null);
	wp_register_style('adepa-cf', ADEPA_CF_URL . 'assets/cf.css', array('adepa-cf-polices'), ADEPA_CF_VERSION);
	wp_register_style('adepa-cf-hero', ADEPA_CF_URL . 'assets/afc-hero.css', array('adepa-cf'), ADEPA_CF_VERSION);
	wp_register_script('adepa-cf', ADEPA_CF_URL . 'assets/cf.js', array(), ADEPA_CF_VERSION, true);
	// Prise de rendez-vous (1.3.0) : feuille et script À PART, au nom neuf
	// (LiteSpeed garde l'ancien contenu d'une feuille combinée), chargés
	// seulement sur la page qui porte [adepa_rdv].
	wp_register_style('adepa-cf-rdv', ADEPA_CF_URL . 'assets/afc-rdv.css', array('adepa-cf'), ADEPA_CF_VERSION);
	wp_register_script('adepa-cf-rdv', ADEPA_CF_URL . 'assets/afc-rdv.js', array(), ADEPA_CF_VERSION, true);
	if (adepa_cf_page_concernee()) {
		wp_enqueue_style('adepa-cf');
		if (is_post_type_archive(ADEPA_CF_TYPE)) {
			wp_enqueue_style('adepa-cf-hero');
		}
		wp_enqueue_script('adepa-cf');
		$p = is_singular() ? get_post() : null;
		if ($p && has_shortcode((string) $p->post_content, 'adepa_rdv')) {
			wp_enqueue_style('adepa-cf-rdv');
			wp_enqueue_script('adepa-cf-rdv');
		}
	}
});

/*
 * Les fichiers du rendez-vous échappent aux optimisations de LiteSpeed
 * (combinaison, report, chargement différé) : le script doit charger les
 * créneaux dès l'ouverture de la page, et la feuille garder son adresse
 * versionnée (?ver=) pour qu'une nouvelle version arrive vraiment.
 */
add_filter('script_loader_tag', function ($tag, $handle) {
	if ($handle === 'adepa-cf-rdv' && strpos($tag, 'data-no-optimize') === false) {
		$tag = str_replace('<script ', '<script data-no-optimize="1" data-no-defer="1" ', $tag);
	}
	return $tag;
}, 10, 2);
add_filter('style_loader_tag', function ($tag, $handle) {
	if ($handle === 'adepa-cf-rdv' && strpos($tag, 'data-no-optimize') === false) {
		$tag = str_replace('<link ', '<link data-no-optimize="1" ', $tag);
	}
	return $tag;
}, 10, 2);

/* Titres de page, avec ou sans Rank Math. */
function adepa_cf_titre_catalogue() {
	if (is_tax(ADEPA_CF_THEME)) {
		return single_term_title('', false) . ' · Formations ADéPA';
	}
	return 'Nos formations · Centre de formation ADéPA (Qualiopi)';
}
function adepa_cf_description_catalogue() {
	return 'Formations en établissement finançables OPCO et parcours gratuits en ligne pour le médico-social, par l’organisme de formation ADéPA, certifié Qualiopi.';
}
add_filter('pre_get_document_title', function ($t) {
	return (is_post_type_archive(ADEPA_CF_TYPE) || is_tax(ADEPA_CF_THEME)) ? adepa_cf_titre_catalogue() : $t;
}, 99);
add_filter('rank_math/frontend/title', function ($t) {
	return (is_post_type_archive(ADEPA_CF_TYPE) || is_tax(ADEPA_CF_THEME)) ? adepa_cf_titre_catalogue() : $t;
}, 99);
add_filter('rank_math/frontend/description', function ($d) {
	if (is_post_type_archive(ADEPA_CF_TYPE) || is_tax(ADEPA_CF_THEME)) {
		return adepa_cf_description_catalogue();
	}
	if (is_singular(ADEPA_CF_TYPE)) {
		return wp_trim_words(wp_strip_all_tags(get_the_excerpt()), 26, '…');
	}
	return $d;
}, 99);
add_action('wp_head', function () {
	if (defined('RANK_MATH_VERSION') || !adepa_cf_page_concernee()) {
		return;
	}
	$d = is_singular(ADEPA_CF_TYPE) ? wp_trim_words(wp_strip_all_tags(get_the_excerpt()), 26, '…') : adepa_cf_description_catalogue();
	echo '<meta name="description" content="' . esc_attr($d) . '">' . "\n";
}, 2);

/* ---------------------------------------------------------------- cartes */

function adepa_cf_carte($f) {
	$id    = $f->ID;
	$img   = adepa_cf_couverture($id, 'medium_large');
	$themes = wp_get_post_terms($id, ADEPA_CF_THEME, array('fields' => 'names'));
	$theme = $themes && !is_wp_error($themes) ? $themes[0] : '';
	$duree = adepa_cf_duree($id);
	$gratuit = adepa_cf_est_gratuite($id);
	$publics = (array) adepa_cf_meta($id, 'publics', array());
	$h  = '<article class="afc-carte" data-theme="' . esc_attr(sanitize_title($theme)) . '" data-type="' . ($gratuit ? 'gratuit' : 'qualiopi') . '">';
	$h .= '<a class="afc-carte__lien" href="' . esc_url(get_permalink($id)) . '">';
	if ($img) {
		$h .= '<span class="afc-carte__visuel"><img loading="lazy" src="' . esc_url($img) . '" alt="' . esc_attr($f->post_title) . '"></span>';
	} else {
		// Sans couverture : la thématique, dans la charte, plutôt qu'une initiale.
		$h .= '<span class="afc-carte__visuel afc-carte__visuel--vide"><span>' . esc_html($theme ?: 'Formation ADéPA') . '</span></span>';
	}
	$h .= '<span class="afc-carte__corps">';
	$h .= '<span class="afc-carte__haut">';
	$h .= '<span class="afc-pastille ' . ($gratuit ? 'afc-pastille--or' : 'afc-pastille--rouge') . '">' . ($gratuit ? 'Gratuit · en ligne' : 'Qualiopi · finançable OPCO') . '</span>';
	if ($theme) {
		$h .= '<span class="afc-carte__theme">' . esc_html($theme) . '</span>';
	}
	$h .= '</span>';
	$h .= '<span class="afc-carte__titre">' . esc_html($f->post_title) . '</span>';
	$h .= '<span class="afc-carte__resume">' . esc_html(wp_trim_words(wp_strip_all_tags($f->post_excerpt), 26, '…')) . '</span>';
	if ($publics) {
		$h .= '<span class="afc-carte__publics">';
		foreach (array_slice($publics, 0, 2) as $p) {
			$h .= '<span>' . esc_html($p) . '</span>';
		}
		$h .= '</span>';
	}
	$h .= '<span class="afc-carte__bas"><span>' . esc_html(implode(' · ', array_filter(array($duree, adepa_cf_prix($id))))) . '</span><span class="afc-carte__voir">Voir la formation <span aria-hidden="true">→</span></span></span>';
	$h .= '</span></a></article>';
	return $h;
}

/** Une grille de cartes. `$type` : tout, gratuit ou qualiopi. */
function adepa_cf_grille($type = 'tout', $limite = -1, $exclure = 0) {
	$liste = array();
	foreach (adepa_cf_formations() as $f) {
		if ($exclure && $f->ID === $exclure) {
			continue;
		}
		$g = adepa_cf_est_gratuite($f->ID);
		if (($type === 'gratuit' && !$g) || ($type === 'qualiopi' && $g)) {
			continue;
		}
		$liste[] = $f;
	}
	if ($limite > 0) {
		$liste = array_slice($liste, 0, $limite);
	}
	if (!$liste) {
		return '';
	}
	$h = '<div class="afc-grille">';
	foreach ($liste as $f) {
		$h .= adepa_cf_carte($f);
	}
	return $h . '</div>';
}

/* ------------------------------------------------------------ catalogue */

function adepa_cf_rendu_catalogue() {
	$o   = adepa_cf_organisme();
	$terme = is_tax(ADEPA_CF_THEME) ? get_queried_object() : null;
	$themes = get_terms(array('taxonomy' => ADEPA_CF_THEME, 'hide_empty' => true));
	ob_start();
	?>
	<main class="afc<?php echo $terme ? '' : ' afc--catalogue'; ?>" id="afc-catalogue">
		<?php if ($terme) : ?>
		<section class="afc-hero">
			<p class="afc-surtitre">Centre de formation ADéPA · certifié Qualiopi</p>
			<h1 class="afc-h1"><?php echo esc_html($terme->name); ?></h1>
			<p class="afc-chapo">Des formations pensées pour le médico-social&nbsp;: en établissement, finançables par votre OPCO, et des parcours gratuits en ligne pour les professionnels comme pour les familles.</p>
		</section>
		<?php else : ?>
			<?php echo adepa_cf_hero_catalogue(); // phpcs:ignore ?>
		<?php endif; ?>

		<?php if (!$terme && $themes && !is_wp_error($themes)) : ?>
		<nav class="afc-filtres" aria-label="Filtrer les formations">
			<button type="button" class="afc-filtre is-actif" data-filtre="">Toutes</button>
			<?php foreach ($themes as $t) : ?>
				<button type="button" class="afc-filtre" data-filtre="<?php echo esc_attr($t->slug); ?>"><?php echo esc_html($t->name); ?></button>
			<?php endforeach; ?>
		</nav>
		<?php endif; ?>

		<?php if ($terme) : ?>
			<div class="afc-grille">
				<?php
				foreach (adepa_cf_formations(array('tax_query' => array(array('taxonomy' => ADEPA_CF_THEME, 'field' => 'term_id', 'terms' => $terme->term_id)))) as $f) {
					echo adepa_cf_carte($f); // phpcs:ignore
				}
				?>
			</div>
			<p><a class="afc-lien" href="<?php echo esc_url(adepa_cf_url_catalogue()); ?>">← Toutes les formations</a></p>
		<?php else : ?>
			<section class="afc-section" id="qualiopi" data-bloc="qualiopi">
				<div class="afc-entete">
					<p class="afc-surtitre">En établissement · sur devis</p>
					<h2 class="afc-h2">Formations Qualiopi pour vos équipes</h2>
					<p>Animées dans vos locaux, en classe virtuelle ou en mixte. Programme ajusté à votre public, convention de formation, émargement et attestation de fin de formation.</p>
				</div>
				<?php echo adepa_cf_grille('qualiopi'); // phpcs:ignore ?>
			</section>

			<section class="afc-section afc-section--encadre" id="gratuit" data-bloc="gratuit">
				<div class="afc-entete">
					<p class="afc-surtitre">En ligne · gratuit</p>
					<h2 class="afc-h2">Parcours gratuits, une compétence à la fois</h2>
					<p>Quatre modules, à votre rythme, sans carte bancaire et sans date de fin. Chaque parcours a sa fiche récap A4 à télécharger librement.</p>
				</div>
				<?php echo adepa_cf_grille('gratuit'); // phpcs:ignore ?>
			</section>
			<p class="afc-vide" hidden>Aucune formation dans cette thématique pour le moment.</p>
		<?php endif; ?>

		<section class="afc-section afc-devis-bloc" id="devis">
			<div class="afc-entete">
				<p class="afc-surtitre">Un besoin sur mesure&nbsp;?</p>
				<h2 class="afc-h2">Demandez un devis</h2>
				<p>Décrivez votre équipe et votre besoin&nbsp;: nous revenons vers vous avec un programme et un devis, avant tout engagement.</p>
			</div>
			<?php echo adepa_cf_formulaire_devis(0); // phpcs:ignore ?>
		</section>

		<?php echo adepa_cf_bandeau_reglementaire(); // phpcs:ignore ?>
	</main>
	<?php
	return ob_get_clean();
}

/**
 * LE HAUT DU CATALOGUE /formations/ (28/09/2026, demande de Siham : « comme
 * cette image », un bandeau d'école en ligne avec une carte de choix à droite).
 *
 * ⚠ ON REPREND LA FORME, PAS LES PROMESSES. Aucun « N°1 », aucun nombre
 * d'avis, aucun partenaire, aucun « diplôme reconnu par l'État », aucun
 * « éligible CPF » (le bilan n'est pas encore référencé sur Mon Compte
 * Formation). Tout ce qui est écrit ici est vérifiable : le certificat, son
 * numéro, et le nombre de parcours gratuits, COMPTÉ dans la base.
 *
 * L'image de fond se règle dans Centre de formation → Réglages ; sans image,
 * un dégradé aux couleurs du site.
 */
function adepa_cf_hero_catalogue() {
	$o      = adepa_cf_organisme();
	$nb     = count(array_filter(adepa_cf_formations(), function ($f) {
		return adepa_cf_est_gratuite($f->ID);
	}));
	$image  = adepa_cf_reglage('hero_image', '');
	$style  = $image ? ' style="--afc-hero-img:url(\'' . esc_url($image) . '\')"' : '';
	$bilan  = adepa_cf_url_page('bilan-de-competences-seine-et-marne');
	$choix  = array(
		array('Salarié ou en recherche d’emploi', $bilan, 'mallette', 'Bilan de compétences'),
		array('Structure ou employeur', '#qualiopi', 'batiment', 'Formations pour vos équipes'),
		array('Parent ou proche', '#gratuit', 'coeur', 'Parcours gratuits'),
		array('Autre', '#devis', 'points', 'Nous écrire'),
	);
	$icones = array(
		'mallette' => '<path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><rect x="3.5" y="7" width="17" height="12.5" rx="2"/><path d="M9 7v12.5M15 7v12.5"/>',
		'batiment' => '<rect x="4.5" y="3.5" width="10" height="17" rx="1"/><path d="M14.5 9.5h5v11h-5M7.5 7h1M11 7h1M7.5 10.5h1M11 10.5h1M7.5 14h1M11 14h1M9 20.5v-3h1.5v3"/>',
		'coeur'    => '<path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z"/>',
		'points'   => '<circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/>',
	);
	ob_start();
	?>
	<div class="afc-annonce">
		<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#FF5757" d="M3.5 9.5h17v3.5h-17zM5 13h14v8H5z"/><path fill="#D4AF37" d="M11 9.5h2V21h-2z"/><path fill="none" stroke="#D4AF37" stroke-width="1.6" d="M12 9.5C10.5 6.5 7 5.5 7 8s3 1.5 5 1.5zm0 0c1.5-3 5-4 5-1.5s-3 1.5-5 1.5z"/></svg>
		<a href="#gratuit"><?php echo esc_html(sprintf('Offert : %d parcours gratuits en ligne, avec leur fiche récap à télécharger', $nb)); ?></a>
	</div>
	<section class="afc-hero2<?php echo $image ? ' afc-hero2--photo' : ''; ?>"<?php echo $style; // phpcs:ignore ?>>
		<div class="afc-hero2__int">
			<div class="afc-hero2__haut">
				<p class="afc-surtitre afc-hero2__sur">Centre de formation ADéPA · Melun, Seine-et-Marne</p>
				<a class="afc-label" href="<?php echo esc_url($o['pdf']); ?>" target="_blank" rel="noopener">
					<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M12 3l7 3v5.5c0 4.3-3 7.7-7 9.5-4-1.8-7-5.2-7-9.5V6z"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M8.8 12.2l2.2 2.2 4.3-4.6"/></svg>
					<span><strong>Certifié Qualiopi</strong><small>n° <?php echo esc_html($o['certificat']); ?></small></span>
				</a>
			</div>
			<div class="afc-hero2__grille">
				<div class="afc-hero2__texte">
					<h1 class="afc-hero2__titre">Faites grandir votre pratique en vous formant <em>à l’éducatif et au médico‑social</em></h1>
					<ul class="afc-pilules">
						<li>Certifié Qualiopi</li>
						<li>Finançable OPCO</li>
						<li>Présentiel ou distanciel</li>
					</ul>
					<ul class="afc-coches">
						<li>Dates à convenir avec vous, dans vos locaux ou à distance</li>
						<li><?php echo esc_html(sprintf('%d parcours gratuits en ligne, sans carte bancaire', $nb)); ?></li>
						<li>Devis sous 72&nbsp;h ouvrées, avant tout engagement</li>
					</ul>
					<p class="afc-hero2__pied">Certification Qualiopi délivrée par <?php echo esc_html($o['certificateur']); ?>, au titre des actions de formation et des bilans de compétences. <a href="<?php echo esc_url($o['pdf']); ?>" target="_blank" rel="noopener">Voir le certificat</a></p>
				</div>
				<div class="afc-choix">
					<p class="afc-choix__pastille"><span aria-hidden="true"></span>Devis gratuit et sans engagement</p>
					<h2 class="afc-choix__titre">Quelle est votre situation&nbsp;?</h2>
					<ul class="afc-choix__grille">
						<?php foreach ($choix as $c) : ?>
						<li><a class="afc-choix__tuile" href="<?php echo esc_url($c[1]); ?>">
							<svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true" fill="<?php echo $c[2] === 'points' ? 'currentColor' : 'none'; ?>" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><?php echo $icones[$c[2]]; // phpcs:ignore ?></svg>
							<strong><?php echo esc_html($c[0]); ?></strong>
							<small><?php echo esc_html($c[3]); ?></small>
						</a></li>
						<?php endforeach; ?>
					</ul>
				</div>
			</div>
		</div>
	</section>
	<?php
	return ob_get_clean();
}

/** Les liens réglementaires, au pied de chaque page du service. */
function adepa_cf_bandeau_reglementaire() {
	$o = adepa_cf_organisme();
	$h  = '<aside class="afc-reglementaire">';
	$h .= '<p><strong>Organisme de formation ADéPA</strong>, association loi 1901. Déclaration d’activité n° ' . esc_html($o['nda']) . ' (préfecture d’Île-de-France)&nbsp;: cet enregistrement ne vaut pas agrément de l’État. Certification Qualiopi n° ' . esc_html($o['certificat']) . ' au titre des actions de formation et des bilans de compétences.</p>';
	$h .= '<p class="afc-reglementaire__liens">';
	foreach (array(
		'informations-reglementaires' => 'Informations réglementaires',
		'cgv-formation'               => 'CGV formation',
		'accessibilite-handicap'      => 'Accessibilité et handicap',
		'reclamation'                 => 'Réclamation',
	) as $slug => $lib) {
		$h .= '<a href="' . esc_url(adepa_cf_url_page($slug)) . '">' . esc_html($lib) . '</a>';
	}
	$h .= '</p></aside>';
	return $h;
}

/* ----------------------------------------------------------------- fiche */

function adepa_cf_bloc($titre, $texte) {
	$t = adepa_cf_texte($texte);
	return $t ? '<section class="afc-bloc"><h2 class="afc-h3">' . esc_html($titre) . '</h2><div class="afc-texte">' . $t . '</div></section>' : '';
}

function adepa_cf_attribut($label, $valeur, $ton = '') {
	if ($valeur === '' || $valeur === null) {
		return '';
	}
	return '<div class="afc-attribut ' . ($ton ? 'afc-attribut--' . $ton : '') . '"><p class="afc-attribut__label">' . esc_html($label) . '</p><div class="afc-attribut__valeur">' . adepa_cf_texte($valeur) . '</div></div>';
}

function adepa_cf_rendu_fiche($id) {
	$f       = get_post($id);
	$gratuit = adepa_cf_est_gratuite($id);
	$img     = adepa_cf_couverture($id, 'full');
	$themes  = wp_get_post_terms($id, ADEPA_CF_THEME);
	$theme   = $themes && !is_wp_error($themes) ? $themes[0] : null;
	$faq     = (array) adepa_cf_meta($id, 'faq', array());
	$enroll  = adepa_cf_lien_teachizy(adepa_cf_meta($id, 'enrollUrl'));
	$duree   = adepa_cf_duree($id);
	$attPrix = (int) adepa_cf_meta($id, 'attestationPrix', 0);
	$pdf     = (int) adepa_cf_meta($id, 'fiche_pdf', 0);
	$jpg     = (int) adepa_cf_meta($id, 'fiche_jpg', 0);
	$devis_ok = isset($_GET['devis']) && $_GET['devis'] === 'ok'; // phpcs:ignore
	ob_start();
	?>
	<main class="afc afc-fiche" id="afc-fiche">
		<nav class="afc-ariane" aria-label="Fil d’Ariane">
			<a href="<?php echo esc_url(home_url('/')); ?>">Accueil</a><span aria-hidden="true">/</span>
			<a href="<?php echo esc_url(adepa_cf_url_catalogue()); ?>">Nos formations</a><span aria-hidden="true">/</span>
			<span><?php echo esc_html($f->post_title); ?></span>
		</nav>

		<?php if ($img) : ?>
			<div class="afc-fiche__visuel"><img src="<?php echo esc_url($img); ?>" alt="<?php echo esc_attr($f->post_title); ?>"></div>
		<?php endif; ?>

		<div class="afc-fiche__grille">
			<div class="afc-fiche__principal">
				<div class="afc-pastilles">
					<?php if ($theme) : ?><a class="afc-pastille" href="<?php echo esc_url(get_term_link($theme)); ?>"><?php echo esc_html($theme->name); ?></a><?php endif; ?>
					<?php if (adepa_cf_meta($id, 'certifying')) : ?><span class="afc-pastille afc-pastille--rouge">Qualiopi · finançable OPCO</span><?php endif; ?>
					<?php if ($gratuit) : ?><span class="afc-pastille afc-pastille--or">Gratuit · en ligne</span><?php endif; ?>
				</div>
				<h1 class="afc-h1 afc-h1--fiche"><?php echo esc_html($f->post_title); ?></h1>

				<div class="afc-attributs">
					<?php
					echo adepa_cf_attribut('Durée', $duree); // phpcs:ignore
					echo adepa_cf_attribut('Public visé', adepa_cf_meta($id, 'targetAudience'), 'or'); // phpcs:ignore
					echo adepa_cf_attribut('Prérequis', adepa_cf_meta($id, 'prerequisites'), 'rouge'); // phpcs:ignore
					echo adepa_cf_attribut('Lieu', adepa_cf_meta($id, 'city')); // phpcs:ignore
					// Formations en intra : pas de sessions datées affichées (la méta
					// _af_sessions est conservée, seulement plus montrée).
					if (!$gratuit) {
						echo adepa_cf_attribut('Dates', 'À convenir avec vous'); // phpcs:ignore
					}
					?>
				</div>

				<?php
				echo adepa_cf_bloc('Présentation', $f->post_excerpt); // phpcs:ignore
				echo adepa_cf_bloc('Objectifs pédagogiques', adepa_cf_meta($id, 'objectives')); // phpcs:ignore
				echo adepa_cf_bloc('Programme', adepa_cf_meta($id, 'program')); // phpcs:ignore
				echo adepa_cf_bloc('Méthodologie pédagogique', adepa_cf_meta($id, 'methodology')); // phpcs:ignore
				echo adepa_cf_bloc('Modalités d’évaluation', adepa_cf_meta($id, 'evaluation')); // phpcs:ignore
				?>

				<?php if ($faq) : ?>
				<section class="afc-bloc">
					<h2 class="afc-h3">Questions fréquentes</h2>
					<div class="afc-faq">
						<?php foreach ($faq as $q) : if (empty($q['question'])) { continue; } ?>
							<details><summary><?php echo esc_html($q['question']); ?></summary><div class="afc-texte"><?php echo adepa_cf_texte($q['answer']); // phpcs:ignore ?></div></details>
						<?php endforeach; ?>
					</div>
				</section>
				<?php endif; ?>
			</div>

			<aside class="afc-fiche__cote">
				<?php if ($gratuit) : ?>
					<div class="afc-carton">
						<p class="afc-prix">Gratuit</p>
						<p class="afc-petit">Du premier au dernier module, sans carte bancaire et sans date de fin.</p>
						<?php if ($duree) : ?><p class="afc-petit">Environ <?php echo esc_html($duree); ?> de lecture, à votre rythme.</p><?php endif; ?>
						<?php if ($enroll) : ?><a class="afc-bouton" href="<?php echo esc_url($enroll); ?>" target="_blank" rel="noopener">Commencer la formation</a><?php endif; ?>
						<ul class="afc-coches">
							<li><?php echo $attPrix ? 'Attestation de suivi nominative&nbsp;: ' . esc_html(adepa_cf_euros($attPrix / 100)) . ', facultative' : 'Attestation de suivi nominative, facultative'; ?></li>
							<li>Ni diplôme, ni certification professionnelle</li>
							<li>Pour les parents comme pour les professionnels</li>
						</ul>
					</div>
					<?php if ($enroll) : ?>
					<div class="afc-carton">
						<p class="afc-carton__titre">Comment ça se passe</p>
						<ol class="afc-etapes">
							<li>Le parcours se suit sur notre espace de formation en ligne&nbsp;: en cliquant, vous quittez ce site.</li>
							<li>L’accès s’y ouvre avec une adresse e-mail. <strong>Aucune carte bancaire n’est demandée, à aucun moment.</strong></li>
							<li>Quatre modules dans l’ordre, à votre rythme, sans date de fin.</li>
						</ol>
					</div>
					<?php endif; ?>
					<?php if ($pdf) : ?>
					<div class="afc-carton">
						<p class="afc-carton__titre">La fiche récap, en une page</p>
						<a href="<?php echo esc_url(wp_get_attachment_url($pdf)); ?>" target="_blank" rel="noopener">
							<?php if ($jpg) : ?><img class="afc-fiche-recap" loading="lazy" src="<?php echo esc_url(wp_get_attachment_image_url($jpg, 'medium_large')); ?>" alt="<?php echo esc_attr('Aperçu de la fiche récapitulative A4 « ' . $f->post_title . ' »'); ?>"><?php endif; ?>
						</a>
						<p class="afc-petit">Tout le parcours sur une page&nbsp;: la notion clé, les quatre modules et la grille à recopier. À imprimer et à garder sous la main.</p>
						<a class="afc-bouton afc-bouton--contour" href="<?php echo esc_url(wp_get_attachment_url($pdf)); ?>" target="_blank" rel="noopener">Télécharger la fiche A4 (PDF)</a>
					</div>
					<?php endif; ?>
				<?php else : ?>
					<div class="afc-carton" id="devis">
						<p class="afc-prix"><?php echo esc_html(adepa_cf_prix($id)); ?></p>
						<p class="afc-petit">Tarif net de taxe, ajusté au nombre de participants et à la modalité. Financement OPCO, France Travail ou employeur possible.</p>
						<?php if ($devis_ok) : ?>
							<p class="afc-alerte afc-alerte--ok">Votre demande est bien partie. Nous revenons vers vous sous 72&nbsp;h ouvrées.</p>
						<?php endif; ?>
						<p class="afc-carton__titre">Demander un devis</p>
						<?php echo adepa_cf_formulaire_devis($id); // phpcs:ignore ?>
					</div>
				<?php endif; ?>
				<p class="afc-petit afc-centre"><a href="<?php echo esc_url(adepa_cf_url_page('accessibilite-handicap')); ?>">Situation de handicap&nbsp;: parlons-en avant l’inscription</a></p>
			</aside>
		</div>

		<?php
		$autres = adepa_cf_grille($gratuit ? 'gratuit' : 'qualiopi', 3, $id);
		if ($autres) {
			echo '<section class="afc-section"><h2 class="afc-h2">Autres formations</h2>' . $autres . '</section>'; // phpcs:ignore
		}
		echo adepa_cf_bandeau_reglementaire(); // phpcs:ignore
		?>
	</main>
	<?php
	adepa_cf_jsonld($id);
	return ob_get_clean();
}

function adepa_cf_jsonld($id) {
	$f    = get_post($id);
	$img  = adepa_cf_couverture($id, 'full');
	$prix = adepa_cf_meta($id, 'priceFrom');
	$course = array(
		'@context'    => 'https://schema.org',
		'@type'       => 'Course',
		'name'        => $f->post_title,
		'description' => wp_trim_words(wp_strip_all_tags(adepa_cf_meta($id, 'objectives', $f->post_excerpt)), 50, '…'),
		'url'         => get_permalink($id),
		'provider'    => array('@type' => 'Organization', 'name' => 'ADéPA, organisme de formation', 'sameAs' => home_url('/')),
	);
	if ($img) {
		$course['image'] = array($img);
	}
	if (adepa_cf_est_gratuite($id)) {
		$course['offers'] = array('@type' => 'Offer', 'price' => '0', 'priceCurrency' => 'EUR', 'category' => 'Free');
		$course['hasCourseInstance'] = array('@type' => 'CourseInstance', 'courseMode' => 'online');
	} elseif ($prix !== '' && (float) $prix > 0) {
		$course['offers'] = array('@type' => 'Offer', 'price' => (string) $prix, 'priceCurrency' => 'EUR', 'category' => 'Paid');
	}
	$ariane = array(
		'@context' => 'https://schema.org',
		'@type' => 'BreadcrumbList',
		'itemListElement' => array(
			array('@type' => 'ListItem', 'position' => 1, 'name' => 'Nos formations', 'item' => adepa_cf_url_catalogue()),
			array('@type' => 'ListItem', 'position' => 2, 'name' => $f->post_title, 'item' => get_permalink($id)),
		),
	);
	echo '<script type="application/ld+json">' . wp_json_encode(array($course, $ariane), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . '</script>';
}

/* Le catalogue insérable n'importe où : [adepa_formations type="gratuit" limite="3"] */
add_shortcode('adepa_formations', function ($a) {
	$a = shortcode_atts(array('type' => 'tout', 'limite' => -1), $a);
	wp_enqueue_style('adepa-cf');
	return '<div class="afc afc--insere">' . adepa_cf_grille($a['type'], (int) $a['limite']) . '</div>';
});
