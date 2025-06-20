class DeleteModal extends HTMLElement {
  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })

    document.addEventListener('showDeleteModal', this.showDeleteModal.bind(this))
  }

  connectedCallback () {
    this.render()
  }

  showDeleteModal (event) {
    this.shadow.querySelector('.modal-overlay').classList.add('active')
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
  
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s, visibility 0.3s;
            z-index: 1000; /* Asegura que esté por encima del resto */
        }

        .modal-overlay.active{
          opacity: 1;
          visibility: visible;
        }
  
        .modal-content {
            background: white;
            padding: 20px 30px;
            border-radius: 10px;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            color: black;
            position: relative;
        }
  
        .close-button {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 24px;
            height: 24px;
            cursor: pointer;
            padding: 2px;
            border-radius: 4px;
            transition: background-color 0.2s ease;
        }
  
        .close-button:hover {
            background-color: rgba(0, 0, 0, 0.1);
        }
  
        .close-button svg {
            width: 100%;
            height: 100%;
            fill: hsl(200, 77%, 22%);
            transition: fill 0.2s ease;
        }
  
        .close-button:hover svg {
            fill: hsl(200, 77%, 32%);
        }
  
        .modal-content h2 {
            margin-bottom: 20px;
            padding-right: 30px; /* Espacio para el botón de cerrar */
        }
  
        .modal-buttons {
            display: flex;
            justify-content: space-around;
            margin-top: 20px;
        }
  
        .modal-buttons button {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            min-width: 60px;
        }
  
        .btn-confirm {
            background-color:hsl(0, 65%, 50%);
            color: white;
        }
  
        .btn-cancel {
            background-color: hsl(0, 0%, 65%);
            color: white;
        }
  
        .btn-confirm:hover {
            background-color:hsl(0, 65%, 40%);
        }
  
        .btn-cancel:hover {
            background-color: hsl(0, 0%, 45%);
        }
     
      </style>
  
      <div class="modal-overlay">
        <div class="modal-content">
          <button class="close-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M19,3H16.3H7.7H5A2,2 0 0,0 3,5V7.7V16.4V19A2,2 0 0,0 5,21H7.7H16.4H19A2,2 0 0,0 21,19V16.3V7.7V5A2,2 0 0,0 19,3M15.6,17L12,13.4L8.4,17L7,15.6L10.6,12L7,8.4L8.4,7L12,10.6L15.6,7L17,8.4L13.4,12L17,15.6L15.6,17Z" />
            </svg>
          </button>
          <h2>¿Estás seguro de eliminar el registro?</h2>
          <div class="modal-buttons">
            <button class="btn-confirm" >Sí</button>
            <button class="btn-cancel" >No</button>
          </div>
        </div>
      </div>
      `

    this.renderButtons()
  }

  renderButtons () {
    this.shadow.querySelector('.modal-overlay').addEventListener('click', event => {
      if (event.target.closest('.btn-confirm')) {
        this.shadow.querySelector('.modal-overlay').classList.remove('active')
      }

      if (event.target.closest('.btn-cancel')) {
        this.shadow.querySelector('.modal-overlay').classList.remove('active')
      }

      if (event.target.closest('.close-button')) {
        this.shadow.querySelector('.modal-overlay').classList.remove('active')
      }
    })
  }
}

customElements.define('delete-modal-component', DeleteModal)
