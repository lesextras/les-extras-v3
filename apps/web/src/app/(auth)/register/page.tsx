'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Building2, Lock, Mail } from 'lucide-react';
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
import { CarteChoix } from './CarteChoix';
import { CHOIX_COMPTE, PARCOURS, type CleCompte, type CleEtape } from './parcours';
import { Progression } from './Progression';
import {
  EtapeStructure,
  EtapeService,
  EtapePoste,
  RechercheEtablissement,
  type EtablissementExistant,
} from './Etapes';
import { apiRequest } from '@/lib/api';

/**
 * L'INSCRIPTION, EN ÉTAPES.
 *
 * Ce qu'il faut savoir avant de toucher à cet écran :
 *
 * 1. LE COMPTE EST CRÉÉ À L'ÉTAPE « identite », PAS À LA FIN. Les étapes qui
 *    suivent — structure, service, poste — interrogent des routes
 *    authentifiées, elles ne peuvent donc pas venir avant. Et c'est le bon
 *    ordre de toute façon : quelqu'un qui abandonne à l'étape 4 garde son
 *    accès et retrouve le parcours dans son espace, au lieu de tout perdre.
 *
 * 2. AUCUNE ÉTAPE APRÈS LA CRÉATION N'EST BLOQUANTE. Chacune porte « je le
 *    ferai plus tard ». Exiger l'organigramme complet avant de laisser entrer,
 *    c'est perdre la moitié des gens sur un écran administratif.
 *
 * 3. LES DEUX ANCIENNES TUILES « Établissement » ET « Salarié » N'EN FONT PLUS
 *    QU'UNE. Elles posaient la mauvaise question : une directrice adjointe est
 *    salariée de son établissement, et un chef de service qui cherche du
 *    renfort correspondait exactement à la tuile « Établissement ». C'est
 *    l'étape « poste » qui distingue désormais direction, responsable et
 *    salarié — une question à laquelle chacun sait répondre parce qu'elle
 *    porte sur son métier.
 */
