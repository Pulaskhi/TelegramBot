(function () {
  console.log('[create-password] Script cargado')
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  const email = params.get('email')
  const form = document.getElementById('create-form')
  const message = document.getElementById('message')

  if (token || email) history.replaceState(null, '', window.location.pathname)

  async function doCreate () {
    message.textContent = ''
    const name = document.getElementById('name').value.trim()
    const password = document.getElementById('password').value
    const password2 = document.getElementById('password2').value

    if (!name) return message.textContent = 'El nombre es requerido'
    if (password.length < 8) return message.textContent = 'La contraseña debe tener al menos 8 caracteres'
    if (password !== password2) return message.textContent = 'Las contraseñas no coinciden'

    const btn = document.getElementById('create-btn')
    btn.disabled = true
    btn.textContent = 'Creando...'

    try {
      const res = await fetch('/api/customer/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error')

      localStorage.setItem('token', data.token)
      history.replaceState(null, '', window.location.pathname)

      message.textContent = 'Cuenta creada. Redirigiendo...'
      setTimeout(() => { window.location.href = '/' }, 800)
    } catch (err) {
      message.textContent = err.message || 'Error creando cuenta'
      btn.disabled = false
      btn.textContent = 'Crear cuenta'
    }
  }

  document.getElementById('create-btn').addEventListener('click', (e) => {
    e.preventDefault()
    doCreate()
  })

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    return false
  })
})()
