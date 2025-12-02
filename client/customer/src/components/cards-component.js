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
      description: 'Reentrenate constantemente como nuestros ',
      cards: [{
        title: 'Genera test automáticamente',
        color: 'fire'
      }, {
        title: 'Genera Flashcards',
        color: 'fire'
      }, {
        title: 'Reentrena',
        color: 'smoke'
      }]
    };
  }

  render() {
    this.shadow.innerHTML =
      /* html */
      `
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

              * { box-sizing: border-box; margin: 0; padding: 0 }
              :host { display:block }
              h1,h2,h3,h4,h5,h6,p,a,span,li,label,input,button { font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Nunito Sans', sans-serif }

              .cards { display:flex; flex-direction:column; align-items:center; gap:2.25rem; padding:3.5rem 1.25rem; position:relative; background: transparent; border-radius: 0; box-shadow: none }
              .section-overlay{ display:none }
              .cards-info, .cards-list{ position:relative; z-index:2; width:100%; max-width:var(--max-width,1200px) }

              @media(min-width:768px){ .cards{ padding:3.5rem 8% } }
              @media(min-width:1280px){ .cards{ padding:4rem 12% } }

              .cards-info { display:flex; flex-direction:column; gap:1.25rem; text-align:center }
              .cards-title h2 { background: linear-gradient(90deg,var(--accent,#ff6b2d),var(--accent-600,#e85a27)); -webkit-background-clip:text; background-clip:text; color:transparent; font-weight:800; font-size:clamp(1.4rem,4vw,2.6rem); letter-spacing:0.06em }
              .cards-description p { color:var(--muted); font-size:clamp(.95rem,2.2vw,1.05rem); line-height:1.6 }

              .cards-list { display:flex; flex-wrap:wrap; gap:1.25rem; justify-content:center; align-items:stretch }
              .card { border-radius:16px; padding:1.6rem; text-align:center; flex:0 1 320px; max-width:360px; background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)), rgba(8,12,16,0.28); color:var(--text); box-shadow: 0 12px 30px rgba(2,6,10,0.28); transition:transform .28s var(--ease), box-shadow .28s var(--ease) }
              .card:hover { transform: translateY(-8px); box-shadow:0 22px 44px rgba(2,6,10,0.5) }

              .card.fire { background: linear-gradient(135deg, rgba(255,98,46,0.12), rgba(255,122,63,0.08)), linear-gradient(135deg,var(--accent,#ff6b2d),#ff7a4d) }
              .card.smoke { background: linear-gradient(135deg, rgba(0,0,0,0.2), rgba(0,0,0,0.12)), linear-gradient(135deg,#3b3b3b,#222) }

              .card-title { color: var(--text); font-size:1rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em }
            </style>

            <section class="cards">
              <div class="section-overlay" aria-hidden="true"></div>
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