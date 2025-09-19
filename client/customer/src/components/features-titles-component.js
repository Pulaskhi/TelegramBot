class FeaturesTitles extends HTMLElement {
  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  async connectedCallback () {
    await this.loadData()
    await this.render()
  }

  loadData () {
    this.data = [
      { title: 'Entrena' },
      { title: 'Resiste' },
      { title: 'Supera' }
    ]
  }

  render () {
    this.shadow.innerHTML =
    /* html */`
    <style>
      * { box-sizing: border-box; margin:0; padding:0; }

      ul {
        list-style-type: none;
        margin: 0;
        padding: 0;
      }

      h1, h2, h3, h4, h5, h6, p, a, span, li {
        font-family: "Nunito Sans", serif;
        font-weight: 800;
      }

      .features-titles {
        align-items: center;
        /* Gradiente que arranca del rojo fuego del Hero */
        background: linear-gradient(to bottom, #ff4500 0%, #330000 100%);
        display: flex;
        flex-direction: column;
        height: 175vh;
        justify-content: center;
        position: relative;
        width: 100%;
      }

      @media (min-width: 1024px) {
        .features-titles { height: 200vh; }
      }

      @media (min-width: 1280px) {
        .features-titles { height: 250vh; }
      }

      .features-titles ul li {
        color: #ffdd33;
        font-size: 3rem;
        text-shadow: 0 0 20px #ff4500, 0 0 40px rgba(255, 215, 51, 0.8);
        height: 100vh;
        margin-top: calc(-80vh + 1.1em);
        padding-top: 50vh;
        position: sticky;
        top: 0;
        transform: translateY(calc((var(--index) - var(--items)* .5)* 1.5em));
        text-align: center;
        transition: transform 0.3s ease, color 0.3s ease;
      }

      .features-titles ul li:first-child {
        margin-top: 0;
      }

      .features-titles ul li:hover {
        color: #ff6347;
        transform: scale(1.1) translateY(calc((var(--index) - var(--items)* .5)* 1.5em));
        text-shadow: 0 0 25px rgba(255, 99, 71, 1), 0 0 50px rgba(255, 215, 51, 0.9);
      }

      .features-titles-footer {
        background-color: transparent;
        bottom: 0;
        display: block;
        position: absolute;
        width: 100%;
      }

      .features-titles-footer-backgroud-waves svg {
        width: 100%;
        height: 220px;
        display: block;
        filter: drop-shadow(0 -10px 30px rgba(0,0,0,0.7));
      }

      .features-titles-footer-backgroud-waves path:nth-child(1) {
        fill: #ff4500;
      }
      .features-titles-footer-backgroud-waves path:nth-child(2) {
        fill: #ff6347;
        opacity: 0.8;
      }
      .features-titles-footer-backgroud-waves path:nth-child(3) {
        fill: #ff3300;
        opacity: 0.6;
      }
    </style>

    <section class="features-titles">
      <div class="features-titles-list">
        <ul style="--items: ${this.data.length}">
        </ul>
      </div>

      <div class="features-titles-footer">
        <div class="features-titles-footer-backgroud-waves">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path d="M0,320 C80,200 160,160 240,260 C320,360 400,160 480,280 C560,400 640,160 720,260 C800,360 880,160 960,280 C1040,400 1120,160 1200,260 C1280,360 1360,180 1440,300 L1440,320 L0,320Z"></path>
            <path d="M0,320 C100,180 200,140 300,280 C400,420 500,140 600,280 C700,420 800,140 900,280 C1000,420 1100,140 1200,280 C1300,420 1400,180 1440,280 L1440,320 L0,320Z"></path>
            <path d="M0,320 C120,140 240,120 360,300 C480,480 600,120 720,300 C840,480 960,120 1080,300 C1200,480 1320,140 1440,320 L1440,320 L0,320Z"></path>
          </svg>
        </div>
      </div>
    </section>
    `

    this.data.forEach((element, index) => {
      const ulContainer = this.shadow.querySelector('ul')
      const liContainer = document.createElement('li')
      liContainer.style.setProperty('--index', index)
      liContainer.textContent = element.title
      ulContainer.appendChild(liContainer)
    })
  }
}

customElements.define('features-titles-component', FeaturesTitles)
