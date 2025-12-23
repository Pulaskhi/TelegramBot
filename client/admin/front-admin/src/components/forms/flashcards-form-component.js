class FlashcardsFormComponent extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this._savedTemas = [];
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
    this.loadSavedTests();
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

      .preview { background:#fff; border-radius:12px; padding:16px; box-shadow: inset 0 0 5px rgba(0,0,0,0.03); display:flex; flex-direction:column; min-height:0 }
      #flashCardArea { flex:1; overflow:auto; min-height:0 }

      @media(max-width:900px){ .grid{ grid-template-columns: 1fr; height: auto } .panel{ padding:12px } }
    </style>

    <section class="panel">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <h2 style="margin:0">Flashcards — Repaso inteligente</h2>
          <p style="margin:6px 0 0;color:#6b7280">Genera tarjetas por concepto y programa repasos.</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <button id="btnOpenFull" title="Abrir en pantalla completa" style="padding:8px 10px;border-radius:8px;border:1px solid #e6eefc;background:#fff;cursor:pointer">Pantalla completa</button>
        </div>
      </div>

      <div class="grid">
        <aside class="sidebar">
          <div style="display:flex;gap:8px;align-items:center">
            <div class="tabs" role="tablist">
              <div class="tab active" data-tab="available">Tests Disponibles</div>
              <div class="tab inactive" data-tab="generate">Generar Flashcards</div>
            </div>
            <select id="filterTopic" style="margin-left:auto;padding:8px;border-radius:8px;border:1px solid #e6eefc"></select>
          </div>

          <div class="form-body">
            <div class="tab-content" data-tab="available">
              <label style="font-weight:700;color:#374151">Tests guardados</label>
              <div id="conceptsContainer" class="test-list"></div>
              <input type="hidden" id="temaSelected" />
              <input type="hidden" id="testSelected" />
            </div>

            <div class="tab-content" data-tab="generate" style="display:none">
              <label style="font-weight:700;color:#374151">Generar Flashcards</label>
              <div style="display:flex;gap:8px;align-items:center">
                <select id="selectTema"><option value="">Selecciona tema</option></select>
                <select id="selectTest"><option value="">Selecciona test</option></select>
                <button class="btn btn-primary" id="btnGenerateFlash">Generar</button>
              </div>
            </div>
          </div>
        </aside>

        <section class="preview">
          <h3 style="margin:0 0 8px">Tarjeta seleccionada</h3>
          <div id="flashCardArea"></div>
          <div style="margin-top:12px; display:flex; gap:8px;">
            <button class="btn" id="btnSchedule">Programar repaso</button>
            <button class="btn" id="btnExport">Exportar</button>
          </div>
        </section>
      </div>
    </section>
    <div class="preview-full" style="display:none">
      <button class="close-full" title="Cerrar" style="position:fixed;top:12px;right:12px;z-index:10002;padding:10px;border-radius:8px;background:#fff;border:1px solid #e6eefc;cursor:pointer">×</button>
      <div id="flashCardAreaFull" style="padding:24px;box-sizing:border-box"></div>
    </div>
    `;
  }

  bindEvents() {
    this.shadow.addEventListener('click', (e) => {
      const tab = e.target.closest('.tab')
      if (tab) {
        // toggle tab visuals
        this.shadow.querySelectorAll('.tab').forEach(t => t.classList.add('inactive'))
        tab.classList.remove('inactive')
        tab.classList.add('active')
        // toggle contents
        this.shadow.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none')
        const target = this.shadow.querySelector(`.tab-content[data-tab="${tab.dataset.tab}"]`)
        if (target) target.style.display = 'block'
        if (tab.dataset.tab === 'generate') this.populateGenerateSelects()
      }

      if (e.target.closest('#btnGenerateFlash')) {
        this.generateFlashcards()
      }

      if (e.target.closest('#btnOpenFull')) {
        const panel = this.shadow.querySelector('.panel')
        const previewFull = this.shadow.querySelector('.preview-full')
        if (!panel || !previewFull) return
        panel.classList.add('full-screen')
        previewFull.style.display = 'block'
        // move current preview into full area if available
        const current = this.shadow.querySelector('#flashCardArea')
        const full = this.shadow.querySelector('#flashCardAreaFull')
        if (full && current) full.innerHTML = current.innerHTML
      }

      if (e.target.closest('#btnExport')) {
        const tema = this.shadow.querySelector('#temaSelected').value
        const name = this.shadow.querySelector('#testSelected').value
        if (!tema || !name) {
          document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'Selecciona una tarjeta antes de exportar', type: 'error' } }))
          return
        }
        // trigger download via window location
        const url = `/api/admin/assistants/saved-tests/${encodeURIComponent(tema)}/${encodeURIComponent(name)}`
        fetch(url).then(r => r.json()).then(data => {
          const blob = new Blob([JSON.stringify(data.questions || data, null, 2)], { type: 'application/json' })
          const a = document.createElement('a')
          a.href = URL.createObjectURL(blob)
          a.download = `${name}`
          a.click()
          URL.revokeObjectURL(a.href)
        })
      }

      const list = this.shadow.querySelector('#conceptsContainer')
      if (list) {
        const temaEl = e.target.closest('.tema-header')
        if (temaEl) {
          const inner = temaEl.nextElementSibling
          if (inner && inner.classList.contains('tema-inner')) inner.style.display = inner.style.display === 'block' ? 'none' : 'block'
          return
        }
        const testEl = e.target.closest('.test-item')
        if (testEl) {
          const tema = testEl.dataset.tema
          const name = testEl.dataset.name
          this.shadow.querySelector('#temaSelected').value = tema
          this.shadow.querySelector('#testSelected').value = name
          Array.from(this.shadow.querySelectorAll('.test-item')).forEach(el => el.classList.remove('selected'))
          testEl.classList.add('selected')
          this.showFlashPreview(tema, name)
        }
      }
    })

    // close full-screen
    const closeBtn = this.shadow.querySelector('.close-full')
    if (closeBtn) closeBtn.addEventListener('click', () => {
      const panel = this.shadow.querySelector('.panel')
      const previewFull = this.shadow.querySelector('.preview-full')
      if (panel) panel.classList.remove('full-screen')
      if (previewFull) previewFull.style.display = 'none'
    })

    const temaSel = this.shadow.querySelector('#selectTema')
    if (temaSel) temaSel.addEventListener('change', () => this.loadTestsForTema(temaSel.value))
  }

  async loadSavedTests() {
    const container = this.shadow.querySelector('#conceptsContainer')
    container.innerHTML = '<p>Cargando temas...</p>'
    try {
      const res = await fetch('/api/admin/assistants/saved-tests')
      const data = await res.json()
      if (!data.success || !data.temas?.length) {
        container.innerHTML = '<p>No hay tests guardados.</p>'
        return
      }
      this._savedTemas = data.temas || []
      container.innerHTML = this._savedTemas.map(t => {
        const testsHtml = (t.tests || []).map(test => `<div class="test-item" data-tema="${t.tema}" data-name="${test.name}">${test.name}</div>`).join('')
        return `<div class="tema-header" data-tema="${t.tema}">${t.tema}</div><div class="tema-inner" style="display:none">${testsHtml}</div>`
      }).join('')
      const selectTema = this.shadow.querySelector('#selectTema')
      if (selectTema) {
        selectTema.innerHTML = '<option value="">Selecciona tema</option>'
        this._savedTemas.forEach(t => {
          const opt = document.createElement('option')
          opt.value = t.tema
          opt.text = t.tema
          selectTema.appendChild(opt)
        })
      }
    } catch (err) {
      console.error('Error loading temas:', err)
      container.innerHTML = '<p>Error cargando temas.</p>'
    }
  }

  async loadTestsForTema(tema) {
    const sel = this.shadow.querySelector('#selectTest')
    sel.innerHTML = '<option value="">Selecciona test</option>'
    if (!tema) return
    try {
      const temas = this._savedTemas || []
      const found = temas.find(t => t.tema === tema)
      if (found && Array.isArray(found.tests)) {
        found.tests.forEach(t => {
          const opt = document.createElement('option')
          opt.value = t.name
          opt.text = t.name
          sel.appendChild(opt)
        })
      }
    } catch (err) {
      console.error('Error loading tests for tema:', err)
    }
  }

  populateGenerateSelects() {
    const selectTema = this.shadow.querySelector('#selectTema')
    if (selectTema && !selectTema.children.length) {
      this._savedTemas.forEach(t => {
        const opt = document.createElement('option')
        opt.value = t.tema
        opt.text = t.tema
        selectTema.appendChild(opt)
      })
    }
  }

  async generateFlashcards() {
    const tema = this.shadow.querySelector('#selectTema').value || this.shadow.querySelector('#temaSelected').value
    const test = this.shadow.querySelector('#selectTest').value || this.shadow.querySelector('#testSelected').value
    if (!tema) {
      document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'Selecciona un tema primero', type: 'error' } }))
      return
    }
    try {
      const payload = test ? { tema, test } : { tema }
      const res = await fetch('/api/admin/assistants/flashcards-from-test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.success) {
        document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'Flashcards generadas correctamente!', type: 'success' } }))
        this.showFlashcardsPreview(data.flashcards || data.flashcards || data)
      } else {
        document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'Error generando flashcards.', type: 'error' } }))
      }
    } catch (err) {
      console.error('❌ Error:', err)
      document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'Error al comunicar con el backend.', type: 'error' } }))
    }
  }

  showFlashPreview(tema, test) {
    const area = this.shadow.querySelector('#flashCardArea')
    area.innerHTML = `<p style="color:#6b7280">Vista previa para <b>${tema}</b>${test ? ' / ' + test : ''}</p>`
  }

  showFlashcardsPreview(flashcards) {
    const panel = this.shadow.querySelector('.panel')
    // open full-screen-like preview by clearing preview area and showing cards
    const area = this.shadow.querySelector('#flashCardArea')
    area.innerHTML = ''
    if (!flashcards || !flashcards.length) {
      area.innerHTML = '<p>No se generaron flashcards</p>'
      return
    }
    const wrapper = document.createElement('div')
    wrapper.style.display = 'grid'
    wrapper.style.gridTemplateColumns = '1fr 1fr'
    wrapper.style.gap = '10px'
    flashcards.forEach(card => {
      const cardEl = document.createElement('div')
      cardEl.style.border = '1px solid #eef2ff'
      cardEl.style.padding = '12px'
      cardEl.style.borderRadius = '8px'
      cardEl.innerHTML = `<div style="font-weight:700;color:#1e3a8a;margin-bottom:6px">${card.concepto || card.title || 'Sin título'}</div><div>${card.texto || card.text || card.contenido || 'Sin contenido'}</div>`
      wrapper.appendChild(cardEl)
    })
    area.appendChild(wrapper)
  }
}

customElements.define('flashcards-form-component', FlashcardsFormComponent);
