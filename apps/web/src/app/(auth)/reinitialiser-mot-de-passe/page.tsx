'use client';

// RÉINITIALISATION — la cible du lien envoyé par e-mail.
//
// Le jeton arrive dans l'URL. Il est signé et valable une heure ; il cesse de
// fonctionner dès que le mot de passe change, donc il ne sert qu'une fois
// (voir auth.service.ts, `empreinteMotDePasse`).
//
// Une fois le mot de passe changé, on ouvre directement l'espace : la personne
// vient de prouver qu'elle relève cette adresse et de choisir son mot de passe.
// Lui redemander de se connecter dans la foulée serait une formalité de plus,
// au moment précis où elle sortait déjà d'une contrariété.
import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, KeyRound, AlertTriangle } from 'lucide-react';
import {
  nouveauMotDePasseSchema,
  type NouveauMotDePasseValues,
} from '@/lib/validation';
import { reinitialiserMotDePasse } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';

function Formulaire() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const token = params.get('token') ?? '';
  const [envoi, setEnvoi] = React.useState(false);

  const form = useForm<NouveauMotDePasseValues>({
    resolver: zodResolver(nouveauMotDePasseSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  // Sans jeton, il n'y a rien à faire ici — et surtout rien à remplir. On le
  // dit tout de suite plutôt que d'afficher un formulaire qui échouera.
  if (!token) {
    return (
      <div>
        <span className="grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </span>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Lien incomplet</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Cette adresse ne contient pas de jeton de réinitialisation. Le lien a peut-être été
          coupé en passant d’un logiciel à l’autre — recopiez-le en entier, ou demandez-en un
          nouveau.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/mot-de-passe-oublie">Demander un nouveau lien</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/login">Retour à la connexion</Link>
          </Button>
        </div>
      </div>
    );
  }

  async function onSubmit(values: NouveauMotDePasseValues) {
    setEnvoi(true);
    try {
      await reinitialiserMotDePasse(token, values.password);
      toast({
        title: 'Mot de passe changé',
        description: 'Vous êtes connecté·e.',
        variant: 'success',
      });
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      toast({
        title: 'Changement impossible',
        description:
          err instanceof Error
            ? err.message
            : 'Ce lien n’est plus valable. Demandez-en un nouveau.',
        variant: 'error',
      });
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <KeyRound className="size-6" />
        </span>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Nouveau mot de passe</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Choisissez-en un que vous retiendrez. Vous serez connecté·e aussitôt.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Mot de passe</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    leftIcon={<Lock />}
                    autoFocus
                    {...field}
                  />
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
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    leftIcon={<Lock />}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" loading={envoi}>
            Changer mon mot de passe
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}

export default function ReinitialiserMotDePassePage() {
  // `useSearchParams` impose une frontière de suspense côté App Router.
  return (
    <React.Suspense>
      <Formulaire />
    </React.Suspense>
  );
}
