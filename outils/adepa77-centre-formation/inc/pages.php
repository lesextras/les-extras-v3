<?php
/**
 * LES PAGES RÉGLEMENTAIRES DE L'ORGANISME DE FORMATION.
 *
 * Ce qu'un OPCO, France Travail ou l'auditeur Qualiopi vient lire AVANT une
 * inscription (indicateurs 1 et 2 du référentiel national qualité). Chaque
 * page est un shortcode : son texte vit dans ce fichier, et le tableau des
 * formations se calcule depuis le catalogue, donc il ne peut pas diverger des
 * fiches.
 *
 * ⚠ Aucun chiffre d'indicateur n'est publié tant qu'aucune session n'est
 *   terminée : une page honnête vaut mieux que des pourcentages invérifiables.
 * ⚠ Le médiateur de la consommation n'est pas nommé : aucun nom n'est porté
 *   ici avant son référencement par la CECMC.
 * ⚠ Textes à faire relire par un juriste avant d'y adosser une vente à un
 *   particulier.
 */
if (!defined('ABSPATH')) {
	exit;
}

function adepa_cf_pages() {
	return array(
		'informations-reglementaires' => array('Informations réglementaires', '[adepa_informations_reglementaires]'),
		'cgv-formation'               => array('Conditions générales de vente, formation', '[adepa_cgv_formation]'),
		'reclamation'                 => array('Procédure de réclamation', '[adepa_reclamation]'),
		'accessibilite-handicap'      => array('Accessibilité et situation de handicap', '[adepa_accessibilite]'),
	);
}

/** Crée les pages manquantes, sans jamais toucher à une page existante. */
function adepa_cf_creer_pages() {
	$crees = array();
	foreach (adepa_cf_pages() as $slug => $p) {
		if (get_page_by_path($slug)) {
			continue;
		}
		$id = wp_insert_post(array(
			'post_type'    => 'page',
			'post_status'  => 'publish',
			'post_title'   => $p[0],
			'post_name'    => $slug,
			'post_content' => $p[1],
		));
		if ($id && !is_wp_error($id)) {
			// Astra : pas de titre automatique (la page porte le sien), pleine largeur.
			update_post_meta($id, 'site-post-title', 'disabled');
			update_post_meta($id, 'ast-site-content-layout', 'full-width-container');
			update_post_meta($id, 'site-content-style', 'unboxed');
			update_post_meta($id, 'site-sidebar-layout', 'no-sidebar');
			$crees[] = $slug;
		}
	}
	return $crees;
}

function adepa_cf_enveloppe($surtitre, $titre, $chapo, $corps) {
	wp_enqueue_style('adepa-cf');
	$h  = '<div class="afc afc-regl">';
	$h .= '<section class="afc-hero afc-hero--court"><p class="afc-surtitre">' . esc_html($surtitre) . '</p><h1 class="afc-h1">' . esc_html($titre) . '</h1>';
	if ($chapo) {
		$h .= '<p class="afc-chapo">' . $chapo . '</p>';
	}
	$h .= '</section><div class="afc-regl__corps">' . $corps . '</div>' . adepa_cf_bandeau_reglementaire() . '</div>';
	return $h;
}

function adepa_cf_section($titre, $html, $ancre = '') {
	return '<section class="afc-regl__section"' . ($ancre ? ' id="' . esc_attr($ancre) . '"' : '') . '><h2 class="afc-h3">' . esc_html($titre) . '</h2>' . $html . '</section>';
}

function adepa_cf_date_maj() {
	return 'Page mise à jour le ' . esc_html(wp_date('j F Y', strtotime('2026-09-28'))) . '.';
}

/* ------------------------------------------- informations réglementaires */

