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
  user: SessionUser & { phone?: string | null; hebdoOptIn?: boolean };
  profile?: Profile | null;
  isFreelance: boolean;
  accountId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<FichierDepose | null>(null);
  const [photoTouchee, setPhotoTouchee] = useState(false);
  const [hebdo, setHebdo] = useState(user.hebdoOptIn !== false);

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
        hebdoOptIn: hebdo,
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
              <Field
                label="Taux horaire (€)"
                htmlFor="hourlyRate"
                hint="Le tarif affiché aux établissements sur votre profil."
              >
                <Input
                  id="hourlyRate"
                  name="hourlyRate"
                  type="number"
                  step="0.5"
                  defaultValue={profile?.hourlyRate ? String(profile.hourlyRate) : ""}
                />
              </Field>
            </div>

            {/* Le rayon pilote directement le score de proximité du matching.
                Laissé en champ numérique nu, personne ne le renseignait — et un
                rayon vide fait disparaître l'intervenant des propositions. */}
            <Field
              label="Rayon d'intervention"
              htmlFor="radiusKm"
              hint="Distance maximale que vous acceptez de parcourir depuis votre ville. C'est ce qui détermine les missions qui vous sont proposées."
            >
              <div className="flex flex-wrap gap-2">
                {[10, 20, 30, 50, 80, 100].map((km) => (
                  <label
                    key={km}
                    className="cursor-pointer rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium transition-colors hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"
                  >
                    <input
                      type="radio"
                      name="radiusKm"
                      value={km}
                      defaultChecked={(profile?.radiusKm ?? 30) === km}
                      className="sr-only"
                    />
                    {km} km
                  </label>
                ))}
              </div>
            </Field>
          </CardContent>
        </Card>
      ) : null}

      {/* Le rendez-vous du lundi — désactivable en un clic, sans détour par
          un e-mail de désinscription. */}
      <Card>
        <CardContent className="pt-6">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={hebdo}
              onChange={(e) => setHebdo(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded border-input accent-[hsl(var(--primary))]"
            />
            <span className="text-sm">
              <span className="font-medium">Recevoir le rendez-vous du lundi</span>
              <span className="block text-muted-foreground">
                Un e-mail par semaine, groupé : les missions près de chez vous, les questions sans
                réponse dans votre métier, les nouveautés. Jamais plus d&apos;un par semaine, et
                rien du tout s&apos;il n&apos;y a rien à dire.
              </span>
            </span>
          </label>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
