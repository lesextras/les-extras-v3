"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Shield,
  Pencil,
  Save,
  Star,
  CalendarDays,
  CalendarCheck,
  Award,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  X,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GlassCard, GlassCardContent, GlassCardHeader } from "@/components/ui/glass-card";
import { toast } from "sonner";
import { updateFreelanceProfile, type ProfileFormValues } from "@/app/actions/profile";
import {
  containerVariants,
  itemFadeUp,
  SPRING_SOFT,
} from "@/lib/motion";
import { FreelanceKycDocumentsCard } from "@/components/profile/FreelanceKycDocumentsCard";
import type { KycSummary, UserKycDocument } from "@/lib/kyc-documents";

/* ────────────────── Schema ────────────────── */
const profileSchema = z.object({
  firstName: z.string().min(2, "Min. 2 caractères"),
  lastName: z.string().min(2, "Min. 2 caractères"),
  jobTitle: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  siret: z.string().optional(),
  tvaNumber: z.string().optional(),
  isAvailable: z.boolean().optional(),
  availableDays: z.array(z.string()).optional(),
});

/* ────────────────── Types ────────────────── */
interface UserProfileClientProps {
  initialData: {
    firstName: string;
    lastName: string;
    jobTitle: string;
    bio: string;
    avatar?: string;
    city: string;
    zipCode: string;
    siret: string;
    tvaNumber: string;
    phone: string;
    address: string;
    skills: string[];
    availableDays: string[];
    isAvailable: boolean;
    availableCredits: number;
    createdAt: string;
  };
  initialKycDocuments: UserKycDocument[];
  initialKycSummary: KycSummary;
  userRole: "ESTABLISHMENT" | "FREELANCE" | "ADMIN";
  userEmail: string;
}

/* ────────────────── Completeness Ring ────────────────── */
function CompletenessRing({ pct }: { pct: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative h-24 w-24">
      <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="hsl(var(--teal))"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-[hsl(var(--teal))]">
        {pct}%
      </span>
    </div>
  );
}