add_shortcode('adepa_informations_reglementaires', function () {
	$o = adepa_cf_organisme();
	$c = '';

	$c .= adepa_cf_section('L’organisme de formation', '<ul>'
		. '<li><strong>' . esc_html($o['nom']) . '</strong>, ' . esc_html(strtolower($o['forme'])) . '.</li>'
		. '<li>Siège social&nbsp;: ' . esc_html($o['siege']) . '. Adresse administrative&nbsp;: ' . esc_html($o['administratif']) . '.</li>'
		. '<li>SIRET&nbsp;: ' . esc_html($o['siret']) . '.</li>'
		. '<li>Numéro de déclaration d’activité&nbsp;: <strong>' . esc_html($o['nda']) . '</strong> (préfecture d’Île-de-France). Cet enregistrement ne vaut pas agrément de l’État.</li>'
		. '<li>Contact&nbsp;: <a href="mailto:' . esc_attr($o['email']) . '">' . esc_html($o['email']) . '</a>, ' . esc_html($o['telephone']) . '.</li>'
		. '</ul>', 'organisme');

	$c .= adepa_cf_section('Certification Qualiopi', '<p>Certificat n° <strong>' . esc_html($o['certificat']) . '</strong>, délivré le ' . esc_html($o['delivre']) . ' par ' . esc_html($o['certificateur']) . ' (accréditation COFRAC n° ' . esc_html($o['cofrac']) . '), valable jusqu’au ' . esc_html($o['fin']) . ', au titre des catégories <strong>actions de formation</strong> (L.&nbsp;6313-1-1°) et <strong>bilans de compétences</strong> (L.&nbsp;6313-1-2°).</p>'
		. '<p>La certification atteste la qualité du processus mis en œuvre par l’organisme. Elle ne vaut ni diplôme ni certification professionnelle pour les personnes formées.</p>'
		. '<p><a class="afc-lien" href="' . esc_url($o['pdf']) . '" target="_blank" rel="noopener">Télécharger le certificat (PDF)</a></p>', 'qualiopi');

	// Le tableau se calcule depuis le catalogue : il ne peut pas contredire les fiches.
	$lignes = '';
	foreach (adepa_cf_formations() as $f) {
		$g = adepa_cf_est_gratuite($f->ID);
		$lignes .= '<tr><td><a href="' . esc_url(get_permalink($f)) . '">' . esc_html($f->post_title) . '</a></td>'
			. '<td>' . esc_html(adepa_cf_duree($f->ID) ?: 'Selon le programme retenu') . '</td>'
			. '<td>' . esc_html($g ? 'En ligne, à votre rythme' : (adepa_cf_meta($f->ID, 'city') ?: 'Dans votre établissement ou à distance')) . '</td>'
			. '<td>' . esc_html(adepa_cf_prix($f->ID)) . '</td></tr>';
	}
	$c .= adepa_cf_section("Nos formations : durée, modalité, tarif", '<p>Le détail de chaque formation (public visé, prérequis, objectifs, programme, modalités d’évaluation) figure sur sa fiche. Voici la synthèse.</p>'
		. '<div class="afc-tableau"><table><thead><tr><th>Formation</th><th>Durée</th><th>Modalité</th><th>Tarif</th></tr></thead><tbody>' . $lignes . '</tbody></table></div>'
		. '<p class="afc-petit">Tarifs nets de taxe&nbsp;: l’association n’est pas assujettie à la TVA sur ces prestations, sauf mention contraire portée sur la facture. Les parcours gratuits le restent du premier au dernier module&nbsp;; seule l’attestation de suivi nominative, facultative, peut être payante, et son prix est affiché sur la fiche avant toute demande.</p>', 'formations');

	$c .= adepa_cf_section('Prérequis', '<p>Les prérequis propres à chaque formation sont indiqués sur sa fiche, avant l’inscription. Les parcours gratuits en ligne n’exigent aucun diplôme ni aucune expérience&nbsp;: une connexion internet et la lecture du français suffisent.</p>', 'prerequis');

	$c .= adepa_cf_section('Délais d’accès', '<ul>'
		. '<li><strong>Parcours gratuits en ligne</strong>&nbsp;: accès immédiat, dès l’ouverture de votre accès sur l’espace de formation.</li>'
		. '<li><strong>Formations en établissement</strong>&nbsp;: la date est fixée avec vous à l’acceptation du devis.</li>'
		. '<li><strong>Parcours financés</strong> (OPCO, France Travail, employeur)&nbsp;: comptez 2 à 4 semaines entre le premier échange et l’entrée en formation, le temps de l’instruction du dossier par le financeur. Écrivez-nous au moins un mois avant la date souhaitée.</li>'
		. '</ul>', 'delais');

	$c .= adepa_cf_section('Modalités pédagogiques et d’évaluation', '<ul>'
		. '<li><strong>En amont</strong>&nbsp;: un échange de positionnement vérifie que la formation correspond au besoin et au niveau des participants, et permet d’ajuster le programme.</li>'
		. '<li><strong>Pendant</strong>&nbsp;: apports, mises en situation et études de cas tirées du quotidien des équipes&nbsp;; émargement par demi-journée pour les formations en présentiel ou en classe virtuelle.</li>'
		. '<li><strong>À la fin</strong>&nbsp;: évaluation des acquis selon les modalités indiquées sur la fiche, questionnaire de satisfaction, et attestation de fin de formation remise à chaque participant.</li>'
		. '<li>Ces documents ne constituent ni un diplôme, ni une certification professionnelle enregistrée au RNCP ou au Répertoire spécifique.</li>'
		. '</ul>', 'modalites');

	$c .= adepa_cf_section('Accessibilité et situation de handicap', '<p>Nos formations sont ouvertes aux personnes en situation de handicap. Chaque demande d’aménagement est étudiée avant l’inscription. <a class="afc-lien" href="' . esc_url(adepa_cf_url_page('accessibilite-handicap')) . '">Tout savoir sur l’accessibilité</a></p>', 'accessibilite');

	$c .= adepa_cf_section('Indicateurs de résultats', '<p>Les indicateurs (taux de satisfaction, d’assiduité, de réussite aux évaluations et d’abandon) sont publiés sur cette page à l’issue des premières sessions, puis actualisés au moins une fois par an.</p><p>Aucun chiffre n’est affiché aujourd’hui, parce qu’aucune session n’est encore terminée. Nous préférons une page honnête à des pourcentages invérifiables.</p>', 'indicateurs');

	$c .= adepa_cf_section('Réclamations', '<p>Toute personne (participant, structure, financeur) peut adresser une réclamation. Accusé de réception sous 5 jours ouvrés, réponse motivée sous 15 jours ouvrés. <a class="afc-lien" href="' . esc_url(adepa_cf_url_page('reclamation')) . '">La procédure complète</a></p>', 'reclamations');

	$c .= adepa_cf_section('Conditions de vente', '<p>Les conditions de commande, de prix, de paiement, d’annulation et de rétractation figurent dans nos <a class="afc-lien" href="' . esc_url(adepa_cf_url_page('cgv-formation')) . '">conditions générales de vente formation</a>.</p>', 'cgv');

	return adepa_cf_enveloppe('Organisme de formation certifié Qualiopi', 'Informations réglementaires', 'Les informations ci-dessous sont publiées au titre du Référentiel national qualité et sont accessibles avant toute inscription. ' . adepa_cf_date_maj(), $c);
});

