const sequelizeDb = require('../../models/sequelize')
const User = sequelizeDb.User
const UserActivationToken = sequelizeDb.UserActivationToken
const UserCredential = sequelizeDb.UserCredential
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret'

exports.activate = async (req, res, next) => {
  try {
    console.log('[activate] body:', req.body)
    const { token, name, password } = req.body
    if (!token || !password) {
      console.log('[activate] Faltan token o password')
      return res.status(400).json({ error: true, message: 'Token y contraseña son requeridos' })
    }

    const activation = await UserActivationToken.findOne({ where: { token, used: false } })
    console.log('[activate] activation:', activation)
    if (!activation) {
      console.log('[activate] Token inválido o ya usado')
      return res.status(400).json({ error: true, message: 'Token inválido o ya usado' })
    }

    if (new Date(activation.expirationDate) < new Date()) {
      console.log('[activate] Token expirado')
      return res.status(400).json({ error: true, message: 'Token expirado' })
    }

    // Get or create user
    let user = await User.findByPk(activation.userId)
    console.log('[activate] user:', user)
    if (!user) {
      console.log('[activate] Usuario no encontrado')
      return res.status(400).json({ error: true, message: 'Usuario no encontrado' })
    }

    // Update name if provided
    if (name) {
      await user.update({ name })
      console.log('[activate] Nombre actualizado')
    }

    // Hash password and create credential
    const hash = await bcrypt.hash(password, 10)
    await UserCredential.create({
      userId: user.id,
      email: user.email,
      password: hash,
      lastPasswordChange: new Date()
    })
    console.log('[activate] Credencial creada')

    // Mark token used
    await activation.update({ used: true })
    console.log('[activate] Token marcado como usado')

    // Generate JWT
    const payload = { id: user.id, email: user.email }
    const authToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
    console.log('[activate] JWT generado')

    res.json({ ok: true, token: authToken })
  } catch (err) {
    console.error('[activate] error:', err)
    next(err)
  }
}

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    console.log('[login] email recibido:', email)
    if (!email || !password) {
      console.log('[login] Faltan email o password')
      return res.status(400).json({ error: true, message: 'Email y contraseña son requeridos' })
    }

    const cred = await UserCredential.findOne({ where: { email } })
    console.log('[login] cred encontrado:', cred)
    if (!cred) {
      console.log('[login] No se encontró credencial para el email:', email)
      return res.status(401).json({ error: true, message: 'Credenciales inválidas' })
    }

    const match = await bcrypt.compare(password, cred.password)
    console.log('[login] ¿Password coincide?', match)
    if (!match) {
      console.log('[login] Contraseña incorrecta para el email:', email)
      return res.status(401).json({ error: true, message: 'Credenciales inválidas' })
    }

    const user = await User.findByPk(cred.userId)
    console.log('[login] usuario encontrado:', user)

    const payload = { id: user.id, email: user.email }
    const authToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })

    res.json({ ok: true, token: authToken })
  } catch (err) {
    console.error('[login] error:', err)
    next(err)
  }
}
