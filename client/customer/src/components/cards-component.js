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
      cards: [{
        title: 'Entrenamiento de Resistencia',
        color: 'fire'
      }, {
        title: 'Simulacros de Rescate',
        color: 'smoke'
      }, {
        title: 'Habilidades con Manguera',
        color: 'fire'
      }]
    };
  }

  render() {
    this.shadow.innerHTML =
      /* html */
      `
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:opsz,wght@6..12,200..1000&display=swap');

              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }

              h1, h2, h3, h4, h5, h6, p, a, span, li, label, input, button {
                font-family: "Nunito Sans", serif;
                margin: 0;
              }

              .cards {
                align-items: center;
                background: #330000;
                display: flex;
                flex-direction: column;
                justify-content: center;
                padding: 4rem 2rem;
              }
              
              @media (min-width: 768px) {
                .cards { 
                  padding: 4rem 10%; 
                }
              }

              @media (min-width: 1280px) {
                .cards { 
                  padding: 4rem 20%; 
                }
              }
              
              .cards-info {
                display: flex;
                flex-direction: column;
                gap: 5rem;
                padding-bottom: 5rem;
                text-align: center;
              }
              
              .cards-title h2 {
                background: linear-gradient(270deg, #ff6347, #ffdd33);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
                font-size: 3rem;
                font-weight: 700;
                line-height: 1.2;
              }
              
              @media (min-width: 768px) {
                .cards-title h2 {
                  font-size: 5rem;
                }
              }

              .cards-description p {
                color: #f0f0f0;
                font-size: 1.2rem;
                line-height: 1.5;
                font-weight: 400;
                text-shadow: 2px 2px 10px rgba(0,0,0,0.5);
              }

              @media (min-width: 768px) {
                .cards-description p { 
                  font-size: 2rem; 
                }
              }

              .cards-list {
                display: flex;
                flex-wrap: wrap; 
                gap: 2rem;
                width: 100%;
                justify-content: center;
              }

              @media (min-width: 1024px) {
                .cards-list {
                  flex-direction: row;
                }
              }

              .card {
                border-radius: 2rem;
                padding: 2.5rem;
                text-align: center;
                flex: 1;
                /* Propiedades para controlar el desbordamiento de texto */
                word-wrap: break-word; 
                overflow-wrap: break-word;
                /* Establecer un ancho máximo para que no se extienda demasiado */
                max-width: 350px; 
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
              }

              .card:hover {
                transform: translateY(-10px);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
              }

              .card.fire {
                background: linear-gradient(135deg, #ff3300, #ff6347);
              }

              .card.smoke {
                background: linear-gradient(135deg, #444444, #222222);
              }

              .card-title {
                color: #ffdd33;
                font-size: 2rem;
                font-weight: 800;
                line-height: 1.2;
                text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
              }
              
              @media (min-width: 768px) {
                .card-title {
                  font-size: 1rem;
                }
              }
            </style>

            <section class="cards">
              <div class="cards-info">
                <div class="cards-title">
                  <h2>${this.data.title}</h2>
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

      const cardTitle = document.createElement('h4');
      cardTitle.classList.add('card-title');
      cardTitle.textContent = element.title;
      cardContainer.appendChild(cardTitle);
    });
  }
}

customElements.define('cards-component', Cards);