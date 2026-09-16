'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Lock, Mail, Phone } from 'lucide-react';
import { registerSchema, type RegisterValues } from '@/lib/validation';
import { register as registerAccount } from '@/lib/auth-client';
import { apiRequest } from '@/lib/api';
import { lancerConfettis } from '@/lib/confetti';
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
import { EtapeLieuDeTravail, EtapePoste, LIEU_VIDE, type LieuDeTravail } from './Etapes';

/**
 * L'INSCRIPTION, EN ÉTAPES.
 *
 * Ordre : vos identifiants → votre situation → où vous travaillez → votre poste.
 *
 * ⚠⚠ LE COMPTE EST CRÉÉ DÈS LA PREMIÈRE ÉTAPE, ET TOUT LE RESTE EN DÉCOULE.
 *
 * La personne entre d'abord, elle se décrit ensuite. Conséquence : au moment de
 * la création, on ne sait pas encore ce qu'elle est. Le compte naît donc en
 * PARTICULIER — le type le plus restreint du produit : il ne publie rien, ne
 * reçoit aucune candidature, n'a pas d'équipe. Quelqu'un qui abandonne juste
 * après reste avec le compte qui ouvre le MOINS de portes, jamais l'inverse.
 *
 * Le vrai type est posé à l'étape « votre situation » par
 * `PATCH /accounts/qualification`, une route qui n'accepte de changer le type
 * que sur un compte encore VIERGE — aucune fiche, aucune facture, aucun devis.
 * En pratique : les minutes qui suivent l'inscription. Ne cherchez pas à vous
 * en servir ailleurs, elle refusera.
 *
 * ⚠ L'ÉTAPE « où vous travaillez » N'EST PLUS PUBLIQUE, puisque le compte
 * existe déjà : ses recherches peuvent donc rester sur les routes publiques
 * (`/public/etablissements`, `/public/structures`) ou passer aux routes
 * authentifiées, les deux marchent. Ses ÉCRITURES — rattachement à la
 * structure, création du service — sont appliquées à la validation de l'étape.
 *
 * ⚠ AUCUNE ÉTAPE APRÈS LA PREMIÈRE N'EST BLOQUANTE. Chacune porte de quoi
 * passer outre, et tout se retrouve dans l'espace, sur « Mon poste ». Exiger
 * l'organigramme complet avant de laisser entrer, c'est perdre la moitié des
 * gens sur un écran administratif.
 *
 * ⚠ LES ANCIENNES TUILES « Établissement » ET « Salarié » N'EN FONT PLUS
 * QU'UNE. Elles posaient la mauvaise question : une directrice adjointe est
 * salariée de son établissement, et un chef de service qui cherche du renfort
 * correspondait exactement à la tuile « Établissement ». C'est l'étape
 * « poste » qui distingue direction, responsable et salarié — une question à
 * laquelle chacun sait répondre parce qu'elle porte sur son métier.
 */
