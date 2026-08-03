'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Phone, MapPin, Hash, ArrowRight, ArrowLeft, Check, FileUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { onboardingProfileSchema, type OnboardingProfileValues } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';

/**
 * Les étapes dépendent du type de compte. Un établissement n'a aucun diplôme
 * ni justificatif personnel à déposer : lui montrer un dépôt de documents à
 * l'inscription, c'est lui demander quelque chose qui n'existe pas chez lui.
 * L'étape reste pour les intervenants, chez qui elle a un sens.
 */
const ETAPES_ETABLISSEMENT = ['Profil', 'Finalisation'] as const;
const ETAPES_INTERVENANT = ['Profil', 'Documents', 'Finalisation'] as const;

export default function WizardForm({
  typeDeCompte,
}: {
  typeDeCompte: 'ESTABLISHMENT' | 'FREELANCE';
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = React.useState(0);
  const STEPS: readonly string[] =
    typeDeCompte === 'ESTABLISHMENT' ? ETAPES_ETABLISSEMENT : ETAPES_INTERVENANT;
  const etape = STEPS[step];
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<OnboardingProfileValues>({
    resolver: zodResolver(onboardingProfileSchema),
    defaultValues: { phone: '', city: '', postalCode: '', bio: '' },
    mode: 'onTouched',
  });

  async function next() {
    if (step === 0) {
      const ok = await form.trigger(['phone', 'city', 'postalCode', 'bio']);
      if (!ok) return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function prev() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function finish() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: STEPS.length, profile: form.getValues() }),
      });
      if (!res.ok) throw new Error('Impossible d’enregistrer votre profil.');
      toast({ title: 'Profil complété', description: 'Bienvenue sur LES EXTRAS !', variant: 'success' });
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      toast({
        title: 'Oups',
        description: err instanceof Error ? err.message : 'Réessayez.',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Indicateur d'étapes */}
      <ol className="mb-8 flex items-center gap-3">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={label} className="flex flex-1 items-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors',
                    done && 'bg-primary text-primary-foreground',
                    active && 'bg-primary text-primary-foreground ring-4 ring-primary/15',
                    !done && !active && 'bg-muted text-muted-foreground',
                  )}
                >
                  {done ? <Check className="size-4" /> : i + 1}
                </span>
                <span className={cn('hidden text-sm font-medium sm:block', active ? 'text-foreground' : 'text-muted-foreground')}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span className={cn('h-px flex-1', done ? 'bg-primary' : 'bg-border')} />
              )}
            </li>
          );
        })}
      </ol>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft md:p-8">
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} noValidate>
            {/* Étape 1 : Profil */}
            {etape === 'Profil' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold">Vos informations</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Elles permettent de vous mettre en relation avec les bonnes structures.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="06 12 34 56 78" leftIcon={<Phone />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Ville</FormLabel>
                        <FormControl>
                          <Input placeholder="Melun" leftIcon={<MapPin />} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Code postal</FormLabel>
                        <FormControl>
                          <Input placeholder="77000" inputMode="numeric" leftIcon={<Hash />} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Présentation</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Quelques mots sur votre parcours, vos spécialités…"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Optionnel — 600 caractères maximum.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Étape 2 : documents — intervenants uniquement */}
            {etape === 'Documents' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold">Vos justificatifs</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ajoutez vos justificatifs pour accélérer la validation de votre profil.
                  </p>
                </div>
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 p-8 text-center transition-colors hover:border-primary/40">
                  <span className="grid size-12 place-items-center rounded-xl bg-primary-soft text-primary">
                    <FileUp className="size-6" />
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    Vos diplômes et justificatifs
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Vous les déposerez depuis votre dossier, une fois votre compte créé —
                    au moment où un établissement vous les demandera.
                  </span>
                </label>
                <div className="rounded-xl bg-accent/60 p-4 text-sm text-accent-foreground">
                  <Sparkles className="mb-1 size-4" />
                  Vos documents resteront privés : seuls les établissements avec lesquels vous
                  travaillez y auront accès, et vous pourrez les retirer à tout moment.
                </div>
              </div>
            )}

            {/* Dernière étape : finalisation */}
            {etape === 'Finalisation' && (
              <div className="space-y-5 text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
                  <Check className="size-7" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold">Tout est prêt !</h2>
                  <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                    Vous pouvez maintenant accéder à votre tableau de bord. Vous compléterez les
                    éléments manquants quand vous le souhaitez.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between">
              <Button type="button" variant="ghost" onClick={prev} disabled={step === 0 || submitting}>
                <ArrowLeft />
                Retour
              </Button>
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={next}>
                  Continuer
                  <ArrowRight />
                </Button>
              ) : (
                <Button type="button" onClick={finish} loading={submitting}>
                  Accéder à mon espace
                  {!submitting && <ArrowRight />}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
