import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';

/**
 * DÉPÔT DE FICHIERS — couche technique.
 *
 * Parle à un dépôt compatible S3 (ici MinIO, hébergé sur le même serveur et
 * joignable uniquement par le réseau interne). Ce service ne connaît rien aux
 * règles métier : il pose, relit et supprime des octets. Les autorisations sont
 * décidées dans FilesService.
 *
 * Choix assumé : aucune URL signée n'est distribuée. Chaque téléchargement
 * repasse par l'API, qui revérifie les droits. Un lien ne peut donc pas fuiter
 * et rester valable — ce qui compte quand on stocke des pièces d'identité.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client | null = null;
  private bucket = '';
  /** Reste faux tant que la configuration est absente : l'API démarre quand même. */
  private ready = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const endpoint = this.config.get<string>('S3_ENDPOINT');
    const accessKeyId = this.config.get<string>('S3_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('S3_SECRET_ACCESS_KEY');
    this.bucket = this.config.get<string>('S3_BUCKET') ?? 'les-extras';

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      this.logger.warn(
        'Dépôt de fichiers non configuré (S3_ENDPOINT / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY). ' +
          'Les dépôts de documents seront refusés proprement ; le reste de l’application fonctionne.',
      );
      return;
    }

    this.client = new S3Client({
      endpoint,
      region: this.config.get<string>('S3_REGION') ?? 'us-east-1',
      credentials: { accessKeyId, secretAccessKey },
      // MinIO n'utilise pas les sous-domaines de bucket.
      forcePathStyle: true,
    });

    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.ready = true;
      this.logger.log(`Dépôt de fichiers prêt (bucket « ${this.bucket} »).`);
    } catch {
      // Le bucket n'existe pas encore : on le crée au premier démarrage.
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.ready = true;
        this.logger.log(`Bucket « ${this.bucket} » créé.`);
      } catch (error) {
        this.ready = false;
        this.logger.error(
          `Dépôt de fichiers injoignable : ${(error as Error).message}`,
        );
      }
    }
  }

  /** Le dépôt est-il utilisable ? Permet de refuser proprement plutôt que de planter. */
  get disponible(): boolean {
    return this.ready && this.client !== null;
  }

  private exigerDisponible(): S3Client {
    if (!this.client || !this.ready) {
      throw new ServiceUnavailableException(
        'Le dépôt de documents est momentanément indisponible. Réessayez dans quelques instants.',
      );
    }
    return this.client;
  }

  /**
   * Fabrique une clé d'objet non devinable. Le nom d'origine n'entre jamais
   * dans la clé : il peut contenir le nom de la personne, des accents, ou des
   * séparateurs de chemin.
   */
  construireCle(kind: string, originalName: string): string {
    const ext = this.extension(originalName);
    const annee = new Date().getFullYear();
    return `${kind.toLowerCase()}/${annee}/${randomUUID()}${ext}`;
  }

  /** Extension normalisée (minuscules, 8 caractères max), ou chaîne vide. */
  private extension(nom: string): string {
    const point = nom.lastIndexOf('.');
    if (point < 0 || point === nom.length - 1) return '';
    const ext = nom
      .slice(point + 1)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    return ext ? `.${ext.slice(0, 8)}` : '';
  }

  async deposer(cle: string, contenu: Buffer, mimeType: string): Promise<void> {
    const client = this.exigerDisponible();
    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: cle,
        Body: contenu,
        ContentType: mimeType,
      }),
    );
  }

  /** Flux de lecture de l'objet, à streamer vers la réponse HTTP. */
  async lire(cle: string): Promise<Readable> {
    const client = this.exigerDisponible();
    const sortie = await client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: cle }),
    );
    return sortie.Body as Readable;
  }

  /**
   * Supprime un objet. Ne lève jamais : un objet déjà absent n'est pas une
   * erreur, et un effacement RGPD ne doit pas échouer à cause du dépôt.
   */
  async supprimer(cle: string): Promise<boolean> {
    if (!this.disponible) return false;
    try {
      await this.client!.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: cle }),
      );
      return true;
    } catch (error) {
      this.logger.warn(
        `Suppression du fichier « ${cle} » impossible : ${(error as Error).message}`,
      );
      return false;
    }
  }

  /** Suppression en lot (effacement RGPD). Renvoie le nombre d'objets effacés. */
  async supprimerPlusieurs(cles: string[]): Promise<number> {
    if (!this.disponible || cles.length === 0) return 0;
    let total = 0;
    // L'API S3 limite chaque appel à 1000 objets.
    for (let i = 0; i < cles.length; i += 1000) {
      const lot = cles.slice(i, i + 1000);
      try {
        const res = await this.client!.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: { Objects: lot.map((Key) => ({ Key })), Quiet: true },
          }),
        );
        total += lot.length - (res.Errors?.length ?? 0);
        if (res.Errors?.length) {
          this.logger.warn(
            `${res.Errors.length} fichier(s) n’ont pas pu être supprimés du dépôt.`,
          );
        }
      } catch (error) {
        this.logger.warn(
          `Suppression en lot impossible : ${(error as Error).message}`,
        );
      }
    }
    return total;
  }
}
