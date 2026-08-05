import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/request-context';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * INSCRIPTION — 10 PAR HEURE ET PAR ADRESSE IP.
   *
   * Chaque inscription déclenche un e-mail de confirmation, et le quota
   * d'envoi journalier est partagé avec tout le reste du site. Sans bridage
   * propre, le plafond global (120 requêtes/minute) autorisait 120
   * inscriptions par minute : de quoi vider la réserve d'e-mails de la
   * journée en moins de trois minutes, depuis un seul poste. Or la
   * confirmation d'adresse conditionne toute publication : un établissement
   * inscrit ce jour-là se serait retrouvé bloqué sans comprendre pourquoi.
   *
   * 10 par heure laisse largement passer une équipe entière qui s'inscrit
   * depuis le même réseau d'établissement — c'est le cas d'usage réel — et
   * ferme la porte au pilonnage.
   */
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  /**
   * CONNEXION — 20 TENTATIVES PAR QUART D'HEURE ET PAR ADRESSE IP.
   *
   * Aucun bridage propre n'existait : le plafond global autorisait 7 200
   * essais de mot de passe par heure et par IP, sans verrouillage ni délai.
   * 20 par quart d'heure couvre très largement quelqu'un qui hésite entre
   * deux mots de passe, et rend l'essai systématique inopérant.
   */
  @Throttle({ default: { limit: 20, ttl: 900_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token);
  }

  /**
   * MOT DE PASSE OUBLIÉ — la sortie de secours qui manquait.
   *
   * Le lien « Mot de passe oublié ? » de l'écran de connexion pointait vers
   * l'écran de connexion : il rechargeait la page et ne menait nulle part. Et
   * aucune route n'existait ici pour lui donner une destination. Une
   * directrice qui perdait son mot de passe trois semaines après la signature
   * n'avait aucun moyen de s'en sortir seule — il fallait écrire à
   * l'association et attendre.
   *
   * Plafonné à 5 demandes par heure et par adresse IP : chaque demande envoie
   * un e-mail, et le quota d'envoi est partagé avec tout le reste du site.
   */
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.demanderReinitialisation(dto.email);
  }

  /**
   * Le changement lui-même. Bridé aussi : le jeton est signé, donc
   * impossible à deviner, mais rien ne justifie de laisser quelqu'un en
   * essayer des milliers.
   */
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.reinitialiserMotDePasse(dto.token, dto.password);
  }

  /** Renvoi du lien de confirmation — plafonné pour éviter le pilonnage. */
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.auth.resendVerification(dto.email);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: RequestUser) {
    return this.auth.me(user.id);
  }
}
