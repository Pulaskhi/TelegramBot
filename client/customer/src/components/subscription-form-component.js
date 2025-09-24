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
        /* Fondo con gradiente oscuro para que coincida con el tema de fuego */
        background-image: linear-gradient(135deg, #330000 0%, #1a0000 100%);
        display: grid;
        gap: 2rem;
        grid-template-columns: 1fr;
        min-height: 100vh;
        padding: 3rem 1rem;
      }

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
        gap: 2rem;
      }

      @media (min-width: 1280px) {
        .explanation {
          align-items: flex-start;
          text-align: left;
        }
      }

      .explanation-title h3 {
        color: #ffdd33; /* Amarillo para el título */
        font-size: 2rem;
        font-weight: 800;
        text-align: center;
        text-shadow: 0 0 10px rgba(255, 221, 51, 0.5); /* Sombra para efecto de brillo */
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
        color: #ddd; /* Gris claro para el texto de información */
        font-size: 1.2rem;
        font-weight: 600;
        line-height: 2rem;
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
        /* Estilo de "chip" de fuego */
        background-color: rgba(255, 69, 0, 0.2); 
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 69, 0, 0.4);
        border-radius: 9999px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
        padding: 0.5rem 1.5rem;
        width: max-content;
      }

      .explanation-featured span{
        color: #ffdd33; /* Texto amarillo */
        font-size: 1rem;
        font-weight: 600;
      }

      @media (min-width: 768px) {
        .explanation-featured span {
          font-size: 1.2rem;
        }
      }

      .form-container {
        background-color: white;
        border-radius: 1.5rem;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        display: flex;
        flex-direction: column;
        gap: 2rem;
        padding: 3rem;
        width: 100%;
        margin: auto;
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
        color: #333;
        font-size: 1.5rem;
        font-weight: 800;
      }

      @media (min-width: 768px) {
        .info-area-title h4 {
          font-size: 2rem;
        }
      }

      .info-area-subtitle span {
        color: #888;
        font-size: 0.9rem;
        font-weight: 600;
      }

      @media (min-width: 768px) {
        .info-area-subtitle span {
          font-size: 1.2rem;
        }
      }

      .info-area-icon svg {
        animation: top-bottom 2s infinite;
        width: 5rem;
        /* Nuevo color de fuego para el icono */
        fill: #ff4500;
      }

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
        border: 2px solid #ddd;
        border-radius: 0.75rem;
        font-size: 1rem;
        outline: none;
        padding: 1rem;
        width: 100%;
        transition: border-color 0.3s ease;
      }

      .form-element-input input:hover,
      .form-element-input input:focus {
        border-color: #ff6347; /* Borde de color de fuego al pasar el cursor */
      }

      .form-element-button button{
        /* Estilos de botón de fuego */
        background-color: #ff4500;
        border-radius: 0.75rem;
        color: white;
        font-size: 1.2rem;
        font-weight: 600;
        padding: 1rem;
        width: 100%;
        transition: background-color 0.3s ease, transform 0.1s ease;
      }

      .form-element-button button:hover{
        background-color: #ff6347;
      }

      .form-element-button button:active {
        transform: scale(0.98);
      }
    
    </style>

    <section class="subscription-form">
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
          <form>
            <div class="form-element">
              <div class="form-element-input">
                <input type="text" placeholder="Dirección de correo">
              </div>
            </div>
            <div class="form-element-button">
              <button>${this.data.formElementButton}</button>
            </div>
          </form>
        </div>
      </div>
    </section>
    `
  }
}

customElements.define('subscription-form-component', SubscriptionForm)
