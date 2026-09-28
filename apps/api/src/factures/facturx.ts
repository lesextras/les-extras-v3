import { inflateSync } from 'node:zlib';
import type { LectureFacture } from './lecture';

/**
 * FACTUR-X, LU NATIVEMENT.
 *
 * Une facture Factur-X (ou ZUGFeRD) est un PDF qui embarque un fichier XML
 * (`factur-x.xml`, norme EN 16931, syntaxe CII). Quand il est là, on n'a rien
 * à deviner : fournisseur, SIRET, numéro, dates, HT, TVA, TTC, IBAN et lignes
 * sont dans le XML, exacts au centime. La lecture ne consomme pas le moteur.
 *
 * Aucune dépendance : on lit les flux « EmbeddedFile » du PDF à la main
 * (décompression FlateDecode par zlib), et le XML par expressions régulières
 * sur les noms de balises sans leur préfixe d'espace de noms (`ram:`, `rsm:`,
 * `udt:` changent d'un émetteur à l'autre, les noms locaux ne changent pas).
 *
 * ⚠ La réforme de la facturation électronique (2026-2027) rend ce format
 * courant : c'est le cas normal de demain, pas l'exception.
 */

const NOMS_XML = ['factur-x.xml', 'zugferd-invoice.xml', 'ZUGFeRD-invoice.xml', 'xrechnung.xml', 'order-x.xml'];

/** Le XML Factur-X embarqué dans un PDF, ou null. */
export function extraireXmlFacturX(pdf: Buffer): string | null {
  const latin = pdf.toString('latin1');
  // Les objets « /Type /EmbeddedFile » portent le flux ; le nom du fichier est dans le
  // /Filespec voisin. On lit tous les flux embarqués et on garde celui qui est du CII.
  const re = /\/Type\s*\/EmbeddedFile[\s\S]*?stream\r?\n/g;
  let m: RegExpExecArray | null;
  const candidats: string[] = [];
  while ((m = re.exec(latin))) {
    const entete = m[0];
    const debut = m.index + entete.length;
    const finMarqueur = latin.indexOf('endstream', debut);
    if (finMarqueur < 0) continue;
    let fin = finMarqueur;
    const lg = /\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(entete);
    if (lg) fin = Math.min(finMarqueur, debut + Number(lg[1]));
    const brut = pdf.subarray(debut, fin);
    let texte: string | null = null;
    if (/\/FlateDecode/.test(entete)) {
      try {
        texte = inflateSync(brut).toString('utf8');
      } catch {
        // Le /Length peut être indirect ou approximatif : on retente jusqu'au marqueur, en tolérant la fin de ligne.
        try {
          texte = inflateSync(pdf.subarray(debut, finMarqueur)).toString('utf8');
        } catch {
          texte = null;
        }
      }
    } else {
      texte = brut.toString('utf8');
    }
    if (texte && /CrossIndustryInvoice/.test(texte)) candidats.push(texte);
  }
  if (candidats.length) return candidats[0];
  // Repli : un PDF non compressé peut porter le XML en clair.
  const clair = /<\?xml[\s\S]*?CrossIndustryInvoice[\s\S]*?<\/[\w:]*CrossIndustryInvoice>/.exec(latin);
  return clair ? Buffer.from(clair[0], 'latin1').toString('utf8') : null;
}

/** Le PDF porte-t-il un fichier joint nommé comme Factur-X ? (indice rapide, sans décompresser) */
export function sembleFacturX(pdf: Buffer): boolean {
  const latin = pdf.toString('latin1');
  return NOMS_XML.some((n) => latin.includes(n)) || latin.includes('/AFRelationship');
}

// ─── Lecture du XML CII ────────────────────────────────────────────────────

function balise(xml: string, nom: string): string | null {
  const m = new RegExp(`<(?:[\\w-]+:)?${nom}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${nom}>`).exec(xml);
  return m ? m[1] : null;
}

function bloc(xml: string | null, nom: string): string | null {
  return xml ? balise(xml, nom) : null;
}

