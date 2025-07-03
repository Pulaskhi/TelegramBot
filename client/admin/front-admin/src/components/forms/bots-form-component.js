import isEqual from 'lodash-es/isEqual'
import { store } from '../../redux/store.js'
import { refreshTable } from '../../redux/crud-slice.js'

class BotsForm extends HTMLElement {
    constructor () {
      super()
      this.shadow = this.attachShadow({ mode: 'open' })
      this.endpoint = '/api/admin/bots'
      this.unsubscribe = null
      this.formElementData = null
    }
  
    connectedCallback () {
        this.unsubscribe = store.subscribe(() => {
          const currentState = store.getState()
    
          if (currentState.crud.formElement.data && currentState.crud.formElement.endPoint === this.endpoint && !isEqual(this.formElementData, currentState.crud.formElement.data)) {
            this.formElementData = currentState.crud.formElement.data
            this.showElement(this.formElementData)
          }
          if (!currentState.crud.formElement.data && currentState.crud.formElement.endPoint === this.endpoint) {
            this.resetForm()
          }
        })
    
        this.render()
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
  
        ul{
          list-style-type: none;
          margin: 0;
          padding: 0;
        }
  
        .form__header-box{
          display: flex;
          justify-content: space-between; /* Alinea los elementos a los extremos */
          align-items: center;
          background: hsl(198, 100%, 85%);
          border-radius: 5px;
  
        }
  
        .form__header-box-filter.active{
          background: hsl(198, 74.20%, 6.10%);
          padding: 5px 10px;
          color: white; /* Asegura que el texto sea visible */
          height: 30px;
          border-radius: 5px 0 0 5px;
  
        }
        .form__header-box-filter{
          background: hsl(200, 77%, 42%);
          padding: 5px 10px;
          color: white; /* Asegura que el texto sea visible */
          height: 30px;
          border-radius: 5px 0 0 5px;
  
        }
  
        .form__header-box-filter button {
          color: white; /* Asegura que el texto sea visible */
          font-size: 16px;
        }
  
        .form__header-icons {
          display: flex;
          gap: 10px; /* Espacio entre los iconos */
          margin-right: 5px;
        }
  
        .table__header__icon svg,
        .edit-icon svg,
        .delete-icon svg,
        .clean-icon,
        .save-icon {
          width: 30px;
          height: 30px;
          fill: black;
        }
  
  
        /* Ajustar cada elemento del formulario */
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
  
        .tabs{
          display:flex;
          align-items: center;
        }

        .tab{
          background: hsl(200, 77%, 42%);
          cursor: pointer;
          padding: 5px 10px;
          color: white; 
          height: 30px;
        }

        .tab:first-child{
          border-radius: 5px 0 0 5px;
        }

        .tab button{
          color: white; 
        }

        .tab.active{
          background: hsl(198, 74.20%, 6.10%);
          color: white; 
        }

        .tab-content{
          display: none;
        }

        .tab-content.active{
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(20%, 1fr));
          gap:1rem;
        }
        
        .validation-errors.active{
          background: hsl(0, 96.80%, 75.50%);
          border-radius: 5px;
          display: block;
          margin: 1rem 0;
          padding: 1rem;
          position: relative;
        }

        .validation-errors{
          display: none;
        }

        .close-validation-errors{
          position: absolute;
          right: 0.5rem;
          top: 0.5rem;
        }

        .close-validation-errors svg{
          fill: hsl(100, 100%, 100%);
          height: 2rem;
          width: 2rem;
        }
     
      </style>
  
