(function () {
  console.log('[login] Script cargado')
  const params = new URLSearchParams(window.location.search)
  const maybeEmail = params.get('email')
  const maybePassword = params.get('password')
  const form = document.getElementById('login-form')
  const message = document.getElementById('message')

  if (maybeEmail) document.getElementById('email').value = decodeURIComponent(maybeEmail)
  if (maybePassword) document.getElementById('password').value = decodeURIComponent(maybePassword)
  if (maybeEmail || maybePassword) {
    history.replaceState(null, '', window.location.pathname)
  }

  async function doLogin () {
    message.textContent = ''
    const email = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value

    if (!email) return message.textContent = 'El email es requerido'
    if (!password) return message.textContent = 'La contraseña es requerida'

    const btn = document.getElementById('login-btn')
    btn.disabled = true
    btn.textContent = 'Entrando...'

    try {
      const res = await fetch('/api/customer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error')

      localStorage.setItem('token', data.token)
      history.replaceState(null, '', window.location.pathname)

      message.textContent = 'Login correcto. Redirigiendo...'
      setTimeout(() => { window.location.href = '/' }, 600)
    } catch (err) {
      message.textContent = err.message || 'Credenciales inválidas'
      btn.disabled = false
      btn.textContent = 'Entrar'
    }
  }

  document.getElementById('login-btn').addEventListener('click', (e) => {
    e.preventDefault()
    doLogin()
  })

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    return false
  })
})()