export default function RegisterPage() {
  const router = useRouter();
  // Une personne invitée arrive souvent ici sans compte. Sans ce paramètre,
  // elle créerait son compte puis perdrait l'invitation en route.
  const params = useSearchParams();
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const [etape, setEtape] = React.useState<CleEtape>('identite');
  const [compteCree, setCompteCree] = React.useState(false);
  const [lieu, setLieu] = React.useState<LieuDeTravail>(LIEU_VIDE);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accountType: undefined,
      firstName: '',
      lastName: '',
      phone: '',
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
  const nomEtablissement = form.watch('organizationName') ?? '';

  // LE CTA DES PAGES D'ATTERRISSAGE PASSAIT UN `?type=` QUE PERSONNE NE LISAIT.
  //
  // « /register?type=etablissement » arrivait sur un formulaire vierge : le
  // visiteur venu d'une annonce devait choisir à nouveau ce qu'il venait
  // pourtant d'indiquer en cliquant.
  const typeDemande = params.get('type');
  React.useEffect(() => {
    if (!typeDemande) return;
    const t = typeDemande.toLowerCase();
    const sansAccent = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
    // « salarie » ne crée plus un compte d'indépendant : il mène à la même
    // porte que « établissement », et c'est l'étape « poste » qui tranche.
    if (t === 'etablissement' || t === 'establishment' || sansAccent === 'salarie') {
      form.setValue('accountType', 'ESTABLISHMENT', { shouldValidate: false });
    } else if (t === 'freelance' || t === 'intervenant') {
      form.setValue('accountType', 'FREELANCE', { shouldValidate: false });
    } else if (t === 'particulier' || t === 'parent') {
      form.setValue('accountType', 'PARTICULIER', { shouldValidate: false });
    }
    // Une seule fois, à l'arrivée : ensuite c'est le visiteur qui décide, et
    // réappliquer le paramètre annulerait son changement d'avis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeDemande]);

  function allerA(cle: CleEtape) {
    setEtape(cle);
    // Un changement d'étape qui laisse la page à mi-hauteur donne l'impression
    // que rien ne s'est passé.
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function terminer() {
    const suite = params.get('next');
    router.push(suite || '/welcome?bienvenue=1');
    router.refresh();
  }

  /**
   * ÉTAPE 1 — CRÉER LE COMPTE.
   *
   * ⚠ ON NE PASSE PAS PAR `form.handleSubmit`, ET C'EST UN CORRECTIF.
   *
   * `handleSubmit` valide le SCHÉMA ENTIER. À cette étape, le type de compte et
   * le nom de l'établissement sont forcément vides — ils se choisissent plus
   * loin. La validation échouerait donc toujours, le bouton ne ferait rien du
   * tout, et l'échec marquerait au passage TOUS les champs en erreur.
   *
   * Règle générale pour ce parcours : un formulaire découpé en étapes valide
   * étape par étape, jamais le schéma complet avant la dernière.
   */
  async function creerLeCompte() {
    const ok = await form.trigger([
      'firstName',
      'lastName',
      'email',
      'phone',
      'password',
      'confirmPassword',
      'acceptTerms',
    ]);
    if (!ok) return;

    setSubmitting(true);
    try {
      // `accountType` est vide ici : `auth-client` crée donc en PARTICULIER,
      // le type le plus restreint. Voir la note en tête de fichier.
      await registerAccount(form.getValues());
      setCompteCree(true);
      // ⚠ APRÈS la réponse du serveur, jamais avant : des confettis sur une
      // inscription refusée diraient l'inverse de ce qui vient de se passer.
      lancerConfettis();
      toast({
        title: 'Compte créé',
        description: 'Vous êtes entré. Encore deux questions pour vous situer.',
        variant: 'success',
      });

      // Une invitation en attente passe avant le reste du parcours.
      const suite = params.get('next');
      if (suite) {
        router.push(suite);
        router.refresh();
        return;
      }
      allerA('profil');
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

  /** ÉTAPE 2 — enregistrer le type réel du compte. */
  async function qualifier(type: CleCompte) {
    form.setValue('accountType', type, { shouldValidate: false });
    setSubmitting(true);
    try {
      await apiRequest('/accounts/qualification', { method: 'PATCH', body: { type } });
      if (type === 'ESTABLISHMENT') {
        allerA('etablissement');
      } else {
        terminer();
      }
    } catch (err) {
      toast({
        title: 'Enregistrement impossible',
        description: err instanceof Error ? err.message : 'Réessayez dans un instant.',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * ÉTAPE 3 — le lieu de travail.
   *
   * ⚠ CHAQUE ÉCRITURE EST TOLÉRANTE À L'ÉCHEC, et c'est délibéré : le compte
   * existe déjà. Un rattachement de structure qui rate ne doit pas faire croire
   * que l'inscription a échoué — la personne le refera depuis son espace. Le
   * seul échec qu'on montre est celui du service, parce qu'il a une cause qu'on
   * sait nommer : un collègue a déjà créé ce nom.
   */
  async function enregistrerLieu() {
    setSubmitting(true);
    try {
      // Le nom de l'établissement d'abord : c'est lui qui figure sur les devis.
      await apiRequest('/accounts/qualification', {
        method: 'PATCH',
        body: { type: 'ESTABLISHMENT', organizationName: nomEtablissement.trim() },
      }).catch(() => undefined);

      if (lieu.rejoindre) {
        await apiRequest('/organisation/rejoindre', {
          method: 'POST',
          body: { etablissementId: lieu.rejoindre.id },
        })
          .then(() =>
            toast({
              title: `Rattaché à ${lieu.rejoindre?.name}`,
              description: 'Un responsable doit confirmer votre rattachement.',
              variant: 'success',
            }),
          )
          .catch(() => undefined);
      }

      if (lieu.structureId || lieu.structure) {
        await apiRequest('/structures/rattacher', {
          method: 'POST',
          body: lieu.structureId ? { structureId: lieu.structureId } : lieu.structure,
        }).catch(() => undefined);
      }

      const service = lieu.service.trim();
      if (service) {
        await apiRequest('/units', { method: 'POST', body: { name: service } }).catch(
          (e: unknown) => {
            const message = e instanceof Error ? e.message : '';
            toast({
              title: 'Service déjà existant',
              description: message.includes('existe déjà')
                ? `${message} Demandez à le rejoindre depuis « Mon équipe ».`
                : 'Nous n’avons pas pu créer ce service. Vous pourrez le faire depuis votre espace.',
              variant: 'error',
            });
          },
        );
      }

      lancerConfettis();
      allerA('poste');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {etape === 'identite' ? 'Créer un compte' : etapeCourante.titre}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground" lang="fr">
          {etape === 'identite'
            ? 'Gratuit, sans engagement. Votre compte est créé dès cette page — le reste se complète ensuite, et rien n’est obligatoire.'
            : etapeCourante.explication}
        </p>
      </div>

      <Progression etapes={etapes} index={indexEtape} />

      {/* ---------------------------------------------------------------- */}
      {/* Étape 1 — les identifiants ; c'est ici que le compte est créé      */}
      {/* ---------------------------------------------------------------- */}
      {etape === 'identite' && (
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void creerLeCompte();
            }}
            className="space-y-5"
            noValidate
          >
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
                  <FormDescription>
                    Votre adresse professionnelle si vous en avez une : elle permet
                    à vos collègues de vous reconnaître.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Téléphone{' '}
                    <span className="font-normal text-muted-foreground">(facultatif)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      autoComplete="tel"
                      placeholder="06 12 34 56 78"
                      leftIcon={<Phone />}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Pour vous joindre quand un renfort se décide dans l’heure. Il
                    n’apparaît nulle part publiquement.
                  </FormDescription>
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

            <Button type="submit" className="w-full" size="lg" loading={submitting}>
              Créer mon compte
              {!submitting && <ArrowRight />}
            </Button>
          </form>
        </Form>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Étape 2 — la situation                                            */}
      {/* ---------------------------------------------------------------- */}
      {etape === 'profil' && (
        <div className="space-y-5">
          <div className="grid items-stretch gap-3 sm:grid-cols-3">
            {CHOIX_COMPTE.map((c) => (
              <CarteChoix
                key={c.key}
                choix={c}
                actif={typeChoisi === c.key}
                onSelect={() => void qualifier(c.key as CleCompte)}
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
      {/* Étape 3 — où vous travaillez                                       */}
      {/* ---------------------------------------------------------------- */}
      {etape === 'etablissement' && (
        <div className="space-y-4">
          {/*
            L'EXPLICATION QUI DÉSAMORCE LA MÉFIANCE.
            Sans elle, cet écran ressemble à un formulaire administratif :
            « pourquoi me demandent-ils ma structure ? qui va voir ça ? ». En
            une phrase — c'est une déclaration, comme sur un réseau
            professionnel — la question devient évidente, et la réponse
            beaucoup plus facile à donner.
          */}
          <div className="rounded-xl border border-primary/25 bg-primary-soft/25 p-4">
            <p className="text-sm font-semibold">C’est une déclaration, comme sur LinkedIn</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground" lang="fr">
              Vous dites simplement où vous êtes en poste. Rien n’est vérifié à
              l’avance, aucun justificatif ne vous est demandé — vous n’attendez
              donc l’autorisation de personne pour commencer.
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground" lang="fr">
              Et si cet écran peut rester grand ouvert, c’est parce que déclarer
              ne donne aucun accès : vous ne verrez les données de votre
              établissement qu’une fois qu’un collègue vous aura invité ou
              confirmé.
            </p>
          </div>

          <EtapeLieuDeTravail
            nomEtablissement={nomEtablissement}
            setNomEtablissement={(v) =>
              form.setValue('organizationName', v, { shouldValidate: false })
            }
            lieu={lieu}
            setLieu={setLieu}
          />

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={terminer}>
              Je le ferai plus tard
            </Button>
            <Button
              type="button"
              className="ml-auto"
              size="lg"
              loading={submitting}
              disabled={nomEtablissement.trim().length < 2}
              onClick={() => void enregistrerLieu()}
            >
              Continuer
              {!submitting && <ArrowRight />}
            </Button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Étape 4 — le poste                                                 */}
      {/* ---------------------------------------------------------------- */}
      {etape === 'poste' && (
        <>
          <EtapePoste onFait={terminer} />
          <div className="mt-3 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => allerA('etablissement')}
            >
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