/* ────────────────── Stat Tile ────────────────── */
function StatTile({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl glass-panel-dense px-4 py-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════ */
/*                 MAIN COMPONENT              */
/* ════════════════════════════════════════════ */
export function UserProfileClient({
  initialData,
  initialKycDocuments,
  initialKycSummary,
  userRole,
  userEmail,
}: UserProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [newSkill, setNewSkill] = useState("");
  const [localAvailable, setLocalAvailable] = useState(initialData.isAvailable);
  const [localDays, setLocalDays] = useState<string[]>(initialData.availableDays);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: initialData.firstName,
      lastName: initialData.lastName,
      jobTitle: initialData.jobTitle,
      bio: initialData.bio,
      skills: initialData.skills,
      phone: initialData.phone,
      address: initialData.address,
      city: initialData.city,
      zipCode: initialData.zipCode,
      siret: initialData.siret,
      tvaNumber: initialData.tvaNumber,
      isAvailable: initialData.isAvailable,
      availableDays: initialData.availableDays,
    },
  });

  /* ── Completeness calculation ── */
  const vals = form.watch();
  const fields = [vals.firstName, vals.lastName, vals.jobTitle, vals.bio, vals.phone, vals.address, vals.city, vals.siret];
  const filled = fields.filter(Boolean).length;
  const pct = Math.round((filled / fields.length) * 100);

  /* ── Submit ── */
  function onSubmit(data: ProfileFormValues) {
    startTransition(async () => {
      const result = await updateFreelanceProfile({
        ...data,
        isAvailable: localAvailable,
        availableDays: localDays,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Profil mis à jour !");
        setIsEditing(false);
      }
    });
  }

  /* ── Skills ── */
  const addSkill = () => {
    if (newSkill.trim()) {
      const cur = form.getValues("skills") || [];
      if (!cur.includes(newSkill.trim())) {
        form.setValue("skills", [...cur, newSkill.trim()]);
      }
      setNewSkill("");
    }
  };
  const removeSkill = (s: string) => {
    const cur = form.getValues("skills") || [];
    form.setValue("skills", cur.filter(x => x !== s));
  };

  const initials = `${initialData.firstName?.[0] ?? ""}${initialData.lastName?.[0] ?? ""}`.toUpperCase() || "?";

  const memberSince = initialData.createdAt
    ? new Date(initialData.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : "—";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12"
    >
      {/* ── HERO BANNER ── */}
      <motion.div variants={itemFadeUp} className="relative overflow-hidden rounded-2xl">
        {/* Background gradient */}
        <div className="h-36 bg-gradient-to-br from-[hsl(var(--teal))] via-[hsl(var(--teal)/0.8)] to-[hsl(var(--emerald)/0.6)]" />

        {/* Dot pattern overlay */}
        <div className="absolute inset-0 dot-mesh opacity-30" />

        {/* Profile card overlay */}
        <div className="relative -mt-16 px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative group">
              <div className="h-28 w-28 rounded-2xl glass-panel dark-card-shadow border-2 border-[rgba(255,255,255,0.10)] flex items-center justify-center overflow-hidden">
                {initialData.avatar ? (
                  <img src={initialData.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-[hsl(var(--teal))] font-[family-name:var(--font-display)]">
                    {initials}
                  </span>
                )}
              </div>
              {/* Status dot */}
              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[hsl(var(--emerald))] border-2 border-[hsl(var(--background))]" />
            </div>

            {/* Name & meta */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-display)] truncate">
                {initialData.firstName} {initialData.lastName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {initialData.jobTitle && (
                  <Badge variant="teal">{initialData.jobTitle}</Badge>
                )}
                <Badge variant={userRole === "FREELANCE" ? "info" : "sand"}>
                  {userRole === "FREELANCE" ? "Indépendant" : "Établissement"}
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {userRole === "ESTABLISHMENT" && (
                <Button variant="outline" size="sm" asChild>
                  <a href="/account/establishment">
                    <Building2 className="h-4 w-4 mr-1.5" />
                    Profil Établissement
                  </a>
                </Button>
              )}
              <Button
                variant={isEditing ? "outline" : "default"}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? (
                  <>
                    <X className="h-4 w-4 mr-1.5" />
                    Annuler
                  </>
                ) : (
                  <>
                    <Pencil className="h-4 w-4 mr-1.5" />
                    Modifier
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── STATS BAR ── */}
      <motion.div variants={itemFadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile
          icon={Award}
          label="Crédits"
          value={initialData.availableCredits}
          color="bg-[hsl(var(--teal-light))] text-[hsl(var(--teal))]"
        />
        <StatTile
          icon={CalendarDays}
          label="Membre depuis"
          value={memberSince}
          color="bg-[hsl(var(--violet-light))] text-[hsl(var(--violet))]"
        />
        <StatTile
          icon={Star}
          label="Complétude"
          value={`${pct}%`}
          color="bg-[hsl(var(--sand-light))] text-[hsl(var(--sand))]"
        />
        <StatTile
          icon={Shield}
          label="Statut"
          value={pct >= 80 ? "Vérifié" : "En cours"}
          color={pct >= 80 ? "bg-[hsl(var(--emerald-light))] text-[hsl(var(--emerald))]" : "bg-[hsl(var(--coral-light))] text-[hsl(var(--coral))]"}
        />
      </motion.div>

      {/* ── MAIN GRID: Left (details) + Right (completeness + meta) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* SECTION: IDENTITÉ */}
              <motion.div variants={itemFadeUp}>
                <GlassCard animate>
                  <GlassCardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--teal-light))] text-[hsl(var(--teal))]">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold">Identité</h2>
                        <p className="text-xs text-muted-foreground">Informations personnelles</p>
                      </div>
                    </div>
                  </GlassCardHeader>
                  <GlassCardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prénom</FormLabel>
                                <FormControl><Input placeholder="Jean" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom</FormLabel>
                                <FormControl><Input placeholder="Dupont" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="jobTitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Spécialité / Titre</FormLabel>
                              <FormControl>
                                <Input placeholder="Infirmier DE, Aide-Soignant..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Téléphone</FormLabel>
                              <FormControl>
                                <Input placeholder="06 12 34 56 78" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    ) : (
                      <div className="space-y-3">
                        <InfoRow icon={User} label="Nom complet" value={`${initialData.firstName} ${initialData.lastName}`} />
                        <InfoRow icon={Mail} label="Email" value={userEmail} />
                        <InfoRow icon={Briefcase} label="Spécialité" value={initialData.jobTitle || "Non renseigné"} />
                        <InfoRow icon={Phone} label="Téléphone" value={initialData.phone || "Non renseigné"} />
                      </div>
                    )}
                  </GlassCardContent>
                </GlassCard>
              </motion.div>

              {/* SECTION: BIO & COMPÉTENCES */}
              <motion.div variants={itemFadeUp}>
                <GlassCard animate delay={0.1}>
                  <GlassCardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--violet-light))] text-[hsl(var(--violet))]">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold">Expertise</h2>
                        <p className="text-xs text-muted-foreground">Bio et compétences</p>
                      </div>
                    </div>
                  </GlassCardHeader>
                  <GlassCardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Présentez votre parcours professionnel..."
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div>
                          <p className="text-sm font-medium mb-2">Compétences</p>
                          <div className="flex gap-2 mb-3">
                            <Input
                              placeholder="Ajouter (ex: Pédiatrie)…"
                              value={newSkill}
                              onChange={(e) => setNewSkill(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                            />
                            <Button type="button" onClick={addSkill} variant="secondary" size="sm">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {(vals.skills || []).map((s, i) => (
                              <Badge key={i} variant="teal" className="pr-1 gap-1">
                                {s}
                                <button type="button" onClick={() => removeSkill(s)} className="ml-0.5 hover:text-destructive" aria-label={`Supprimer ${s}`}>
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Bio</p>
                          <p className="text-sm leading-relaxed">{initialData.bio || "Aucune bio renseignée."}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Compétences</p>
                          <div className="flex flex-wrap gap-1.5">
                            {initialData.skills.length > 0 ? (
                              initialData.skills.map((s, i) => (
                                <Badge key={i} variant="teal">{s}</Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground italic">Aucune compétence ajoutée.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </GlassCardContent>
                </GlassCard>
              </motion.div>

              {/* SECTION: DISPONIBILITÉ (Freelance only) */}
              {userRole === "FREELANCE" && (
                <motion.div variants={itemFadeUp}>
                  <GlassCard animate delay={0.15}>
                    <GlassCardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--color-teal-50))] text-[hsl(var(--teal))]">
                          <CalendarCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <h2 className="text-base font-semibold">Disponibilité</h2>
                          <p className="text-xs text-muted-foreground">Indiquez vos jours de disponibilité</p>
                        </div>
                      </div>
                    </GlassCardHeader>
                    <GlassCardContent className="space-y-5">
                      {/* Global toggle */}
                      <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">Disponible pour des missions</p>
                          <p className="text-xs text-muted-foreground">
                            {localAvailable
                              ? "Vous apparaissez comme disponible dans le catalogue"
                              : "Vous n'apparaissez pas comme disponible"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`relative flex h-2.5 w-2.5 rounded-full ${localAvailable ? "bg-emerald-500" : "bg-red-500"}`}>
                            {localAvailable && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
                          </span>
                          {isEditing ? (
                            <Switch
                              checked={localAvailable}
                              onCheckedChange={(checked) => {
                                setLocalAvailable(checked);
                                form.setValue("isAvailable", checked);
                              }}
                            />
                          ) : (
                            <Badge variant={localAvailable ? "teal" : "secondary"}>
                              {localAvailable ? "Disponible" : "Indisponible"}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Days grid */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-3">Jours d&apos;intervention habituels</p>
                        <div className="flex gap-2">
                          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => {
                            const isActive = localDays.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                disabled={!isEditing}
                                onClick={() => {
                                  const next = isActive
                                    ? localDays.filter((d) => d !== day)
                                    : [...localDays, day];
                                  setLocalDays(next);
                                  form.setValue("availableDays", next);
                                }}
                                className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-medium transition-all ${
                                  isActive
                                    ? "bg-[hsl(var(--color-teal-50))] text-[hsl(var(--color-teal-700))] border border-[hsl(var(--teal)/0.3)] shadow-sm"
                                    : "bg-muted/50 text-muted-foreground border border-transparent"
                                } ${isEditing ? "cursor-pointer hover:scale-105" : "cursor-default"}`}
                              >
                                {day.slice(0, 2)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </GlassCardContent>
                  </GlassCard>
                </motion.div>
              )}

              {userRole === "FREELANCE" && (
                <motion.div variants={itemFadeUp}>
                  <FreelanceKycDocumentsCard
                    initialDocuments={initialKycDocuments}
                    initialSummary={initialKycSummary}
                  />
                </motion.div>
              )}

              {/* SECTION: COORDONNÉES & ADMINISTRATIF */}
              <motion.div variants={itemFadeUp}>
                <GlassCard animate delay={0.2}>
                  <GlassCardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--sand-light))] text-[hsl(var(--sand))]">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold">Coordonnées & Administratif</h2>
                        <p className="text-xs text-muted-foreground">Adresse, SIRET, TVA</p>
                      </div>
                    </div>
                  </GlassCardHeader>
                  <GlassCardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Adresse</FormLabel>
                              <FormControl><Input placeholder="10 rue de la Paix" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="zipCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Code Postal</FormLabel>
                                <FormControl><Input placeholder="75001" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ville</FormLabel>
                                <FormControl><Input placeholder="Paris" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="siret"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SIRET</FormLabel>
                                <FormControl><Input placeholder="123 456 789 00012" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="tvaNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>TVA</FormLabel>
                                <FormControl><Input placeholder="FR..." {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <InfoRow icon={MapPin} label="Adresse" value={[initialData.address, initialData.zipCode, initialData.city].filter(Boolean).join(", ") || "Non renseigné"} />
                        <InfoRow icon={FileText} label="SIRET" value={initialData.siret || "Non renseigné"} />
                        <InfoRow icon={FileText} label="TVA" value={initialData.tvaNumber || "Non renseigné"} />
                      </div>
                    )}
                  </GlassCardContent>
                </GlassCard>
              </motion.div>

              {/* SAVE BUTTON */}
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={SPRING_SOFT}
                  className="flex justify-end"
                >
                  <Button type="submit" size="lg" disabled={isPending}>
                    {isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enregistrement…
                      </span>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Enregistrer les modifications
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </form>
          </Form>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-6">
          {/* Complétude */}
          <motion.div variants={itemFadeUp}>
            <GlassCard animate delay={0.15}>
              <GlassCardContent className="pt-6 flex flex-col items-center text-center">
                <CompletenessRing pct={pct} />
                <h3 className="mt-3 text-sm font-semibold">Profil complété</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {pct >= 80
                    ? "Votre profil est bien renseigné !"
                    : "Complétez votre profil pour plus de visibilité."}
                </p>
                {pct < 100 && (
                  <div className="mt-4 w-full space-y-2">
                    {!vals.firstName && <TodoItem label="Ajouter votre prénom" />}
                    {!vals.lastName && <TodoItem label="Ajouter votre nom" />}
                    {!vals.jobTitle && <TodoItem label="Ajouter votre spécialité" />}
                    {!vals.bio && <TodoItem label="Rédiger votre bio" />}
                    {!vals.phone && <TodoItem label="Ajouter un téléphone" />}
                    {!vals.address && <TodoItem label="Renseigner votre adresse" />}
                    {!vals.city && <TodoItem label="Ajouter votre ville" />}
                    {!vals.siret && <TodoItem label="Renseigner votre SIRET" />}
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>
          </motion.div>

          {/* Badges */}
          <motion.div variants={itemFadeUp}>
            <GlassCard animate delay={0.25}>
              <GlassCardHeader className="pb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[hsl(var(--teal))]" />
                  Vérifications
                </h3>
              </GlassCardHeader>
              <GlassCardContent className="space-y-3">
                <VerifRow done={!!initialData.firstName && !!initialData.lastName} label="Identité renseignée" />
                <VerifRow done={!!userEmail} label="Email vérifié" />
                <VerifRow done={!!initialData.phone} label="Téléphone ajouté" />
                <VerifRow done={!!initialData.siret} label="SIRET vérifié" />
                <VerifRow done={(initialData.skills?.length ?? 0) > 0} label="Compétences ajoutées" />
              </GlassCardContent>
            </GlassCard>
          </motion.div>

          {/* Quick actions */}
          <motion.div variants={itemFadeUp}>
            <GlassCard animate delay={0.35}>
              <GlassCardHeader className="pb-3">
                <h3 className="text-sm font-semibold">Actions rapides</h3>
              </GlassCardHeader>
              <GlassCardContent className="space-y-2">
                {userRole === "ESTABLISHMENT" && (
                  <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                    <a href="/account/establishment">
                      <Building2 className="h-4 w-4 mr-2 text-[hsl(var(--coral))]" />
                      Gérer l&#39;établissement
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <a href="/dashboard">
                    <Briefcase className="h-4 w-4 mr-2 text-[hsl(var(--teal))]" />
                    Tableau de bord
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <a href="/settings">
                    <Clock className="h-4 w-4 mr-2 text-[hsl(var(--violet))]" />
                    Paramètres
                  </a>
                </Button>
              </GlassCardContent>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────── Helpers ──────── */
function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm truncate">{value}</p>
      </div>
    </div>
  );
}

function TodoItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--coral))]" />
      {label}
    </div>
  );
}

function VerifRow({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      {done ? (
        <CheckCircle2 className="h-4 w-4 text-[hsl(var(--emerald))]" />
      ) : (
        <Clock className="h-4 w-4 text-muted-foreground/50" />
      )}
      <span className={`text-sm ${done ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
    </div>
  );
}
