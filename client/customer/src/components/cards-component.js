class Cards extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({
      mode: 'open'
    });
  }

  async connectedCallback() {
    this.loadData();
    this.render();
  }

  loadData() {
    this.data = {
      title: 'Tu entrenamiento, nuestra fuerza',
      description: 'Más allá de la manguera y el hacha, la verdadera preparación de un bombero reside en la disciplina. Desde la agilidad en espacios confinados hasta la resistencia en rescates de alto riesgo, cada desafío se convierte en una oportunidad para salvar vidas.',
      images: {
        xs: './images/bombero/bombero-entrenando-xs.jpg',
        sm: './images/bombero/bombero-entrenando-sm.jpg',
        md: './images/bombero/bombero-entrenando-md.jpg',
        lg: './images/bombero/bombero-entrenando-lg.jpg'
      },
      cards: [{
        title: 'Entrenamiento de Resistencia',
        color: 'fire',
        images: {
          xs: './images/bombero/resistencia-xs.jpg',
          sm: './images/bombero/resistencia-sm.jpg',
          md: './images/bombero/resistencia-md.jpg',
          lg: './images/bombero/resistencia-lg.jpg'
        }
      }, {
        title: 'Simulacros de Rescate',
        color: 'smoke',
        images: {
          xs: './images/bombero/rescate-xs.jpg',
          sm: './images/bombero/rescate-sm.jpg',
          md: './images/bombero/rescate-md.jpg',
          lg: './images/bombero/rescate-lg.jpg'
        }
      }, {
        title: 'Habilidades con Manguera',
        color: 'fire',
        images: {
          xs: './images/bombero/habilidades-xs.jpg',
          sm: './images/bombero/habilidades-sm.jpg',
          md: './images/bombero/habilidades-md.jpg',
          lg: './images/bombero/habilidades-lg.jpg'
        }
      }]
    };
  }

  render() {
    this.shadow.innerHTML =
      /* html */
      `
            <style>
              * {
                box-sizing: border-box;
              }

              h1, h2, h3, h4, h5, h6, p, a, span, li, label, input, button {
                font-family: "Nunito Sans", serif;
                margin: 0;
              }

              img {
                object-fit: cover;
                width: 100%;
              }

              .cards {
                align-items: center;
                background: #330000;
                border-bottom-left-radius: 2rem;
                border-bottom-right-radius: 2rem;
                display: flex;
                flex-direction: column;
                justify-content: center;
                padding: 2rem;
                position: relative;
              }

              @media (min-width: 768px) {
                .cards { padding: 2rem 10%; }
              }

              @media (min-width: 1280px) {
                .cards { padding: 2rem 20%; }
              }

              .cards-info {
                display: flex;
                flex-direction: column;
                gap: 5rem;
                padding-bottom: 5rem;
              }

              .cards-title {
                align-items: center;
                display: flex;
                position: relative;
              }

              @media (min-width: 1280px) {
                .cards-title { width: 80%; }
              }

              .cards-title-gradient h2 {
                background: linear-gradient(270deg, #ff6347, #ffdd33);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
                font-size: 5rem;
                font-weight: 700;
              }

              @media (min-width: 768px) {
                .cards-title-gradient h2 {
                  font-size: 10rem;
                  line-height: 11rem;
                }
              }

              .cards-image {
                position: absolute;
                left: 55%;
                top: 50%;
                width: 40%;
                z-index: 10;
              }

              @media (min-width: 768px) {
                .cards-image {
                  left: 60%;
                  width: 30%;
                }
              }

              @media (min-width: 1024px) {
                .cards-image {
                  left: 50%;
                  width: 30%;
                }
              }

              @media (min-width: 1280px) {
                .cards-image {
                  left: 70%;
                  top: 30%;
                  width: 30%;
                }
              }

              .cards-description p {
                color: #f0f0f0;
                font-size: 1.2rem;
                line-height: 1.5;
                font-weight: 400;
              }

              @media (min-width: 768px) {
                .cards-description p { font-size: 2rem; }
              }

              .cards-list {
                display: flex;
                flex-direction: column;
                gap: 2rem;
              }

              .card {
                border-radius: 2rem;
                display: grid;
                gap: 2rem;
                grid-template-columns: 1fr;
                padding: 2.5rem 2.5rem 0 2.5rem;
                position: relative;
                overflow: hidden;
              }

              @media (min-width: 1024px) {
                .card { grid-template-columns: 1fr 1fr; }
              }

              .card.fire {
                background: linear-gradient(135deg, #ff3300, #ff6347);
              }

              .card.smoke {
                background: linear-gradient(135deg, #444444, #222222);
              }

              .card-title {
                display: flex;
                align-items: center;
              }

              .card-title h4 {
                font-size: 2rem;
                font-weight: 800;
                line-height: 2.5rem;
                color: #ffdd33;
                text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
              }

              @media (min-width: 768px) {
                .card-title h4 {
                  font-size: 3rem;
                  line-height: 3.5rem;
                }
              }

              .card-image {
                display: flex;
                align-items: flex-end;
              }

              .card-image img {
                display: block;
                border-radius: 1rem 1rem 0 0;
              }
            </style>

            <section class="cards">
              <div class="cards-info">
                <div class="cards-title">
                  <div class="cards-title-gradient">
                    <h2>${this.data.title}</h2>
                  </div>
                  <div class="cards-image">
                    <picture>
                      <source srcset="${this.data.images.lg}" media="(min-width: 1920px)">
                      <source srcset="${this.data.images.md}" media="(min-width: 1024px)">
                      <source srcset="${this.data.images.sm}" media="(min-width: 768px)">
                      <source srcset="${this.data.images.xs}" media="(min-width: 480px)">
                      <img src="${this.data.images.xs}" alt="Imagen de bombero entrenando">
                    </picture>
                  </div>
                </div>
                <div class="cards-description">
                  <p>${this.data.description}</p>
                </div>
              </div>

              <div class="cards-list"></div>
            </section>
        `;

    const cardListContainer = this.shadow.querySelector('.cards-list');
    this.data.cards.forEach(element => {
      const cardContainer = document.createElement('div');
      cardContainer.classList.add('card', element.color);
      cardListContainer.appendChild(cardContainer);

      const cardTitleContent = document.createElement('div');
      cardTitleContent.classList.add('card-title');
      cardContainer.appendChild(cardTitleContent);

      const cardTitle = document.createElement('h4');
      cardTitle.textContent = element.title;
      cardTitleContent.appendChild(cardTitle);

      const cardImageContent = document.createElement('div');
      cardImageContent.classList.add('card-image');
      cardContainer.appendChild(cardImageContent);

      const picture = document.createElement('picture');
      cardImageContent.appendChild(picture);

      const sourceLg = document.createElement('source');
      sourceLg.srcset = element.images.lg;
      sourceLg.media = '(min-width: 1920px)';
      picture.appendChild(sourceLg);

      const sourceMd = document.createElement('source');
      sourceMd.srcset = element.images.md;
      sourceMd.media = '(min-width: 1024px)';
      picture.appendChild(sourceMd);

      const sourceSm = document.createElement('source');
      sourceSm.srcset = element.images.sm;
      sourceSm.media = '(min-width: 768px)';
      picture.appendChild(sourceSm);

      const sourceXs = document.createElement('source');
      sourceXs.srcset = element.images.xs;
      sourceXs.media = '(min-width: 480px)';
      picture.appendChild(sourceXs);

      const img = document.createElement('img');
      img.src = element.images.xs;
      img.alt = 'Imagen de bombero en entrenamiento';
      picture.appendChild(img);
    });
  }
}

customElements.define('cards-component', Cards);