function blocs(xml: string, nom: string): string[] {
  const out: string[] = [];
  const re = new RegExp(`<(?:[\\w-]+:)?${nom}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${nom}>`, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
}

function texte(xml: string | null, nom: string): string | null {
  if (!xml) return null;
  const v = balise(xml, nom);
  return v === null ? null : decoderEntites(v.replace(/<[^>]+>/g, '').trim()) || null;
}

function nombre(xml: string | null, nom: string): number | null {
  const t = texte(xml, nom);
  if (t === null) return null;
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

/** Une date CII : `<udt:DateTimeString format="102">20260315</udt:DateTimeString>`. */
function date(xml: string | null, nom: string): string | null {
  if (!xml) return null;
  const b = bloc(xml, nom);
  if (!b) return null;
  const m = /(\d{4})(\d{2})(\d{2})/.exec(b.replace(/<[^>]+>/g, ' '));
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function decoderEntites(s: string) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, c) => String.fromCodePoint(Number(c)))
    .replace(/&amp;/g, '&');
}

/**
 * Lit le XML et rend la même structure que le moteur. `poste` reste null :
 * le XML ne connaît pas notre budget, c'est la règle de dépôt ou la relecture
 * qui l'affecte.
 */
export function lireFacturX(xml: string): LectureFacture | null {
  if (!/CrossIndustryInvoice/.test(xml)) return null;
  const doc = bloc(xml, 'ExchangedDocument');
  const transaction = bloc(xml, 'SupplyChainTradeTransaction') ?? xml;
  const accord = bloc(transaction, 'ApplicableHeaderTradeAgreement');
  const vendeur = accord ? bloc(accord, 'SellerTradeParty') : null;
  const reglement = bloc(transaction, 'ApplicableHeaderTradeSettlement');
  const totaux = reglement ? bloc(reglement, 'SpecifiedTradeSettlementHeaderMonetarySummation') : null;

  const fournisseur = texte(vendeur, 'Name') ?? '';
  // SIRET : l'identifiant légal (schemeID 0002 = SIREN, 0009 = SIRET) ; on garde ce qui fait 14 chiffres.
  let siret: string | null = null;
  if (vendeur) {
    const ids = [...blocs(vendeur, 'ID'), texte(bloc(vendeur, 'SpecifiedLegalOrganization'), 'ID') ?? ''].map((x) => x.replace(/<[^>]+>/g, '').replace(/\D/g, ''));
    siret = ids.find((x) => x.length === 14) ?? null;
  }
  const ibanBloc = reglement ? bloc(reglement, 'PayeePartyCreditorFinancialAccount') : null;
  const iban = texte(ibanBloc, 'IBANID');
  const termes = reglement ? bloc(reglement, 'SpecifiedTradePaymentTerms') : null;

  const lignes = blocs(transaction, 'IncludedSupplyChainTradeLineItem')
    .slice(0, 60)
    .map((l) => {
      const produit = bloc(l, 'SpecifiedTradeProduct');
      const livraison = bloc(l, 'SpecifiedLineTradeDelivery');
      const prix = bloc(l, 'SpecifiedLineTradeAgreement');
      const total = bloc(l, 'SpecifiedLineTradeSettlement');
      return {
        libelle: (texte(produit, 'Name') ?? '').slice(0, 160),
        quantite: nombre(livraison, 'BilledQuantity'),
        prixUnitaire: nombre(bloc(prix, 'NetPriceProductTradePrice'), 'ChargeAmount'),
        total: nombre(bloc(total, 'SpecifiedTradeSettlementLineMonetarySummation'), 'LineTotalAmount'),
      };
    });

  const montantTTC = nombre(totaux, 'GrandTotalAmount');
  const montantHT = nombre(totaux, 'TaxBasisTotalAmount');
  const tva = nombre(totaux, 'TaxTotalAmount');
  const devise = (texte(reglement, 'InvoiceCurrencyCode') ?? 'EUR').toUpperCase().slice(0, 3);
  if (!fournisseur && montantTTC === null) return null;

  return {
    fournisseur,
    numero: texte(doc, 'ID'),
    dateFacture: date(doc, 'IssueDateTime'),
    dateEcheance: date(termes, 'DueDateDateTime'),
    montantHT,
    tva,
    montantTTC,
    devise: devise || 'EUR',
    poste: null,
    lignes,
    remarque: null,
    siret,
    iban,
  };
}

/** Le raccourci complet : un PDF → une lecture, ou null s'il n'est pas Factur-X. */
export function lirePdfFacturX(pdf: Buffer): LectureFacture | null {
  if (!sembleFacturX(pdf)) return null;
  const xml = extraireXmlFacturX(pdf);
  return xml ? lireFacturX(xml) : null;
}
