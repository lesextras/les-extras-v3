import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  adminOutreachTemplate,
  welcomeFreelanceTemplate,
  welcomeEstablishmentTemplate,
  missionConfirmedTemplate,
  missionCompletedTemplate,
  workshopBookingTemplate,
  messageNotificationTemplate,
  passwordResetTemplate,
  candidatureDeclinedTemplate,
  reviewInvitationTemplate,
} from './mail.templates';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<number>('SMTP_PORT') === 465,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  private async sendMail(to: string, subject: string, html: string) {
    try {
      const from = this.configService.get<string>('SMTP_FROM');
      await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent successfully to ${to} (Subject: ${subject})`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to} (Subject: ${subject})`, error instanceof Error ? error.stack : String(error));
      // Non-blocking in v1: on logge juste l'erreur
    }
  }

  async sendWelcomeFreelanceEmail(to: string, firstName: string) {
    await this.sendMail(to, 'Bienvenue chez Les Extras !', welcomeFreelanceTemplate(firstName));
  }

  async sendWelcomeEstablishmentEmail(to: string, name: string) {
    await this.sendMail(to, 'Bienvenue chez Les Extras !', welcomeEstablishmentTemplate(name));
  }

  async sendMissionConfirmedEmail(to: string, missionDate: string, otherPartyName: string) {
    await this.sendMail(to, 'Mission confirmée !', missionConfirmedTemplate(missionDate, otherPartyName));
  }

  async sendMissionCompletedEmail(to: string, missionDate: string) {
    await this.sendMail(to, 'Mission terminée', missionCompletedTemplate(missionDate));
  }

  async sendWorkshopBookingEmail(to: string, workshopTitle: string, date: string) {
    await this.sendMail(to, `Confirmation d'inscription : ${workshopTitle}`, workshopBookingTemplate(workshopTitle, date));
  }

  async sendMessageNotificationEmail(to: string, senderName: string) {
    await this.sendMail(to, 'Nouveau message reçu', messageNotificationTemplate(senderName));
  }

  async sendAdminOutreachEmail(to: string, recipientName: string, message: string) {
    await this.sendMail(
      to,
      'Message du Desk Les Extras',
      adminOutreachTemplate(recipientName, message),
    );
  }

  async sendPasswordResetEmail(to: string, resetUrl: string) {
    await this.sendMail(to, 'Réinitialisation de votre mot de passe', passwordResetTemplate(resetUrl));
  }

  async sendCandidatureDeclinedEmail(to: string, missionTitle: string, firstName: string) {
    await this.sendMail(to, 'Candidature non retenue', candidatureDeclinedTemplate(missionTitle, firstName));
  }

  async sendReviewInvitationEmail(to: string, missionTitle: string) {
    await this.sendMail(to, 'Donnez votre avis !', reviewInvitationTemplate(missionTitle));
  }
}