/* -------------------------------------------------------- CGV formation */

add_shortcode('adepa_cgv_formation', function () {
	$o = adepa_cf_organisme();
	$c = '';
	$c .= adepa_cf_section('1. Objet', '<p>Les présentes conditions s’appliquent aux prestations de formation vendues par l’association ADéPA, organisme de formation (déclaration d’activité n° ' . esc_html($o['nda']) . ', certification Qualiopi n° ' . esc_html($o['certificat']) . '), ainsi qu’à l’attestation de suivi des parcours gratuits en ligne. Les parcours gratuits eux-mêmes ne font l’objet d’aucune vente.</p>');
	$c .= adepa_cf_section('2. Commande', '<ul>'
		. '<li>Toute formation en établissement fait l’objet d’un devis. La commande est formée par l’acceptation écrite du devis.</li>'
		. '<li>Une <strong>convention de formation</strong> est ensuite établie avec la structure (article L.&nbsp;6353-1 du code du travail). Lorsqu’une personne physique s’inscrit et finance elle-même sa formation, un <strong>contrat de formation</strong> est conclu (article L.&nbsp;6353-3).</li>'
		. '<li>Le programme, la durée, les dates, le lieu, le nombre de participants, le prix et les conditions d’annulation ou de report sont précisés dans la convention ou le contrat, avant tout engagement.</li>'
		. '</ul>');
	$c .= adepa_cf_section('3. Prix', '<p>Les prix sont exprimés en euros. L’association n’est pas assujettie à la TVA sur ces prestations, sauf mention contraire portée sur la facture. Le prix applicable est celui du devis accepté.</p>');
	$c .= adepa_cf_section('4. Paiement et financement', '<ul>'
		. '<li>Les formations sont réglées sur facture, aux conditions du devis accepté.</li>'
		. '<li>En cas de prise en charge par un financeur (OPCO, France Travail, employeur), il appartient au client d’en faire la demande avant le début de la formation. La part non prise en charge reste due par le client.</li>'
		. '<li>Contrat de formation d’une personne physique&nbsp;: aucune somme n’est exigée avant l’expiration du délai de rétractation, et le premier versement ne peut excéder 30&nbsp;% du prix (article L.&nbsp;6353-6 du code du travail).</li>'
		. '</ul>');
	$c .= adepa_cf_section('5. Rétractation', '<ul>'
		. '<li><strong>Contrat de formation d’une personne physique</strong>&nbsp;: la personne dispose de dix jours à compter de la signature pour se rétracter, par lettre recommandée avec avis de réception (article L.&nbsp;6353-5 du code du travail).</li>'
		. '<li><strong>Contrat conclu à distance avec un consommateur</strong>&nbsp;: délai de quatorze jours à compter de la conclusion du contrat, sans motif ni pénalité (article L.&nbsp;221-18 du code de la consommation).</li>'
		. '</ul>');
	$c .= adepa_cf_section('6. L’attestation de suivi des parcours gratuits', '<ul>'
		. '<li>Les parcours en ligne sont gratuits. L’attestation de suivi est un document distinct, facultatif, délivré à la demande de la personne qui a suivi le parcours, au prix affiché sur la fiche de la formation.</li>'
		. '<li>Ce document atteste que la personne a suivi le parcours. Ce n’est pas une certification professionnelle&nbsp;: il n’est enregistré ni au RNCP ni au Répertoire spécifique, et il ne confère aucun titre, aucun niveau et aucun droit à exercer.</li>'
		. '<li>La demande se fait après le parcours, par écrit. Les conditions et le prix sont communiqués avant tout paiement&nbsp;; aucun accès au contenu n’en dépend.</li>'
		. '<li>L’attestation est établie et transmise sous quinze jours ouvrés à compter du paiement. Une erreur matérielle (nom, date, intitulé) est rectifiée sans frais sur simple demande.</li>'
		. '<li>Droit de rétractation&nbsp;: le consommateur dispose de quatorze jours à compter de la commande. S’il demande expressément que l’attestation soit établie avant la fin de ce délai, il en est informé et le droit s’éteint une fois le document transmis (articles L.&nbsp;221-25 et L.&nbsp;221-28, 1° du code de la consommation).</li>'
		. '</ul>');
	$c .= adepa_cf_section('7. Réclamations et médiation', '<p>Toute réclamation suit la <a class="afc-lien" href="' . esc_url(adepa_cf_url_page('reclamation')) . '">procédure de réclamation</a> de l’organisme.</p><p>Médiateur de la consommation&nbsp;: en cours de désignation. Aucun nom n’est porté ici avant son référencement par la Commission d’évaluation et de contrôle de la médiation de la consommation.</p>');
	$c .= adepa_cf_section('8. Données personnelles', '<p>Les données transmises (demande de devis, inscription, émargement, évaluation) servent à la gestion de la formation et aux obligations de l’organisme envers les financeurs et la certification. Elles ne sont ni cédées ni vendues. Voir notre <a class="afc-lien" href="' . esc_url(adepa_cf_url_page('confidentialites')) . '">politique de confidentialité</a>. Contact&nbsp;: <a href="mailto:' . esc_attr($o['email']) . '">' . esc_html($o['email']) . '</a>.</p>');
	$c .= adepa_cf_section('9. Droit applicable', '<p>Les présentes conditions sont soumises au droit français. ' . adepa_cf_date_maj() . '</p>');
	return adepa_cf_enveloppe('Organisme de formation ADéPA', 'Conditions générales de vente, formation', '', $c);
});

