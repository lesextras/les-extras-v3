<?php
/** Gabarit d'une fiche formation : en-tête et pied de page du site, contenu du centre de formation. */
if (!defined('ABSPATH')) {
	exit;
}
get_header();
while (have_posts()) {
	the_post();
	echo adepa_cf_rendu_fiche(get_the_ID()); // phpcs:ignore
}
get_footer();
