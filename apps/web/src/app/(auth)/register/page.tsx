'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Building2, Lock, Mail, Phone } from 'lucide-react';
import { registerSchema, type RegisterValues } from '@/lib/validation';
import { register as registerAccount } from '@/lib/auth-client';
import { apiRequest } from '@/lib/api';
import { lancerConfettis } from '@/lib/confetti';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  CHOIX_COMPTE,
  PARCOURS,
  QUI_DEMANDE,
  coteDe,
  type CleCompte,
  type CleEtape,
} from './parcours';
import { Progression } from './Progression';
import {
  ChampStructure,
  EtapeActivites,
  EtapeDisponibilite,
  LIEU_VIDE,
  type LieuDeTravail,
} from './Etapes';

/**
 * L'INSCRIPTION, EN ÉTAPES.
 *
 * ⚠⚠ DEUX CARTES EN TÊTE DEPUIS LE 21/09/2026 : « Je cherche un intervenant »
 * et « Je propose mes services ». C'est la forme des deux faces d'une place de
 * marché, et la première question porte désormais sur l'INTENTION plutôt que
 * sur une catégorie de compte. Le troisième cas — le particulier — n'a pas
 * disparu du produit : il se déclare sur l'écran des identifiants, sous
 * « Vous êtes ? », où « un établissement » est pré-coché. Voir `CoteMarche` et
 * `QUI_DEMANDE` dans parcours.ts, qui expliquent pourquoi le type de compte
 * PARTICULIER reste vivant en base.
 *
 * Ordre, selon le compte créé :
 *   établissement → situation, identifiants (avec l'organisme gestionnaire)
 *   intervenant   → situation, identifiants (avec sa structure), ce que vous faites
 *   particulier   → situation, identifiants, ce que vous cherchez
 *
 * ⚠ UN COMPTE = UNE PERSONNE (24/09/2026, décision de Siham). Chaque
 * inscription crée SON compte, dont la personne est titulaire. Il n'existe
 * plus de chemin pour « rejoindre » l'établissement de quelqu'un d'autre, ni
 * de service, de poste ou de droits à déclarer.
 *
 * ⚠⚠ LA SITUATION VIENT AVANT LES IDENTIFIANTS, ET C'EST CE QUI PERMET DE CRÉER
 * LE COMPTE JUSTE DU PREMIER COUP.
 *
 * Nous avons d'abord fait l'inverse — compte créé au tout premier écran, puis
 * « qualifié » ensuite. Ça obligeait à corriger le compte après coup : son
 * type, son nom, et son SLUG. Ce dernier est calculé À LA CRÉATION à partir du
 * nom : un compte créé avant qu'on connaisse le nom de l'établissement gardait
 * donc pour toujours l'adresse publique du prénom de la personne —
 * « /camille-durand » pour la MECS Les Tilleuls. Un défaut qui ne se voit pas
 * tout de suite et ne se rattrape plus.
 *
 * Une carte à cliquer coûte deux secondes et n'est pas un formulaire : la
 * mettre en tête ne fait fuir personne, et elle donne au serveur tout ce qu'il
 * faut pour créer un compte correct, sans aucune route de rattrapage.
 *
 * ⚠ LE NOM DE L'ÉTABLISSEMENT EST DEMANDÉ DANS « vos identifiants », et il doit
 * y rester : c'est lui qui fixe le nom du compte ET son slug. Le déplacer plus
 * loin ramènerait exactement le défaut ci-dessus.
 *
 * ⚠ LA STRUCTURE JURIDIQUE S'ÉCRIT JUSTE APRÈS LA CRÉATION : sa route demande
 * une session. L'écriture est tolérante à l'échec : le compte est créé, une
 * structure qui rate ne doit pas faire croire à un échec d'inscription.
 *
 * ⚠ AUCUNE ÉTAPE APRÈS LA CRÉATION N'EST BLOQUANTE. Chacune porte de quoi
 * passer outre, et tout se retrouve dans l'espace.
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

  // LE CTA DES PAGES D'ATTERRISSAGE PASSAIT UN `?type=` QUE PERSONNE NE LISAIT.
  //
  // « /register?type=etablissement » arrivait sur un formulaire vierge : le
  // visiteur venu d'une annonce devait choisir à nouveau ce qu'il venait
  // pourtant d'indiquer en cliquant.
  const typeDemande = params.get('type');
  React.useEffect(() => {
    if (!typeDemande) return;
    const t = typeDemande.toLowerCase();
    // Tout autre valeur (dont l'ancien « salarie ») affiche les deux cartes :
    // un compte = une personne, et c'est à elle de dire de quel côté elle est.
    if (t === 'etablissement' || t === 'establishment') {
      form.setValue('accountType', 'ESTABLISHMENT', { shouldValidate: false });
      setEtape('identite');
    } else if (t === 'freelance' || t === 'intervenant') {
      form.setValue('accountType', 'FREELANCE', { shouldValidate: false });
      setEtape('identite');
    } else if (t === 'particulier' || t === 'parent') {
      form.setValue('accountType', 'PARTICULIER', { shouldValidate: false });
      setEtape('identite');
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
    const champs: (keyof RegisterValues)[] = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'password',
      'confirmPassword',
      'acceptTerms',
    ];
    // Le nom de l'établissement fait partie de CETTE étape : c'est lui qui
    // fixe le nom du compte et son slug, tous deux posés à la création.
    if (typeChoisi === 'ESTABLISHMENT') champs.push('organizationName');
    const ok = await form.trigger(champs);
    if (!ok) return;

    setSubmitting(true);
    try {
      // Le type ET le nom sont connus : le compte est créé complet, et son
      // slug est juste du premier coup.
      await registerAccount(form.getValues());
      setCompteCree(true);
      // ⚠ APRÈS la réponse du serveur, jamais avant : des confettis sur une
      // inscription refusée diraient l'inverse de ce qui vient de se passer.
      lancerConfettis();
      toast({
        title: 'Compte créé',
        description:
          typeChoisi === 'FREELANCE'
            ? 'Vous êtes entré. Une dernière question, et rien n’est obligatoire.'
            : 'Bienvenue ! Votre espace est prêt.',
        variant: 'success',
      });

      // Une invitation en attente passe avant le reste du parcours.
      const suite = params.get('next');
      if (suite) {
        router.push(suite);
        router.refresh();
        return;
      }
      /**
       * ⚠ CHAQUE TYPE DE COMPTE A SA SUITE, ET AUCUNE N'EST BLOQUANTE.
       * Un intervenant dit ensuite ce qu'il vient faire ; un particulier dit
       * s'il vient réserver, se rendre disponible, ou les deux. Toutes ces
       * étapes se repassent depuis l'espace : le compte est déjà créé.
       *
       * ⚠ LA STRUCTURE JURIDIQUE EST ÉCRITE ICI, JUSTE APRÈS LA CRÉATION. Elle
       * est saisie avec les identifiants, mais sa route demande une session :
       * elle ne pouvait pas partir avant. Tolérante à l'échec : facultative
       * pour entrer, elle se complète depuis l'espace.
       */
      await enregistrerStructure();
      if (typeChoisi === 'ESTABLISHMENT') terminer();
      else if (typeChoisi === 'FREELANCE') allerA('activites');
      else if (typeChoisi === 'PARTICULIER') allerA('disponibilite');
      else terminer();
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

  /** L'organisme gestionnaire ou l'entité qui facture, s'il a été saisi. */
  async function enregistrerStructure() {
    if (typeChoisi === 'PARTICULIER') return;
    if (!lieu.structureId && !lieu.structure) return;
    await apiRequest('/structures/rattacher', {
      method: 'POST',
      body: lieu.structureId ? { structureId: lieu.structureId } : lieu.structure,
    }).catch(() => undefined);
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
            {/*
              ⚠ LE NOM DE L'ÉTABLISSEMENT DOIT RESTER SUR CETTE ÉTAPE-CI.
              C'est lui qui fixe le nom du compte ET son slug (l'adresse
              publique), tous deux posés à la création et jamais recalculés.
              Le demander plus loin obligerait à renommer un compte déjà
              créé, et l'adresse garderait pour toujours le prénom de la
              personne.

              ⚠ AUCUN DE CES CHAMPS N'ÉCRIT QUOI QUE CE SOIT ICI : le compte
              n'existe pas encore. La structure part juste après la création
              (`enregistrerStructure`).
            */}
            {/*
              ⚠⚠ « VOUS ÊTES ? » — CE QUI REMPLACE LA CARTE « PARTICULIER ».

              Elle a disparu de la première page le 21/09/2026 : les trois
              cartes demandaient de se ranger dans une CATÉGORIE avant de
              savoir ce que la catégorie ouvrait. La distinction, elle, reste
              entière : un parent n'a pas d'établissement, et son espace n'est
              pas celui d'une MECS (menu court, accueil dédié).
              Elle se pose donc ici, en deux boutons, une fois la personne déjà
              du bon côté du marché.

              ⚠ « Un établissement » EST PRÉ-SÉLECTIONNÉ, et ce n'est pas un
              détail : c'est le cas de très loin le plus fréquent, et qui ne lit
              pas cette question obtient exactement ce qu'il obtenait avant. Une
              question ajoutée à un formulaire d'inscription ne doit rien coûter
              à ceux qu'elle ne concerne pas.

              ⚠ CHANGER DE RÉPONSE CHANGE LE TYPE DE COMPTE, DONC LE PARCOURS
              (voir PARCOURS) et le NOM du compte — donc son slug, calculé à la
              création et jamais recalculé. C'est précisément pour ça que la
              question est ICI et pas après : le compte n'existe pas encore.
            */}
            {coteDe(typeChoisi ?? 'ESTABLISHMENT') === 'DEMANDE' && (
              <section className="space-y-3 rounded-xl border border-border bg-card p-4">
                <h2 className="text-sm font-semibold">Vous êtes&nbsp;?</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {QUI_DEMANDE.map((q) => {
                    const actif = typeChoisi === q.type;
                    return (
                      <button
                        key={q.type}
                        type="button"
                        aria-pressed={actif}
                        onClick={() => {
                          form.setValue('accountType', q.type, { shouldValidate: false });
                          // Un particulier n'a pas d'établissement : on ne
                          // garde pas une saisie qui ne partira plus.
                          if (q.type === 'PARTICULIER') {
                            form.setValue('organizationName', '');
                            setLieu(LIEU_VIDE);
                          }
                        }}
                        className={`rounded-lg border-2 p-3 text-left transition ${
                          actif
                            ? 'border-primary bg-primary-soft/30'
                            : 'border-border bg-background hover:border-primary/40'
                        }`}
                      >
                        <span className="block text-sm font-semibold">{q.titre}</span>
                        <span
                          className="mt-1 block text-xs leading-relaxed text-muted-foreground"
                          lang="fr"
                        >
                          {q.aide}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {typeChoisi === 'ESTABLISHMENT' && (
              <section className="space-y-5 rounded-xl border border-border bg-card p-4">
                <h2 className="text-sm font-semibold">Votre établissement</h2>

                {/*
                  DEUX CHAMPS CÔTE À CÔTE : « l'ESAT Corail » d'un côté, « de
                  l'ADSEA » de l'autre. Fondus en un seul, on ne savait plus à
                  laquelle des deux questions on répondait (16/09/2026).
                */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Nom de votre établissement</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ESAT Corail, DAIS, MECS Les Tilleuls…"
                            autoComplete="organization"
                            leftIcon={<Building2 />}
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Le vôtre, pas celui du groupe.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/*
                    L'ORGANISME GESTIONNAIRE — l'autre moitié de la phrase, et
                    l'entité juridique dont le SIRET figurera sur les devis et
                    les factures. On cherche d'abord parmi les structures déjà
                    déclarées sur Les Extras, puis dans l'annuaire public ; la
                    saisie à la main reste ouverte, parce que beaucoup de
                    petites associations n'y figurent pas.
                  */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="organisme">Organisme gestionnaire</Label>
                    <ChampStructure
                      id="organisme"
                      valeur={{ structureId: lieu.structureId, structure: lieu.structure }}
                      onChange={(v) => setLieu((l) => ({ ...l, ...v }))}
                      placeholder="ADSEA, Fondation Poidatz, 820051852…"
                    />
                    <p className="text-xs text-muted-foreground" lang="fr">
                      L’association, la fondation, l’entreprise ou la collectivité
                      qui gère l’établissement (nom ou SIRET). Facultatif.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/*
              INTERVENANT — SA STRUCTURE, SUR LE MÊME ÉCRAN QUE LES IDENTIFIANTS.
              Facultative ici, exigée pour publier : c'est ce SIRET qui figure
              sur les devis et les factures. La structure part juste après
              la création du compte (voir creerLeCompte), jamais avant.
            */}
            {typeChoisi === 'FREELANCE' && (
              <section className="space-y-3 rounded-xl border border-border bg-card p-4">
                <div>
                  <h2 className="text-sm font-semibold">L'entité qui facture vos interventions</h2>
                  <p className="text-xs text-muted-foreground" lang="fr">
                    Micro-entreprise, association, société. Facultatif pour entrer,
                    nécessaire pour publier une fiche : ce numéro figurera sur vos
                    devis et vos factures.
                  </p>
                </div>
                <ChampStructure
                  valeur={{ structureId: lieu.structureId, structure: lieu.structure }}
                  onChange={(v) => setLieu((l) => ({ ...l, ...v }))}
                  placeholder="Votre SIRET, ou le nom de votre entreprise…"
                />
                <p className="text-xs text-muted-foreground" lang="fr">
                  Pas encore de structure ? Continuez : vous pourrez la renseigner
                  depuis votre espace, avant de publier.
                </p>
              </section>
            )}

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
                    Elle est à vous seul : un compte Les Extras ne se partage pas.
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
                  <FormLabel required>Téléphone</FormLabel>
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

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={() => allerA('profil')}>
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
      {/* Étape 2 — la situation                                            */}
      {/* ---------------------------------------------------------------- */}
      {etape === 'profil' && (
        <div className="space-y-5">
          {/*
            ⚠⚠ DEUX CARTES, PAS TROIS (21/09/2026, demande de Siham).
            Une place de marché a deux côtés ; la première question doit porter
            sur l'INTENTION, pas sur une catégorie de compte. Le particulier ne
            disparaît pas du produit — il se déclare d'un clic à l'étape
            suivante, sous « Vous êtes ? ». Voir `CoteMarche` dans parcours.ts.
          */}
          <div className="grid items-stretch gap-3 sm:grid-cols-2">
            {CHOIX_COMPTE.map((c) => (
              <CarteChoix
                key={c.key}
                choix={c}
                actif={typeChoisi ? coteDe(typeChoisi) === c.key : false}
                onSelect={() => {
                  form.setValue('accountType', c.typeParDefaut, { shouldValidate: false });
                  allerA('identite');
                }}
              />
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground" lang="fr">
            {/* ⚠ Plus d'« Passez la souris » (24/09/2026) : sur téléphone il n'y
                a pas de survol. Le recto dit déjà le bénéfice de chaque carte. */}
            Vous pourrez créer un second compte plus tard si vous cumulez les deux.
          </p>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Intervenant indépendant — étape 3 : ce qu'il vient faire           */}
      {/* ---------------------------------------------------------------- */}
      {etape === 'activites' && (
        <>
          <EtapeActivites onFait={terminer} />
          <div className="mt-3 flex items-center justify-between gap-2">
            <span />
            <Button type="button" variant="ghost" size="sm" onClick={terminer}>
              Je le ferai plus tard
            </Button>
          </div>
        </>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Particulier — étape 3 : ce qu'il vient chercher                    */}
      {/* ---------------------------------------------------------------- */}
      {etape === 'disponibilite' && (
        <>
          <EtapeDisponibilite onFait={terminer} />
          <div className="mt-3 flex items-center justify-end gap-2">
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
