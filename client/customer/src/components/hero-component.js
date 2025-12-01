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
      redirectUrl: '/admin/asistentes'
    }
  }

  render () {
    this.shadow.innerHTML = /* html */`
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: var(--font-family);
      }

      button {
        cursor: pointer;
        outline: none;
        border: none;
      }

      .hero {
        position: relative;
        min-height: 100vh;             /* ocupar toda la pantalla */
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4rem 1.5rem;
        background: transparent;       /* usamos la imagen global del body */
        overflow: visible;
        z-index: 1;                    /* encima del overlay pseudo-body */
      }

      .hero-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          180deg,
          rgba(6,10,15,0.28) 0%,
          rgba(6,10,15,0.62) 80%
        );
        z-index: 2;
        pointer-events: none;
      }

      .hero-info {
        position: relative;
        z-index: 3;
        text-align: center;
        max-width: 900px;
        color: #fff;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .hero-title h1 {
        font-size: clamp(2.4rem, 5vw, 3.6rem);
        font-weight: 900;
        color: #fff;                /* texto blanco para contraste */
        letter-spacing: -0.02em;
        text-shadow: 0 8px 30px rgba(6,10,15,0.6);
      }

      .hero-description p {
        font-size: clamp(1rem, 2.2vw, 1.15rem);
        line-height: 1.6;
        color: rgba(255,255,255,0.92);
        text-shadow: 0 6px 22px rgba(6,10,15,0.55);
      }

      .hero-button button {
        background: linear-gradient(90deg, rgba(255,90,43,0.98), rgba(255,138,58,0.98));
        border-radius: 999px;
        color: white;
        font-size: 1rem;
        font-weight: 800;
        padding: 0.95rem 2rem;
        box-shadow: 0 18px 46px rgba(6,10,15,0.55);
        transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
      }

      .hero-button button:hover {
        transform: translateY(-3px);
        box-shadow: 0 26px 64px rgba(6,10,15,0.65);
        filter: brightness(1.03);
      }

      /* Responsive */
      @media (max-width: 900px) {
        .hero { min-height: 72vh; padding: 3rem 1rem }
        .hero-title h1{ font-size: clamp(1.8rem, 6vw, 2.6rem) }
      }
      @media (max-width: 480px) {
        .hero { min-height: 62vh; padding: 2rem 0.75rem }
        .hero-title h1{ font-size: 1.6rem }
      }
    </style>

    <section class="hero">

      <div class="hero-overlay" aria-hidden="true"></div>

      <div class="hero-info">
        <div class="hero-title">
          <h1>${this.data.title}</h1>
        </div>
        <div class="hero-description">
          <p>${this.data.description}</p>
        </div>
        <div class="hero-button">
          <button>${this.data.buttonText}</button>
        </div>
      </div>
    </section>
    `
  }

  setupButtonListener () {
    const button = this.shadow.querySelector('.hero-button button')
    if (button) {
      button.addEventListener('click', () => {
        window.location.href = this.data.redirectUrl
      })
    }
  }
}

customElements.define('hero-component', Hero)