      <section class="form">
        <div class="form__header">
          <div class="form__header-box">
          <div class="tabs">
              <div class="tab active" data-tab="general">
                <button>General</button>
              </div>
            </div class="tabs">
            <div class="form__header-icons">
              <button class="clean-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <title>eraser</title>
                  <path
                    d="M16.24,3.56L21.19,8.5C21.97,9.29 21.97,10.55 21.19,11.34L12,20.53C10.44,22.09 7.91,22.09 6.34,20.53L2.81,17C2.03,16.21 2.03,14.95 2.81,14.16L13.41,3.56C14.2,2.78 15.46,2.78 16.24,3.56M4.22,15.58L7.76,19.11C8.54,19.9 9.8,19.9 10.59,19.11L14.12,15.58L9.17,10.63L4.22,15.58Z" />
                </svg>
              </button>
              <button class="save-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <title>content-save</title>
                  <path
                    d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div class="form__body">
          <div class="validation-errors">
            <ul></ul>
            <div class="close-validation-errors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>close-circle-outline</title><path d="M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2C6.47,2 2,6.47 2,12C2,17.53 6.47,22 12,22C17.53,22 22,17.53 22,12C22,6.47 17.53,2 12,2M14.59,8L12,10.59L9.41,8L8,9.41L10.59,12L8,14.59L9.41,16L12,13.41L14.59,16L16,14.59L13.41,12L16,9.41L14.59,8Z" /></svg>
            </div>
          </div>
          <form>
            <input type="hidden" name="id">
            <div class="tab-content active" data-tab="general">
            <div class="form-element">
              <div class="form-title">
                <span>Nombre</span>
              </div>
              <div class="form-element-input">
                <input type="text" placeholder="" name="name">
              </div>
            </div>
            <div class="form-element">
              <div class="form-title">
                <span>Plataforma</span>
              </div>
              <div class="form-element-input">
                <input type="text" placeholder="" name="platform">
              </div>
            </div>
            <div class="form-element">
              <div class="form-title">
                <span>Token</span>
              </div>
              <div class="form-element-input">
                <input type="text" placeholder="" name="token">
              </div>
            </div>
            <div class="form-element">
              <div class="form-title">
                <span>Description</span>
              </div>
              <div class="form-element-input">
                <input type="text" placeholder="" name="description">
              </div>
            </div>
          </div>
            <div class="tab-content" data-tab="images">
              <div class="form-element">
                <div class="form-title">
                  <span>Avatar</span>
                </div>
                <div class="form-element-input">
                  <input type="image" name="avatar">
                </div>
              </div>
            </div>
           
          </form>
        </div>
      </section>
      
      `
      // Se llama a la función para el botón de guardar
      this.renderButtons()
    }
  
    renderButtons () {
      const SaveButton = this.shadow.querySelector('.save-icon')
  
      // async porque se hace un await para una llamada fetch
      this.shadow.querySelector('.form').addEventListener('click', async event => {
        // Prevenir que no se pasen los datos de los campo a través de la url.
        event.preventDefault()

        if(event.target.closest('.save-icon')){
          const form = this.shadow.querySelector('form')
          // Coge todos los valores de los inputs del formulario y te los prepara.
          const formData = new FormData(form)
          const formDataJson = {}
    
          for (const [key, value] of formData.entries()) {
            formDataJson[key] = value !== '' ? value : null
          }
          const id = this.shadow.querySelector('[name="id"]').value
          const endpoint = id ? `${this.endpoint}/${id}` : this.endpoint
          const method = id ? 'PUT' : 'POST'
          delete formDataJson.id
          try {
           
            const response = await fetch(endpoint, {
              method,
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(formDataJson)
            })
    
            if (!response.ok) {
              throw response
            }
  
            store.dispatch(refreshTable(this.endpoint))
            this.resetForm()
            // const data = await response.json()
    
            document.dispatchEvent(new CustomEvent('notice', {
              detail: {
                message: 'Datos guardados correctamente',
                type: 'success'
              }
    
            }))
          } catch (error) {
            if (error.status === 422) {
              const data = await error.json()
              this.showValidationErrors(data.message)
            }
  
            if (error.status === 500) {
              document.dispatchEvent(new CustomEvent('notice', {
                detail: {
                  message: 'No se han podido guardar los datos',
                  type: 'error'
                }
              }))
            }
          }
        }
  
        if(event.target.closest('.clean-icon')){
          this.resetForm()
        }

        if(event.target.closest('.tab')){
          const clickedTab = event.target.closest('.tab')

          this.shadow.querySelector('.tab.active').classList.remove('active')
          clickedTab.classList.add('active')

          this.shadow.querySelector('.tab-content.active').classList.remove('active')
          this.shadow.querySelector(`.tab-content[data-tab='${clickedTab.dataset.tab}']`).classList.add('active')
        }

        if(event.target.closest('.close-validation-errors')){
          this.hideValidationErrors()
        }
      })
    }


		showElement (data) {
			Object.entries(data).forEach(([key, value]) => {
				if (this.shadow.querySelector(`[name="${key}"]`)) {
					this.shadow.querySelector(`[name="${key}"]`).value = value
				}
			})
		}

    showValidationErrors (messages) {

      const errorlist = this.shadow.querySelector('.validation-errors ul')
      errorlist.innerHTML = '' // Limpiar errores anteriores si hay


      messages.forEach(error => {
        const li = document.createElement('li'); 
        li.textContent = error.message;          
        errorlist.appendChild(li);                      
      });
      
      const container = this.shadow.querySelector('.validation-errors')
      container.classList.add('active')
    }

    hideValidationErrors(){
      this.shadow.querySelector('.validation-errors').remove('active')
    }
	
		resetForm () {
			const form = this.shadow.querySelector('form')
			form.reset()
			this.shadow.querySelector('[name="id"]').value = ''
			this.formElementData = null
      this.hideValidationErrors()
		}

  }
  
  customElements.define('bots-form-component', BotsForm)
  