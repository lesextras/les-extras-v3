/* Prise de rendez-vous ADéPA (1.3.0).
   Les créneaux ne sont jamais dans le HTML (la page est en cache) : ils sont
   demandés en POST à admin-ajax.php à l'ouverture, et redemandés après une
   collision. Aucune bibliothèque. */
(function () {
	'use strict';
	var racine = document.getElementById('afc-rdv');
	if (!racine || !window.fetch || !window.FormData) return;
	var ajax = racine.getAttribute('data-ajax');

	function $(sel, ctx) { return (ctx || racine).querySelector(sel); }
	function $$(sel, ctx) { return Array.prototype.slice.call((ctx || racine).querySelectorAll(sel)); }
	function el(tag, cls, txt) {
		var e = document.createElement(tag);
		if (cls) e.className = cls;
		if (txt != null) e.textContent = txt;
		return e;
	}
	function envoyer(action, donnees) {
		var fd = new FormData();
		fd.append('action', action);
		Object.keys(donnees || {}).forEach(function (k) { fd.append(k, donnees[k]); });
		return fetch(ajax + (ajax.indexOf('?') < 0 ? '?' : '&') + 'n=' + Date.now(), {
			method: 'POST', body: fd, credentials: 'same-origin', cache: 'no-store'
		}).then(function (r) {
			if (!r.ok) throw new Error('HTTP ' + r.status);
			return r.json();
		});
	}
	var ERREUR_RESEAU = 'La connexion au serveur a échoué. Vérifiez votre connexion internet puis réessayez.';

	if (racine.getAttribute('data-vue') === 'annulation') { annulation(); return; }

	/* ------------------------------------------------------------ état */
	var etat = { motif: '', jours: [], jour: null, creneau: null, t0: 0, charge: false };
	var alerte = $('.afc-rdv__alerte');

	function montrerAlerte(txt) {
		alerte.textContent = txt || '';
		alerte.hidden = !txt;
	}

	function aller(n, sansFocus) {
		$$('.afc-rdv__etape').forEach(function (s) { s.hidden = s.getAttribute('data-etape') !== String(n); });
		$$('.afc-rdv__fil li').forEach(function (li) {
			var p = +li.getAttribute('data-pas');
			if (p === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
			li.classList.toggle('is-fait', p < n);
		});
		$('.afc-rdv__fil').hidden = n === 4;
		if (!sansFocus) {
			var h = $('[data-etape="' + n + '"] .afc-rdv__h');
			if (h) {
				h.focus({ preventScroll: true });
				var haut = racine.querySelector('.afc-rdv__carte').getBoundingClientRect().top;
				if (haut < 0 || haut > window.innerHeight * 0.6) {
					window.scrollBy({ top: haut - 90, behavior: 'smooth' });
				}
			}
		}
	}

	function resume() {
		var lm = $('[data-info-ligne="motif"]'), ld = $('[data-info-ligne="date"]');
		var b = etat.motif ? $('.afc-rdv__motif[data-motif="' + etat.motif + '"] strong') : null;
		lm.hidden = !b;
		if (b) $('[data-info="motif"]').textContent = b.textContent;
		ld.hidden = !(etat.jour && etat.creneau);
		if (etat.jour && etat.creneau) {
			$('[data-info="date"]').textContent = majuscule(etat.jour.moyen) + ', ' + etat.creneau.h + ' à ' + etat.creneau.fin;
		}
	}
	function majuscule(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

	/* ------------------------------------------------ étape 1 : l'objet */
	$$('.afc-rdv__motif').forEach(function (b) {
		b.addEventListener('click', function () {
			choisirMotif(b.getAttribute('data-motif'));
			montrerAlerte('');
			aller(2);
		});
	});
	function choisirMotif(m) {
		etat.motif = m;
		$$('.afc-rdv__motif').forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-motif') === m ? 'true' : 'false'); });
		resume();
	}

	/* ------------------------------------ étape 2 : le jour, puis l'heure */
	var cadreJours = $('.afc-rdv__jours-cadre');
	var listeJours = $('.afc-rdv__jours');
	var titreHeures = $('#afc-rdv-e2h');
	var listeHeures = $('.afc-rdv__heures');
	var suite = $('.afc-rdv__suite');
	var charge = $('[data-etape="2"] .afc-rdv__charge');

	function charger() {
		charge.hidden = false;
		charge.textContent = 'Chargement des créneaux…';
		return envoyer('adepa_cf_rdv_creneaux').then(function (r) {
			if (!r || !r.ok) throw new Error('réponse');
			etat.t0 = r.t;
			etat.jours = r.jours || [];
			etat.charge = true;
			// Le jour choisi reste choisi s'il a encore des créneaux ; le créneau, s'il est encore libre.
			var jour = etat.jour && etat.jours.filter(function (j) { return j.date === etat.jour.date; })[0];
			etat.jour = jour || etat.jours[0] || null;
			if (etat.creneau && etat.jour) {
				var c = etat.jour.creneaux.filter(function (x) { return x.t === etat.creneau.t; })[0];
				etat.creneau = c || null;
			} else {
				etat.creneau = null;
			}
			dessinerJours();
		}).catch(function () {
			charge.hidden = false;
			charge.textContent = '';
			charge.appendChild(document.createTextNode('Les créneaux n’ont pas pu être chargés. '));
			var b = el('button', 'afc-rdv__lienbouton', 'Réessayer');
			b.type = 'button';
			b.addEventListener('click', charger);
			charge.appendChild(b);
		});
	}

	function dessinerJours() {
		listeJours.textContent = '';
		if (!etat.jours.length) {
			charge.hidden = false;
			charge.textContent = 'Aucun créneau n’est disponible en ligne pour le moment. Écrivez-nous ou appelez-nous : les coordonnées sont sous ce cadre.';
			cadreJours.hidden = true;
			titreHeures.hidden = true;
			listeHeures.textContent = '';
			suite.hidden = true;
			resume();
			return;
		}
		charge.hidden = true;
		cadreJours.hidden = false;
		etat.jours.forEach(function (j) {
			var b = el('button', 'afc-rdv__jour');
			b.type = 'button';
			b.setAttribute('data-date', j.date);
			b.setAttribute('aria-pressed', etat.jour && etat.jour.date === j.date ? 'true' : 'false');
			var n = j.creneaux.length;
			b.setAttribute('aria-label', majuscule(j.moyen) + ', ' + n + (n > 1 ? ' créneaux' : ' créneau'));
			b.appendChild(el('span', 'afc-rdv__jour-sem', j.jour));
			b.appendChild(el('strong', 'afc-rdv__jour-num', j.num));
			b.appendChild(el('span', 'afc-rdv__jour-mois', j.mois));
			b.addEventListener('click', function () {
				etat.jour = j;
				etat.creneau = null;
				$$('.afc-rdv__jour').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
				dessinerHeures();
			});
			listeJours.appendChild(b);
		});
		dessinerHeures();
		var actif = $('.afc-rdv__jour[aria-pressed="true"]');
		if (actif) listeJours.scrollLeft = Math.max(0, actif.offsetLeft - listeJours.offsetLeft - 8);
		majDefile();
	}

	function dessinerHeures() {
		listeHeures.textContent = '';
		if (!etat.jour) return;
		titreHeures.hidden = false;
		titreHeures.querySelector('span').textContent = '(' + etat.jour.moyen + ')';
		etat.jour.creneaux.forEach(function (c) {
			var b = el('button', 'afc-rdv__heure', c.h);
			b.type = 'button';
			b.setAttribute('aria-pressed', etat.creneau && etat.creneau.t === c.t ? 'true' : 'false');
			b.setAttribute('aria-label', c.h + ' à ' + c.fin);
			b.addEventListener('click', function () {
				etat.creneau = c;
				$$('.afc-rdv__heure').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
				majSuite();
				resume();
			});
			listeHeures.appendChild(b);
		});
		majSuite();
		resume();
	}

	function majSuite() {
		suite.hidden = false;
		suite.disabled = !etat.creneau;
		suite.textContent = etat.creneau ? 'Continuer avec ' + etat.creneau.h : 'Continuer';
	}

	function majDefile() {
		var g = $('.afc-rdv__defile--g'), d = $('.afc-rdv__defile--d');
		var max = listeJours.scrollWidth - listeJours.clientWidth;
		g.disabled = listeJours.scrollLeft <= 2;
		d.disabled = listeJours.scrollLeft >= max - 2;
		cadreJours.classList.toggle('sans-defile', max <= 2);
	}
	listeJours.addEventListener('scroll', function () { window.requestAnimationFrame(majDefile); }, { passive: true });
	window.addEventListener('resize', majDefile);
	$$('.afc-rdv__defile').forEach(function (b) {
		b.addEventListener('click', function () {
			listeJours.scrollBy({ left: +b.getAttribute('data-defile') * listeJours.clientWidth * 0.8, behavior: 'smooth' });
		});
	});

	suite.addEventListener('click', function () {
		if (!etat.creneau) return;
		montrerAlerte('');
		$('.afc-rdv__rappel').textContent = majuscule(etat.jour.moyen) + ', ' + etat.creneau.h + ' à ' + etat.creneau.fin + ' (heure de Paris) · ' + $('[data-info="motif"]').textContent;
		majMode();
		aller(3);
	});
	$$('.afc-rdv__retour').forEach(function (b) {
		b.addEventListener('click', function () {
			montrerAlerte('');
			aller(+b.getAttribute('data-aller'));
		});
	});

	/* ---------------------------------------- étape 3 : les coordonnées */
	var form = $('.afc-rdv__form');
	var tel = $('#afc-rdv-tel');
	var erreurForm = $('.afc-rdv__erreur');
	var bouton = $('.afc-rdv__confirmer');

	function modeChoisi() {
		var r = form.querySelector('input[name="mode"]:checked');
		return r ? r.value : '';
	}
	function majMode() {
		var parTel = modeChoisi() === 'telephone';
		tel.required = parTel;
		$('.afc-rdv__oblig').hidden = !parTel;
		$('#afc-rdv-tel-aide').textContent = parTel ? 'Obligatoire : nous vous appelons à ce numéro.' : 'Facultatif pour un rendez-vous en visio.';
		$('[data-info="mode"]').textContent = parTel ? 'Téléphone' : 'Visio';
	}
	$$('input[name="mode"]', form).forEach(function (r) { r.addEventListener('change', majMode); });
	majMode();
	$('[data-info="mode"]').textContent = 'Téléphone ou visio';

	function erreurChamp(input, txt) {
		var p = document.getElementById(input.id + '-err');
		input.setAttribute('aria-invalid', txt ? 'true' : 'false');
		if (p) { p.textContent = txt || ''; p.hidden = !txt; }
		return !txt;
	}
	function verifier() {
		var ok = true, premier = null;
		var nom = $('#afc-rdv-nom'), mail = $('#afc-rdv-email');
		function test(input, txt) {
			if (!erreurChamp(input, txt)) { ok = false; if (!premier) premier = input; }
		}
		test(nom, nom.value.trim() ? '' : 'Indiquez votre prénom et votre nom.');
		test(mail, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim()) ? '' : 'Indiquez une adresse e-mail valide, par exemple nom@exemple.fr.');
		var chiffres = tel.value.replace(/\D/g, '');
		if (tel.required || tel.value.trim()) {
			test(tel, chiffres.length >= 9 ? '' : (tel.required ? 'Indiquez le numéro auquel nous pouvons vous appeler.' : 'Ce numéro semble incomplet.'));
		} else {
			erreurChamp(tel, '');
		}
		if (premier) premier.focus();
		return ok;
	}
	$$('input', form).forEach(function (i) {
		i.addEventListener('input', function () { if (i.getAttribute('aria-invalid') === 'true') erreurChamp(i, ''); });
	});

	form.addEventListener('submit', function (ev) {
		ev.preventDefault();
		erreurForm.hidden = true;
		if (!etat.creneau || !etat.motif) { aller(etat.motif ? 2 : 1); return; }
		if (!verifier()) return;
		bouton.disabled = true;
		bouton.textContent = 'Enregistrement…';
		envoyer('adepa_cf_rdv_reserver', {
			motif: etat.motif,
			creneau: etat.creneau.t,
			nom: $('#afc-rdv-nom').value.trim(),
			email: $('#afc-rdv-email').value.trim(),
			telephone: tel.value.trim(),
			mode: modeChoisi(),
			message: $('#afc-rdv-msg').value,
			site_web: form.querySelector('input[name="site_web"]').value,
			t0: etat.t0,
			origine: document.referrer || ''
		}).then(function (r) {
			bouton.disabled = false;
			bouton.textContent = 'Confirmer le rendez-vous';
			if (r && r.ok) { confirmation(r); return; }
			if (r && r.code === 'pris') {
				// Collision : on recharge les créneaux libres et on revient au choix.
				etat.creneau = null;
				resume();
				charger().then(function () {
					aller(2);
					montrerAlerte(r.message);
				});
				return;
			}
			erreurForm.textContent = (r && r.message) || ERREUR_RESEAU;
			erreurForm.hidden = false;
		}).catch(function () {
			bouton.disabled = false;
			bouton.textContent = 'Confirmer le rendez-vous';
			erreurForm.textContent = ERREUR_RESEAU;
			erreurForm.hidden = false;
		});
	});

	/* ------------------------------------------- étape 4 : c'est enregistré */
	function ligne(dl, dt, dd) {
		dl.appendChild(el('dt', '', dt));
		dl.appendChild(el('dd', '', dd));
	}
	function confirmation(r) {
		var v = r.rdv || {};
		var dl = $('.afc-rdv__recap');
		dl.textContent = '';
		if (v.date) ligne(dl, 'Date', majuscule(v.date));
		if (v.heure) ligne(dl, 'Heure', v.heure + ' à ' + v.fin + ' (heure de Paris)');
		if (v.motif) ligne(dl, 'Motif', v.motif);
		if (v.mode) {
			ligne(dl, 'Mode', v.mode + '. ' + v.mode_detail);
			$('[data-info="mode"]').textContent = v.mode;
		}
		$('.afc-rdv__mailinfo').textContent = r.mail
			? 'Un e-mail de confirmation est parti à ' + r.email + ', avec l’invitation pour votre agenda et un lien pour annuler si besoin. Pensez à regarder dans les courriers indésirables.'
			: 'Le rendez-vous est bien enregistré, mais l’e-mail de confirmation n’a pas pu partir. Notez ces informations. L’association est prévenue.';
		var a = $('.afc-rdv__ics');
		if (r.ics && window.Blob && window.URL) {
			a.href = URL.createObjectURL(new Blob([r.ics], { type: 'text/calendar;charset=utf-8' }));
			a.hidden = false;
		}
		montrerAlerte('');
		aller(4);
	}

	/* ------------------------------------------------------- démarrage */
	var depart = racine.getAttribute('data-motif') || '';
	try {
		var p = new URLSearchParams(window.location.search).get('motif');
		if (p && racine.querySelector('.afc-rdv__motif[data-motif="' + p + '"]')) depart = p;
	} catch (e) { /* navigateur ancien */ }
	if (depart && racine.querySelector('.afc-rdv__motif[data-motif="' + depart + '"]')) {
		choisirMotif(depart);
		aller(2, true);
	} else {
		choisirMotif('');
		aller(1, true);
	}
	charger();

	/* ================================================== annulation */
	function annulation() {
		var zone = $('.afc-rdv__annul');
		var id = racine.getAttribute('data-id'), jeton = racine.getAttribute('data-jeton');
		function message(txt, cls, garder) {
			if (!garder) zone.textContent = '';
			zone.appendChild(el('p', cls || '', txt));
			var p = el('p');
			var a = el('a', 'afc-rdv__lien', 'Prendre un autre rendez-vous');
			a.href = window.location.pathname;
			p.appendChild(a);
			zone.appendChild(p);
		}
		envoyer('adepa_cf_rdv_voir', { id: id, jeton: jeton }).then(function (r) {
			if (!r || !r.ok) { message((r && r.message) || ERREUR_RESEAU, 'afc-rdv__alerte'); return; }
			var v = r.rdv;
			zone.textContent = '';
			var h = el('h2', 'afc-rdv__h', v.annule ? 'Ce rendez-vous est déjà annulé' : 'Votre rendez-vous');
			h.tabIndex = -1;
			zone.appendChild(h);
			var dl = el('dl', 'afc-rdv__recap');
			ligne(dl, 'Date', majuscule(v.date));
			ligne(dl, 'Heure', v.heure + ' à ' + v.fin + ' (heure de Paris)');
			ligne(dl, 'Motif', v.motif);
			ligne(dl, 'Mode', v.mode);
			zone.appendChild(dl);
			if (v.annule) { message('Le créneau a été libéré.', '', true); return; }
			if (v.passe) { message('Ce rendez-vous est déjà passé : il ne peut plus être annulé en ligne.', '', true); return; }
			zone.appendChild(el('p', '', 'Voulez-vous vraiment annuler ce rendez-vous ? Le créneau sera proposé à quelqu’un d’autre.'));
			var b = el('button', 'afc-rdv__confirmer afc-rdv__confirmer--annuler', 'Oui, annuler ce rendez-vous');
			b.type = 'button';
			var err = el('p', 'afc-rdv__erreur');
			err.setAttribute('role', 'alert');
			err.hidden = true;
			zone.appendChild(err);
			zone.appendChild(b);
			b.addEventListener('click', function () {
				b.disabled = true;
				b.textContent = 'Annulation…';
				envoyer('adepa_cf_rdv_annuler', { id: id, jeton: jeton }).then(function (r2) {
					if (r2 && r2.ok) {
						message('Votre rendez-vous est annulé. Le créneau est libéré et l’association est prévenue.', 'afc-rdv__succes');
						zone.querySelector('p').setAttribute('tabindex', '-1');
						zone.querySelector('p').focus();
						return;
					}
					b.disabled = false;
					b.textContent = 'Oui, annuler ce rendez-vous';
					err.textContent = (r2 && r2.message) || ERREUR_RESEAU;
					err.hidden = false;
				}).catch(function () {
					b.disabled = false;
					b.textContent = 'Oui, annuler ce rendez-vous';
					err.textContent = ERREUR_RESEAU;
					err.hidden = false;
				});
			});
		}).catch(function () { message(ERREUR_RESEAU, 'afc-rdv__alerte'); });
	}
})();
