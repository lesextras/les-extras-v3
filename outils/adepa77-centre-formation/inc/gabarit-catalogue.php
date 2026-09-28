<?php
/** Gabarit du catalogue (/formations/ et les pages de thématique). */
if (!defined('ABSPATH')) {
	exit;
}
get_header();
echo adepa_cf_rendu_catalogue(); // phpcs:ignore
get_footer();
