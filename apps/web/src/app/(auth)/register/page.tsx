'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Building2, UserRound, Briefcase, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { registerSchema, type RegisterValues } from '@/lib/validation';
import { register as registerAccount } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const accountTypes = [
  {
    key: 'ESTABLISHMENT' as const,
    icon: Building2,
    title: 'Établissement',
    desc: 'MECS, IME, ITEP, EHPAD, SESSAD… Je recherche du renfort.',
  },
  {
    key: 'FREELANCE' as const,
    icon: UserRound,
    title: 'Professionnel',
    desc: 'Éducateur, moniteur, thérapeute… Je propose mes services en indépendant.',
  },
  {
    // Même compte que « Professionnel » côté droits (indépendant tant que le
    // rattachement n'est pas confirmé) : voir la note dans onSubmit ci-dessous.
    key: 'SALARIE' as const,
    icon: Briefcase,
    title: 'Salarié',
    desc: 'Je travaille pour un établissement et je veux m’y rattacher.',
  },
];

export default function RegisterPage() {
  const router = useRouter();
  // Une personne invitée arrive souvent ici sans compte. Sans ce paramètre,
  // elle créerait son compte puis perdrait l'invitation en route.
  const params = useSearchParams();
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  // « Salarié » crée un compte FREELANCE (mêmes droits qu'un indépendant en
  // attendant) — ce drapeau ne sert qu'à afficher la bonne tuile et à envoyer
  // la personne vers l'étape de rattachement après l'inscription.
  const [profilSalarie, setProfilSalarie] = React.useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accountType: undefined,
      firstName: '',
      lastName: '',
      organizationName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false as unknown as true,
    },
  });

  const selectedType = form.watch('accountType');
  // Tuile affichée comme active : « Salarié » partage la valeur FREELANCE du
  // formulaire, donc on la distingue via le drapeau plutôt que via le champ.
  const selectedTile = selectedType === 'FREELANCE' && profilSalarie ? 'SALARIE' : selectedType;

  async function onSubmit(values: RegisterValues) {
    setSubmitting(true);
    try {
      await registerAccount(values);
      toast({
        title: 'Compte créé',
        description: 'Bienvenue ! Finalisons votre profil.',
        variant: 'success',
      });
      const suite = params.get('next');
      // Un profil « Salarié » est envoyé vers l'étape de rattachement du
      // wizard ; sauf si une invitation (`next`) l'attend déjà ailleurs.
      router.push(suite || (profilSalarie ? '/welcome?bienvenue=1&salarie=1' : '/welcome?bienvenue=1'));
      router.refresh();
    } catch (err) {
      toast({
        title: 'Inscription impossible',
        description: err instanceof Error ? err.message : 'Réessayez dans un instant.',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight">Créer un compte</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Gratuit, sans engagement. Choisissez votre profil pour commencer.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Choix du type de compte */}
          <FormField
            control={form.control}
            name="accountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  required
                  hint="Établissement si vous cherchez du renfort, Professionnel ou Salarié si vous proposez vos services. Vous pourrez créer un second compte plus tard si besoin."
                >
                  Je suis…
                </FormLabel>
                <div className="grid gap-3 sm:grid-cols-3">
                  {accountTypes.map((t) => {
                    const active = selectedTile === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => {
                          if (t.key === 'SALARIE') {
                            field.onChange('FREELANCE');
                            setProfilSalarie(true);
                          } else {
                            field.onChange(t.key);
                            setProfilSalarie(false);
                          }
                        }}
                        aria-pressed={active}
                        className={cn(
                          'relative flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-all',
                          active
                            ? 'border-primary bg-primary-soft/50 shadow-soft'
                            : 'border-border bg-card hover:border-primary/40',
                        )}
                      >
                        {active && (
                          <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                            <Check className="size-3" />
                          </span>
                        )}
                        <span
                          className={cn(
                            'grid size-10 place-items-center rounded-lg',
                            active ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground',
                          )}
                        >
                          <t.icon className="size-5" />
                        </span>
                        <span className="text-sm font-semibold">{t.title}</span>
                        <span className="text-xs text-muted-foreground">{t.desc}</span>
                      </button>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* L'API stocke un prénom et un nom séparés : c'est la personne qui
              ouvre le compte, y compris pour un établissement. Le nom de la
              structure est un champ distinct, demandé juste après. */}
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required hint="Le vôtre — c’est vous qui créez ce compte.">
                    Prénom
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Camille" autoComplete="given-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required hint="Votre nom de famille.">Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Durand" autoComplete="family-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {selectedType === 'ESTABLISHMENT' && (
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    required
                    hint="Le nom de votre structure (MECS, IME, ITEP, EHPAD…) tel qu’il doit apparaître sur vos documents."
                  >
                    Nom de l’établissement
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="MECS Les Tilleuls"
                      autoComplete="organization"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    C’est ce nom qui apparaîtra sur vos devis et vos factures.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel required hint="Elle servira à vous connecter et à recevoir les notifications importantes.">
                  Adresse e-mail
                </FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" placeholder="vous@exemple.fr" leftIcon={<Mail />} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required hint="8 caractères minimum, avec au moins une lettre et un chiffre.">
                    Mot de passe
                  </FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" placeholder="••••••••" leftIcon={<Lock />} {...field} />
                  </FormControl>
                  <FormDescription>8 caractères min., lettres et chiffres.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required hint="Retapez le même mot de passe, pour éviter une faute de frappe.">
                    Confirmation
                  </FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" placeholder="••••••••" leftIcon={<Lock />} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="acceptTerms"
            render={({ field }) => (
              <FormItem>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="mt-0.5 size-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span className="text-sm text-muted-foreground">
                    J’accepte les{' '}
                    <Link href="/legal#cgu" className="font-medium text-primary hover:underline">
                      conditions d’utilisation
                    </Link>{' '}
                    et la{' '}
                    <Link href="/legal#confidentialite" className="font-medium text-primary hover:underline">
                      politique de confidentialité
                    </Link>
                    .
                  </span>
                </label>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" size="lg" loading={submitting}>
            Créer mon compte
            {!submitting && <ArrowRight />}
          </Button>
        </form>
      </Form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Vous avez déjà un compte ?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
