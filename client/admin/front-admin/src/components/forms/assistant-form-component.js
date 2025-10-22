import isEqual from 'lodash-es/isEqual'
import { store } from '../../redux/store.js'
import { refreshTable } from '../../redux/crud-slice.js'
import { showFiles, removeFiles } from '../../redux/files-slice.js'
import '../tables/test-table-component.js'

class AssistantForm extends HTMLElement {
  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.endpoint = '/api/admin/assistants'
    this.unsubscribe = null
    this.formElementData = null
  }

  connectedCallback() {
    this.unsubscribe = store.subscribe(() => {
      const currentState = store.getState()

      if (
        currentState.crud.formElement.data &&
        currentState.crud.formElement.endPoint === this.endpoint &&
        !isEqual(this.formElementData, currentState.crud.formElement.data)
      ) {
        this.formElementData = currentState.crud.formElement.data
        this.showElement(this.formElementData)
      }
      if (!currentState.crud.formElement.data && currentState.crud.formElement.endPoint === this.endpoint) {
        this.resetForm()
      }
    })

    this.render()
  }

  render() {
    this.shadow.innerHTML = `
      <style>
        * { box-sizing: border-box; font-family: "Nunito Sans", serif; }
        button { background: transparent; border: none; cursor: pointer; }
        ul { list-style: none; margin: 0; padding: 0; }

        .form__header-box {
          display: flex; justify-content: space-between; align-items: center;
          background: linear-gradient(135deg, hsl(60,100%,85%), hsl(30,90%,75%));
          border-radius: 5px; box-shadow: 0 2px 10px rgba(255,140,0,0.3);
          padding: 5px 10px;
        }

        .form__header-icons { display: flex; gap: 10px; }
        .save-icon svg, .clean-icon svg, .load-icon svg {
          width: 30px; height: 30px; fill: hsl(0,85%,45%);
          transition: fill 0.3s ease;
        }
        .save-icon:hover svg, .clean-icon:hover svg, .load-icon:hover svg {
          fill: hsl(25,100%,40%);
        }

        .tabs { display: flex; }
        .tab {
          background: linear-gradient(135deg, hsl(30,100%,55%), hsl(0,85%,50%));
          color: white; padding: 8px 15px; cursor: pointer;
          border: 1px solid hsl(0,85%,40%);
        }
        .tab.active {
          background: linear-gradient(135deg, hsl(45,100%,50%), hsl(25,100%,40%));
        }

        .tab-content { display: none; }
        .tab-content.active {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(45%, 1fr));
          gap: 1rem; background: rgba(255,255,255,0.1);
          padding: 20px; border-radius: 10px; margin-top: 10px;
        }

        .form-element { display: flex; flex-direction: column; gap: 6px; }
        .form-element label { font-weight: 600; }
        .form-element-input input {
          width: 100%; padding: 10px; border-radius: 5px;
          border: 2px solid hsl(30,80%,60%);
        }
        .form-element-input input:focus {
          outline: none; border-color: hsl(14,100%,50%);
          box-shadow: 0 0 10px rgba(255,100,0,0.4);
        }

        .test-list { max-height: 300px; overflow-y: auto; border: 1px solid #ccc; background: white; border-radius: 8px; }
        .test-item {
          padding: 10px; border-bottom: 1px solid #eee; cursor: pointer;
          display: flex; justify-content: space-between; align-items: center;
        }
        .test-item:hover { background: #f9fafb; }
      </style>

      <section class="form">
        <div class="form__header">
          <div class="form__header-box">
            <div class="tabs">
              <div class="tab active" data-tab="general"><button>General</button></div>
              <div class="tab" data-tab="files"><button>Documentos</button></div>
              <div class="tab" data-tab="saved"><button>Tests Guardados</button></div>
            </div>
            <div class="form__header-icons">
              <button class="clean-icon" title="Limpiar formulario">🧹</button>
              <button class="save-icon" title="Generar Test">💾</button>
            </div>
          </div>
        </div>

        <div class="form__body">
          <div class="validation-errors"><ul></ul></div>
          <form>
            <input type="hidden" name="id">

            <!-- General -->
            <div class="tab-content active" data-tab="general">
              <div class="form-element">
                <label>Nombre del Asistente</label>
                <div class="form-element-input"><input type="text" name="assistantName"></div>
              </div>
              <div class="form-element">
                <label>Endpoint del Asistente</label>
                <div class="form-element-input"><input type="text" name="assistantEndpoint"></div>
              </div>
            </div>

            <!-- Documentos -->
            <div class="tab-content" data-tab="files">
              <div class="form-element">
                <label>Nombre del archivo PDF (ya existente en storage/documents/gallery)</label>
                <div class="form-element-input">
                  <input type="text" name="pdfFilename" placeholder="ejemplo.pdf">
                </div>
              </div>
              <div class="form-element">
                <label>Documentos</label>
                <div class="form-element-input">
                  <upload-file-button-component icon="documents" name="assistantDocuments" language-alias="all" quantity="multiple" file-type="documents"></upload-file-button-component>
                </div>
              </div>
            </div>

            <!-- Tests guardados -->
            <div class="tab-content" data-tab="saved">
              <div class="form-element">
                <label>Tests generados previamente</label>
                <div class="test-list"></div>
              </div>
            </div>
          </form>
        </div>
      </section>
    `
    this.renderButtons()
  }

  renderButtons() {
    this.shadow.querySelector('.form').addEventListener('click', async (event) => {
      event.preventDefault()

      // === GUARDAR / GENERAR TEST ===
      if (event.target.closest('.save-icon')) {
        console.log('💾 Guardar pulsado')

        let filename = null
        try {
          const state = store.getState()
          const files = state.files?.files || state.files?.selectedFiles || []
          if (files.length > 0) filename = files[0].filename || files[0].name
        } catch (e) {
          console.warn('⚠️ No se pudo leer Redux.files:', e)
        }

        if (!filename) filename = this.shadow.querySelector('[name="pdfFilename"]')?.value.trim() || ''
        console.log('📄 Nombre del PDF seleccionado:', filename)

        if (!filename) {
          document.dispatchEvent(new CustomEvent('notice', {
            detail: { message: 'Debes indicar el nombre del archivo PDF ya existente en storage/documents/gallery', type: 'error' }
          }))
          return
        }

        try {
          const res = await fetch('/api/admin/assistants/pdf-questions-stored', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename, save: true }) // 👈 Guardar test
          })

          if (!res.ok) throw new Error(`Error HTTP ${res.status}`)
          const data = await res.json()
          console.log('📡 Respuesta del backend:', data)

          if (data.success && data.questions) {
            // Crear el modal lateral con el test
            const oldModal = document.querySelector('.test-overlay')
            if (oldModal) oldModal.remove()

            const overlay = document.createElement('div')
            overlay.className = 'test-overlay'
            overlay.innerHTML = `
              <div class="test-modal">
                <div class="test-modal-header">
                  <span>🧠 Test generado</span>
                  <button class="close-btn">×</button>
                </div>
                <div class="test-modal-content"></div>
              </div>
            `
            document.body.appendChild(overlay)

            const container = overlay.querySelector('.test-modal-content')
            const test = document.createElement('test-component')
            test.setAttribute('data-questions', JSON.stringify(data.questions))
            container.appendChild(test)

            overlay.querySelector('.close-btn').addEventListener('click', () => overlay.remove())
            overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove() })

            if (!document.getElementById('test-modal-style')) {
              const style = document.createElement('style')
              style.id = 'test-modal-style'
              style.textContent = `
                .test-overlay {
                  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                  background: rgba(0,0,0,0.5); display: flex; justify-content: flex-end;
                  align-items: stretch; z-index: 9999;
                }
                .test-modal {
                  width: 40%; background: white; height: 100%;
                  border-radius: 10px 0 0 10px; overflow-y: auto;
                  box-shadow: -4px 0 15px rgba(0,0,0,0.2);
                  display: flex; flex-direction: column;
                  animation: slideIn .25s ease;
                }
                .test-modal-header {
                  background: #2563eb; color: white; padding: 10px 20px;
                  display: flex; justify-content: space-between; align-items: center;
                  font-weight: bold; border-radius: 10px 0 0 0;
                }
                .test-modal-content { flex: 1; overflow-y: auto; padding: 20px; background: #f9fafb; }
                .close-btn { background: transparent; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
                @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
              `
              document.head.appendChild(style)
            }

            document.dispatchEvent(new CustomEvent('notice', {
              detail: { message: 'Preguntas generadas y guardadas correctamente ✅', type: 'success' }
            }))
          } else {
            throw new Error('Respuesta sin preguntas válidas')
          }
        } catch (err) {
          console.error('❌ Error general:', err)
          document.dispatchEvent(new CustomEvent('notice', {
            detail: { message: 'Error al generar preguntas desde el PDF', type: 'error' }
          }))
        }
      }

      // === LIMPIAR ===
      if (event.target.closest('.clean-icon')) this.resetForm()

      // === CAMBIO DE TABS ===
      if (event.target.closest('.tab')) {
        const clicked = event.target.closest('.tab')
        this.shadow.querySelector('.tab.active').classList.remove('active')
        clicked.classList.add('active')
        this.shadow.querySelector('.tab-content.active').classList.remove('active')
        this.shadow.querySelector(`.tab-content[data-tab='${clicked.dataset.tab}']`).classList.add('active')

        // Si el usuario abre "Tests Guardados", los cargamos automáticamente
        if (clicked.dataset.tab === 'saved') this.loadSavedTests()
      }
    })
  }

  async loadSavedTests() {
    try {
      const res = await fetch('/api/admin/assistants/saved-tests')
      const data = await res.json()
      const list = this.shadow.querySelector('.test-list')
      list.innerHTML = ''

      if (data.tests?.length) {
        data.tests.forEach(t => {
          const div = document.createElement('div')
          div.className = 'test-item'
          div.innerHTML = `
            <span>📘 ${t.name}</span>
            <small>${(t.size / 1024).toFixed(1)} KB</small>
          `
          div.addEventListener('click', () => this.openSavedTest(t.name))
          list.appendChild(div)
        })
      } else {
        list.innerHTML = '<p>No hay tests guardados.</p>'
      }
    } catch (err) {
      console.error('❌ Error cargando tests guardados:', err)
    }
  }

  async openSavedTest(name) {
    try {
      const res = await fetch(`/api/admin/assistants/saved-tests/${name}`)
      const data = await res.json()
      if (!data.success) throw new Error('No se pudo cargar el test')

      const overlay = document.createElement('div')
      overlay.className = 'test-overlay'
      overlay.innerHTML = `
        <div class="test-modal">
          <div class="test-modal-header">
            <span>🧠 ${name}</span>
            <button class="close-btn">×</button>
          </div>
          <div class="test-modal-content"></div>
        </div>
      `
      document.body.appendChild(overlay)

      const container = overlay.querySelector('.test-modal-content')
      const test = document.createElement('test-component')
      test.setAttribute('data-questions', JSON.stringify(data.questions))
      container.appendChild(test)

      overlay.querySelector('.close-btn').addEventListener('click', () => overlay.remove())
      overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove() })
    } catch (err) {
      console.error('❌ Error abriendo test guardado:', err)
    }
  }

  showElement(data) {
    Object.entries(data).forEach(([key, value]) => {
      const input = this.shadow.querySelector(`[name="${key}"]`)
      if (input) input.value = value
      if (typeof value === 'object' && key === 'files') store.dispatch(showFiles(value))
    })
  }

  resetForm() {
    const form = this.shadow.querySelector('form')
    form.reset()
    this.shadow.querySelector('[name="id"]').value = ''
    this.formElementData = null
    store.dispatch(removeFiles())
  }
}

customElements.define('assistant-form-component', AssistantForm)
