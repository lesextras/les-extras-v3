function remplacer(s){
  if(typeof s!=='string'||!/toulali/i.test(s))return s;
  s=s.replace(/https?:\/\/toulali\.fr\/acces-handicap\/?/gi,'https://adepa77.fr/accessibilite-handicap/');
  s=s.replace(/Accessibilité de toulali\.fr/gi,'Accessibilité et handicap d’ADéPA');
  s=s.replace(/contact@toulali\.fr/gi,'assoc.adepa@gmail.com');
  s=s.replace(/fr\.toulali\./gi,'fr.adepa.');
  s=s.replace(/toulali\.fr\/lex/gi,'§LEX§');
  s=s.replace(/communauté\s+TOULALIA?\b/gi,'communauté ADéPA');
  s=s.replace(/parcours\s+toulalia\b/gi,'parcours ADéPA');
  s=s.replace(/\bTOULALIA\b/gi,'ADéPA IA');
  s=s.replace(/\btoulali\b(?!\.)/gi,'ADéPA');
  s=s.replace(/\btoulali(?=\.(\s|<|"|$))/gi,'ADéPA');
  s=s.replace(/§LEX§/g,'toulali.fr/lex');
  return s;
}
function profond(v){if(typeof v==='string')return remplacer(v);if(Array.isArray(v))return v.map(profond);if(v&&typeof v==='object'){var o={};for(var k in v)o[k]=profond(v[k]);return o;}return v;}
if(typeof module!=='undefined')module.exports={remplacer,profond};