export default function RegisterPage() {
  const router = useRouter();
  // Une personne invitée arrive souvent ici sans compte. Sans ce paramètre,
  // elle créerait son compte puis perdrait l'invitation en route.
  const params = useSearchParams();
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const [etape, setEtape] = React.useState<CleEtape>('profil');
  const [compteCree, setCompteCree] = React.useState(false);
  /**
   * L'établissement existant que la personne a reconnu comme le sien.
   *
   * On ne peut pas la rattacher tout de suite : elle n'a pas encore de compte.
   * On garde donc son choix jusqu'à la création, puis on l'y rattache — et on
   * saute les étapes « structure » et « service », qui appartiennent à
   * l'établissement qu'elle rejoint et non à elle.
   */
  const [aRejoindre, setARejoindre] = React.useState<EtablissementExistant | null>(null);

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

  const typeChoisi = form.watch('accountType') as CleCompte | undefined;
  const etapes = typeChoisi ? PARCOURS[typeChoisi] : PARCOURS.ESTABLISHMENT;
  const indexEtape = Math.max(
    0,
    etapes.findIndex((e) => e.cle === etape),
  );
  const etapeCourante = etapes[indexEtape];

  // LE CTA DES PAGES D'ATTERRISSAGE PASSAIT UN `?type=` QUE PERSONNE NE LISAIT.
  //
  // « /register?type=etablissement » arrivait sur un formulaire vierge : le
  // visiteur venu d'une annonce devait choisir a nouveau ce qu'il venait
  // pourtant d'indiquer en cliquant. Une etape de plus entre le clic paye et
  // le compte cree, pour rien.
  const typeDemande = params.get('type');
  React.useEffect(() => {
    if (!typeDemande) return;
    const t = typeDemande.toLowerCase();
    const sansAccent = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
    // « salarie » ne crée plus un compte d'indépendant : il mène à la même
    // porte que « établissement », et c'est l'étape « poste » qui tranche.
    if (t === 'etablissement' || t === 'establishment' || sansAccent === 'salarie') {
      form.setValue('accountType', 'ESTABLISHMENT', { shouldValidate: false });
      setEtape('etablissement');
    } else if (t === 'freelance' || t === 'intervenant') {
      form.setValue('accountType', 'FREELANCE', { shouldValidate: false });
      setEtape('identite');
    } else if (t === 'particulier' || t === 'parent') {
      form.setValue('accountType', 'PARTICULIER', { shouldValidate: false });
      setEtape('identite');
    }
    // Une seule fois, a l'arrivee : ensuite c'est le visiteur qui decide, et
    // reappliquer le parametre annulerait son changement d'avis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeDemande]);

  function allerA(cle: CleEtape) {
    setEtape(cle);
    // Un changement d'étape qui laisse la page à mi-hauteur donne l'impression
    // que rien ne s'est passé.
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function suivante() {
    const prochaine = etapes[indexEtape + 1];
    if (prochaine) allerA(prochaine.cle);
    else terminer();
  }

  function precedente() {
    const avant = etapes[indexEtape - 1];
    // On ne revient jamais AVANT la création du compte : le compte existe, et
    // un écran qui proposerait de le recréer produirait une erreur d'adresse
    // déjà prise, donc un cul-de-sac.
    if (avant && !(compteCree && avant.cle === 'identite')) allerA(avant.cle);
  }

  function terminer() {
    const suite = params.get('next');
    router.push(suite || '/welcome?bienvenue=1');
    router.refresh();
  }

  /** Crée le compte — fin de l'étape « identite ». */
  async function creerLeCompte(values: RegisterValues) {
    setSubmitting(true);
    try {
      await registerAccount(values);
      setCompteCree(true);
      toast({
        title: 'Compte créé',
        description:
          values.accountType === 'ESTABLISHMENT'
            ? 'Encore trois questions pour vous relier à votre équipe.'
            : 'Bienvenue ! Finalisons votre profil.',
        variant: 'success',
      });
      // Une invitation en attente passe avant le reste du parcours.
      const suite = params.get('next');
      if (suite) {
        router.push(suite);
        router.refresh();
        return;
      }

      // La personne a reconnu son établissement : on l'y rattache plutôt que
      // de la laisser avec un homonyme, et on l'envoie directement déclarer
      // son poste — la structure et les services sont ceux de la maison
      // qu'elle rejoint, pas les siens à créer.
      if (aRejoindre) {
        try {
          await apiRequest('/organisation/rejoindre', {
            method: 'POST',
            body: { etablissementId: aRejoindre.id },
          });
          toast({
            title: `Rattaché à ${aRejoindre.name}`,
            description:
              'Votre rattachement est en attente de confirmation par un responsable.',
            variant: 'success',
          });
        } catch {
          // Un rattachement qui échoue ne doit pas coûter le compte : la
          // personne pourra se déclarer depuis son espace.
        }
        allerA('poste');
        return;
      }

      suivante();
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {etape === 'profil' ? 'Créer un compte' : etapeCourante.titre}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground" lang="fr">
          {etape === 'profil'
            ? 'Gratuit, sans engagement. Trois minutes, et vous pouvez vous arrêter en route.'
            : etapeCourante.explication}
        </p>
      </div>

      {typeChoisi && <Progression etapes={etapes} index={indexEtape} />}

      {/* ---------------------------------------------------------------- */}
      {/* Étape 1 — la situation                                            */}
      {/* ---------------------------------------------------------------- */}
      {etape === 'profil' && (
        <div className="space-y-5">
          <div className="grid items-stretch gap-3 sm:grid-cols-3">
            {CHOIX_COMPTE.map((c) => (
              <CarteChoix
                key={c.key}
                choix={c}
                actif={typeChoisi === c.key}
                onSelect={() => {
                  form.setValue('accountType', c.key as RegisterValues['accountType'], {
                    shouldValidate: true,
                  });
                  allerA(c.key === 'ESTABLISHMENT' ? 'etablissement' : 'identite');
                }}
              />
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground" lang="fr">
            Passez la souris sur une carte pour savoir ce qu’elle ouvre. Vous
            pourrez créer un second compte plus tard si vous cumulez deux
            situations.
          </p>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Étape 2 — l'établissement (parcours établissement seulement)      */}
      {/* ---------------------------------------------------------------- */}
      {etape === 'etablissement' && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(() => suivante())}
            className="space-y-5"
            noValidate
          >
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Nom de l’établissement</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="MECS Les Tilleuls"
                      autoComplete="organization"
                      leftIcon={<Building2 />}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Le lieu où vous travaillez, pas la structure qui le gère —
                    nous vous demanderons celle-ci ensuite. C’est ce nom qui
                    apparaîtra sur vos devis et vos factures.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Le doublon d'établissement est le plus coûteux des trois :
                on cherche pendant la frappe et on propose de rejoindre. */}
            <RechercheEtablissement
              nom={form.watch('organizationName') ?? ''}
              onRejoindre={(e) => {
                setARejoindre(e);
                form.setValue('organizationName', e.name, { shouldValidate: true });
                allerA('identite');
              }}
            />

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={() => allerA('profil')}>
                <ArrowLeft />
                Retour
              </Button>
              <Button
                type="submit"
                className="ml-auto"
                disabled={(form.watch('organizationName') ?? '').trim().length < 2}
              >
                Continuer
                <ArrowRight />
              </Button>
            </div>
          </form>
        </Form>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Étape « identite » — c'est ici que le compte est créé             */}
      {/* ---------------------------------------------------------------- */}
      {etape === 'identite' && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(creerLeCompte)} className="space-y-5" noValidate>
            {/* L'API stocke un prénom et un nom séparés : c'est la personne qui
                ouvre le compte, y compris pour un établissement. */}
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Prénom</FormLabel>
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
                    <FormLabel required>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Durand" autoComplete="family-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                      placeholder="vous@exemple.fr"
                      leftIcon={<Mail />}
                      {...field}
                    />
                  </FormControl>
                  {typeChoisi === 'ESTABLISHMENT' && (
                    <FormDescription>
                      Votre adresse professionnelle si vous en avez une : elle
                      permet à vos collègues de vous reconnaître, et à votre
                      rattachement d’être vérifié plus vite.
                    </FormDescription>
                  )}
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
                    {/* La règle est écrite en clair sous le champ : la répéter
                        dans une bulle n'ajoutait rien. */}
                    <FormLabel required>Mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        leftIcon={<Lock />}
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
                      {/* La rubrique s'appelle « Protection des données
                          personnelles » (ancre #donnees) : la case
                          d'acceptation doit mener au texte réellement accepté. */}
                      <Link
                        href="/legal#donnees"
                        className="font-medium text-primary hover:underline"
                      >
                        politique de confidentialité
                      </Link>
                      .
                    </span>
                  </label>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={precedente}>
                <ArrowLeft />
                Retour
              </Button>
              <Button type="submit" className="ml-auto" size="lg" loading={submitting}>
                Créer mon compte
                {!submitting && <ArrowRight />}
              </Button>
            </div>
          </form>
        </Form>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Étapes authentifiées — le compte existe déjà                      */}
      {/* ---------------------------------------------------------------- */}
      {etape === 'structure' && (
        <>
          <EtapeStructure onFait={suivante} onPasser={suivante} />
          <RetourEtape onClick={precedente} desactive />
        </>
      )}

      {etape === 'service' && (
        <>
          <EtapeService onFait={suivante} onPasser={suivante} />
          <RetourEtape onClick={precedente} />
        </>
      )}

      {etape === 'poste' && (
        <>
          <EtapePoste onFait={terminer} />
          <div className="mt-3 flex items-center justify-between gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={precedente}>
              <ArrowLeft />
              Retour
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={terminer}>
              Je le ferai plus tard
            </Button>
          </div>
        </>
      )}

      {!compteCree && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Vous avez déjà un compte ?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      )}
    </div>
  );
}

function RetourEtape({ onClick, desactive }: { onClick: () => void; desactive?: boolean }) {
  if (desactive) return null;
  return (
    <div className="mt-3">
      <Button type="button" variant="ghost" size="sm" onClick={onClick}>
        <ArrowLeft />
        Retour
      </Button>
    </div>
  );
}