/* ---------------------------------------------------------- réclamation */

add_shortcode('adepa_reclamation', function () {
	$o = adepa_cf_organisme();
	$c = adepa_cf_section('Qui peut réclamer', '<p>Toute personne (candidat, participant, structure, financeur ou entreprise) peut formuler une réclamation portant sur nos prestations de formation ou de bilan de compétences.</p>');
	$c .= adepa_cf_section('Comment faire', '<ol>'
		. '<li>Écrivez à <a href="mailto:' . esc_attr($o['email']) . '?subject=R%C3%A9clamation">' . esc_html($o['email']) . '</a> avec la mention «&nbsp;Réclamation&nbsp;» en objet, ou par courrier au siège de l’association (' . esc_html($o['siege']) . '). Indiquez la formation concernée, les faits, et ce que vous attendez.</li>'
		. '<li><strong>Accusé de réception sous 5 jours ouvrés.</strong> Votre réclamation est enregistrée dans notre registre des réclamations.</li>'
		. '<li><strong>Réponse motivée sous 15 jours ouvrés</strong> à compter de l’accusé de réception. Si l’analyse demande plus de temps, nous vous en informons et vous indiquons un nouveau délai.</li>'
		. '<li><strong>En cas de désaccord persistant</strong>, votre dossier est transmis à la présidence de l’association, qui statue et vous répond dans un délai d’un mois.</li>'
		. '</ol>');
	$c .= adepa_cf_section('Ce que nous en faisons', '<p>Les réclamations reçues font l’objet d’une revue au moins une fois par an. Elles alimentent l’amélioration de nos formations, au même titre que les questionnaires de satisfaction.</p><p>' . adepa_cf_date_maj() . '</p>');
	return adepa_cf_enveloppe('Organisme de formation ADéPA', 'Procédure de réclamation', 'Une réclamation est une information utile&nbsp;: voici comment nous la traitons, et dans quels délais.', $c);
});

