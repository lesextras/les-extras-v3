"use client";

// Identité de facturation du compte — c'est elle qui apparaît sur les
// factures émises depuis cet outil (en-tête, mention de TVA, coordonnées de
// règlement).
//   PATCH /accounts/:id  { legalName, siret, address, city, postalCode, phone, vatMention, iban, bic }
//
// Avant ce formulaire, seul un administrateur de la plateforme pouvait saisir
// ces champs (back-office) : un établissement ou un freelance qui émettait sa
// propre facture depuis « Devis & factures » n'avait aucun moyen d'indiquer
// sa propre raison sociale ou son SIRET — la facture sortait donc incomplète.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Field } from "./form-fields";
import { SectionTitle } from "./ui";

export interface IdentiteFacturation {
  legalName?: string | null;
  siret?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  vatMention?: string | null;
  /** Coordonnées de règlement, imprimées sur les factures émises par ce compte. */
  iban?: string | null;
  bic?: string | null;
  /** Logo imprimé en tête des devis et factures émis par ce compte. */
  logoUrl?: string | null;
}

export function FacturationSettings({
  accountId,
  identite,
  canManage,
}: {
  accountId: string;
  identite: IdentiteFacturation;
  canManage: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const body = {
        legalName: String(fd.get("legalName") || "") || undefined,
        siret: String(fd.get("siret") || "") || undefined,
        address: String(fd.get("address") || "") || undefined,
        city: String(fd.get("city") || "") || undefined,
        postalCode: String(fd.get("postalCode") || "") || undefined,
        phone: String(fd.get("phone") || "") || undefined,
        vatMention: String(fd.get("vatMention") || "") || undefined,
        iban: String(fd.get("iban") || "") || undefined,
        bic: String(fd.get("bic") || "") || undefined,
        logoUrl: String(fd.get("logoUrl") || "") || undefined,
      };
      await apiRequest(`/accounts/${accountId}`, { method: "PATCH", body, accountId });
      toast({ title: "Identité de facturation mise à jour" });
      router.refresh();
    } catch (err) {
      toast({
        title: "Enregistrement impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <SectionTitle title="Identité de facturation" />
          <p className="text-sm text-muted-foreground">
            Ces informations apparaissent sur les factures que vous émettez depuis « Devis &
            factures ». Sans elles, une facture est incomplète au regard de la loi.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Raison sociale"
              htmlFor="legalName"
              hint="Le nom légal qui doit apparaître sur vos factures — celui de votre structure, ou le vôtre si vous êtes indépendant·e."
            >
              <Input
                id="legalName"
                name="legalName"
                defaultValue={identite.legalName ?? ""}
                placeholder="MECS Les Tilleuls"
                disabled={!canManage}
              />
            </Field>
            <Field
              label="SIRET"
              htmlFor="siret"
              hint="Obligatoire sur une facture (art. L. 441-9 du code de commerce). 14 chiffres."
            >
              <Input
                id="siret"
                name="siret"
                defaultValue={identite.siret ?? ""}
                placeholder="123 456 789 00012"
                disabled={!canManage}
              />
            </Field>
          </div>
          <Field label="Adresse" htmlFor="address" hint="L'adresse de facturation, telle qu'elle doit apparaître sur le document.">
            <Input id="address" name="address" defaultValue={identite.address ?? ""} disabled={!canManage} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
            <Field label="Ville" htmlFor="city">
              <Input id="city" name="city" defaultValue={identite.city ?? ""} disabled={!canManage} />
            </Field>
            <Field label="Code postal" htmlFor="postalCode">
              <Input id="postalCode" name="postalCode" defaultValue={identite.postalCode ?? ""} disabled={!canManage} />
            </Field>
          </div>
          <Field label="Téléphone" htmlFor="phone">
            <Input id="phone" name="phone" defaultValue={identite.phone ?? ""} disabled={!canManage} />
          </Field>
          <Field
            label="Mention de TVA"
            htmlFor="vatMention"
            hint="Affichée telle quelle sur vos factures. Laissez vide pour garder la mention par défaut : « TVA non applicable, art. 293 B du CGI » (franchise en base). Si vous êtes assujetti·e à la TVA, indiquez votre taux et votre numéro de TVA intracommunautaire."
          >
            <Input
              id="vatMention"
              name="vatMention"
              defaultValue={identite.vatMention ?? ""}
              placeholder="TVA non applicable, art. 293 B du CGI"
              disabled={!canManage}
            />
          </Field>
          {/* COORDONNÉES DE RÈGLEMENT. Le produit annonce un règlement par
              virement, mais rien ne permettait de saisir l'IBAN : la facture
              partait sans le moyen de la payer. Rien n'est pré-rempli ni
              suggéré — des coordonnées bancaires ne s'inventent pas. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
            <Field
              label="IBAN"
              htmlFor="iban"
              hint="Apparaît dans la section « Règlement » des factures que vous émettez, pour que votre client puisse vous payer par virement. Laissez vide si vous préférez communiquer votre RIB autrement : la facture sortira alors sans coordonnées bancaires."
            >
              <Input
                id="iban"
                name="iban"
                defaultValue={identite.iban ?? ""}
                placeholder="FR76 …"
                autoComplete="off"
                disabled={!canManage}
              />
            </Field>
            <Field
              label="BIC"
              htmlFor="bic"
              hint="Facultatif : il n'est plus exigé pour un virement en zone SEPA."
            >
              <Input
                id="bic"
                name="bic"
                defaultValue={identite.bic ?? ""}
                autoComplete="off"
                disabled={!canManage}
              />
            </Field>
          </div>
          <Field
            label="Logo (adresse de l'image)"
            htmlFor="logoUrl"
            hint="Imprimé en tête de vos devis et factures, à la place de leur en-tête sobre. Une image PNG ou JPEG accessible en ligne (le logo de votre site, par exemple). Laissez vide pour des documents sans logo — c'est très bien aussi."
          >
            <Input
              id="logoUrl"
              name="logoUrl"
              type="url"
              defaultValue={identite.logoUrl ?? ""}
              placeholder="https://votre-site.fr/logo.png"
              disabled={!canManage}
            />
          </Field>
          {canManage ? (
            <div className="flex justify-end">
              <Button type="submit" loading={loading}>
                Enregistrer
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Seuls la direction et l&apos;administration peuvent modifier ces informations.
            </p>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
