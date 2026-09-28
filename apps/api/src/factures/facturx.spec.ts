import { deflateSync } from 'node:zlib';
import { extraireXmlFacturX, lireFacturX, lirePdfFacturX, sembleFacturX } from './facturx';

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocument>
    <ram:ID>F-2026-0042</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">20260315</udt:DateTimeString></ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:SpecifiedTradeProduct><ram:Name>Ramettes A4 &amp; stylos</ram:Name></ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement><ram:NetPriceProductTradePrice><ram:ChargeAmount>4.50</ram:ChargeAmount></ram:NetPriceProductTradePrice></ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery><ram:BilledQuantity unitCode="C62">10</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement><ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>45.00</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation></ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>PAPETERIE DE L'ALMONT SAS</ram:Name>
        <ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">123456789</ram:ID></ram:SpecifiedLegalOrganization>
        <ram:ID schemeID="0009">12345678900021</ram:ID>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty><ram:Name>ASSOCIATION ADEPA</ram:Name></ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:PayeePartyCreditorFinancialAccount><ram:IBANID>FR7630006000011234567890189</ram:IBANID></ram:PayeePartyCreditorFinancialAccount>
      </ram:SpecifiedTradeSettlementPaymentMeans>
      <ram:SpecifiedTradePaymentTerms><ram:DueDateDateTime><udt:DateTimeString format="102">20260414</udt:DateTimeString></ram:DueDateDateTime></ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>45.00</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>45.00</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">9.00</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>54.00</ram:GrandTotalAmount>
        <ram:DuePayableAmount>54.00</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

/** Un PDF minimal qui embarque le XML en FlateDecode, comme le font les générateurs Factur-X. */
function pdfAvecXml(xml: string) {
  const flux = deflateSync(Buffer.from(xml, 'utf8'));
  const tete = Buffer.from(
    `%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Names << /EmbeddedFiles << /Names [(factur-x.xml) 3 0 R] >> >> /AF [3 0 R] >>\nendobj\n` +
      `3 0 obj\n<< /Type /Filespec /F (factur-x.xml) /UF (factur-x.xml) /AFRelationship /Data /EF << /F 4 0 R >> >>\nendobj\n` +
      `4 0 obj\n<< /Type /EmbeddedFile /Subtype /text#2Fxml /Filter /FlateDecode /Length ${flux.length} >>\nstream\n`,
    'latin1',
  );
  const pied = Buffer.from(`\nendstream\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n`, 'latin1');
  return Buffer.concat([tete, flux, pied]);
}

describe('Factur-X', () => {
  it('reconnaît un PDF Factur-X et en sort le XML', () => {
    const pdf = pdfAvecXml(XML);
    expect(sembleFacturX(pdf)).toBe(true);
    const xml = extraireXmlFacturX(pdf);
    expect(xml).toContain('CrossIndustryInvoice');
    expect(xml).toContain('F-2026-0042');
  });

  it('lit fournisseur, SIRET, numéro, dates, montants, IBAN et lignes, au centime', () => {
    const l = lireFacturX(XML)!;
    expect(l).not.toBeNull();
    expect(l.fournisseur).toBe("PAPETERIE DE L'ALMONT SAS");
    expect(l.siret).toBe('12345678900021');
    expect(l.numero).toBe('F-2026-0042');
    expect(l.dateFacture).toBe('2026-03-15');
    expect(l.dateEcheance).toBe('2026-04-14');
    expect(l.montantHT).toBe(45);
    expect(l.tva).toBe(9);
    expect(l.montantTTC).toBe(54);
    expect(l.iban).toBe('FR7630006000011234567890189');
    expect(l.devise).toBe('EUR');
    expect(l.lignes).toEqual([{ libelle: 'Ramettes A4 & stylos', quantite: 10, prixUnitaire: 4.5, total: 45 }]);
    expect(l.poste).toBeNull();
  });

  it('rend null sur un PDF ordinaire, sans lever', () => {
    const pdf = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF', 'latin1');
    expect(sembleFacturX(pdf)).toBe(false);
    expect(lirePdfFacturX(pdf)).toBeNull();
  });

  it('enchaîne PDF → lecture', () => {
    const l = lirePdfFacturX(pdfAvecXml(XML))!;
    expect(l.montantTTC).toBe(54);
    expect(l.fournisseur).toBe("PAPETERIE DE L'ALMONT SAS");
  });
});
