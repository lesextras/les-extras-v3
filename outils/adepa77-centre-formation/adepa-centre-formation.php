<?php
/**
 * Plugin Name: ADéPA, centre de formation
 * Description: Le catalogue des formations de l'organisme de formation ADéPA (certifié Qualiopi) : formations en établissement sur devis, parcours gratuits en ligne, demandes de devis, et pages réglementaires (informations Qualiopi, CGV formation, réclamation, accessibilité).
 * Version: 1.2.1
 * Author: Association ADéPA
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Text Domain: adepa-cf
 *
 * POURQUOI CETTE EXTENSION (28/09/2026, décision de la fondatrice).
 * adepa77.fr est LE site de l'organisme de formation. Le service
 * « formations » quitte Les Extras (qui reste une plateforme de mise en
 * relation) et vit ici, avec tout ce qu'un financeur ou un auditeur Qualiopi
 * vient chercher avant une inscription.
 *
 * Règles tenues partout dans ce code :
 *  - « attestation de suivi », jamais « certificat » ;
 *  - aucun prix inventé : seuls ceux déjà publiés sont repris, sinon « sur devis » ;
 *  - aucune donnée n'est supprimée à la désactivation.
 */

if (!defined('ABSPATH')) {
	exit;
}

define('ADEPA_CF_VERSION', '1.2.1');
define('ADEPA_CF_DIR', plugin_dir_path(__FILE__));
define('ADEPA_CF_URL', plugin_dir_url(__FILE__));
define('ADEPA_CF_TYPE', 'adepa_formation');
define('ADEPA_CF_THEME', 'adepa_thematique');
define('ADEPA_CF_DEMANDE', 'adepa_demande');

require_once ADEPA_CF_DIR . 'inc/fonctions.php';
require_once ADEPA_CF_DIR . 'inc/type.php';
require_once ADEPA_CF_DIR . 'inc/import.php';
require_once ADEPA_CF_DIR . 'inc/gabarits.php';
require_once ADEPA_CF_DIR . 'inc/devis.php';
require_once ADEPA_CF_DIR . 'inc/pages.php';
require_once ADEPA_CF_DIR . 'inc/admin.php';
require_once ADEPA_CF_DIR . 'inc/accessibilite.php';
require_once ADEPA_CF_DIR . 'inc/migration.php';

register_activation_hook(__FILE__, 'adepa_cf_activation');
function adepa_cf_activation() {
	adepa_cf_enregistrer_types();
	adepa_cf_creer_pages();
	flush_rewrite_rules();
}

register_deactivation_hook(__FILE__, function () {
	// On ne supprime rien : les fiches, les demandes et les pages restent.
	flush_rewrite_rules();
});
