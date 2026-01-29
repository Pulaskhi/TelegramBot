class SubscriptionForm extends HTMLElement {
  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.data = {}
  }

  async connectedCallback () {
    await this.loadData()
    await this.render()
  }

  loadData () {
    this.data = {
      explanationTitle: 'Este es un título muy chulo',
      explanationInfo: 'esta es una descripción ultra super mega guay chula chiripitiflautica',
      explanationFeatured: 'Subscríbete perro',
      infoAreaTitle: 'Empieza a usarlo ya',
      infoAreaSubtitle: 'Te enviaremos un correo electrónico con las instrucciones para que puedas empezar a estafar a gente.',
      formElementButton: 'Pa lante',
    }
  }

  render () {
    this.shadow.innerHTML =
    /* html */`
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:opsz,wght@6..12,200..1000&display=swap');

      *{
        box-sizing: border-box;
      }

      button{
        background-color: transparent;
        border: none;
        cursor: pointer;
        outline: none;
        padding: 0;
      }

      h1, h2, h3, h4, h5, h6, p{
        margin: 0;
      }

      h1, h2, h3, h4, h5, h6, p, a, span, li, label, input, button{
        font-family: "Nunito Sans", serif;
        font-optical-sizing: auto;
      }

      img{
        object-fit: cover;
        width: 100%;
      }

      .subscription-form{
        align-items: center;
        display: grid;
        gap: 2rem;
        grid-template-columns: 1fr;
        min-height: 100vh;
        padding: 3rem 1rem;
        background: transparent;
        position: relative;
      }

      .subscription-form .section-overlay{ display:none }
      .explanation, .form-container{ position: relative; z-index:2 }

      @media (min-width: 768px) {
        .subscription-form {
          padding: 3rem 10%;
        }
      }

      @media (min-width: 1280px) {
        .subscription-form {
          grid-template-columns: 1fr 1fr;
          padding: 3rem 10%;
        }
      }

      .explanation {
        align-items: center;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      @media (min-width: 1280px) {
        .explanation {
          align-items: flex-start;
          text-align: left;
        }
      }

      .explanation-title h3 {
        background: linear-gradient(90deg,var(--accent,#ff6b2d),var(--accent-600,#e85a27));
        -webkit-background-clip: text; background-clip: text; color: transparent;
        font-size: clamp(1.2rem,3vw,1.8rem);
        font-weight: 800; text-transform: uppercase; letter-spacing:0.10em; text-align:center
      }

      @media (min-width: 768px) {
        .explanation-title h3 {
          font-size: 3rem;
        }
      }

      @media (min-width: 1280px) {
        .explanation-title h3 {
          line-height: 3.5rem;
          text-align: left;
        }
      }

      .explanation-info p{
        color: var(--muted);
        font-size: clamp(.9rem,2.2vw,1.1rem);
        font-weight: 600;
        line-height: 1.6;
        text-align: center;
      }

      @media (min-width: 768px) {
        .explanation-info p {
          font-size: 1.5rem;
        }
      }

      @media (min-width: 1280px) {
        .explanation-info p {
          text-align: left;
        }
      }

      .explanation-featured{
        display:inline-flex; align-items:center; gap:8px; padding:0.45rem 1rem; border-radius:9999px;
        background: linear-gradient(90deg, rgba(255,107,45,0.12), rgba(232,90,39,0.08));
        border: 1px solid rgba(232,90,39,0.12); box-shadow: 0 6px 18px rgba(0,0,0,0.28)
      }

      .explanation-featured span{ color: var(--accent); font-weight:700 }

      @media (min-width: 768px) {
        .explanation-featured span {
          font-size: 1.2rem;
        }
      }

      .form-container {
        background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)), rgba(8,12,16,0.32);
        border-radius: 12px; box-shadow: 0 12px 30px rgba(2,6,10,0.28); display:flex; flex-direction:column; gap:1.25rem; padding:1.5rem; width:100%; margin:auto; color:var(--text)
      }

      .info-area {
        align-items: center;
        display: flex;
        gap: 1.5rem;
      }

      .info-area-text {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .info-area-title h4 {
        color: var(--text);
        font-size: 1.25rem;
        font-weight: 800;
      }

      @media (min-width: 768px) {
        .info-area-title h4 {
          font-size: 2rem;
        }
      }

      .info-area-subtitle span {
        color: var(--muted);
        font-size: 0.95rem;
        font-weight: 600;
      }

      @media (min-width: 768px) {
        .info-area-subtitle span {
          font-size: 1.2rem;
        }
      }

      .info-area-icon svg { animation: top-bottom 2s infinite; width:4.2rem; fill: var(--accent) }

      @keyframes top-bottom {
        0%, 100%, 20%, 50%, 80% {
          -webkit-transform: translateY(0);
          -ms-transform: translateY(0);
          transform: translateY(0);
        }

        40% {
          -webkit-transform: translateY(-8px);
          -ms-transform: translateY(-8px);
          transform: translateY(-8px);
        }
        60% {
          -webkit-transform: translateY(-4px);
          -ms-transform: translateY(-4px);
          transform: translateY(-4px);
        }
      }

      .form form{
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .form-element-input input {
        border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); color: var(--text); border-radius:12px; font-size:1rem; outline:none; padding:0.95rem; width:100%; transition:border-color .18s var(--ease), box-shadow .18s var(--ease)
      }

      .form-element-input input:hover, .form-element-input input:focus { border-color: var(--accent); box-shadow: 0 6px 20px rgba(232,90,39,0.06) }

      .form-element-button button{ background: linear-gradient(90deg,var(--accent),var(--accent-600)); border-radius:12px; color:#041211; font-size:1.05rem; font-weight:700; padding:0.9rem; width:100%; transition: transform .12s var(--ease), box-shadow .12s var(--ease); box-shadow: 0 10px 30px rgba(232,90,39,0.12) }
      .form-element-button button:hover{ transform: translateY(-2px); box-shadow:0 14px 40px rgba(232,90,39,0.16) }
      .form-element-button button:active{ transform: translateY(0) scale(.99) }
    
    </style>

    <section class="subscription-form">
      <div class="section-overlay" aria-hidden="true"></div>
      <div class="explanation">
        <div class="explanation-title">
          <h3>${this.data.explanationTitle}</h3>
        </div>
        <div class="explanation-info">
          <p>${this.data.explanationInfo}</p>
        </div>
        <div class="explanation-featured">
          <span>${this.data.explanationFeatured}</span>
        </div>
      </div>
      <div class="form-container">
        <div class="info-area">
          <div class="info-area-text">
            <div class="info-area-title">
              <h4>${this.data.infoAreaTitle}</h4>
            </div>
            <div class="info-area-subtitle">
              <span>${this.data.infoAreaSubtitle}</span>
            </div>
          </div>
          <div class="info-area-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>hand-pointing-down</title><path d="M9.9,21V11L6.7,12.69L6.5,12.72C6.19,12.72 5.93,12.6 5.74,12.4L5,11.63L9.9,7.43C10.16,7.16 10.5,7 10.9,7H17.4C18.17,7 18.9,7.7 18.9,8.5V12.86C18.9,13.47 18.55,14 18.05,14.2L13.11,16.4L11.9,16.53V21A1,1 0 0,1 10.9,22A1,1 0 0,1 9.9,21M18.9,5H10.9V2H18.9V5Z" /></svg>
          </div>
        </div>
        <div class="form">
          <form id="newsletter-form">
            <div class="form-element">
              <div class="form-element-input">
                <input id="newsletter-email" type="email" placeholder="Dirección de correo" required>
              </div>
            </div>
            <div class="form-element-button">
              <button type="submit">${this.data.formElementButton}</button>
            </div>
            <div id="newsletter-feedback" style="margin-top:10px;"></div>
          </form>
        </div>
      </div>
    </section>
    `
    // Lógica JS para el formulario
    const form = this.shadow.getElementById('newsletter-form')
    const emailInput = this.shadow.getElementById('newsletter-email')
    const feedback = this.shadow.getElementById('newsletter-feedback')
    form.onsubmit = async (e) => {
      e.preventDefault()
      feedback.textContent = ''
      const email = emailInput.value.trim()
      if (!email) {
        feedback.textContent = 'Introduce un correo válido.'
        feedback.style.color = 'red'
        return
      }
      try {
        const res = await fetch('/api/customer/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        })
        const data = await res.json()
        if (res.ok) {
          feedback.textContent = '¡Suscripción exitosa! Revisa tu correo.'
          feedback.style.color = 'green'
          form.reset()
        } else {
          feedback.textContent = data.message || 'Error al suscribirse.'
          feedback.style.color = 'red'
        }
      } catch (err) {
        feedback.textContent = 'Error de red.'
        feedback.style.color = 'red'
      }
    }
  }
}

customElements.define('subscription-form-component', SubscriptionForm)
