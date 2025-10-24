import isEqual from 'lodash-es/isEqual'
import { store } from '../../redux/store.js'
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

      /* Modal */
      .test-overlay { position:fixed; inset:0; background:rgba(17,24,39,0.6);
        display:flex; justify-content:flex-end; align-items:stretch; z-index:9999; backdrop-filter:blur(2px); }
      .test-modal { width:45%; background:#fff; border-radius:16px 0 0 16px; overflow-y:auto;
        display:flex; flex-direction:column; box-shadow:-6px 0 16px rgba(0,0,0,0.15); }
      .test-modal-header { background:linear-gradient(90deg,#2563eb,#4f46e5); color:#fff; padding:16px 20px;
        display:flex; justify-content:space-between; align-items:center; font-weight:600; border-radius:16px 0 0 0; }
      .test-modal-content { flex:1; padding:20px; background:#f9fafb; }
      .close-btn { background:transparent; border:none; color:#fff; font-size:1.6rem; cursor:pointer; }
      .close-btn:hover { color:#fbbf24; transform:scale(1.05); }
     </style>

      <section class="form">
        <div class="form__header">
          <div class="form__header-box">
            <div class="tabs">
              <div class="tab active" data-tab="general"><button>General</button></div>
              <div class="tab" data-tab="files"><button>Documentos</button></div>
              <div class="tab" data-tab="saved"><button>Tests Generados</button></div>
              <div class="tab" data-tab="trained"><button>Tests Entrenados</button></div>
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
              <div class="form-element">
                <label>Tema</label>
                <div class="form-element-input"><input type="text" name="assistantName"></div>
              </div>
              <div class="form-element">
                <label>Subtema</label>
                <div class="form-element-input"><input type="text" name="assistantEndpoint"></div>
              </div>
            </div>

            <div class="tab-content" data-tab="files">
              <div class="form-element"><label>Nombre del archivo PDF</label>
                <div class="form-element-input"><input type="text" name="pdfFilename" placeholder="ejemplo.pdf"></div>
              </div>
            </div>

            <div class="tab-content" data-tab="saved">
              <div class="form-element"><label>Tests generados previamente</label>
                <div class="test-list saved-list"></div>
              </div>
            </div>

            <div class="tab-content" data-tab="trained">
              <div class="form-element"><label>Tests entrenados</label>
                <div class="test-list trained-list"></div>
              </div>
            </div>
          </form>
        </div>
      </section>
    `
    this.bindEvents()
  }

  bindEvents() {
    this.shadow.querySelector('.form').addEventListener('click', async (e) => {
      e.preventDefault()

      if (e.target.closest('.save-icon')) this.generateTest()
      if (e.target.closest('.clean-icon')) this.resetForm()

      const tab = e.target.closest('.tab')
      if (tab) {
        this.shadow.querySelector('.tab.active').classList.remove('active')
        tab.classList.add('active')
        this.shadow.querySelector('.tab-content.active').classList.remove('active')
        this.shadow.querySelector(`.tab-content[data-tab="${tab.dataset.tab}"]`).classList.add('active')

        if (tab.dataset.tab === 'saved') this.loadSavedTests()
        if (tab.dataset.tab === 'trained') this.loadTrainedTests()
      }
    })
  }

  async generateTest() {
    let filename = this.shadow.querySelector('[name="pdfFilename"]')?.value.trim()
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
      const data = await res.json()
      if (!data.success) throw new Error('Error al generar preguntas')
      document.dispatchEvent(new CustomEvent('notice', { detail: { message: '✅ Preguntas generadas correctamente', type: 'success' } }))
      this.loadSavedTests()
    } catch (err) {
      console.error('❌ Error generando test:', err)
      document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'Error al generar el test', type: 'error' } }))
    }
  }

  async loadSavedTests() {
    await this.loadTests('/api/admin/assistants/saved-tests', '.saved-list', 'saved')
  }

  async loadTrainedTests() {
    await this.loadTests('/api/admin/assistants/trained-tests', '.trained-list', 'trained')
  }

  async loadTests(url, selector, type) {
    try {
      const res = await fetch(url)
      const data = await res.json()
      const list = this.shadow.querySelector(selector)
      list.innerHTML = ''

      const groups = data.temas || data.tests || []
      if (!groups.length) {
        list.innerHTML = '<p>No hay tests guardados.</p>'
        return
      }

      groups.forEach(grupo => {
        const header = document.createElement('div')
        header.className = 'tema-header'
        header.innerHTML = `<span class="caret">▶</span> ${grupo.tema}`
        list.appendChild(header)

        const inner = document.createElement('div')
        inner.className = 'tema-inner'

        grupo.tests?.forEach(t => {
          const row = document.createElement('div')
          row.className = 'test-item'
          row.innerHTML = `<span>${t.name}</span>`
          row.addEventListener('click', () => this.openTest(grupo.tema, t.name, type))
          inner.appendChild(row)
        })
        list.appendChild(inner)

        header.addEventListener('click', () => {
          const open = inner.style.display === 'block'
          inner.style.display = open ? 'none' : 'block'
          header.classList.toggle('open', !open)
        })
      })
    } catch (err) {
      console.error('❌ Error cargando tests:', err)
    }
  }

  async openTest(tema, name, type) {
    try {
      const endpoint =
        type === 'trained'
          ? `/api/admin/assistants/trained-tests/${encodeURIComponent(tema)}/${encodeURIComponent(name)}`
          : `/api/admin/assistants/saved-tests/${encodeURIComponent(tema)}/${encodeURIComponent(name)}`
      const res = await fetch(endpoint)
      const data = await res.json()
      if (!data.success) throw new Error('No se pudo abrir el test')
      this.showTestModal(`🧠 ${name}`, data.questions, tema, name, data.feedback || '')
    } catch (err) {
      console.error('❌ Error abriendo test:', err)
      document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'No se pudo abrir el test guardado', type: 'error' } }))
    }
  }

  showTestModal(title, questionsArray, tema = null, source = null, feedback = '') {
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
    if (feedback) test.setAttribute('data-feedback', feedback)
    container.appendChild(test)

    overlay.querySelector('.close-btn').addEventListener('click', () => overlay.remove())
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove() })
  }

  resetForm() {
    const form = this.shadow.querySelector('form')
    form.reset()
    this.shadow.querySelector('.tab.active').classList.remove('active')
    this.shadow.querySelector('[data-tab="general"]').classList.add('active')
    this.shadow.querySelector('.tab-content.active').classList.remove('active')
    this.shadow.querySelector('[data-tab="general"].tab-content')
  }

  showElement(data) {
    Object.entries(data).forEach(([key, value]) => {
      const input = this.shadow.querySelector(`[name="${key}"]`)
      if (input) input.value = value
      if (typeof value === 'object' && key === 'files') store.dispatch(showFiles(value))
    })
  }
}

customElements.define('assistant-form-component', AssistantForm)
