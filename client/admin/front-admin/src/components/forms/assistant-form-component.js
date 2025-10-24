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
      * { box-sizing: border-box; font-family: 'Inter','Nunito Sans',sans-serif; }
      button { background: transparent; border: none; cursor: pointer; }
      .form { display:flex; flex-direction:column; gap:1rem; background:#f9fafb; border-radius:12px; box-shadow:0 0 20px rgba(0,0,0,0.05); padding:20px; }
      .form__header-box {
        display:flex; justify-content:space-between; align-items:center;
        background:linear-gradient(90deg,#2563eb,#4f46e5); color:#fff;
        border-radius:10px; padding:10px 20px; box-shadow:0 2px 10px rgba(37,99,235,0.3);
      }
      .tabs { display:flex; gap:10px; }
      .tab button { font-weight:600; background:transparent; color:#fff; padding:8px 15px; border-radius:6px; }
      .tab.active button { background:rgba(255,255,255,0.2); box-shadow:inset 0 2px 4px rgba(255,255,255,0.2); }
      .form__header-icons { display:flex; gap:12px; }
      .form__header-icons button { font-size:1.2rem; background:rgba(255,255,255,0.15);
        color:#fff; border-radius:50%; width:40px; height:40px;
        display:flex; justify-content:center; align-items:center; }
      .form__header-icons button:hover { background:rgba(255,255,255,0.35); transform:scale(1.05); }
      .form__body { background:#fff; border-radius:10px; padding:20px; box-shadow:inset 0 0 5px rgba(0,0,0,0.05); }
      .tab-content { display:none; }
      .tab-content.active { display:block; }
      .form-element { display:flex; flex-direction:column; margin-bottom:1rem; }
      .form-element label { font-weight:600; color:#374151; margin-bottom:6px; }
      .form-element-input input { padding:10px 12px; border:2px solid #e5e7eb; border-radius:8px; background:#f9fafb; font-size:0.95rem; }
      .form-element-input input:focus { outline:none; border-color:#2563eb; box-shadow:0 0 6px rgba(37,99,235,0.3); background:#fff; }
      .test-list { border:1px solid #e5e7eb; border-radius:8px; background:#fff; overflow-y:auto; max-height:360px; padding:8px; }
      .tema-header { font-weight:700; background:#1e40af; color:#fff; padding:10px 12px;
        border-radius:8px; margin:8px 4px 6px; cursor:pointer; display:flex; align-items:center; gap:8px; }
      .tema-header .caret { transition:transform .2s ease; }
      .tema-header.open .caret { transform:rotate(90deg); }
      .tema-inner { margin:6px 0 12px 10px; display:none; }
      .test-item { display:flex; justify-content:space-between; align-items:center;
        padding:10px 12px; border:1px solid #f3f4f6; border-radius:8px; cursor:pointer; margin:6px 2px;
        background:#f9fafb; }
      .test-item:hover { background:#eff6ff; transform:translateX(3px); }
      .test-item span { font-weight:600; color:#1e3a8a; }
      .test-item small { color:#6b7280; font-size:0.85rem; }
      .test-overlay { position:fixed; inset:0; background:rgba(17,24,39,0.6);
        display:flex; justify-content:flex-end; align-items:stretch; z-index:9999; backdrop-filter:blur(2px);
        animation:fadeIn .2s ease; }
      .test-modal { width:45%; background:#fff; border-radius:16px 0 0 16px; overflow-y:auto;
        display:flex; flex-direction:column; box-shadow:-6px 0 16px rgba(0,0,0,0.15); animation:slideIn .25s ease; }
      .test-modal-header { background:linear-gradient(90deg,#2563eb,#4f46e5); color:#fff; padding:16px 20px;
        display:flex; justify-content:space-between; align-items:center; font-weight:600; border-radius:16px 0 0 0; }
      .test-modal-content { flex:1; padding:20px; background:#f9fafb; }
      .close-btn { background:transparent; border:none; color:#fff; font-size:1.6rem; cursor:pointer; }
      .close-btn:hover { color:#fbbf24; transform:scale(1.05); }
      @keyframes slideIn { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
      @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
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
          <form>
            <input type="hidden" name="id">
            <div class="tab-content active" data-tab="general">
              <div class="form-element"><label>Tema</label><div class="form-element-input"><input type="text" name="assistantName"></div></div>
              <div class="form-element"><label>Subtema</label><div class="form-element-input"><input type="text" name="assistantEndpoint"></div></div>
            </div>
            <div class="tab-content" data-tab="files">
              <div class="form-element"><label>Nombre del archivo PDF</label><div class="form-element-input"><input type="text" name="pdfFilename" placeholder="ejemplo.pdf"></div></div>
              <div class="form-element"><label>Documentos</label><div class="form-element-input"><upload-file-button-component icon="documents" name="assistantDocuments" language-alias="all" quantity="multiple" file-type="documents"></upload-file-button-component></div></div>
            </div>
            <div class="tab-content" data-tab="saved">
              <div class="form-element"><label>Tests generados previamente</label><div class="test-list"></div></div>
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
      if (event.target.closest('.save-icon')) {
        let filename = null
        const state = store.getState()
        const files = state.files?.files || state.files?.selectedFiles || []
        if (files.length > 0) filename = files[0].filename || files[0].name
        if (!filename) filename = this.shadow.querySelector('[name="pdfFilename"]')?.value.trim() || ''
        if (!filename) {
          document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'Debes indicar el nombre del PDF', type: 'error' } }))
          return
        }
        try {
          const res = await fetch('/api/admin/assistants/pdf-questions-stored', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename, save: true })
          })
          if (!res.ok) throw new Error(`Error HTTP ${res.status}`)
          const data = await res.json()
          if (data.success && data.questions) {
            const tema = filename.match(/TEMA[-_\s]?(\d+)/i)?.[0] || 'SIN_TEMA'
            this.showTestModal('🧠 Test generado', data.questions, tema, filename)
            document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'Preguntas generadas correctamente ✅', type: 'success' } }))
            const activeTab = this.shadow.querySelector('.tab.active')?.dataset?.tab
            if (activeTab === 'saved') this.loadSavedTests()
          } else throw new Error('Respuesta sin preguntas válidas')
        } catch (err) {
          console.error('❌ Error general:', err)
          document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'Error al generar preguntas', type: 'error' } }))
        }
      }
      if (event.target.closest('.clean-icon')) this.resetForm()
      if (event.target.closest('.tab')) {
        const clicked = event.target.closest('.tab')
        this.shadow.querySelector('.tab.active').classList.remove('active')
        clicked.classList.add('active')
        this.shadow.querySelector('.tab-content.active').classList.remove('active')
        this.shadow.querySelector(`.tab-content[data-tab='${clicked.dataset.tab}']`).classList.add('active')
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
      if (!data.temas || data.temas.length === 0) { list.innerHTML = '<p>No hay tests guardados.</p>'; return }
      data.temas.forEach(grupo => {
        const header = document.createElement('div')
        header.className = 'tema-header'
        header.innerHTML = `<span class="caret">▶</span> ${grupo.tema}`
        list.appendChild(header)
        const inner = document.createElement('div')
        inner.className = 'tema-inner'
        grupo.tests.forEach(t => {
          const row = document.createElement('div')
          row.className = 'test-item'
          row.innerHTML = `<span>${t.name}</span><small>${(t.size / 1024).toFixed(1)} KB</small>`
          row.addEventListener('click', () => this.openSavedTest(grupo.tema, t.name))
          inner.appendChild(row)
        })
        header.addEventListener('click', () => {
          const opened = inner.style.display === 'block'
          inner.style.display = opened ? 'none' : 'block'
          header.classList.toggle('open', !opened)
        })
        list.appendChild(inner)
      })
    } catch (err) { console.error('❌ Error cargando tests guardados:', err) }
  }

  async openSavedTest(tema, name) {
    try {
      const res = await fetch(`/api/admin/assistants/saved-tests/${encodeURIComponent(tema)}/${encodeURIComponent(name)}`)
      const data = await res.json()
      if (!data.success) throw new Error('No se pudo cargar el test')
      this.showTestModal(`🧠 ${name}`, data.questions, tema, name)
    } catch (err) {
      console.error('❌ Error abriendo test guardado:', err)
      document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'No se pudo abrir el test guardado', type: 'error' } }))
    }
  }

  showTestModal(title, questionsArray, tema = null, source = null) {
    const old = document.querySelector('.test-overlay')
    if (old) old.remove()
    const overlay = document.createElement('div')
    overlay.className = 'test-overlay'
    overlay.innerHTML = `
      <div class="test-modal">
        <div class="test-modal-header">
          <span>${title}</span>
          <button class="close-btn">×</button>
        </div>
        <div class="test-modal-content"></div>
      </div>
    `
    document.body.appendChild(overlay)
    const container = overlay.querySelector('.test-modal-content')
    const test = document.createElement('test-component')
    test.setAttribute('data-questions', JSON.stringify(questionsArray))
    if (tema) test.setAttribute('data-tema', tema)
    if (source) test.setAttribute('data-source', source)
    container.appendChild(test)
    overlay.querySelector('.close-btn').addEventListener('click', () => overlay.remove())
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove() })
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