/* ---------------------------------------------------------- accessibilité */

add_shortcode('adepa_accessibilite', function () {
	$o = adepa_cf_organisme();
	$c = adepa_cf_section('Notre engagement', '<p>Nos formations sont ouvertes aux personnes en situation de handicap. Chaque candidature est étudiée avec attention, et le parcours est adapté, dans la mesure du possible, aux besoins de chacun&nbsp;: rythme, supports, modalités de suivi et d’évaluation.</p>');
	$c .= adepa_cf_section('Avant l’inscription', '<p>Un échange préalable permet d’identifier les aménagements utiles. Écrivez-nous à <a href="mailto:' . esc_attr($o['email']) . '?subject=Accessibilit%C3%A9">' . esc_html($o['email']) . '</a> en précisant la formation envisagée&nbsp;: nous revenons vers vous sous 48&nbsp;h ouvrées. Le référent handicap de l’organisme suit votre demande de l’inscription à la fin de la formation.</p>');
	$c .= adepa_cf_section('Selon la modalité', '<ul>'
		. '<li><strong>Parcours en ligne</strong>&nbsp;: à votre rythme, sans date de fin, pauses possibles à tout moment, contenus écrits lisibles par un lecteur d’écran.</li>'
		. '<li><strong>Formations en établissement ou en classe virtuelle</strong>&nbsp;: accessibilité des locaux, durée des séquences, supports et modalités d’évaluation sont vérifiés avec la structure avant la session.</li>'
		. '</ul>');
	$c .= adepa_cf_section('Les relais', '<p>Lorsque nous ne pouvons pas répondre nous-mêmes à un besoin, nous vous orientons vers les structures compétentes&nbsp;: Agefiph, Cap emploi, MDPH.</p><p>' . adepa_cf_date_maj() . '</p>');
	return adepa_cf_enveloppe('Organisme de formation ADéPA', 'Accessibilité et situation de handicap', 'Une formation accessible à toutes et à tous&nbsp;: parlons de votre situation avant l’inscription.', $c);
});
