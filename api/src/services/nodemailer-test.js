const nodemailer = require('nodemailer');
require('dotenv').config();

async function sendTestEmail(to, subject, text) {
  try {

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.EMAIL_CLIENT_ID,
        clientSecret: process.env.EMAIL_CLIENT_SECRET,
        refreshToken: process.env.EMAIL_REFRESH_TOKEN
      }
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text
    });

    console.log('Correo enviado:', info.response);
  } catch (err) {
    console.error('Error enviando correo:', err);
  }
}

// Ejemplo de uso:
// sendTestEmail('destinatario@ejemplo.com', 'Asunto de prueba', 'Texto del email de prueba');

module.exports = sendTestEmail;
