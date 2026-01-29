class Hero extends HTMLElement {
  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.data = {}
  }

  async connectedCallback () {
    this.loadData()
    this.render()
    this.setupButtonListener()
  }

  loadData () {
    this.data = {
      title: 'Prepárate para la oposición de Bombero',
      description: 'Utiliza asistentes de inteligencia artificial para generar test automaticamente',
      buttonText: 'Comenzar',
      redirectUrl: '/admin/assistant-form'
    }
  }

  render () {
    this.shadow.innerHTML = /* html */`
    <style>
      :host { display:block }
      .hero { position: relative; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:48px 20px; background: transparent; }
      .hero-overlay{ display:none }
      .hero-inner{ position:relative; z-index:2; width:100%; max-width:1200px; display:grid; grid-template-columns:1fr 420px; gap:28px; align-items:center }
      .hero-content{ color: var(--text) }
      .hero-title h1{ font-size: clamp(2rem,4.6vw,3.6rem); margin:0 0 6px 0; font-weight:800; letter-spacing:-0.02em }
      .hero-desc{ margin:0; color: var(--muted); font-size:1.05rem; line-height:1.6 }
      .hero-cta{ display:flex; gap:12px; margin-top:18px; align-items:center }
      .hero-cta button{ min-width:140px; padding:12px 20px; height:48px; border-radius:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px }
      .cta-primary{ background:linear-gradient(90deg,var(--accent),var(--accent-600)); color:#041211; border:none; box-shadow:0 10px 30px rgba(46,166,122,0.12) }
      .btn { background: rgba(255,255,255,0.06); color: var(--muted); border: 1px solid rgba(255,255,255,0.06); }
      .hero-cta button:hover{ transform: translateY(-2px); }
      .hero-cta button:active{ transform: translateY(0); }
      .hero-card{ background: var(--surface); padding:22px; border-radius:12px; box-shadow:0 20px 48px rgba(2,6,10,0.42) }
      @media(max-width:900px){ .hero-inner{ grid-template-columns:1fr } }
    </style>

    <section class="hero" role="banner">
      <div class="hero-overlay" aria-hidden="true"></div>
      <div class="hero-inner">
        <div class="hero-content">
          <div class="hero-title"><h1>${this.data.title}</h1></div>
          <p class="hero-desc">${this.data.description}</p>
          <div class="hero-cta">
            <button class="cta-primary">${this.data.buttonText}</button>
            <button class="btn">Ver servicios</button>
          </div>
        </div>
        <aside class="hero-card">
          <h4 style="margin:0 0 8px 0">Resumen rápido</h4>
          <p style="margin:0;color:var(--muted)">Genera tests, revisa y entrena preguntas desde el panel de administración.</p>
        </aside>
      </div>
    </section>
    `
  }

  setupButtonListener () {
    const button = this.shadow.querySelector('.hero-cta .cta-primary')
    if (button) {
      button.addEventListener('click', () => {
        // Requiere login: si no hay token, enviar a /login
        const token = localStorage.getItem('token')
        if (!token) {
          // conserva el proxy host
          const proxyPort = '8082'
          let targetOrigin = window.location.origin
          if (window.location.port !== proxyPort) {
            targetOrigin = `${window.location.protocol}//${window.location.hostname}:${proxyPort}`
          }
          window.location.href = `${targetOrigin}/login`
          return
        }

        if (this.data && this.data.redirectUrl) {
          // Ya autenticado, redirige al destino (vía proxy)
          const proxyPort = '8082'
          let targetOrigin = window.location.origin
          if (window.location.port !== proxyPort) {
            targetOrigin = `${window.location.protocol}//${window.location.hostname}:${proxyPort}`
          }
          window.location.href = `${targetOrigin}${this.data.redirectUrl}`
        }
      })
    }
  }
}

customElements.define('hero-component', Hero)
