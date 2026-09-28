import { deflateRawSync } from 'node:zlib';

/**
 * UN CLASSEUR EXCEL SANS DÉPENDANCE.
 *
 * Un .xlsx est un zip de fichiers XML. On n'a besoin que de cellules texte,
 * nombre et formule, d'une ligne d'en-tête en gras et de largeurs de colonnes :
 * une petite écriture maison évite d'ajouter une bibliothèque (et sa mise à
 * jour du verrou pnpm) pour ça. Le fichier s'ouvre dans Excel, LibreOffice et
 * Google Sheets.
 */

export type Cellule = string | number | null | undefined | { f: string } | { d: Date };

export interface Feuille {
  nom: string;
  colonnes?: number[];
  lignes: Cellule[][];
  /** Indices (0 = première ligne) des lignes à mettre en gras. */
  gras?: number[];
}

const xml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function colonne(i: number) {
  let s = '';
  let n = i;
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

/** Numéro de série Excel d'une date (jours depuis le 30/12/1899). */
function serie(d: Date) {
  return Math.round(((d.getTime() - Date.UTC(1899, 11, 30)) / 86_400_000) * 1e6) / 1e6;
}

function feuilleXml(f: Feuille) {
  const gras = new Set(f.gras ?? [0]);
  const cols = f.colonnes?.length
    ? `<cols>${f.colonnes.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
    : '';
  const rows = f.lignes
    .map((ligne, r) => {
      const cells = ligne
        .map((v, c) => {
          const ref = `${colonne(c)}${r + 1}`;
          const s = gras.has(r) ? ' s="1"' : '';
          if (v === null || v === undefined || v === '') return '';
          if (typeof v === 'number') return `<c r="${ref}"${s} t="n"><v>${Number.isFinite(v) ? v : 0}</v></c>`;
          if (typeof v === 'object' && 'f' in v) return `<c r="${ref}"${s}><f>${xml(v.f)}</f></c>`;
          if (typeof v === 'object' && 'd' in v) return `<c r="${ref}" s="2"><v>${serie(v.d)}</v></c>`;
          return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${xml(String(v))}</t></is></c>`;
        })
        .join('');
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join('');
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `${cols}<sheetData>${rows}</sheetData></worksheet>`
  );
}

// ─── Le zip (méthode « deflate », CRC-32 maison) ────────────────────────────

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zip(entrees: { nom: string; contenu: Buffer }[]): Buffer {
  const locaux: Buffer[] = [];
  const centraux: Buffer[] = [];
  let offset = 0;
  for (const e of entrees) {
    const nom = Buffer.from(e.nom, 'utf8');
    const comp = deflateRawSync(e.contenu);
    const crc = crc32(e.contenu);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0x21, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comp.length, 18);
    local.writeUInt32LE(e.contenu.length, 22);
    local.writeUInt16LE(nom.length, 26);
    local.writeUInt16LE(0, 28);
    locaux.push(local, nom, comp);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(comp.length, 20);
    central.writeUInt32LE(e.contenu.length, 24);
    central.writeUInt16LE(nom.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centraux.push(central, nom);
    offset += local.length + nom.length + comp.length;
  }
  const dirLen = centraux.reduce((t, b) => t + b.length, 0);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(0, 4);
  fin.writeUInt16LE(0, 6);
  fin.writeUInt16LE(entrees.length, 8);
  fin.writeUInt16LE(entrees.length, 10);
  fin.writeUInt32LE(dirLen, 12);
  fin.writeUInt32LE(offset, 16);
  fin.writeUInt16LE(0, 20);
  return Buffer.concat([...locaux, ...centraux, fin]);
}

export function classeur(feuilles: Feuille[]): Buffer {
  const noms = feuilles.map((f) => f.nom.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31));
  const types =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
    feuilles.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') +
    `</Types>`;
  const rels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const workbook =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>` +
    noms.map((n, i) => `<sheet name="${xml(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') +
    `</sheets></workbook>`;
  const wbRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    feuilles.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
    `<Relationship Id="rId${feuilles.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    `</Relationships>`;
  const styles =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts>` +
    `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
    `<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>` +
    `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
    `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
    `<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>` +
    `</styleSheet>`;
  return zip([
    { nom: '[Content_Types].xml', contenu: Buffer.from(types) },
    { nom: '_rels/.rels', contenu: Buffer.from(rels) },
    { nom: 'xl/workbook.xml', contenu: Buffer.from(workbook) },
    { nom: 'xl/_rels/workbook.xml.rels', contenu: Buffer.from(wbRels) },
    { nom: 'xl/styles.xml', contenu: Buffer.from(styles) },
    ...feuilles.map((f, i) => ({ nom: `xl/worksheets/sheet${i + 1}.xml`, contenu: Buffer.from(feuilleXml(f)) })),
  ]);
}
