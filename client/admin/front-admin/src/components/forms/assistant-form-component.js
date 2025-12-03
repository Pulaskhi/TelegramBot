import isEqual from 'lodash-es/isEqual'
import { store } from '../../redux/store.js'
import { showFiles, removeFiles } from '../../redux/files-slice.js'
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
      :host { display:block; width:100%; box-sizing:border-box; font-family: 'Inter','Nunito Sans',sans-serif }
      *{ box-sizing: border-box }

      /* Panel container */
      .panel { display:flex; flex-direction:column; height:100%; padding:18px; gap:12px; }

      /* Grid layout: left sidebar and right preview. Ensure both columns can scroll internally. */
      .grid { display:grid; grid-template-columns: 380px 1fr; gap:18px; height: calc(100vh - 72px); min-height:0 }

      /* Sidebar form */
      .sidebar { background: #fff; border-radius:12px; padding:16px; box-shadow: 0 6px 20px rgba(2,6,23,0.06); display:flex; flex-direction:column; gap:12px; min-height:0 }
      .sidebar .header { display:flex; flex-direction:column; gap:6px }
      .tabs { display:flex; gap:8px }
      .tab { padding:8px 12px; border-radius:8px; cursor:pointer; background:linear-gradient(90deg,#2563eb,#4f46e5); color:#fff; font-weight:600 }
      .tab.inactive { opacity:0.6; background:transparent; color:#374151; border:1px solid #e6eefc }

      .form-body { overflow:auto; padding-top:6px; display:flex; flex-direction:column; gap:10px; min-height:0 }
      form { display:flex; flex-direction:column; gap:12px }
      label { font-weight:700; color:#374151 }

      .upload-row { display:flex; gap:12px; align-items:flex-start }
      upload-file-button-component { display:block }

      .test-list { display:flex; flex-direction:column; gap:8px; overflow:auto; padding:6px; border-radius:8px; border:1px solid #eef2ff; min-height:0 }
      .tema-header { display:flex; align-items:center; gap:10px; padding:10px; border-radius:8px; background:#eef2ff; }
      .tema-title{ font-weight:700; color:#1e3a8a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:calc(100% - 48px); }
      .open-group-btn { margin-left:auto; padding:8px 12px; border-radius:8px; border:none; background:#1e3a8a; color:#fff; cursor:pointer }
      /* Inline expanded panel under a tema header */
      .expanded-panel { background:#fff; border:1px solid #e6eefc; border-radius:8px; margin:8px 0 6px 0; padding:8px; box-shadow: 0 6px 18px rgba(2,6,23,0.06); }
      .expanded-row { display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #f3f4f6 }
      .expanded-row:last-child { border-bottom: none }

      /* Preview */
      .preview { background:#fff; border-radius:12px; padding:16px; box-shadow: inset 0 0 5px rgba(0,0,0,0.03); display:flex; flex-direction:column; min-height:0 }
      #previewArea { flex:1; overflow:auto; min-height:0 }
      .preview-controls { display:flex; gap:8px; align-items:center; margin-top:8px }

      /* Modal overlay (reused) */
      .test-overlay { position:fixed; inset:0; background:rgba(17,24,39,0.5); display:flex; justify-content:center; align-items:center; z-index:9999 }
      .test-modal { width:720px; max-width:95%; max-height:85vh; overflow:auto; background:#fff; border-radius:12px; }
      .test-modal-header { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:linear-gradient(90deg,#2563eb,#4f46e5); color:#fff; border-radius:12px 12px 0 0 }
      .test-modal-content { padding:12px 16px }
      .modal-row { display:flex; justify-content:space-between; align-items:center; padding:8px 6px; border-bottom:1px solid #f3f4f6 }

      /* Responsive */
      @media(max-width:900px){ .grid{ grid-template-columns: 1fr; height: auto } .panel{ padding:12px } }
    </style>

    <section class="panel">
      <div class="grid">
        <aside class="sidebar">
          <div class="header">
            <div>
              <h2 style="margin:0">Generador de Tests</h2>
              <p style="margin:6px 0 0;color:#6b7280">Sube PDFs, genera preguntas y guarda tests por tema.</p>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
              <div class="tabs" role="tablist">
                <div class="tab" data-tab="files">Documentos</div>
                <div class="tab inactive" data-tab="saved">Tests Generados</div>
                <div class="tab inactive" data-tab="trained">Tests Entrenados</div>
              </div>
              <select id="filterTopic" style="margin-left:auto;padding:8px;border-radius:8px;border:1px solid #e6eefc"></select>
            </div>
          </div>

          <div class="form-body">
            <form>
              <input type="hidden" name="id">

              <div class="tab-content" data-tab="files">
                <label>Sube tu documento PDF</label>
                <div class="upload-row">
                  <upload-file-button-component icon="documents" name="assistantDocuments" language-alias="all" quantity="single" file-type="documents"></upload-file-button-component>
                </div>
                <div style="display:flex;gap:8px">
                  <button type="button" class="btn btn-primary" id="btnCreateGenerate">Generar y guardar</button>
                  <button type="button" class="btn" id="btnCreateGenerateAuto">Generar + Auto-train</button>
                </div>
                <small style="color:#6b7280">Selecciona un PDF y pulsa generar. El test se guardará en el tema detectado.</small>
              </div>

              <div class="tab-content" data-tab="saved" style="display:none">
                <label>Tests generados previamente</label>
                <div class="test-list saved-list"></div>
              </div>

              <div class="tab-content" data-tab="trained" style="display:none">
                <label>Tests entrenados</label>
                <div class="test-list trained-list"></div>
              </div>
            </form>
          </div>
        </aside>

        <section class="preview">
          <h3 style="margin:0 0 8px">Vista Previa del Test</h3>
          <div id="previewArea"></div>
          <div class="preview-controls">
            <label style="display:flex;align-items:center;gap:8px">Mostrar:
              <select id="selectLimit"><option value="0">Todas</option><option value="5">5</option><option value="10">10</option><option value="20">20</option></select>
            </label>
            <div style="margin-left:auto;display:flex;gap:8px">
              <button class="btn" id="btnStart">Iniciar Test</button>
            </div>
          </div>
        </section>
      </div>
    </section>
    `
    this.bindEvents()
  }

  bindEvents() {
      // Use shadow root as event delegation container (no more .form element)
      this.shadow.addEventListener('click', async (e) => {
        // don't call preventDefault globally; only for actionable buttons

      if (e.target.closest('#btnCreateGenerate')) {
        this.generateAndShowTest(false)
      }
      if (e.target.closest('#btnCreateGenerateAuto')) {
        this.generateAndShowTest(true)
      }
      // download button removed from UI; no handler needed
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
        // handle tab visual state
        const prev = this.shadow.querySelector('.tab.active')
        if (prev) {
          prev.classList.remove('active')
          prev.classList.add('inactive')
        }
        tab.classList.remove('inactive')
        tab.classList.add('active')

        // hide all tab-content and show the selected one
        this.shadow.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none')
        const target = this.shadow.querySelector(`.tab-content[data-tab="${tab.dataset.tab}"]`)
        if (target) target.style.display = 'block'

        if (tab.dataset.tab === 'saved') this.loadSavedTests()
        if (tab.dataset.tab === 'trained') this.loadTrainedTests()
      }

      // open-group-btn (delegated): read header dataset and open modal
      const openBtn = e.target.closest('.open-group-btn')
      if (openBtn) {
        const header = openBtn.closest('.tema-header')
        if (header) {
          let tests = []
          try { tests = JSON.parse(header.dataset.tests || '[]') } catch (err) { tests = [] }
          const tema = header.dataset.tema || 'Sin tema'
          const listType = header.dataset.type || 'trained'
          // if no tests available, attempt to fetch tests for that tema from the server as a fallback
          if (!tests.length) {
            const endpoint = listType === 'trained'
              ? `/api/admin/assistants/trained-tests/${encodeURIComponent(tema)}`
              : `/api/admin/assistants/saved-tests/${encodeURIComponent(tema)}`
            try {
              const res = await fetch(endpoint)
              const data = await res.json()
              // data may be { tests: [...] } or array
              tests = data.tests || data || []
            } catch (err) {
              console.warn('No se pudieron cargar tests por tema', err)
              tests = []
            }
          }
          // show inline panel under the header (preferred) — falls back to modal if not possible
          if (header.parentElement) {
            this.toggleInlinePanel(header, tests, listType)
          } else {
            this.showGroupModal(tema, tests, listType)
          }
        }
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
        const temaText = grupo.tema || grupo?.name || 'Sin tema'
        // determine tests array safely
        const testsArr = Array.isArray(grupo.tests)
          ? grupo.tests
          : Array.isArray(grupo.tests) === false && grupo.name && grupo.tema
            ? [ { name: grupo.name } ]
            : (Array.isArray(grupo) ? grupo : [])

        // store metadata on the header for robust delegation
        header.dataset.tema = temaText
        header.dataset.tests = JSON.stringify(testsArr || [])
        header.dataset.type = type

        // show a title and a small action button to open a modal listing the tests (arrow)
        header.innerHTML = `<span class="tema-title">${temaText}</span> <button type="button" class="open-group-btn" style="margin-left:auto;padding:6px 10px;border-radius:6px;border:none;background:#1e3a8a;color:#fff;cursor:pointer;font-weight:700">›</button>`
        list.appendChild(header)
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

  showGroupModal(tema, tests = [], type = 'trained') {
    const old = document.querySelector('.test-overlay')
    if (old) old.remove()

    const overlay = document.createElement('div')
    overlay.className = 'test-overlay'
    overlay.innerHTML = `
      <div class="test-modal">
        <div class="test-modal-header">
          <span>${tema}</span>
          <button class="close-btn">×</button>
        </div>
        <div class="test-modal-content"></div>
      </div>
    `
    document.body.appendChild(overlay)

    const container = overlay.querySelector('.test-modal-content')
    if (Array.isArray(tests) && tests.length) {
      tests.forEach(t => {
        const row = document.createElement('div')
        row.className = 'test-item'
        row.style.display = 'flex'
        row.style.justifyContent = 'space-between'
        row.style.alignItems = 'center'
        row.style.margin = '6px 0'
        row.innerHTML = `<span style="font-weight:600;color:#1e3a8a">${t.name}</span> <div style="display:flex;gap:8px"><button type="button" class="open-test" style="padding:6px 10px;border-radius:6px;border:1px solid rgba(15,23,42,0.06);background:transparent;cursor:pointer;font-weight:700">›</button></div>`
        container.appendChild(row)

        row.querySelector('.open-test').addEventListener('click', () => {
          this.openTest(tema, t.name, type)
          overlay.remove()
        })
      })
    } else {
      container.innerHTML = '<p>No hay tests en este tema.</p>'
    }

    overlay.querySelector('.close-btn').addEventListener('click', () => overlay.remove())
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove() })
  }

  toggleInlinePanel(header, tests = [], type = 'trained') {
    // If there's already an expanded panel immediately after header, remove it (toggle close)
    const next = header.nextElementSibling
    if (next && next.classList && next.classList.contains('expanded-panel')) {
      next.remove()
      return
    }

    // Remove any other open panels in the list to keep UI tidy
    const other = this.shadow.querySelectorAll('.expanded-panel')
    other.forEach(p => p.remove())

    // Create a new panel and insert after header
    const panel = document.createElement('div')
    panel.className = 'expanded-panel'

    if (!Array.isArray(tests) || tests.length === 0) {
      panel.innerHTML = '<div class="expanded-row">No hay tests en este tema.</div>'
      header.parentNode.insertBefore(panel, header.nextSibling)
      return
    }

    tests.forEach(t => {
      const row = document.createElement('div')
      row.className = 'expanded-row'
      const nameSpan = document.createElement('span')
      nameSpan.textContent = t.name || (t.title || 'Sin nombre')
      nameSpan.style.fontWeight = '600'
      nameSpan.style.color = '#1e3a8a'

      const actions = document.createElement('div')
      actions.style.display = 'flex'
      actions.style.gap = '8px'

      const openBtn = document.createElement('button')
      openBtn.type = 'button'
      openBtn.className = 'open-test'
      openBtn.style.padding = '6px 10px'
      openBtn.style.borderRadius = '6px'
      openBtn.style.border = '1px solid rgba(15,23,42,0.06)'
      openBtn.style.background = 'transparent'
      openBtn.style.cursor = 'pointer'
      openBtn.style.fontWeight = '700'
      openBtn.textContent = '›'
      openBtn.addEventListener('click', () => {
        this.openTest(header.dataset.tema || header.dataset.name || '', t.name || t.title || '', type)
      })

      actions.appendChild(openBtn)

      row.appendChild(nameSpan)
      row.appendChild(actions)
      panel.appendChild(row)
    })

    // limit height to show ~4 items and allow internal scroll
    panel.style.maxHeight = '200px'
    panel.style.overflow = 'auto'
    panel.style.boxSizing = 'border-box'
    header.parentNode.insertBefore(panel, header.nextSibling)
    // Scroll panel into view inside sidebar if needed
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
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


