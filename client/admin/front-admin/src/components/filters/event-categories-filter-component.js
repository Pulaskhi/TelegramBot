import { store } from '../../redux/store.js'
import { setFilterQuery } from '../../redux/crud-slice.js'

class EventCategoryFilter extends HTMLElement {
  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.endpoint = '/api/admin/event-categories'
    document.addEventListener('showFilterModal', this.showFilterModal.bind(this))
  }

  connectedCallback () {
    this.render()
  }

  showFilterModal (event) {
    if(event.detail.endpoint === this.endpoint ){
      this.shadow.querySelector('.modal-overlay').classList.add('active')
    }
  }

  render () {
    this.shadow.innerHTML = /* html */`
      <style>
        * { box-sizing: border-box; }
        h1, h2, h3, h4, h5, h6, p { margin: 0; }
        h1, h2, h3, h4, h5, h6, p, a, span, li, label, input, button {
          font-family: "Nunito Sans", serif;
        }

        button {
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
          z-index: 1000;
        }

        .modal-overlay.active {
          opacity: 1;
          visibility: visible;
        }

        .modal-content {
          background: white;
          padding: 20px 30px;
          border-radius: 10px;
          text-align: center;
          max-width: 400px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
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
          padding-right: 30px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
          text-align: left;
        }

        .form-group label {
          font-weight: bold;
        }

        .form-group input {
          padding: 8px;
          border-radius: 5px;
          border: 1px solid #ccc;
          font-size: 14px;
          width: 100%;
        }

        .form-element {
          flex: 1;
          display:flex;
          flex-direction: column;
          gap: 10px 0px;
          margin: 10px 0;
        }
    
        .form-element-input input {
          width: 100%;
          padding: 10px;
          border-radius: 5px;
          box-sizing: border-box;
          border: none;
          background: white;
          color: black;
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
          background-color: hsl(0, 65%, 50%);
          color: white;
        }

        .btn-cancel {
          background-color: hsl(0, 0%, 65%);
          color: white;
        }

        .btn-confirm:hover {
          background-color: hsl(0, 65%, 40%);
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
          <h2>¿Qué quieres filtrar?</h2>

          <div class="form-group">
            <form>
              <div class="form-element">
                <div class="form-title">
                  <span>Nombre</span>
                </div>
                <div class="form-element-input">
                  <input type="text" placeholder="" name="name">
                </div>
              </div>
            </form>
          </div>

          <div class="modal-buttons">
            <button class="btn-confirm">Aceptar</button>
            <button class="btn-cancel">Cancelar</button>
          </div>
        </div>
      </div>
    `

    this.renderButtons()
  }

  renderButtons () {
    const overlay = this.shadow.querySelector('.modal-overlay')

    const confirmBtn = this.shadow.querySelector('.btn-confirm')
    const cancelBtn = this.shadow.querySelector('.btn-cancel')
    const closeBtn = this.shadow.querySelector('.close-button')

    confirmBtn.addEventListener('click', async () => {
      const form = this.shadow.querySelector('form')
      const formData = new FormData(form)
      const formDataJson = {}

      for (const [key, value] of formData.entries()) {
        formDataJson[key] = value !== '' ? value : null
      }
      const query = Object.entries(formDataJson).map(([key, value]) => `${key}=${value}`).join('&')

      const filterQuery = {
        endPoint: this.endpoint,
        query
      }

      store.dispatch(setFilterQuery(filterQuery))
      overlay.classList.remove('active')
    })

    cancelBtn.addEventListener('click', () => {

      const form = this.shadow.querySelector('form')
      form.reset()

      const formData = new FormData(form)
      const formDataJson = {}

      for (const [key, value] of formData.entries()) {
        formDataJson[key] = value !== '' ? value : null
      }

      const query = Object.entries(formDataJson).map(([key, value]) => `${key}=${value}`).join('&')

      const filterQuery = {
        endPoint: this.endpoint,
        query
      }

      store.dispatch(setFilterQuery(filterQuery))

      overlay.classList.remove('active')

    })

    closeBtn.addEventListener('click', () => {
      overlay.classList.remove('active')
    })
  }
}

customElements.define('event-categories-filter-component', EventCategoryFilter)
