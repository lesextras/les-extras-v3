import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { Client as MinioClient } from 'minio';

/**
 * DÉPÔT DE FICHIERS — couche technique.
 *
 * Parle au dépôt MinIO hébergé sur le même serveur, joignable uniquement par
 * le réseau interne. Ce service ne connaît rien aux règles métier : il pose,
 * relit et supprime des octets. Les autorisations sont décidées dans
 * FilesService.
 *
 * Choix assumé : aucune URL signée n'est distribuée. Chaque téléchargement
 * repasse par l'API, qui revérifie les droits. Un lien ne peut donc pas fuiter
 * et rester valable — ce qui compte quand on stocke des pièces d'identité.
 *
 * Le client officiel MinIO est préféré au SDK Amazon : trente-quatre paquets
 * au lieu d'environ cent cinquante, pour exactement les quatre opérations dont
 * nous avons besoin.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: MinioClient | null = null;
  private bucket = '';
  /** Reste faux tant que la configuration est absente : l'API démarre quand même. */
  private ready = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const endpoint = this.config.get<string>('S3_ENDPOINT');
    const accessKey = this.config.get<string>('S3_ACCESS_KEY_ID');
    const secretKey = this.config.get<string>('S3_SECRET_ACCESS_KEY');
    this.bucket = this.config.get<string>('S3_BUCKET') ?? 'les-extras';

    if (!endpoint || !accessKey || !secretKey) {
      this.logger.warn(
        'Dépôt de fichiers non configuré (S3_ENDPOINT / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY). ' +
          'Les dépôts de documents seront refusés proprement ; le reste de l’application fonctionne.',
      );
      return;
    }

    let url: URL;
    try {
      url = new URL(endpoint);
    } catch {
      this.logger.error(`S3_ENDPOINT invalide : « ${endpoint} ».`);
      return;
    }
    const useSSL = url.protocol === 'https:';

    this.client = new MinioClient({
      endPoint: url.hostname,
      port: url.port ? Number(url.port) : useSSL ? 443 : 80,
      useSSL,
      accessKey,
      secretKey,
      region: this.config.get<string>('S3_REGION') ?? 'us-east-1',
    });

    try {
      const existe = await this.client.bucketExists(this.bucket);
      if (!existe) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Bucket « ${this.bucket} » créé.`);
      }
      this.ready = true;
      this.logger.log(`Dépôt de fichiers prêt (bucket « ${this.bucket} »).`);
    } catch (error) {
      this.ready = false;
      this.logger.error(
        `Dépôt de fichiers injoignable : ${(error as Error).message}`,
      );
    }
  }

  /** Le dépôt est-il utilisable ? Permet de refuser proprement plutôt que de planter. */
  get disponible(): boolean {
    return this.ready && this.client !== null;
  }

  private exigerDisponible(): MinioClient {
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
    await client.putObject(this.bucket, cle, contenu, contenu.length, {
      'Content-Type': mimeType,
    });
  }

  /** Flux de lecture de l'objet, à streamer vers la réponse HTTP. */
  async lire(cle: string): Promise<Readable> {
    const client = this.exigerDisponible();
    return client.getObject(this.bucket, cle);
  }

  /**
   * Supprime un objet. Ne lève jamais : un objet déjà absent n'est pas une
   * erreur, et un effacement RGPD ne doit pas échouer à cause du dépôt.
   */
  async supprimer(cle: string): Promise<boolean> {
    if (!this.disponible) return false;
    try {
      await this.client!.removeObject(this.bucket, cle);
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
    try {
      await this.client!.removeObjects(this.bucket, cles);
      return cles.length;
    } catch (error) {
      this.logger.warn(
        `Suppression en lot impossible : ${(error as Error).message}. ` +
          'Reprise fichier par fichier.',
      );
      // Repli : on supprime un par un pour n'abandonner que ceux qui résistent.
      let total = 0;
      for (const cle of cles) {
        if (await this.supprimer(cle)) total++;
      }
      return total;
    }
  }
}
