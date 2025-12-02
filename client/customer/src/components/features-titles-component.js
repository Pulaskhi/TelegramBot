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
      @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:opsz,wght@6..12,200..1000&display=swap');
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
        display: flex;
        flex-direction: column;
        height: 175vh;
        justify-content: center;
        position: relative;
        width: 100%;
      }

      .features-titles-list { position: relative; z-index: 2; }

      /* Use same surface background for continuity */
      .features-titles { background: var(--surface); }

      @media (min-width: 1024px) {
        .features-titles { height: 200vh; }
      }

      @media (min-width: 1280px) {
        .features-titles { height: 250vh; }
      }

      .features-titles ul li {
        color: var(--accent);
        font-size: clamp(1.8rem, 6vw, 4.2rem);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        text-shadow: 0 6px 22px rgba(232,90,39,0.12);
        height: 100vh;
        margin-top: calc(-80vh + 1.1em);
        padding-top: 46vh;
        position: sticky;
        top: 0;
        transform: translateY(calc((var(--index) - var(--items)* .5)* 0.9em));
        text-align: center;
        transition: transform 0.28s var(--ease), color 0.2s var(--ease);
        line-height: 1;
        font-weight: 900;
      }

      .features-titles ul li:first-child {
        margin-top: 0;
      <div class="section-overlay" aria-hidden="true"></div>
      }

      .features-titles ul li:hover {
        color: #ff6347;
        transform: scale(1.1) translateY(calc((var(--index) - var(--items)* .5)* 1.5em));
        text-shadow: 0 0 25px rgba(255, 99, 71, 1), 0 0 50px rgba(255, 215, 51, 0.9);
      }
    </style>

    <section class="features-titles">
      <div class="features-titles-list">
        <ul style="--items: ${this.data.length}">
        </ul>
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