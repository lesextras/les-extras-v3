'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Building2, UserRound, ArrowRight, Check } from 'lucide-react';
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
    value: 'ESTABLISHMENT' as const,
    icon: Building2,
    title: 'Établissement',
    desc: 'MECS, IME, ITEP, EHPAD, SESSAD… Je recherche du renfort.',
  },
  {
    value: 'FREELANCE' as const,
    icon: UserRound,
    title: 'Professionnel',
    desc: 'Éducateur, moniteur, thérapeute… Je propose mes services.',
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accountType: undefined,
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false as unknown as true,
    },
  });

  const selectedType = form.watch('accountType');

  async function onSubmit(values: RegisterValues) {
    setSubmitting(true);
    try {
      await registerAccount(values);
      toast({
        title: 'Compte créé',
        description: 'Bienvenue ! Finalisons votre profil.',
        variant: 'success',
      });
      router.push('/welcome');
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
                <FormLabel required>Je suis…</FormLabel>
                <div className="grid gap-3 sm:grid-cols-2">
                  {accountTypes.map((t) => {
                    const active = field.value === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => field.onChange(t.value)}
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

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>
                  {selectedType === 'ESTABLISHMENT' ? 'Nom de l’établissement' : 'Nom complet'}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      selectedType === 'ESTABLISHMENT' ? 'MECS Les Tilleuls' : 'Camille Durand'
                    }
                    autoComplete={selectedType === 'ESTABLISHMENT' ? 'organization' : 'name'}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Adresse e-mail</FormLabel>
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
                  <FormLabel required>Mot de passe</FormLabel>
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
                  <FormLabel required>Confirmation</FormLabel>
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
                    <Link href="/#" className="font-medium text-primary hover:underline">
                      conditions d’utilisation
                    </Link>{' '}
                    et la{' '}
                    <Link href="/#" className="font-medium text-primary hover:underline">
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
        Vous avez déjà un compte ?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
