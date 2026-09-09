import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NatureProduit, StatutProduit } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StripeConnectService } from '../paiements/stripe-connect.service';
import { MailService } from '../common/mail/mail.service';
import type {
  BoutiqueDto,
  CommanderDto,
  ProduitDto,
  SuiviCommandeDto,
} from './dto/boutique.dto';

/**
 * LA BOUTIQUE D'UNE ASSOCIATION.
 *
 * Une association ne vend pas que des formations : des places, un livret, un
 * t-shirt, un enregistrement. Deux natures de produit, et la distinction porte
 * tout le reste — un objet réel se compte, s'expédie et demande une adresse ;
 * un produit virtuel se remet à l'instant du paiement.
 *
 * L'argent va où l'association a dit qu'il devait aller : si elle a relié son
 * propre compte d'encaissement, il lui est viré directement.
 */

/**
 * ADRESSES QUE LA BOUTIQUE NE PEUT PAS PRENDRE.
 *
 * Aucune ne casse le routage — `/boutique/<slug>` est un segment a part. Elles
 * sont refusees parce qu'elles TROMPENT celui qui recoit le lien : une adresse
 * « admin » ou « paiement » sur un lien partage par QR code ressemble a une
 * page officielle de la plateforme, et c'est exactement ce dont se sert un
 * hameconnage.
 */
const ADRESSES_RESERVEES = new Set([
  'admin',
  'api',
  'boutique',
  'commande',
  'compte',
  'connexion',
  'paiement',
  'panier',
  'stripe',
  'support',
]);

