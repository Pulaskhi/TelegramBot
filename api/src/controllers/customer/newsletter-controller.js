const crypto = require('crypto');

exports.subscribe = async (req, res, next) => {
  try {
    const { email } = req.body
    console.log('[NEWSLETTER] Intentando suscribir email:', email)
    if (!email) {
      console.log('[NEWSLETTER] Email no proporcionado')
      return res.status(400).json({ message: 'Email es requerido' })
    }

    // Generar token aleatorio
    const token = crypto.randomBytes(24).toString('hex');
    console.log('[NEWSLETTER] Token generado:', token)

    const sequelizeDb = require('../../models/sequelize')
    const User = sequelizeDb.User
    const UserActivationToken = sequelizeDb.UserActivationToken

    // Find or create user
    let user = await User.findOne({ where: { email } })
    if (!user) {
      user = await User.create({ name: email.split('@')[0], email })
    }

    // Create activation token in DB
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2) // 48h
    await UserActivationToken.create({ userId: user.id, used: false, token, expirationDate })

    // Prepare activation link
    const frontUrl = process.env.FRONT_URL || 'http://localhost:8082'
    const activationLink = `${frontUrl}/create-password?token=${token}&email=${encodeURIComponent(email)}`

    // Enviar correo usando el servicio común (soporta OAuth2)
    const sendTestEmail = require('../../services/nodemailer-test')
    console.log('[NEWSLETTER] Usando sendTestEmail')

    const mailText = `¡Bienvenido! Pulsa aquí para crear tu contraseña: ${activationLink}`;

    try {
      await sendTestEmail(email, 'Bienvenido a la newsletter', mailText)
      console.log('[NEWSLETTER] Correo enviado')
    } catch (mailErr) {
      console.error('[NEWSLETTER] Error enviando correo:', mailErr)
      throw mailErr
    }

    res.status(200).json({ message: 'Suscripción exitosa y correo enviado', token, activationLink })
  } catch (err) {
    console.error('[NEWSLETTER] Error en subscribe:', err)
    next(err)
  }
}
