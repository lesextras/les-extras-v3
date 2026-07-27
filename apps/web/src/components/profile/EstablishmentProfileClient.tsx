"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import {
  Building2,
  Phone,
  MapPin,
  FileText,
  Save,
  Pencil,
  X,
  Users,
  BedDouble,
  CalendarDays,
  Shield,
  CheckCircle2,
  Clock,
  Globe,
  Briefcase,
  HeartPulse,
  MapPinned,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { updateEstablishmentProfile, type EstablishmentFormValues } from "@/app/actions/establishment";
import { containerVariants, itemFadeUp, SPRING_SOFT } from "@/lib/motion";

/* ────────────────── Schema ────────────────── */
const estabSchema = z.object({
  companyName: z.string().min(2, "Min. 2 caractères"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  siret: z.string().optional(),
  tvaNumber: z.string().optional(),
  bio: z.string().optional(),
});

/* ────────────────── Types ────────────────── */
interface EstablishmentProfileClientProps {
  initialData: {
    companyName: string;
    phone: string;
    address: string;
    city: string;
    zipCode: string;
    country: string;
    siret: string;
    tvaNumber: string;
    bio: string;
    createdAt: string;
  };
  stats: {
    totalMissions: number;
    activeBookings: number;
    availableCredits: number;
  };
}

/* ────────────────── Metric Card ────────────────── */
function MetricCard({ icon: Icon, label, value, color, sub }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-white/70 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        {sub && <Badge variant="quiet" className="text-[10px]">{sub}</Badge>}
      </div>
      <div>
        <p className="text-2xl font-bold font-[family-name:var(--font-display)]">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════ */
/*            ESTABLISHMENT PROFILE            */
/* ════════════════════════════════════════════ */
export function EstablishmentProfileClient({ initialData, stats }: EstablishmentProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<EstablishmentFormValues>({
    resolver: zodResolver(estabSchema),
    defaultValues: {
      companyName: initialData.companyName,
      phone: initialData.phone,
      address: initialData.address,
      city: initialData.city,
      zipCode: initialData.zipCode,
      country: initialData.country,
      siret: initialData.siret,
      tvaNumber: initialData.tvaNumber,
      bio: initialData.bio,
    },
  });

  /* ── Completeness ── */
  const vals = form.watch();
  const fields = [vals.companyName, vals.phone, vals.address, vals.city, vals.siret, vals.bio];
  const filled = fields.filter(Boolean).length;
  const pct = Math.round((filled / fields.length) * 100);

  function onSubmit(data: EstablishmentFormValues) {
    startTransition(async () => {
      const result = await updateEstablishmentProfile(data);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Fiche établissement mise à jour !");
        setIsEditing(false);
      }
    });
  }

  const memberSince = initialData.createdAt
    ? new Date(initialData.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : "—";

  const initials = initialData.companyName
    ? initialData.companyName.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
    : "ET";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12"
    >
      {/* ── HERO BANNER ── */}
      <motion.div variants={itemFadeUp} className="relative overflow-hidden rounded-2xl">
        <div className="h-36 bg-gradient-to-br from-[hsl(var(--coral))] via-[hsl(var(--coral)/0.8)] to-[hsl(var(--sand)/0.7)]" />
        <div className="absolute inset-0 dot-mesh opacity-30" />

        <div className="relative -mt-16 px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {/* Logo */}
            <div className="h-28 w-28 rounded-2xl glass-panel dark-card-shadow border-2 border-[rgba(255,255,255,0.10)] flex items-center justify-center">
              <div className="text-center">
                <Building2 className="h-8 w-8 mx-auto text-[hsl(var(--coral))]" />
                <span className="text-sm font-bold text-[hsl(var(--coral))] font-[family-name:var(--font-display)] mt-1 block">
                  {initials}
                </span>
              </div>
            </div>

            {/* Name & meta */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-display)] truncate">
                {initialData.companyName || "Mon Établissement"}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="coral">Établissement</Badge>
                {initialData.city && (
                  <Badge variant="quiet" className="gap-1">
                    <MapPin className="h-3 w-3" />{initialData.city}
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/account">
                  <Users className="h-4 w-4 mr-1.5" />
                  Coordonnées compte
                </a>
              </Button>
              <Button
                variant={isEditing ? "outline" : "default"}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? (
                  <><X className="h-4 w-4 mr-1.5" />Annuler</>
                ) : (
                  <><Pencil className="h-4 w-4 mr-1.5" />Modifier</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── METRICS ── */}
      <motion.div variants={itemFadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          icon={Briefcase}
          label="Missions postées"
          value={stats.totalMissions}
          color="bg-[hsl(var(--coral-light))] text-[hsl(var(--coral))]"
        />
        <MetricCard
          icon={CalendarDays}
          label="Réservations actives"
          value={stats.activeBookings}
          color="bg-[hsl(var(--teal-light))] text-[hsl(var(--teal))]"
        />
        <MetricCard
          icon={HeartPulse}
          label="Crédits restants"
          value={stats.availableCredits}
          color="bg-[hsl(var(--violet-light))] text-[hsl(var(--violet))]"
        />
        <MetricCard
          icon={BadgeCheck}
          label="Complétude"
          value={`${pct}%`}
          color="bg-[hsl(var(--emerald-light))] text-[hsl(var(--emerald))]"
          sub={pct >= 80 ? "Vérifié" : "En cours"}
        />
      </motion.div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — form area */}
        <div className="lg:col-span-2 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* SECTION: INFORMATIONS GÉNÉRALES */}
              <motion.div variants={itemFadeUp}>
                <GlassCard animate>
                  <GlassCardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--coral-light))] text-[hsl(var(--coral))]">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold">Informations générales</h2>
                        <p className="text-xs text-muted-foreground">Identité de l&#39;établissement</p>
                      </div>
                    </div>
                  </GlassCardHeader>
                  <GlassCardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <FormField
                          control={form.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom de l&#39;établissement</FormLabel>
                              <FormControl><Input placeholder="EHPAD Les Jardins, Clinique…" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Décrivez votre établissement, sa mission, ses spécialités…"
                                  className="min-h-[100px]"
                                  {...field}
                                />
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
                              <FormControl><Input placeholder="01 23 45 67 89" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    ) : (
                      <div className="space-y-3">
                        <InfoRow icon={Building2} label="Nom" value={initialData.companyName || "Non renseigné"} />
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Description</p>
                          <p className="text-sm leading-relaxed">{initialData.bio || "Aucune description renseignée."}</p>
                        </div>
                        <InfoRow icon={Phone} label="Téléphone" value={initialData.phone || "Non renseigné"} />
                      </div>
                    )}
                  </GlassCardContent>
                </GlassCard>
              </motion.div>

              {/* SECTION: ADRESSE */}
              <motion.div variants={itemFadeUp}>
                <GlassCard animate delay={0.1}>
                  <GlassCardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--teal-light))] text-[hsl(var(--teal))]">
                        <MapPinned className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold">Adresse</h2>
                        <p className="text-xs text-muted-foreground">Localisation de l&#39;établissement</p>
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
                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pays</FormLabel>
                              <FormControl><Input placeholder="France" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    ) : (
                      <div className="space-y-3">
                        <InfoRow icon={MapPin} label="Adresse" value={initialData.address || "Non renseigné"} />
                        <InfoRow icon={MapPinned} label="Ville" value={[initialData.zipCode, initialData.city].filter(Boolean).join(" ") || "Non renseigné"} />
                        <InfoRow icon={Globe} label="Pays" value={initialData.country || "France"} />
                      </div>
                    )}

                    {/* Map placeholder */}
                    {!isEditing && (initialData.address || initialData.city) && (
                      <>
                        <Separator />
                        <div className="rounded-xl bg-[hsl(var(--surface-2))] h-40 flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border">
                          <MapPin className="h-5 w-5 mr-2 opacity-50" />
                          Carte interactive — bientôt disponible
                        </div>
                      </>
                    )}
                  </GlassCardContent>
                </GlassCard>
              </motion.div>

              {/* SECTION: ADMINISTRATIF */}
              <motion.div variants={itemFadeUp}>
                <GlassCard animate delay={0.2}>
                  <GlassCardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--sand-light))] text-[hsl(var(--sand))]">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold">Informations légales</h2>
                        <p className="text-xs text-muted-foreground">SIRET, TVA</p>
                      </div>
                    </div>
                  </GlassCardHeader>
                  <GlassCardContent className="space-y-4">
                    {isEditing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                              <FormLabel>N° TVA</FormLabel>
                              <FormControl><Input placeholder="FR12345678901" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <InfoRow icon={FileText} label="SIRET" value={initialData.siret || "Non renseigné"} />
                        <InfoRow icon={FileText} label="N° TVA" value={initialData.tvaNumber || "Non renseigné"} />
                      </div>
                    )}
                  </GlassCardContent>
                </GlassCard>
              </motion.div>

              {/* SAVE */}
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
                      <><Save className="h-4 w-4 mr-2" />Enregistrer</>
                    )}
                  </Button>
                </motion.div>
              )}
            </form>
          </Form>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-6">
          {/* Vérifications */}
          <motion.div variants={itemFadeUp}>
            <GlassCard animate delay={0.15}>
              <GlassCardHeader className="pb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[hsl(var(--coral))]" />
                  Vérifications
                </h3>
              </GlassCardHeader>
              <GlassCardContent className="space-y-3">
                <VerifRow done={!!initialData.companyName} label="Nom renseigné" />
                <VerifRow done={!!initialData.address} label="Adresse complète" />
                <VerifRow done={!!initialData.phone} label="Téléphone ajouté" />
                <VerifRow done={!!initialData.siret} label="SIRET vérifié" />
                <VerifRow done={!!initialData.bio} label="Description rédigée" />
              </GlassCardContent>
            </GlassCard>
          </motion.div>

          {/* Infos résumé */}
          <motion.div variants={itemFadeUp}>
            <GlassCard animate delay={0.25}>
              <GlassCardHeader className="pb-3">
                <h3 className="text-sm font-semibold">Résumé</h3>
              </GlassCardHeader>
              <GlassCardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inscrit depuis</span>
                  <span className="font-medium">{memberSince}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Complétude établissement</span>
                  <span className="font-medium">{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--coral))] to-[hsl(var(--sand))] transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
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
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <a href="/account">
                    <Users className="h-4 w-4 mr-2 text-[hsl(var(--teal))]" />
                    Coordonnées compte
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <a href="/dashboard">
                    <Briefcase className="h-4 w-4 mr-2 text-[hsl(var(--coral))]" />
                    Tableau de bord
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <a href="/dashboard/renforts">
                    <CalendarDays className="h-4 w-4 mr-2 text-[hsl(var(--violet))]" />
                    Gérer les renforts
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
