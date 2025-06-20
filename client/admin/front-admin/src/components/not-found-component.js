class NotFound extends HTMLElement {
  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.data = {}
    
    document.addEventListener('notice', this.handleMessage.bind(this))
  }

  async connectedCallback () {
    await this.loadData()
    await this.render()
  }

  loadData () {
    this.data = {
      code: '404',
      title: 'Página no encontrada',
      description: 'Lo sentimos, la página que buscas no existe o ha sido movida',
      buttonText: 'Volver a inicio'
    }
  }

  render () {
    this.shadow.innerHTML =
      /* html */`
        <style>
         
        *{
          box-sizing: border-box;
        }

        h1, h2, h3, h4, h5, h6, p{
          margin: 0;
        }

        h1, h2, h3, h4, h5, h6, p, a, span, li, label, input, button{
          font-family: "Nunito Sans", serif;
          font-optical-sizing: auto;
        }

        button{
          background-color: transparent;
          border: none;
          cursor: pointer;
          outline: none;
          padding: 0;
        }
    
        .wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          <!-- color: white; -->
        }
   
        .container {
          text-align: center;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          max-width: 600px;
          width: 90%;
        }
  
        .error-code {
          font-size: 8rem;
          font-weight: bold;
          margin-bottom: 1rem;
          opacity: 0.8;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
  
        .title {
          font-size: 3rem;
          font-weight: bold;
          margin-bottom: 1rem;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        }
  
        .subtitle {
          font-size: 2rem;
          margin-bottom: 2rem;
          opacity: 0.9;
          line-height: 1.6;
          color:hsl(0, 0.00%, 100.00%);
        }
  
        .btn-home {
          display: inline-block;
          padding: 1rem 2rem;
          background: hsl(229, 66%, 30%);
          text-decoration: none;
          border-radius: 50px;
          font-size: 2rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
          letter-spacing: 1px;
          color: white;
  
        }
  
  
        .btn-home:hover {
          
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
  
        @media (max-width: 768px) {
            .error-code {
              font-size: 6rem;
            }
            
            .title {
              font-size: 2rem;
            }
            
            .subtitle {
              font-size: 1rem;
            }
            
            .container {
              margin: 1rem;
              padding: 1.5rem;
          }
        }
        
        </style>
  
        <div class="wrapper">
          <div class="container">
            <div class="error-code">${this.data.code}</div>
            <h1 class="title">${this.data.title}</h1>
            <p class="subtitle">${this.data.description}</p>
            <a href="http://dev-youthing.com/" class="btn-home">${this.data.buttonText}</a>
          </div>
        </div>
        
    
        `
  }
}

customElements.define('not-found-component', NotFound)
