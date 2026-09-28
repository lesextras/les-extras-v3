/* Filtre du catalogue par thématique. Sans JavaScript, toutes les cartes restent visibles. */
(function () {
	var boutons = document.querySelectorAll('.afc-filtre');
	if (!boutons.length) return;
	var vide = document.querySelector('.afc-vide');
	boutons.forEach(function (b) {
		b.addEventListener('click', function () {
			var f = b.getAttribute('data-filtre');
			boutons.forEach(function (x) { x.classList.toggle('is-actif', x === b); });
			var visibles = 0;
			document.querySelectorAll('.afc-section[data-bloc]').forEach(function (s) {
				var n = 0;
				s.querySelectorAll('.afc-carte').forEach(function (c) {
					var ok = !f || c.getAttribute('data-theme') === f;
					c.hidden = !ok;
					if (ok) n++;
				});
				s.hidden = n === 0;
				visibles += n;
			});
			if (vide) vide.hidden = visibles !== 0;
		});
	});
})();
