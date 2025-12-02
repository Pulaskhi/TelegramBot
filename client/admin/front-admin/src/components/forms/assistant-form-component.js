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
    this.connectedExtras()
  }

  render() {
    this.shadow.innerHTML = `
    <style>
     :host { display: block; width: 100%; height: auto; overflow: visible; position: relative; z-index: 10; background: transparent; padding: 20px 12px; box-sizing: border-box }
      * { box-sizing: border-box; font-family: 'Inter','Nunito Sans',sans-serif; }
      button { background: transparent; border: none; cursor: pointer; }
      .form { display:flex; flex-direction:column; gap:1rem; background:#f9fafb; border-radius:12px; box-shadow:0 0 20px rgba(0,0,0,0.05); padding:20px; height:auto; max-height: calc(100vh - 160px); overflow:auto; }
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
      .form__body { background:#fff; border-radius:10px; padding:20px; box-shadow:inset 0 0 5px rgba(0,0,0,0.05); flex:1; overflow:auto; }
      .form__body form { display:flex; flex-direction:column; height:100%; }
      .tab-content { display:none; }
      .tab-content.active { display:block; }
      .form-element { display:flex; flex-direction:column; margin-bottom:1rem; }
      .form-element label { font-weight:600; color:#374151; margin-bottom:6px; }

      .test-list { border:1px solid #e5e7eb; border-radius:8px; background:#fff; overflow:auto; padding:8px; display:flex; flex-direction:column; flex:1; min-height:0; box-sizing:border-box }
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
        display:flex; justify-content:flex-end; align-items:stretch; z-index:9999; backdrop-filter:blur(2px); }
      .test-modal { width:45%; background:#fff; border-radius:16px 0 0 16px; overflow-y:auto;
        display:flex; flex-direction:column; box-shadow:-6px 0 16px rgba(0,0,0,0.15); }
      .test-modal-header { background:linear-gradient(90deg,#2563eb,#4f46e5); color:#fff; padding:16px 20px;
        display:flex; justify-content:space-between; align-items:center; font-weight:600; border-radius:16px 0 0 0; }
      .test-modal-content { flex:1; padding:20px; background:#f9fafb; }
      .close-btn { background:transparent; border:none; color:#fff; font-size:1.6rem; cursor:pointer; }
      .close-btn:hover { color:#fbbf24; transform:scale(1.05); }

      .panel { background: var(--surface, #f9fafb); padding: 18px; border-radius: 12px; box-shadow: 0 10px 30px rgba(2,6,10,0.12); height: auto; box-sizing: border-box; display: flex; flex-direction: column; max-width: var(--max-width,1200px); margin: 0 auto; }
      .grid { display: grid; grid-template-columns: 320px minmax(520px, 1fr); gap: 18px; flex: 1; min-height: 0 }
      .preview-area { background: #fff; border-radius: 10px; padding: 20px; box-shadow: inset 0 0 5px rgba(0,0,0,0.05); display:flex; flex-direction:column; height:100%; }
      #previewArea { flex:1; overflow:auto; }
      .preview-controls { display:flex; justify-content:flex-end; gap:8px; margin-top:12px; position:sticky; bottom:16px; background:transparent; padding-top:6px }
      .btn { padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; border: none; }
      .btn-primary { background: #2563eb; color: #fff; }
      .btn-primary:hover { background: #1d4ed8; }
      .btn { background: #e5e7eb; color: #374151; }
      .btn:hover { background: #d1d5db; }
     </style>

    <style>
      /* Scroll & layout fixes: allow inner areas to scroll without double scrollbars */
      .grid, .panel, .preview-area, .form__body, .test-list, .preview-area, #previewArea { min-height: 0; }

      .test-list, .saved-list, .trained-list {
        overflow: auto;
        padding-right: 8px;
        box-sizing: border-box;
        display:flex; flex-direction:column; flex:1; min-height:0;
      }

      /* Ensure form tab content elements size correctly inside flex form */
      .tab-content { min-height:0; display:block }
      .tab-content .form-element { display:flex; flex-direction:column; flex:1; min-height:0 }

      #previewArea {
        overflow: auto;
        max-height: calc(100vh - 120px);
        padding-right: 8px;
        box-sizing: border-box;
      }

      /* Push form actions to bottom */
      .form-actions { margin-top: auto; display:flex; justify-content:flex-start }

      /* Slightly reduce padding of preview area to show more content */
      .preview-area { padding: 14px }

      /* nicer scrollbars */
      .test-list::-webkit-scrollbar, #previewArea::-webkit-scrollbar { width:10px; height:10px }
      .test-list::-webkit-scrollbar-track, #previewArea::-webkit-scrollbar-track { background: transparent }
      .test-list::-webkit-scrollbar-thumb, #previewArea::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius:8px }
      .test-list { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.15) transparent }

      /* Keep header inside the form column (avoid escaping layout) */
      .form__header-box { position: relative; width: 100%; z-index: 1; box-sizing: border-box; display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
      .form__header-box .tabs { flex:1 1 auto; min-width:0 }
      .form__header-box .tabs .tab { flex:0 0 auto }
      .form__header-box .tabs button { white-space:nowrap; }
      .form__header-box .form__header-icons { flex:0 0 auto; display:flex; gap:8px; align-items:center }
    </style>

      <section class="panel">
        <div class="grid">
          <aside class="form">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <div>
                <h2 style="margin:0">Generador de Tests</h2>
                <p style="margin:6px 0 0;color:#6b7280">Sube PDFs, genera preguntas y guarda tests por tema.</p>
              </div>
            </div>
            <div class="form__header">
              <div class="form__header-box">
                  <div class="tabs">
                    <div class="tab" data-tab="files"><button>Documentos</button></div>
                    <div class="tab" data-tab="saved"><button>Tests Generados</button></div>
                    <div class="tab active" data-tab="trained"><button>Tests Entrenados</button></div>
                  </div>
                  <div style="margin-left:12px; display:flex; align-items:center; gap:8px">
                    <label style="font-weight:600; color:#fff; font-size:0.9rem">Tema:</label>
                    <select id="filterTopic" style="min-width:180px; padding:6px 8px; border-radius:6px; border:none"></select>
                  </div>
                <div class="form__header-icons">
                </div>
              </div>
            </div>

            <div class="form__body">
              <form>
                <input type="hidden" name="id">

                <div class="tab-content" data-tab="files">
                  <div class="form-element">
                    <label>Sube tu documento PDF</label>
                    <div class="form-element-input">
                      <upload-file-button-component
                        icon="documents"
                        name="assistantDocuments"
                        language-alias="all"
                        quantity="single"
                        file-type="documents">
                      </upload-file-button-component>
                    </div>
                  </div>
                  <div class="form-actions" style="margin-top:10px;">
                    <div style="display:flex; gap:8px;">
                      <button class="btn btn-primary" id="btnCreateGenerate">Generar y guardar</button>
                      <button class="btn" id="btnCreateGenerateAuto">Generar + Auto-train</button>
                    </div>
                  </div>
                  <small style="color:#6b7280; margin-top:6px;">Selecciona un PDF y pulsa generar. El test se guardará en el tema detectado.</small>
                </div>

                <div class="tab-content" data-tab="saved">
                  <div class="form-element"><label>Tests generados previamente</label>
                    <div class="test-list saved-list"></div>
                  </div>
                </div>

                <div class="tab-content active" data-tab="trained">
                  <div class="form-element"><label>Tests entrenados</label>
                    <div class="test-list trained-list"></div>
                  </div>
                </div>
              </form>
            </div>
          </aside>

          <section class="preview-area">
            <h3 style="margin-top:0">Vista Previa del Test</h3>
            <div id="previewArea"></div>
                  <div class="preview-controls">
                    <label style="display:flex;align-items:center;gap:8px">Mostrar: <select id="selectLimit"><option value="0">Todas</option><option value="5">5</option><option value="10">10</option><option value="20">20</option></select></label>
              <button class="btn" id="btnStart">Iniciar Test</button>
                    <button class="btn" id="btnDownload">Descargar</button>
                  </div>
          </section>
        </div>

      </section>
    `
    this.bindEvents()
  }

  bindEvents() {
      this.shadow.querySelector('.form').addEventListener('click', async (e) => {
      e.preventDefault()

      if (e.target.closest('#btnCreateGenerate')) {
        this.generateAndShowTest(false)
      }
      if (e.target.closest('#btnCreateGenerateAuto')) {
        this.generateAndShowTest(true)
      }
      if (e.target.closest('#btnDownload')) {
        // download the current inline test as JSON
        const preview = this.shadow.querySelector('#previewArea')
        const tc = preview.querySelector('test-component')
        if (!tc) {
          document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'No hay test para descargar', type: 'error' } }))
          return
        }
        const json = tc.getAttribute('data-questions') || '[]'
        const tema = tc.getAttribute('data-tema') || 'test'
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${tema.replace(/[^a-z0-9\-_]/gi, '_')}_test.json`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      }
      if (e.target.closest('#btnStart')) {
        const preview = this.shadow.querySelector('#previewArea')
        const tc = preview.querySelector('test-component')
        if (!tc) {
          document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'No hay test para iniciar', type: 'error' } }))
          return
        }
        let questions = []
        try { questions = JSON.parse(tc.getAttribute('data-questions') || '[]') } catch (err) { questions = [] }
        const tema = tc.getAttribute('data-tema') || null
        const source = tc.getAttribute('data-source') || null
        // emit a custom event so the app can react (navigate to runner, open modal, etc.)
        document.dispatchEvent(new CustomEvent('start-test', { detail: { questions, tema, source } }))
        document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'Iniciando test seleccionado...', type: 'success' } }))
      }
      if (e.target.closest('#selectLimit')) {
        const select = e.target.closest('#selectLimit')
        const limit = parseInt(select.value) || 0
        const preview = this.shadow.querySelector('#previewArea')
        const tc = preview.querySelector('test-component')
        if (!tc) return
        const tema = tc.getAttribute('data-tema') || null
        const source = tc.getAttribute('data-source') || null
        const feedback = tc.getAttribute('data-feedback') || ''
        let questions = []
        try { questions = JSON.parse(tc.getAttribute('data-questions') || '[]') } catch (e) { questions = [] }
        const sliced = limit > 0 ? questions.slice(0, limit) : questions
        // remove and re-render smaller test
        const wrapper = preview
        wrapper.innerHTML = ''
        const newTest = document.createElement('test-component')
        newTest.setAttribute('data-questions', JSON.stringify(sliced))
        if (tema) newTest.setAttribute('data-tema', tema)
        if (source) newTest.setAttribute('data-source', source)
        if (feedback) newTest.setAttribute('data-feedback', feedback)
        wrapper.appendChild(newTest)
      }

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

    const selectLimit = this.shadow.querySelector('#selectLimit')
    if (selectLimit) {
      selectLimit.addEventListener('change', (e) => {
        const limit = parseInt(e.target.value) || 0
        const preview = this.shadow.querySelector('#previewArea')
        const tc = preview.querySelector('test-component')
        if (!tc) return
        const tema = tc.getAttribute('data-tema') || null
        const source = tc.getAttribute('data-source') || null
        const feedback = tc.getAttribute('data-feedback') || ''
        let questions = []
        try { questions = JSON.parse(tc.getAttribute('data-questions') || '[]') } catch (err) { questions = [] }
        const sliced = limit > 0 ? questions.slice(0, limit) : questions
        preview.innerHTML = ''
        const newTest = document.createElement('test-component')
        newTest.setAttribute('data-questions', JSON.stringify(sliced))
        if (tema) newTest.setAttribute('data-tema', tema)
        if (source) newTest.setAttribute('data-source', source)
        if (feedback) newTest.setAttribute('data-feedback', feedback)
        preview.appendChild(newTest)
      })
    }
  }

  async connectedExtras() {
    // load topics into the select and initial lists
    this.loadSavedTests()
    this.loadTrainedTests()
    this.loadTemas()
  }

  async generateTest() {
    let filename = null

    try {
      const state = store.getState()
      const files = state.files?.files || state.files?.selectedFiles || []
      if (files.length > 0) filename = files[0].filename || files[0].name
    } catch (e) {
      console.warn('⚠️ No se pudo leer Redux.files:', e)
    }

    console.log('📄 Archivo seleccionado para generar test:', filename)

    if (!filename) {
      document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'Debes subir o seleccionar un PDF en la galería primero', type: 'error' } }))
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

  // New: generate a test using the selected/uploaded file and show inside the preview area
  async generateAndShowTest(autoTrain = false) {
    // read selected file from global redux files state or from upload component
    let filename = null
    try {
      const state = store.getState()
      const files = state.files?.files || state.files?.selectedFiles || []
      if (files.length > 0) filename = files[0].filename || files[0].name
    } catch (e) {
      console.warn('⚠️ No se pudo leer Redux.files:', e)
    }

    if (!filename) {
      document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'Debes subir o seleccionar un PDF primero', type: 'error' } }))
      return
    }

    try {
      const res = await fetch('/api/admin/assistants/pdf-questions-stored', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, save: true, autoTrain })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Error generando')

      // show inline in preview
      this.showTestInline(data.saved ? data.saved.preguntas : data.questions, data.saved ? data.saved.tema : null, data.file || null, data.saved || null)
      document.dispatchEvent(new CustomEvent('notice', { detail: { message: '✅ Generado y mostrado en preview', type: 'success' } }))
      // refresh saved tests list
      this.loadSavedTests()
    } catch (err) {
      console.error('❌ Error al generar y mostrar:', err)
      document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'Error al generar el test', type: 'error' } }))
    }
  }

  async loadSavedTests() {
    await this.loadTests('/api/admin/assistants/saved-tests', '.saved-list', 'saved')
  }

  async loadTemas() {
    const data = await this.fetchJson('/api/admin/assistants/saved-tests')
    const sel = this.shadow.querySelector('#filterTopic')
    if (!sel) return
    sel.innerHTML = '<option value="">Todos los temas</option>'
    if (data && Array.isArray(data.temas)) {
      data.temas.forEach(g => {
        const opt = document.createElement('option')
        opt.value = g.tema
        opt.text = g.tema
        sel.appendChild(opt)
      })
    }
  }

  async fetchJson(url) {
    try {
      const res = await fetch(url)
      return await res.json()
    } catch (err) {
      console.warn('⚠️ fetchJson error', err)
      return null
    }
  }

  // show test inline in the preview area (not modal)
  showTestInline(questionsArray, tema = null, sourceFile = null, feedback = '') {
    const preview = this.shadow.querySelector('#previewArea')
    preview.innerHTML = ''
    const wrapper = document.createElement('div')
    wrapper.style.overflow = 'auto'
    wrapper.style.display = 'flex'
    wrapper.style.flexDirection = 'column'
    wrapper.style.height = '100%'
    const test = document.createElement('test-component')
    test.style.height = 'auto'
    test.style.overflow = 'visible'
    test.setAttribute('data-questions', JSON.stringify(questionsArray || []))
    if (tema) test.setAttribute('data-tema', tema)
    if (sourceFile) test.setAttribute('data-source', sourceFile)
    if (feedback) test.setAttribute('data-feedback', feedback)
    wrapper.appendChild(test)
    preview.appendChild(wrapper)
  }

  async openTestInline(tema, name) {
    try {
      const endpoint = `/api/admin/assistants/saved-tests/${encodeURIComponent(tema)}/${encodeURIComponent(name)}`
      const res = await fetch(endpoint)
      const data = await res.json()
      if (!data.success) throw new Error('No se pudo abrir el test')
      this.showTestInline(data.questions, tema, name, null)
    } catch (err) {
      console.error('❌ Error abriendo test:', err)
      document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'No se pudo abrir el test guardado', type: 'error' } }))
    }
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

      let groups = data.temas || data.tests || []
      if (type === 'trained') {
        // Group trained tests by tema
        const grouped = {}
        groups.forEach(test => {
          if (!grouped[test.tema]) grouped[test.tema] = []
          grouped[test.tema].push(test)
        })
        groups = Object.keys(grouped).map(tema => ({ tema, tests: grouped[tema] }))
      }

      if (!groups.length) {
        list.innerHTML = '<p>No hay tests guardados.</p>'
        return
      }

      groups.forEach(grupo => {
        const header = document.createElement('div')
        header.className = 'tema-header'
        header.innerHTML = `<span class="caret">▶</span> ${grupo.tema || grupo?.name || 'Sin tema'}`
        list.appendChild(header)

        const inner = document.createElement('div')
        inner.className = 'tema-inner'

        if (Array.isArray(grupo.tests)) {
          grupo.tests.forEach(t => {
            const row = document.createElement('div')
            row.className = 'test-item'
            row.innerHTML = `<span>${t.name}</span>`
            row.addEventListener('click', () => this.openTest(grupo.tema, t.name, type))
            inner.appendChild(row)
          })
        } else if (grupo.name && grupo.tema) {
          const row = document.createElement('div')
          row.className = 'test-item'
          row.innerHTML = `<span>${grupo.name}</span>`
          row.addEventListener('click', () => this.openTest(grupo.tema, grupo.name, type))
          inner.appendChild(row)
        }

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
      this.showTestInline(data.questions, tema, name, data.feedback || '')
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
    this.shadow.querySelector('[data-tab="trained"]').classList.add('active')
    this.shadow.querySelector('.tab-content.active').classList.remove('active')
    this.shadow.querySelector('[data-tab="trained"]').closest('.form').querySelector('[data-tab="trained"].tab-content').classList.add('active')
    store.dispatch(removeFiles())
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


