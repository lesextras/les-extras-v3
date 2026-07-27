export const getBaseTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7f9fc; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { text-align: center; margin-bottom: 20px; }
    .header h1 { color: #fe5b4c; } /* Coral color base */
    .content { font-size: 16px; }
    .footer { margin-top: 30px; font-size: 12px; text-align: center; color: #888; border-top: 1px solid #eaeaea; padding-top: 20px; }
    .btn { display: inline-block; padding: 10px 20px; background-color: #fe5b4c; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Les Extras</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      L'équipe Les Extras<br>
      Ceci est un email automatique, merci de ne pas y répondre.
    </div>
  </div>
</body>
</html>
`;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMultilineText(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

export const welcomeFreelanceTemplate = (firstName: string) => getBaseTemplate(`
  <h2>Bonjour ${firstName},</h2>
  <p>Bienvenue sur <strong>Les Extras</strong> ! Nous sommes ravis de vous compter parmi nos freelances.</p>
  <p>Vous pouvez dès maintenant compléter votre profil et postuler aux missions de renfort disponibles.</p>
  <p><a href="https://les-extras.com/auth/login" class="btn">Accéder à mon espace</a></p>
`);

export const welcomeEstablishmentTemplate = (name: string) => getBaseTemplate(`
  <h2>Bonjour ${name},</h2>
  <p>Bienvenue sur <strong>Les Extras</strong> ! Nous sommes ravis d'accompagner votre établissement.</p>
  <p>Vous pouvez dès maintenant publier vos besoins en renfort et trouver les meilleurs profils.</p>
  <p><a href="https://les-extras.com/auth/login" class="btn">Accéder à mon espace</a></p>
`);

export const missionConfirmedTemplate = (missionDate: string, otherPartyName: string) => getBaseTemplate(`
  <h2>Excellente nouvelle !</h2>
  <p>Votre mission du <strong>${missionDate}</strong> avec <strong>${otherPartyName}</strong> est désormais confirmée.</p>
  <p>N'hésitez pas à échanger des messages si vous avez besoin de préciser les détails avant la mission.</p>
`);

export const missionCompletedTemplate = (missionDate: string) => getBaseTemplate(`
  <h2>Mission terminée</h2>
  <p>Votre mission du <strong>${missionDate}</strong> est marquée comme terminée.</p>
  <p>N'oubliez pas de laisser un avis sur votre expérience !</p>
`);

export const workshopBookingTemplate = (workshopTitle: string, date: string) => getBaseTemplate(`
  <h2>Inscription confirmée !</h2>
  <p>Votre inscription à l'atelier <strong>${workshopTitle}</strong> du <strong>${date}</strong> est bien prise en compte.</p>
  <p>Nous vous enverrons plus de détails prochainement.</p>
`);

export const messageNotificationTemplate = (senderName: string) => getBaseTemplate(`
  <h2>Nouveau message</h2>
  <p>Vous avez reçu un nouveau message de <strong>${senderName}</strong> sur la plateforme Les Extras.</p>
  <p><a href="https://les-extras.com/messaging" class="btn">Voir le message</a></p>
`);

export const adminOutreachTemplate = (recipientName: string, message: string) => getBaseTemplate(`
  <h2>Bonjour ${escapeHtml(recipientName)},</h2>
  <p>Le Desk Les Extras souhaite vous transmettre le message suivant :</p>
  <div style="margin: 16px 0; padding: 16px; border-radius: 8px; background: #f7f9fc; border: 1px solid #eaeaea;">
    ${formatMultilineText(message)}
  </div>
  <p>Retrouvez ce message dans votre espace personnel sur la plateforme.</p>
  <p><a href="https://les-extras.com/dashboard/inbox" class="btn">Accéder à mon espace</a></p>
`);

export const passwordResetTemplate = (resetUrl: string) => getBaseTemplate(`
  <h2>Réinitialisation de votre mot de passe</h2>
  <p>Vous avez demandé à réinitialiser le mot de passe de votre compte Les Extras.</p>
  <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien est valable pendant <strong>1 heure</strong>.</p>
  <p><a href="${resetUrl}" class="btn">Réinitialiser mon mot de passe</a></p>
  <p style="margin-top:20px;font-size:13px;color:#888;">Si vous n'avez pas effectué cette demande, ignorez cet email. Votre mot de passe ne sera pas modifié.</p>
`);

export const candidatureDeclinedTemplate = (missionTitle: string, firstName: string) => getBaseTemplate(`
  <h2>Bonjour ${firstName},</h2>
  <p>Malheureusement, votre candidature pour la mission <strong>"${missionTitle}"</strong> n'a pas été retenue.</p>
  <p>Ne vous découragez pas ! De nouvelles missions sont publiées régulièrement sur la plateforme.</p>
  <p><a href="https://les-extras.com/marketplace" class="btn">Voir les missions disponibles</a></p>
`);

export const reviewInvitationTemplate = (missionTitle: string) => getBaseTemplate(`
  <h2>Mission terminée !</h2>
  <p>La mission <strong>"${missionTitle}"</strong> est désormais terminée.</p>
  <p>Votre avis compte ! Prenez un instant pour évaluer votre expérience et aider la communauté.</p>
  <p><a href="https://les-extras.com/bookings" class="btn">Laisser un avis</a></p>
`);
