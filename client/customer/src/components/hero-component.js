class Hero extends HTMLElement {
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
      title: 'Prepárate para la oposición de Bombero',
      description: 'Entrena tus habilidades físicas y teóricas con nuestro asistente digital. ¡Salva vidas y domina el fuego!',
      buttonText: 'Comenzar preparación'
    }
  }

  render () {
    this.shadow.innerHTML = /* html */`
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:opsz,wght@6..12,200..1000&display=swap');
      * { box-sizing: border-box; margin:0; padding:0; font-family: "Nunito Sans", serif; }

      h1,h2,h3,h4,h5,h6,p{margin:0;}
      button{cursor:pointer; outline:none; border:none;}

      .hero{
        background: linear-gradient(to bottom, #1a1a1a, #330000);
        height: 100vh;
        max-height: 100vh;
        position: relative;
        overflow: hidden;
      }

      .hero-info{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 2rem;
        padding: 2rem;
        position: absolute;
        top: 5%;
        width: 100%;
        text-align:center;
        z-index:10;
      }

      .hero-title h1{
        font-size: 3rem;
        font-weight: 900;
        color: #ffdd33;
        text-shadow: 3px 3px 15px rgba(0,0,0,0.7);
      }

      .hero-description p{
        color: #fff5e6;
        font-size: 1.5rem;
        line-height: 1.8;
        text-shadow: 2px 2px 10px rgba(0,0,0,0.5);
      }

      .hero-button button{
        background: linear-gradient(135deg, #ff4500, #ff6347);
        border-radius: 2rem;
        color:white;
        font-size: 1.4rem;
        font-weight:700;
        padding:1rem 2rem;
        box-shadow:0 10px 25px rgba(0,0,0,0.6);
        transition: all 0.3s ease;
      }

      .hero-button button:hover{
        transform: translateY(-5px) scale(1.05);
        box-shadow:0 15px 35px rgba(0,0,0,0.7);
      }

      .hero-center{
        position:absolute;
        bottom:10%;
        left:50%;
        transform:translateX(-50%) rotate(-10deg);
        width:150px;
        animation: float 3s ease-in-out infinite alternate;
        z-index:5;
      }

      @keyframes float{
        0% { transform: translateX(-50%) rotate(-10deg) translateY(0);}
        50% { transform: translateX(-50%) rotate(-10deg) translateY(-20px);}
        100% { transform: translateX(-50%) rotate(-10deg) translateY(0);}
      }

      .flames{
        position:absolute;
        bottom:120px; 
        left:0;
        width:100%;
        height:50%; 
        overflow:hidden;
        z-index:2;
      }

      .flame{
        position:absolute;
        bottom:0;
        width:50px;
        height:80px;
        background: radial-gradient(circle at bottom,hsl(16, 100%, 50%), #ffdd33, transparent 90%);
        border-radius: 50% 50% 20% 20%;
        animation: flame-rise linear infinite;
        opacity:0.7;
      }

      .flame:nth-child(1){ left:10%; animation-duration:2.5s; animation-delay:0s;}
      .flame:nth-child(2){ left:25%; animation-duration:3s; animation-delay:0.3s;}
      .flame:nth-child(3){ left:40%; animation-duration:2.8s; animation-delay:0.6s;}
      .flame:nth-child(4){ left:60%; animation-duration:3s; animation-delay:0.2s;}
      .flame:nth-child(5){ left:75%; animation-duration:2.5s; animation-delay:0.5s;}
      .flame:nth-child(6){ left:85%; animation-duration:2.8s; animation-delay:0.4s;}

      @keyframes flame-rise{
        0% { transform: scaleY(1) translateY(0) rotate(0deg); opacity:0.7;}
        50% { transform: scaleY(1.1) translateY(-15px) rotate(1deg); opacity:0.9;}
        100% { transform: scaleY(1) translateY(-25px) rotate(-1deg); opacity:0;}
      }

      .hero-footer{
        position:absolute;
        bottom:0;
        width:100%;
        z-index:1;
      }

      .hero-footer-background-waves svg{
        display:block; 
        width:100%;
        height:250px; 
        filter: drop-shadow(0 0 10px rgba(255, 69, 0, 0.8));
      }

      .footer-flame path {
        animation: flame-move 3s ease-in-out infinite alternate;
      }
      .footer-flame path:nth-child(2){ animation-delay: 0.5s; }
      .footer-flame path:nth-child(3){ animation-delay: 1s; }
      .footer-flame path:nth-child(4){ animation-delay: 1.5s; }

      @keyframes flame-move {
        0% { transform: translateY(0); opacity:0.8;}
        50% { transform: translateY(-20px); opacity:1;}
        100% { transform: translateY(0); opacity:0.8;}
      }

    </style>

    <section class="hero">
      <div class="hero-info">
        <div class="hero-title"><h1>${this.data.title}</h1></div>
        <div class="hero-description"><p>${this.data.description}</p></div>
        <div class="hero-button"><button>${this.data.buttonText}</button></div>
      </div>

    
      
      <div class="hero-footer">
        <div class="hero-footer-background-waves footer-flame">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
            <!-- Capa de llama 1: más naranja -->
            <path d="M0,320 C100,200 150,150 240,240 C350,300 450,150 540,240 C650,300 750,150 840,240 C950,300 1050,150 1140,240 C1250,300 1350,220 1440,280 L1440,320 L0,320Z" fill="#ff4500"></path>
            <!-- Capa de llama 2: más roja -->
            <path d="M0,320 C100,180 200,100 300,200 C400,260 500,100 600,200 C700,260 800,100 900,200 C1000,260 1100,100 1200,200 C1300,260 1400,180 1440,240 L1440,320 L0,320Z" fill="#ff6347" opacity="0.8"></path>
            <!-- Capa de llama 3: más amarilla -->
            <path d="M0,320 C120,160 240,80 360,200 C480,260 600,80 720,200 C840,260 960,80 1080,200 C1200,260 1320,80 1440,200 L1440,320 L0,320Z" fill="#ffdd33" opacity="0.7"></path>
            <!-- Capa de llama 4: base roja -->
            <path d="M0,320 C150,150 300,60 450,180 C600,240 750,60 900,180 C1050,240 1200,60 1350,180 L1440,320 L0,320Z" fill="#ff4500" opacity="0.6"></path>
          </svg>
        </div>
      </div>
    </section>
    `
  }
}

customElements.define('hero-component', Hero)