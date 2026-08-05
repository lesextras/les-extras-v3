'use client';

// MOT DE PASSE OUBLIÉ — demande du lien.
//
// Cette page n'existait pas : le lien de l'écran de connexion pointait vers
// l'écran de connexion lui-même. Quelqu'un qui perdait son mot de passe
// n'avait aucun moyen de s'en sortir seul.
//
// Le message de confirmation est volontairement le MÊME que l'adresse existe
// ou non. Dire « aucun compte à cette adresse » transformerait cet écran en
// annuaire : on saurait, en essayant des adresses, quels établissements sont
// clients. La formulation prévient donc au passage du cas le plus probable —
// l'adresse saisie n'est pas celle du compte.
import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft, MailCheck } from 'lucide-react';
import {
  motDePasseOublieSchema,
  type MotDePasseOublieValues,
} from '@/lib/validation';
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

export default function MotDePasseOubliePage() {
  const { toast } = useToast();
  const [envoi, setEnvoi] = React.useState(false);
  const [envoye, setEnvoye] = React.useState(false);

  const form = useForm<MotDePasseOublieValues>({
    resolver: zodResolver(motDePasseOublieSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: MotDePasseOublieValues) {
    setEnvoi(true);
    try {
      const r = await fetch('/api/proxy/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email.trim() }),
      });
      // Un 429 signifie qu'on a déjà beaucoup demandé : on le dit, plutôt que
      // de laisser croire qu'un e-mail est parti alors que non.
      if (r.status === 429) {
        toast({
          title: 'Trop de demandes',
          description:
            'Plusieurs liens ont déjà été demandés depuis cet endroit. Regardez vos e-mails, y compris les indésirables, et réessayez dans une heure.',
          variant: 'error',
        });
        return;
      }
      setEnvoye(true);
    } catch {
      toast({
        title: 'Envoi impossible',
        description: 'La connexion a échoué. Réessayez dans un instant.',
        variant: 'error',
      });
    } finally {
      setEnvoi(false);
    }
  }

  if (envoye) {
    return (
      <div>
        <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <MailCheck className="size-6" />
        </span>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Regardez vos e-mails</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Si <strong className="text-foreground">{form.getValues('email')}</strong> correspond à un
          compte, un lien vient d’y être envoyé. Il est valable une heure et ne fonctionne qu’une
          fois.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Rien ne vient&nbsp;? Regardez dans vos indésirables. Vérifiez aussi que c’est bien
          l’adresse avec laquelle le compte a été créé — c’est la cause la plus fréquente.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/login">
              <ArrowLeft />
              Retour à la connexion
            </Link>
          </Button>
          <Button variant="ghost" onClick={() => setEnvoye(false)}>
            Essayer une autre adresse
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Mot de passe oublié</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Indiquez l’adresse de votre compte : nous vous envoyons un lien pour en choisir un
          nouveau.
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
                    autoFocus
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" loading={envoi}>
            Envoyer le lien
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