@Injectable()
export class BoutiqueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly connect: StripeConnectService,
    private readonly mail: MailService,
  ) {}

  /* ═════════════════════════════════════════════════ la vitrine ══════ */

  /** La fiche de la boutique, créée au premier passage si elle n'existe pas. */
  async vitrine(accountId: string) {
    const deja = await this.prisma.boutique.findUnique({ where: { accountId } });
    if (deja) return deja;

    const compte = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { name: true, slug: true },
    });
    if (!compte) throw new NotFoundException('Compte introuvable.');

    return this.prisma.boutique.create({
      data: {
        accountId,
        nom: compte.name,
        slug: await this.slugLibre(compte.slug || compte.name),
      },
    });
  }

  async modifierVitrine(accountId: string, dto: BoutiqueDto) {
    await this.vitrine(accountId);
    const data: Record<string, unknown> = {};
    if (dto.nom !== undefined) {
      const nom = dto.nom.trim();
      if (nom.length < 2) throw new BadRequestException('Le nom de la boutique est trop court.');
      data.nom = nom;
    }
    for (const champ of [
      'sousTitre',
      'presentation',
      'logoUrl',
      'banniereUrl',
      'contactEmail',
      'cgv',
      'mentions',
      'livraisonTexte',
    ] as const) {
      const v = dto[champ];
      if (v !== undefined) data[champ] = v.trim() || null;
    }
    if (dto.couleur !== undefined) {
      const c = dto.couleur.trim();
      if (c && !/^#[0-9a-fA-F]{6}$/.test(c)) {
        throw new BadRequestException('La couleur s’écrit sous la forme #0F5F3E.');
      }
      data.couleur = c || '#0F5F3E';
    }
    if (dto.slug !== undefined) {
      // On normalise AVANT de juger : la personne tape « ADéPA Boutique », on
      // range « adepa-boutique ». Refuser sa saisie telle quelle serait lui
      // demander de connaitre nos regles d'ecriture.
      const demande = this.normaliser(dto.slug);
      if (demande.length < 3) {
        throw new BadRequestException(
          'L’adresse doit faire au moins trois caractères : des lettres, des chiffres, des tirets.',
        );
      }
      if (ADRESSES_RESERVEES.has(demande)) {
        throw new BadRequestException('Cette adresse est réservée. Choisis-en une autre.');
      }
      const prise = await this.prisma.boutique.findUnique({
        where: { slug: demande },
        select: { accountId: true },
      });
      if (prise && prise.accountId !== accountId) {
        throw new BadRequestException(
          'Cette adresse est déjà prise par une autre boutique. Essaie une variante.',
        );
      }
      data.slug = demande;
    }
    if (dto.publiee !== undefined) data.publiee = dto.publiee;

    return this.prisma.boutique.update({ where: { accountId }, data });
  }

  /* ═════════════════════════════════════════════════ les produits ══════ */

  listerProduits(accountId: string) {
    return this.prisma.produitBoutique.findMany({
      where: { accountId },
      orderBy: [{ ordre: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async creerProduit(accountId: string, dto: ProduitDto) {
    const titre = (dto.titre ?? '').trim();
    if (titre.length < 2) throw new BadRequestException('Donne un titre à ce produit.');
    await this.vitrine(accountId);
    return this.prisma.produitBoutique.create({
      data: {
        accountId,
        titre,
        slug: await this.slugProduitLibre(accountId, dto.slug?.trim() || titre),
        description: dto.description?.trim() || null,
        nature: dto.nature ?? NatureProduit.REEL,
        prixCents: dto.prixCents ?? 0,
      },
    });
  }

  async modifierProduit(accountId: string, id: string, dto: ProduitDto) {
    const p = await this.prisma.produitBoutique.findFirst({ where: { id, accountId } });
    if (!p) throw new NotFoundException('Ce produit n’existe pas.');

    const data: Record<string, unknown> = {};
    if (dto.titre !== undefined) {
      const t = dto.titre.trim();
      if (t.length < 2) throw new BadRequestException('Le titre est trop court.');
      data.titre = t;
    }
    if (dto.slug !== undefined && dto.slug.trim() && dto.slug.trim() !== p.slug) {
      data.slug = await this.slugProduitLibre(accountId, dto.slug.trim());
    }
    for (const champ of ['description', 'imageUrl', 'fichierUrl', 'lienUrl'] as const) {
      const v = dto[champ];
      if (v !== undefined) data[champ] = v.trim() || null;
    }
    for (const champ of ['prixCents', 'tvaPourcent', 'livraisonCents', 'ordre'] as const) {
      if (dto[champ] !== undefined) data[champ] = dto[champ];
    }
    if (dto.prixBarreCents !== undefined) {
      data.prixBarreCents = dto.prixBarreCents > 0 ? dto.prixBarreCents : null;
    }
    if (dto.stock !== undefined) data.stock = dto.stock;
    if (dto.nature !== undefined) data.nature = dto.nature;

    if (dto.statut !== undefined) {
      // On ne publie pas un produit qu'on ne saurait pas livrer : c'est le
      // genre d'erreur qui ne se voit qu'après la première commande.
      if (dto.statut === StatutProduit.PUBLIE) {
        const nature = (data.nature as NatureProduit | undefined) ?? p.nature;
        const fichier = (data.fichierUrl as string | null | undefined) ?? p.fichierUrl;
        const lien = (data.lienUrl as string | null | undefined) ?? p.lienUrl;
        const prix = (data.prixCents as number | undefined) ?? p.prixCents;
        if (prix <= 0) {
          throw new BadRequestException('Fixe un prix avant de mettre ce produit en vente.');
        }
        if (nature === NatureProduit.VIRTUEL && !fichier && !lien) {
          throw new BadRequestException(
            'Un produit virtuel doit porter le fichier ou le lien remis à l’acheteur.',
          );
        }
      }
      data.statut = dto.statut;
    }

    return this.prisma.produitBoutique.update({ where: { id }, data });
  }

  async supprimerProduit(accountId: string, id: string) {
    const p = await this.prisma.produitBoutique.findFirst({ where: { id, accountId } });
    if (!p) throw new NotFoundException('Ce produit n’existe pas.');
    await this.prisma.produitBoutique.delete({ where: { id } });
    return { supprime: true as const };
  }

  /* ═════════════════════════════════════════════════ les commandes ══════ */

  listerCommandes(accountId: string) {
    return this.prisma.commandeBoutique.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      take: 300,
      include: { lignes: true },
    });
  }

  async suivreCommande(accountId: string, id: string, dto: SuiviCommandeDto) {
    const c = await this.prisma.commandeBoutique.findFirst({ where: { id, accountId } });
    if (!c) throw new NotFoundException('Cette commande n’existe pas.');
    return this.prisma.commandeBoutique.update({
      where: { id },
      data: {
        ...(dto.statut !== undefined ? { statut: dto.statut } : {}),
        ...(dto.note !== undefined ? { note: dto.note.trim() || null } : {}),
      },
      include: { lignes: true },
    });
  }

  /* ═══════════════════════════════════════════ la boutique publique ══════ */

  async vitrinePublique(slug: string) {
    const b = await this.prisma.boutique.findUnique({ where: { slug } });
    if (!b || !b.publiee) throw new NotFoundException('Cette boutique n’existe pas.');
    const produits = await this.prisma.produitBoutique.findMany({
      where: { accountId: b.accountId, statut: StatutProduit.PUBLIE },
      orderBy: [{ ordre: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        titre: true,
        slug: true,
        description: true,
        imageUrl: true,
        nature: true,
        prixCents: true,
        prixBarreCents: true,
        livraisonCents: true,
        stock: true,
      },
    });
    return {
      boutique: {
        nom: b.nom,
        slug: b.slug,
        sousTitre: b.sousTitre,
        presentation: b.presentation,
        logoUrl: b.logoUrl,
        banniereUrl: b.banniereUrl,
        couleur: b.couleur,
        contactEmail: b.contactEmail,
        cgv: b.cgv,
        mentions: b.mentions,
        livraisonTexte: b.livraisonTexte,
      },
      produits: produits.map((p) => ({
        ...p,
        // Un stock à zéro n'est pas une erreur : c'est une rupture, et elle
        // doit se lire sur la fiche plutôt que de faire disparaître le produit.
        epuise: p.nature === NatureProduit.REEL && p.stock !== null && p.stock <= 0,
      })),
    };
  }

  /* ═══════════════════════════════════════════════════ le paiement ══════ */

  /**
   * PASSER COMMANDE.
   *
   * Rien n'est écrit ici : ni commande, ni décompte de stock. Tant que le
   * paiement n'est pas confirmé, la commande n'existe pas — c'est le même
   * principe que pour l'achat d'une formation, et c'est ce qui évite les
   * commandes fantômes de quelqu'un qui a fermé l'onglet.
   */
  async commander(slug: string, dto: CommanderDto, origine: string) {
    const cle = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!cle) {
      throw new ServiceUnavailableException(
        "Le paiement en ligne n'est pas branché sur ce serveur.",
      );
    }

    const b = await this.prisma.boutique.findUnique({ where: { slug } });
    if (!b || !b.publiee) throw new NotFoundException('Cette boutique n’existe pas.');
    if (!dto.lignes?.length) throw new BadRequestException('Ton panier est vide.');

    const produits = await this.prisma.produitBoutique.findMany({
      where: {
        accountId: b.accountId,
        id: { in: dto.lignes.map((l) => l.produitId) },
        statut: StatutProduit.PUBLIE,
      },
    });
    if (produits.length !== new Set(dto.lignes.map((l) => l.produitId)).size) {
      throw new BadRequestException("Un produit du panier n'est plus en vente.");
    }

    const parId = new Map(produits.map((p) => [p.id, p]));
    let total = 0;
    let port = 0;
    let contientReel = false;
    const items: Record<string, string> = {};
    const resume: { i: string; q: number }[] = [];

    dto.lignes.forEach((l, i) => {
      const p = parId.get(l.produitId);
      if (!p) throw new BadRequestException("Un produit du panier n'est plus en vente.");
      const q = l.quantite ?? 1;
      if (p.nature === NatureProduit.REEL) {
        contientReel = true;
        if (p.stock !== null && p.stock < q) {
          throw new BadRequestException(`« ${p.titre} » n'est plus disponible en cette quantité.`);
        }
        // Le port se compte une fois par produit, pas par exemplaire : c'est
        // ce que fait un colis.
        port += p.livraisonCents;
      }
      total += p.prixCents * q;
      resume.push({ i: p.id, q });
      items[`line_items[${i}][quantity]`] = String(q);
      items[`line_items[${i}][price_data][currency]`] = 'eur';
      items[`line_items[${i}][price_data][unit_amount]`] = String(p.prixCents);
      items[`line_items[${i}][price_data][product_data][name]`] = p.titre.slice(0, 200);
    });

    if (contientReel && !(dto.adresse && dto.codePostal && dto.ville)) {
      throw new BadRequestException(
        'Cette commande contient un article à expédier : indique une adresse de livraison.',
      );
    }
    if (total <= 0) throw new BadRequestException('Ce panier ne coûte rien : rien à payer.');

    if (port > 0) {
      const i = dto.lignes.length;
      items[`line_items[${i}][quantity]`] = '1';
      items[`line_items[${i}][price_data][currency]`] = 'eur';
      items[`line_items[${i}][price_data][unit_amount]`] = String(port);
      items[`line_items[${i}][price_data][product_data][name]`] = 'Frais d’expédition';
    }

    const racine = origine.replace(/\/$/, '');
    const email = dto.email.trim().toLowerCase();
    const params: Record<string, string> = {
      mode: 'payment',
      ...items,
      customer_email: email,
      success_url: `${racine}/boutique/${slug}?paiement=succes&session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${racine}/boutique/${slug}?paiement=annule`,
      'metadata[kind]': 'boutique',
      'metadata[accountId]': b.accountId,
      'metadata[email]': email,
      'metadata[origine]': racine.slice(0, 120),
      'metadata[port]': String(port),
      // Le détail du panier voyage avec le paiement : c'est lui qui permettra
      // d'écrire la commande au retour, sans avoir rien stocké entre-temps.
      'metadata[panier]': JSON.stringify(resume).slice(0, 480),
    };
    if (dto.nom?.trim()) params['metadata[nom]'] = dto.nom.trim().slice(0, 120);
    if (dto.telephone?.trim()) params['metadata[tel]'] = dto.telephone.trim().slice(0, 40);
    if (dto.adresse?.trim()) params['metadata[adresse]'] = dto.adresse.trim().slice(0, 200);
    if (dto.codePostal?.trim()) params['metadata[cp]'] = dto.codePostal.trim().slice(0, 12);
    if (dto.ville?.trim()) params['metadata[ville]'] = dto.ville.trim().slice(0, 120);
    if (dto.pays?.trim()) params['metadata[pays]'] = dto.pays.trim().slice(0, 80);

    // L'argent va chez l'association quand elle a relié son compte ; sinon il
    // suit le chemin historique, sur le compte de la plateforme.
    Object.assign(params, await this.connect.parametresDeVersement(b.accountId, total + port));

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cle}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params).toString(),
    });
    const json = (await res.json()) as { url?: string; error?: { message?: string } };
    if (!res.ok || !json.url) {
      throw new BadRequestException(json.error?.message ?? "Le paiement n'a pas pu s'ouvrir.");
    }
    return { url: json.url };
  }

  /**
   * LA COMMANDE, UNE FOIS LE PAIEMENT CONFIRMÉ.
   *
   * Appelée par le webhook de paiement. Idempotente : `stripeSessionId` est
   * unique, une notification relivrée retombe sur la commande existante.
   */
  async enregistrerCommandePayee(params: {
    sessionId: string;
    accountId: string;
    email: string;
    montantCents: number;
    portCents: number;
    panier: { i: string; q: number }[];
    nom?: string | null;
    telephone?: string | null;
    adresse?: string | null;
    codePostal?: string | null;
    ville?: string | null;
    pays?: string | null;
    origine?: string | null;
  }) {
    const deja = await this.prisma.commandeBoutique.findUnique({
      where: { stripeSessionId: params.sessionId },
      select: { id: true },
    });
    if (deja) return { deja: true as const };

    const produits = await this.prisma.produitBoutique.findMany({
      where: { accountId: params.accountId, id: { in: params.panier.map((l) => l.i) } },
    });
    const parId = new Map(produits.map((p) => [p.id, p]));

    const commande = await this.prisma.$transaction(async (tx) => {
      const c = await tx.commandeBoutique.create({
        data: {
          accountId: params.accountId,
          email: params.email,
          nom: params.nom ?? null,
          telephone: params.telephone ?? null,
          adresse: params.adresse ?? null,
          codePostal: params.codePostal ?? null,
          ville: params.ville ?? null,
          pays: params.pays ?? null,
          totalCents: params.montantCents,
          fraisPortCents: params.portCents,
          stripeSessionId: params.sessionId,
          lignes: {
            create: params.panier.map((l) => {
              const p = parId.get(l.i);
              return {
                produitId: p?.id ?? null,
                titre: p?.titre ?? 'Article',
                nature: p?.nature ?? NatureProduit.REEL,
                prixCents: p?.prixCents ?? 0,
                quantite: l.q,
                remisUrl:
                  p && p.nature === NatureProduit.VIRTUEL ? p.fichierUrl ?? p.lienUrl : null,
              };
            }),
          },
        },
        include: { lignes: true },
      });

      // Le stock ne se décompte qu'ici, quand l'argent est là.
      for (const l of params.panier) {
        const p = parId.get(l.i);
        if (p && p.nature === NatureProduit.REEL && p.stock !== null) {
          await tx.produitBoutique.update({
            where: { id: p.id },
            data: { stock: { decrement: l.q } },
          });
        }
      }
      return c;
    });

    await this.envoyerRecu(params.accountId, commande, params.origine ?? null);
    return { deja: false as const, id: commande.id };
  }

  /**
   * LE MESSAGE D'APRÈS-ACHAT.
   *
   * Il porte ce qu'on a promis : le lien des produits virtuels, et, quand la
   * commande contient un objet, ce que l'association a écrit sur l'expédition.
   * Ne lève jamais : une commande payée ne doit pas se défaire parce qu'un
   * serveur de courriel ne répond pas.
   */
  private async envoyerRecu(
    accountId: string,
    commande: {
      email: string;
      totalCents: number;
      fraisPortCents: number;
      lignes: {
        titre: string;
        quantite: number;
        nature: NatureProduit;
        remisUrl: string | null;
      }[];
    },
    origine: string | null,
  ) {
    try {
      const b = await this.prisma.boutique.findUnique({
        where: { accountId },
        select: { nom: true, couleur: true, livraisonTexte: true, slug: true },
      });
      const racine =
        origine?.replace(/\/$/, '') ||
        this.config.get<string>('APP_WEB_URL')?.replace(/\/$/, '') ||
        '';
      await this.mail.sendRecuBoutique({
        to: commande.email,
        boutique: { nom: b?.nom ?? 'La boutique', couleur: b?.couleur ?? null },
        lignes: commande.lignes.map((l) => ({
          titre: l.titre,
          quantite: l.quantite,
          virtuel: l.nature === NatureProduit.VIRTUEL,
          lien: l.remisUrl
            ? l.remisUrl.startsWith('http')
              ? l.remisUrl
              : `${racine}${l.remisUrl}`
            : null,
        })),
        totalCents: commande.totalCents,
        fraisPortCents: commande.fraisPortCents,
        livraisonTexte: b?.livraisonTexte ?? null,
        lienBoutique: b?.slug ? `${racine}/boutique/${b.slug}` : racine,
      });
    } catch {
      // MailService journalise déjà l'échec.
    }
  }

  /* ═════════════════════════════════════════════════════ outillage ══════ */

  private normaliser(texte: string): string {
    return texte
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }

  private async slugLibre(base: string): Promise<string> {
    const racine = this.normaliser(base) || 'boutique';
    let essai = racine;
    let n = 2;
    while (await this.prisma.boutique.findUnique({ where: { slug: essai } })) {
      essai = `${racine}-${n++}`;
      if (n > 60) throw new ForbiddenException('Impossible de trouver une adresse libre.');
    }
    return essai;
  }

  private async slugProduitLibre(accountId: string, base: string): Promise<string> {
    const racine = this.normaliser(base) || 'produit';
    let essai = racine;
    let n = 2;
    while (
      await this.prisma.produitBoutique.findUnique({
        where: { accountId_slug: { accountId, slug: essai } },
      })
    ) {
      essai = `${racine}-${n++}`;
      if (n > 60) throw new ForbiddenException('Impossible de trouver une adresse libre.');
    }
    return essai;
  }
}
