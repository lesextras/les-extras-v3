'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { loginSchema, type LoginValues } from '@/lib/validation';
import { login } from '@/lib/auth-client';
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
} from '@/components/ui/form';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginValues) {
    setSubmitting(true);
    try {
      const result = await login(values);
      toast({ title: 'Connexion réussie', description: 'Bon retour parmi nous !', variant: 'success' });
      const next = params.get('next');
      const needsOnboarding = (result.user?.onboardingStep ?? 3) < 3;
      router.push(next || (needsOnboarding ? '/welcome' : '/dashboard'));
      router.refresh();
    } catch (err) {
      toast({
        title: 'Connexion impossible',
        description: err instanceof Error ? err.message : 'Vérifiez vos identifiants.',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Se connecter</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Accédez à votre espace LES EXTRAS.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Adresse e-mail</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="vous@etablissement.fr"
                    leftIcon={<Mail />}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel required>Mot de passe</FormLabel>
                  {/* Ce lien pointait vers /login : il rechargeait la page de
                      connexion et ne menait donc nulle part. La
                      réinitialisation en autonomie n'existe pas encore ; en
                      attendant on envoie vers un chemin qui aboutit vraiment.
                      Un chemin lent vaut mieux qu'un chemin faux. */}
                  <Link href="/contact" className="text-xs font-medium text-primary hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    leftIcon={<Lock />}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" size="lg" loading={submitting}>
            Se connecter
            {!submitting && <ArrowRight />}
          </Button>
        </form>
      </Form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Pas encore de compte ?{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
