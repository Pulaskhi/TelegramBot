import isEqual from 'lodash-es/isEqual'

class FlashcardsFormComponent extends HTMLElement {
  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.endpoint = '/api/admin/assistants'
    this._savedTemas = []
  }

  connectedCallback() {
    this.render()
    this.bindEvents()
    this.connectedExtras()
  }

  render() {
    this.shadow.innerHTML = `
    <style>
      :host { display:block; width:100%; box-sizing:border-box; font-family: 'Inter','Nunito Sans',sans-serif }
      *{ box-sizing: border-box }

      .panel { display:flex; flex-direction:column; height:100%; padding:18px; gap:12px; }
      .grid { display:grid; grid-template-columns: 380px 1fr; gap:18px; height: calc(100vh - 72px); min-height:0 }
      .sidebar { background: #fff; border-radius:12px; padding:16px; box-shadow: 0 6px 20px rgba(2,6,23,0.06); display:flex; flex-direction:column; gap:12px; min-height:0 }
      .tabs { display:flex; gap:8px }
      .tab { padding:8px 12px; border-radius:8px; cursor:pointer; background:linear-gradient(90deg,#2563eb,#4f46e5); color:#fff; font-weight:600 }
      .tab.inactive { opacity:0.6; background:transparent; color:#374151; border:1px solid #e6eefc }

      .form-body { overflow:auto; padding-top:6px; display:flex; flex-direction:column; gap:10px; min-height:0 }
      .test-list { display:flex; flex-direction:column; gap:8px; overflow:auto; padding:6px; border-radius:8px; border:1px solid #eef2ff; min-height:0 }
      .tema-header { display:flex; align-items:center; gap:10px; padding:10px; border-radius:8px; background:#eef2ff; }
      .tema-title{ font-weight:700; color:#1e3a8a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:calc(100% - 48px); }
      .open-group-btn { margin-left:auto; padding:8px 12px; border-radius:8px; border:none; background:#1e3a8a; color:#fff; cursor:pointer }
      .generate-tema-btn { margin-left:8px; padding:6px 8px; border-radius:6px; border:1px solid #e6eefc; background:#fff; color:#1e3a8a; font-weight:700 }

      .expanded-panel { background:#fff; border:1px solid #e6eefc; border-radius:8px; margin:8px 0 6px 0; padding:8px; box-shadow: 0 6px 18px rgba(2,6,23,0.06); }
      .expanded-row { display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #f3f4f6 }
      .expanded-row:last-child { border-bottom: none }

      .preview { background:#fff; border-radius:12px; padding:16px; box-shadow: inset 0 0 5px rgba(0,0,0,0.03); display:flex; flex-direction:column; min-height:0 }
      #previewArea { flex:1; overflow:auto; min-height:0 }

      @media(max-width:900px){ .grid{ grid-template-columns: 1fr; height: auto } .panel{ padding:12px } }
    </style>

    <section class="panel">
      <div class="grid">
        <aside class="sidebar">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <h3 style="margin:0">Flashcards — Temas</h3>
              <div style="font-size:0.9rem;color:#6b7280">Generadas y por generar</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
              <div class="tabs" role="tablist">
                <div class="tab active" data-tab="available">Temas</div>
                <div class="tab inactive" data-tab="generate">Generar</div>
              </div>
            </div>
          </div>

          <div class="form-body">
            <div class="tab-content" data-tab="available" style="display:block">
              <h4 class="section-title">Flashcards generadas</h4>
              <div class="test-list flashcards-list"></div>
              <h4 class="section-title">Temas / Tests</h4>
              <div class="test-list temas-list"></div>
            </div>

            <div class="tab-content" data-tab="generate" style="display:none">
              <h4 class="section-title">Generar Flashcards</h4>
              <div style="display:flex;flex-direction:column;gap:8px">
                <label>Selecciona tema</label>
                <select id="selectTema"><option value="">Selecciona tema</option></select>
                <label>Selecciona test (opcional)</label>
                <select id="selectTest"><option value="">Selecciona test</option></select>
                <div style="display:flex;gap:8px;align-items:center;margin-top:8px">
                  <button id="btnGenerateFlash" class="btn btn-primary" style="padding:8px 12px;border-radius:8px;background:linear-gradient(90deg,#2563eb,#4f46e5);color:#fff;border:none">Generar</button>
                  <label style="font-weight:600;color:#374151"><input type="checkbox" id="chkAutoTrain" style="margin-right:8px"> Auto-train</label>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section class="preview">
          <div id="previewArea"></div>
        </section>
      </div>
    </section>
    <div class="preview-full" style="display:none">
      <button class="close-full" title="Cerrar">×</button>
      <div id="flashCardAreaFull"></div>
    </div>
    `
  }

  bindEvents() {
    this.shadow.addEventListener('click', async (e) => {
      const tab = e.target.closest('.tab')
      if (tab) {
        this.shadow.querySelectorAll('.tab').forEach(t => t.classList.add('inactive'))
        this.shadow.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
        tab.classList.remove('inactive')
        tab.classList.add('active')
        this.shadow.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none')
        const target = this.shadow.querySelector(`.tab-content[data-tab="${tab.dataset.tab}"]`)
        if (target) target.style.display = 'block'
        if (tab.dataset.tab === 'available') {
          this.loadFlashcards()
          this.loadSavedTests()
        }
        return
      }

      // handle open group arrow
      const openBtn = e.target.closest('.open-group-btn')
      if (openBtn) {
        const header = openBtn.closest('.tema-header')
        if (header) {
          let tests = []
          try { tests = JSON.parse(header.dataset.tests || '[]') } catch (err) { tests = [] }
          const tema = header.dataset.tema || 'Sin tema'
          if (!tests.length) {
            try {
              const res = await fetch(`/api/admin/assistants/saved-tests/${encodeURIComponent(tema)}`)
              const data = await res.json()
              tests = data.tests || data || []
            } catch (err) { tests = [] }
          }
          if (header.parentElement) {
            this.toggleInlinePanel(header, tests, 'saved')
          }
        }
        return
      }

      // handle open flashcards files list (specific to flashcards-list)
      const openFlashBtn = e.target.closest('.open-flashcards-btn')
      if (openFlashBtn) {
        const header = openFlashBtn.closest('.tema-header')
        if (header) {
          const inner = header.nextElementSibling
          if (inner && inner.classList && inner.classList.contains('flashcards-inner')) {
            // close other flashcards-inner panels
            this.shadow.querySelectorAll('.flashcards-inner').forEach(n => { if (n !== inner) n.style.display = 'none' })
            inner.style.display = inner.style.display === 'none' ? 'block' : 'none'
            if (inner.style.display === 'block') inner.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          }
        }
        return
      }

      // Close full-screen
      if (e.target.closest('.close-full')) {
        const panel = this.shadow.querySelector('.panel')
        if (panel) panel.classList.remove('full-screen')
        const pf = this.shadow.querySelector('.preview-full')
        if (pf) pf.style.display = 'none'
        return
      }

      // generate by tema button in header
      const genBtn = e.target.closest('.generate-tema-btn')
      if (genBtn) {
        const header = genBtn.closest('.tema-header')
        if (header) {
          const tema = header.dataset.tema || null
          if (tema) {
            const auto = !!this.shadow.querySelector('#chkAutoTrain')?.checked
            this.generateFlashcardsByTema(tema, auto)
          }
        }
        return
      }
    })

    // generate from generate tab
    const btnGen = this.shadow.querySelector('#btnGenerateFlash')
    if (btnGen) btnGen.addEventListener('click', () => this.generateFromGenerateTab())

    const temaSel = this.shadow.querySelector('#selectTema')
    if (temaSel) temaSel.addEventListener('change', () => this.populateTestsForSelect())
  }

  async connectedExtras() {
    this.loadFlashcards()
    this.loadSavedTests()
    this.populateTemaSelect()
  }

  /* ---------------------- flashcards list ---------------------- */
  async loadFlashcards() {
    try {
      const res = await fetch('/api/admin/assistants/flashcards')
      const data = await res.json()
      const list = this.shadow.querySelector('.flashcards-list')
      if (!list) return
      list.innerHTML = ''
      const groups = data.temas || []
      if (!groups.length) { list.innerHTML = '<p>No hay flashcards generadas.</p>'; return }
      groups.forEach(grp => {
        const header = document.createElement('div')
        header.className = 'tema-header'
        const temaText = grp.tema || 'Sin tema'
        const flashcards = Array.isArray(grp.flashcards) ? grp.flashcards : []
        header.dataset.tema = temaText
        header.dataset.tests = JSON.stringify(flashcards || [])
        header.innerHTML = `<span class="tema-title">${temaText}</span> <button type="button" class="generate-tema-btn" title="Generar flashcards desde este tema">Generar</button> <button type="button" class="open-flashcards-btn">›</button>`
        list.appendChild(header)

        // create inner panel listing individual flashcards files (hidden by default)
        const inner = document.createElement('div')
        inner.className = 'flashcards-inner'
        inner.style.display = 'none'
        inner.style.padding = '8px'
        inner.style.border = '1px solid #eef2ff'
        inner.style.borderRadius = '8px'
        inner.style.marginTop = '6px'
        if (flashcards.length === 0) {
          inner.innerHTML = '<div class="expanded-row">No hay archivos de flashcards.</div>'
        } else {
          flashcards.forEach(f => {
            const row = document.createElement('div')
            row.className = 'expanded-row'
            row.style.display = 'flex'
            row.style.justifyContent = 'space-between'
            row.style.alignItems = 'center'
            const name = document.createElement('span')
            name.style.fontWeight = '600'
            name.style.color = '#1e3a8a'
            name.textContent = f.name || f
            const actions = document.createElement('div')
            actions.style.display = 'flex'
            actions.style.gap = '8px'
            const openBtn = document.createElement('button')
            openBtn.type = 'button'
            openBtn.textContent = '›'
            openBtn.addEventListener('click', () => this.openFlashcardsFile(temaText, f.name || f))
            actions.appendChild(openBtn)
            row.appendChild(name)
            row.appendChild(actions)
            inner.appendChild(row)
          })
        }
        list.appendChild(inner)
      })
    } catch (err) { console.error('❌ Error cargando flashcards:', err) }
  }

  async openFlashcardsFile(tema, name) {
    try {
      if (!tema || !name) throw new Error('Falta tema o nombre')
      const endpoint = `/api/admin/assistants/flashcards/${encodeURIComponent(tema)}/${encodeURIComponent(name)}`
      const res = await fetch(endpoint)
      const text = await res.text()
      let data = null
      try {
        data = JSON.parse(text)
      } catch (e) {
        console.error('Non-JSON response opening flashcards:', text)
        document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'Respuesta inesperada del servidor al abrir flashcards (ver consola)', type: 'error' } }))
        return
      }
      if (!res.ok) {
        console.error('Server error opening flashcards:', res.status, data)
        document.dispatchEvent(new CustomEvent('notice', { detail: { message: data.message || `Error ${res.status}`, type: 'error' } }))
        return
      }
      const flashcards = data.flashcards || data
      // Render in the right preview pane (like tests)
      this.showFlashcardsPreview(flashcards, tema, name)
    } catch (err) {
      console.error('❌ Error abriendo flashcards:', err)
      document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'No se pudo abrir el archivo de flashcards', type: 'error' } }))
    }
  }

  /* ---------------------- saved tests (temas) ---------------------- */
  async loadSavedTests() {
    const container = this.shadow.querySelector('.temas-list')
    if (!container) return
    container.innerHTML = '<p>Cargando temas...</p>'
    try {
      const res = await fetch('/api/admin/assistants/saved-tests')
      const data = await res.json()
      if (!data.success || !data.temas?.length) { container.innerHTML = '<p>No hay tests guardados.</p>'; this._savedTemas = []; return }
      this._savedTemas = data.temas || []
      container.innerHTML = ''
      this._savedTemas.forEach(t => {
        const header = document.createElement('div')
        header.className = 'tema-header'
        header.dataset.tema = t.tema
        header.dataset.tests = JSON.stringify(t.tests || [])
        header.innerHTML = `<span class="tema-title">${t.tema}</span> <button type="button" class="generate-tema-btn" title="Generar flashcards desde este tema">Generar</button> <button type="button" class="open-group-btn">›</button>`
        container.appendChild(header)
        const inner = document.createElement('div')
        inner.className = 'tema-inner'
        inner.style.display = 'none'
        inner.style.padding = '8px'
        if (Array.isArray(t.tests)) {
          t.tests.forEach(ts => {
            const row = document.createElement('div')
            row.className = 'expanded-row'
            row.style.display = 'flex'
            row.style.justifyContent = 'space-between'
            row.style.alignItems = 'center'
            const name = document.createElement('span')
            name.style.fontWeight = '600'
            name.style.color = '#1e3a8a'
            name.textContent = ts.name
            const actions = document.createElement('div')
            actions.style.display = 'flex'
            actions.style.gap = '8px'
            const openBtn = document.createElement('button')
            openBtn.textContent = '›'
            openBtn.addEventListener('click', () => this.openSavedTest(t.tema, ts.name))
            const genBtn = document.createElement('button')
            genBtn.textContent = 'Generar'
            genBtn.addEventListener('click', () => this.generateFlashcardsByTest(t.tema, ts.name, !!this.shadow.querySelector('#chkAutoTrain')?.checked))
            actions.appendChild(genBtn)
            actions.appendChild(openBtn)
            row.appendChild(name)
            row.appendChild(actions)
            inner.appendChild(row)
          })
        }
        container.appendChild(inner)
      })

      // populate selectTema
      const select = this.shadow.querySelector('#selectTema')
      if (select) {
        select.innerHTML = '<option value="">Selecciona tema</option>'
        this._savedTemas.forEach(t => {
          const opt = document.createElement('option')
          opt.value = t.tema
          opt.text = t.tema
          select.appendChild(opt)
        })
      }
    } catch (err) { console.error('Error loading temas:', err); container.innerHTML = '<p>Error cargando temas.</p>'; this._savedTemas = [] }
  }

  async populateTestsForSelect() {
    const sel = this.shadow.querySelector('#selectTest')
    sel.innerHTML = '<option value="">Selecciona test</option>'
    const tema = this.shadow.querySelector('#selectTema').value
    if (!tema) return
    const found = (this._savedTemas || []).find(t => t.tema === tema)
    if (found && Array.isArray(found.tests)) {
      found.tests.forEach(f => {
        const opt = document.createElement('option')
        opt.value = f.name
        opt.text = f.name
        sel.appendChild(opt)
      })
    }
  }

  async openSavedTest(tema, name) {
    try {
      const endpoint = `/api/admin/assistants/saved-tests/${encodeURIComponent(tema)}/${encodeURIComponent(name)}`
      const res = await fetch(endpoint)
      const data = await res.json()
      if (!data.success) throw new Error('No se pudo abrir el test')
      // show test in the right preview pane (as test-component)
      const questions = data.questions || []
      this.showTestPreview(questions, tema, name)
    } catch (err) {
      console.error('❌ Error abriendo test:', err)
      document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'No se pudo abrir el test guardado', type: 'error' } }))
    }
  }

  toggleInlinePanel(header, tests = [], type = 'saved') {
    const next = header.nextElementSibling
    if (next && next.classList && next.classList.contains('expanded-panel')) { next.remove(); return }
    const other = this.shadow.querySelectorAll('.expanded-panel'); other.forEach(p => p.remove())
    const panel = document.createElement('div')
    panel.className = 'expanded-panel'
    if (!Array.isArray(tests) || tests.length === 0) { panel.innerHTML = '<div class="expanded-row">No hay tests en este tema.</div>'; header.parentNode.insertBefore(panel, header.nextSibling); return }
    tests.forEach(t => {
      const row = document.createElement('div')
      row.className = 'expanded-row'
      const nameSpan = document.createElement('span')
      nameSpan.textContent = t.name || t.title || 'Sin nombre'
      nameSpan.style.fontWeight = '600'
      nameSpan.style.color = '#1e3a8a'

      const actions = document.createElement('div')
      actions.style.display = 'flex'
      actions.style.gap = '8px'

      const genBtn = document.createElement('button')
      genBtn.type = 'button'
      genBtn.textContent = 'Generar'
      genBtn.addEventListener('click', () => this.generateFlashcardsByTest(header.dataset.tema || '', t.name || t.title || '', !!this.shadow.querySelector('#chkAutoTrain')?.checked))

      const openBtn = document.createElement('button')
      openBtn.type = 'button'
      openBtn.textContent = '›'
      openBtn.addEventListener('click', () => this.openSavedTest(header.dataset.tema || '', t.name || t.title || ''))

      actions.appendChild(genBtn)
      actions.appendChild(openBtn)

      row.appendChild(nameSpan)
      row.appendChild(actions)
      panel.appendChild(row)
    })
    panel.style.maxHeight = '200px'
    panel.style.overflow = 'auto'
    panel.style.boxSizing = 'border-box'
    header.parentNode.insertBefore(panel, header.nextSibling)
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  showFlashcardsInline(flashcards, tema = null, source = null) {
    // show as full-screen overlay similar to assistant-form
    const panel = this.shadow.querySelector('.panel')
    if (panel) panel.classList.add('full-screen')
    const pf = this.shadow.querySelector('.preview-full')
    if (pf) pf.style.display = 'block'
    const area = this.shadow.querySelector('#flashCardAreaFull')
    if (!area) return
    area.innerHTML = ''
    const wrapper = document.createElement('div')
    wrapper.style.display = 'grid'
    wrapper.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))'
    wrapper.style.gap = '12px'
    wrapper.style.padding = '12px'

    flashcards.forEach(card => {
      const c = document.createElement('div')
      c.style.border = '1px solid #eef2ff'
      c.style.borderRadius = '8px'
      c.style.padding = '12px'
      c.style.background = '#fff'
      const title = document.createElement('div')
      title.style.fontWeight = '700'
      title.style.marginBottom = '8px'
      title.textContent = card.titulo || card.concepto || card.title || 'Sin título'
      const exp = document.createElement('div')
      exp.style.color = '#374151'
      exp.style.marginBottom = '8px'
      exp.textContent = card.explicacion || card.texto || card.text || card.explanacion || ''
      c.appendChild(title)
      c.appendChild(exp)
      wrapper.appendChild(c)
    })

    area.appendChild(wrapper)
  }

  showFlashcardsPreview(flashcards, tema = null, source = null) {
    // render flashcards into the right-side preview area (like tests)
    const preview = this.shadow.querySelector('#previewArea')
    if (!preview) return
    preview.innerHTML = ''
    const header = document.createElement('div')
    header.style.display = 'flex'
    header.style.justifyContent = 'space-between'
    header.style.alignItems = 'center'
    header.style.marginBottom = '8px'
    const title = document.createElement('div')
    title.style.fontWeight = '700'
    title.textContent = tema || source || 'Flashcards'
    header.appendChild(title)
    preview.appendChild(header)

    const wrapper = document.createElement('div')
    wrapper.style.display = 'grid'
    wrapper.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))'
    wrapper.style.gap = '12px'
    wrapper.style.padding = '12px'
    wrapper.style.overflow = 'auto'
    wrapper.style.maxHeight = '100%';

    (flashcards || []).forEach(card => {
      const c = document.createElement('div')
      c.style.border = '1px solid #eef2ff'
      c.style.borderRadius = '8px'
      c.style.padding = '12px'
      c.style.background = '#fff'
      const t = document.createElement('div')
      t.style.fontWeight = '700'
      t.style.marginBottom = '8px'
      t.textContent = card.titulo || card.concepto || card.title || 'Sin título'
      const exp = document.createElement('div')
      exp.style.color = '#374151'
      exp.style.marginBottom = '8px'
      exp.textContent = card.explicacion || card.texto || card.text || card.explanacion || ''
      c.appendChild(t)
      c.appendChild(exp)
      wrapper.appendChild(c)
    })

    preview.appendChild(wrapper)
  }

  showTestPreview(questionsArray, tema = null, source = null) {
    // render a test-component into the right-side preview area
    const preview = this.shadow.querySelector('#previewArea')
    if (!preview) return
    preview.innerHTML = ''

    const header = document.createElement('div')
    header.style.display = 'flex'
    header.style.justifyContent = 'space-between'
    header.style.alignItems = 'center'
    header.style.marginBottom = '8px'
    const title = document.createElement('div')
    title.style.fontWeight = '700'
    title.textContent = tema || source || 'Test'
    header.appendChild(title)
    preview.appendChild(header)

    const wrapper = document.createElement('div')
    wrapper.style.overflow = 'auto'
    wrapper.style.height = '100%'
    const test = document.createElement('test-component')
    test.style.height = 'auto'
    test.style.overflow = 'visible'
    test.setAttribute('data-questions', JSON.stringify(questionsArray || []))
    if (tema) test.setAttribute('data-tema', tema)
    if (source) test.setAttribute('data-source', source)
    wrapper.appendChild(test)
    preview.appendChild(wrapper)
  }

  async generateFromGenerateTab() {
    const tema = this.shadow.querySelector('#selectTema').value || ''
    const test = this.shadow.querySelector('#selectTest').value || ''
    const auto = !!this.shadow.querySelector('#chkAutoTrain')?.checked
    if (!tema) {
      document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'Selecciona un tema primero', type: 'error' } }))
      return
    }
    if (test) {
      await this.generateFlashcardsByTest(tema, test, auto)
    } else {
      await this.generateFlashcardsByTema(tema, auto)
    }
  }

  async generateFlashcardsByTest(tema, testName, autoTrain = false) {
    try {
      const payload = { tema, test: testName }
      const res = await fetch('/api/admin/assistants/flashcards-from-test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      const text = await res.text()
      let data = null
      try { data = JSON.parse(text) } catch (e) { console.error('Non-JSON response:', text); document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'Respuesta inesperada del servidor al generar desde test (ver consola)', type: 'error' } })); return }
      if (!res.ok) {
        console.error('Server error:', res.status, data)
        document.dispatchEvent(new CustomEvent('notice', { detail: { message: data.message || `Error ${res.status}`, type: 'error' } }))
        return
      }
      if (!data.success) {
        document.dispatchEvent(new CustomEvent('notice', { detail: { message: data.message || 'Error generando flashcards', type: 'error' } }))
        return
      }
      const flashcards = data.flashcards || []
      this.showFlashcardsPreview(flashcards, tema, testName)
      document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'Flashcards generadas', type: 'success' } }))
      this.loadFlashcards()
    } catch (err) {
      console.error('❌ Error generando por test:', err)
      document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'Error generando flashcards desde el test', type: 'error' } }))
    }
  }

  async generateFlashcardsByTema(tema, autoTrain = false) {
    try {
      const payload = { tema, autoTrain }
      const res = await fetch('/api/admin/assistants/flashcards-from-topic', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      const text = await res.text()
      let data = null
      try { data = JSON.parse(text) } catch (e) { console.error('Non-JSON response:', text); document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'Respuesta inesperada del servidor al generar desde tema (ver consola)', type: 'error' } })); return }
      if (!res.ok) {
        console.error('Server error:', res.status, data)
        document.dispatchEvent(new CustomEvent('notice', { detail: { message: data.message || `Error ${res.status}`, type: 'error' } }))
        return
      }
      if (!data.success) {
        document.dispatchEvent(new CustomEvent('notice', { detail: { message: data.message || 'Error generando flashcards', type: 'error' } }))
        return
      }
      const flashcards = data.flashcards || []
      this.showFlashcardsPreview(flashcards, tema)
      document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'Flashcards generadas', type: 'success' } }))
      this.loadFlashcards()
    } catch (err) {
      console.error('❌ Error generando por tema:', err)
      document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'Error generando flashcards desde el tema', type: 'error' } }))
    }
  }

  async populateTemaSelect() {
    // ensure saved temas are loaded (loadSavedTests is idempotent)
    if (!Array.isArray(this._savedTemas) || !this._savedTemas.length) {
      try { await this.loadSavedTests() } catch (e) { /* ignore */ }
    }
    const select = this.shadow.querySelector('#selectTema')
    if (!select) return

    // Clear existing options robustly and build options via DOM (safer than innerHTML)
    while (select.firstChild) select.removeChild(select.firstChild)
    const defaultOpt = document.createElement('option')
    defaultOpt.value = ''
    defaultOpt.textContent = 'Selecciona tema'
    select.appendChild(defaultOpt)

    const temas = Array.isArray(this._savedTemas) ? this._savedTemas : []
    temas.forEach(t => {
      try {
        const opt = document.createElement('option')
        opt.value = t.tema
        opt.textContent = t.tema
        select.appendChild(opt)
      } catch (e) { /* ignore malformed entries */ }
    })
  }
}

customElements.define('flashcards-form-component', FlashcardsFormComponent)
