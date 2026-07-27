"use client";

// Formulaire d'édition du profil utilisateur (+ champs freelance).
//   PATCH /users/me  { firstName, lastName, phone, + champs profil freelance }
//   (un seul endpoint : l'API met à jour User ET Profile en une transaction)
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { FileUpload, type FichierDepose } from "./FileUpload";
import { Field, Textarea } from "./form-fields";
import { SectionTitle } from "./ui";
import type { Profile, SessionUser } from "./types";

export function ProfileForm({
  user,
  profile,
  isFreelance,
  accountId,
}: {
  user: SessionUser & { phone?: string | null };
  profile?: Profile | null;
  isFreelance: boolean;
  accountId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<FichierDepose | null>(null);
  const [photoTouchee, setPhotoTouchee] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      // Un seul appel : l'API /users/me met à jour l'identité ET le profil
      // freelance (bio, métier, ville, tarif…) dans la même transaction.
      const body: Record<string, unknown> = {
        firstName: String(fd.get("firstName") || "") || undefined,
        lastName: String(fd.get("lastName") || "") || undefined,
        phone: String(fd.get("phone") || "") || undefined,
      };
      // On ne touche à la photo que si la personne l'a modifiée pendant la
      // session : sinon on laisserait un champ vide écraser l'existant.
      if (photoTouchee) body.avatarFileId = photo?.id ?? "";
      if (isFreelance) {
        Object.assign(body, {
          job: String(fd.get("job") || "") || undefined,
          bio: String(fd.get("bio") || "") || undefined,
          city: String(fd.get("city") || "") || undefined,
          postalCode: String(fd.get("postalCode") || "") || undefined,
          radiusKm: fd.get("radiusKm") ? Number(fd.get("radiusKm")) : undefined,
          hourlyRate: fd.get("hourlyRate") ? Number(fd.get("hourlyRate")) : undefined,
          skills: String(fd.get("skills") || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        });
      }
      await apiRequest("/users/me", { method: "PATCH", body, accountId });
      toast({ title: "Profil mis à jour" });
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
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <SectionTitle title="Identité" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Prénom" htmlFor="firstName">
              <Input id="firstName" name="firstName" defaultValue={user.firstName ?? ""} />
            </Field>
            <Field label="Nom" htmlFor="lastName">
              <Input id="lastName" name="lastName" defaultValue={user.lastName ?? ""} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="email">
              <Input id="email" defaultValue={user.email} disabled />
            </Field>
            <Field label="Téléphone" htmlFor="phone">
              <Input id="phone" name="phone" defaultValue={user.phone ?? ""} placeholder="06 12 34 56 78" />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Photo de profil" htmlFor="avatar">
              <FileUpload
                famille="avatar"
                accountId={accountId}
                fichier={photo}
                onChange={(f) => {
                  setPhoto(f);
                  setPhotoTouchee(true);
                }}
                label="Choisir une photo"
                aide="JPEG, PNG ou WEBP · 3 Mo maximum"
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {isFreelance ? (
        <Card>
          <CardHeader>
            <SectionTitle title="Profil professionnel" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Métier" htmlFor="job">
              <Input id="job" name="job" defaultValue={profile?.job ?? ""} placeholder="Éducateur spécialisé" />
            </Field>
            <Field label="Bio" htmlFor="bio">
              <Textarea id="bio" name="bio" rows={4} defaultValue={profile?.bio ?? ""} />
            </Field>
            <Field label="Compétences" htmlFor="skills" hint="Séparées par des virgules">
              <Input
                id="skills"
                name="skills"
                defaultValue={(profile?.skills ?? []).join(", ")}
                placeholder="Internat, TSA, gestion de crise"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Ville" htmlFor="city">
                <Input id="city" name="city" defaultValue={profile?.city ?? ""} />
              </Field>
              <Field label="Code postal" htmlFor="postalCode">
                <Input id="postalCode" name="postalCode" defaultValue={profile?.postalCode ?? ""} />
              </Field>
              <Field label="Rayon (km)" htmlFor="radiusKm">
                <Input id="radiusKm" name="radiusKm" type="number" defaultValue={profile?.radiusKm ?? 30} />
              </Field>
              <Field label="Taux horaire (€)" htmlFor="hourlyRate">
                <Input
                  id="hourlyRate"
                  name="hourlyRate"
                  type="number"
                  step="0.5"
                  defaultValue={profile?.hourlyRate ? String(profile.hourlyRate) : ""}
                />
              </Field>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
