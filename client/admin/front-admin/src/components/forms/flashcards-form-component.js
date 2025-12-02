class FlashcardsFormComponent extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
    this.loadSavedTests(); // cargar tests guardados al inicio
    this.loadTemas();
  }

  render() {
    this.shadow.innerHTML = `
<style>
.host-wrapper{ display:block; width:100vw; height:100vh; position:fixed; top:0; left:0; z-index:1000; background:var(--bg-100); }
:host{ display:block }
*{ box-sizing:border-box; font-family:var(--font-sans); }
.panel{ background:var(--surface); padding:18px; border-radius:12px; box-shadow:0 10px 30px rgba(2,6,10,0.45); height:100%; box-sizing:border-box; display:flex; flex-direction:column; min-height:0; }
.tabs{ display:flex; gap:12px }
.tab button{ padding:8px 12px; border-radius:10px }
.grid{ display:grid; grid-template-columns:380px 1fr; gap:18px; flex:1; min-height:0; }
.search{ background:var(--glass); padding:8px 12px; border-radius:10px }
.test-item{ padding:8px; border-radius:8px; margin:6px 0; background:rgba(255,255,255,0.02); cursor:pointer }
#conceptsContainer{ /* ensure topic list can scroll independently */
  overflow:auto;
  flex:1;
  min-height:0;
  padding-right:6px;
}
.tab-content{ display:none }
.tab-content.active{ display:block }
.tab.active button{ background:var(--accent) }
  .panel.full-screen { position: fixed; inset: 0; z-index: 10000; background: #fff; padding: 0; border-radius: 0; box-shadow: none; display: flex; flex-direction: column; }
  .panel.full-screen .grid { display: none; }
  /* preview-full is a sibling of .panel, show it when panel has full-screen */
  .panel.full-screen + .preview-full { display: block; position: fixed; inset: 0; z-index: 10001; background: #fff; padding: 18px; box-sizing: border-box; overflow: auto; }
  .preview-full { display: none; }
.close-full { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.1); border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10001; }
.close-full:hover { background: rgba(0,0,0,0.2); }
</style>

<style>
/* Scrollbar niceties for webkit and Firefox */
#conceptsContainer::-webkit-scrollbar, #flashCardArea::-webkit-scrollbar, .preview-full::-webkit-scrollbar { width:10px; height:10px }
#conceptsContainer::-webkit-scrollbar-track, #flashCardArea::-webkit-scrollbar-track, .preview-full::-webkit-scrollbar-track { background: transparent }
#conceptsContainer::-webkit-scrollbar-thumb, #flashCardArea::-webkit-scrollbar-thumb, .preview-full::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.25); border-radius:8px }
#conceptsContainer { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.25) transparent }
#flashCardArea { overflow:auto; min-height:0 }
#flashPreview.panel { display:flex; flex-direction:column; min-height:0 }
.panel > .grid { min-height:0 }
.panel aside.panel, .panel section.panel { min-height:0; display:flex; flex-direction:column }
</style>

      <section class="panel">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <h2 style="margin:0">Flashcards — Repaso inteligente</h2>
            <p style="margin:6px 0 0;color:var(--muted)">Genera tarjetas por concepto y programa repasos.</p>
          </div>
        </div>

        <div style="height:14px"></div>

        <div class="tabs">
          <div class="tab active" data-tab="available"><button>Tests Disponibles</button></div>
          <div class="tab" data-tab="generate"><button>Generar Flashcards</button></div>
        </div>

        <div style="height:14px"></div>

        <div class="tab-content active" data-tab="available">
          <div class="grid">
            <aside class="panel" id="flashList" style="display:flex;flex-direction:column;height:100%">
              <div class="toolbar"><input class="search" placeholder="Buscar tema..."></div>
              <div id="conceptsContainer" style="flex:1; overflow:auto"></div>
              <input type="hidden" id="temaSelected" />
              <input type="hidden" id="testSelected" />
            </aside>

            <section class="panel" id="flashPreview" style="display:flex;flex-direction:column;">
              <h3 style="margin-top:0">Tarjeta seleccionada</h3>
              <div id="flashCardArea" style="flex:1; overflow:auto"></div>
              <div style="margin-top:12px; display:flex; gap:8px;">
                <button class="btn" id="btnSchedule">Programar repaso</button>
                <button class="btn" id="btnExport">Exportar</button>
              </div>
            </section>
          </div>
        </div>

        <div class="tab-content" data-tab="generate">
          <div class="panel">
            <h3>Generar Flashcards</h3>
            <p>Selecciona un tema y un test para generar flashcards.</p>
            <div style="display:flex; gap:8px; align-items:center;">
              <select id="selectTema"><option value="">Selecciona tema</option></select>
              <select id="selectTest"><option value="">Selecciona test</option></select>
              <button class="btn btn-primary" id="btnGenerateFlash">Generar</button>
            </div>
          </div>
        </div>
      </section>

      <div class="preview-full">
        <button class="close-full">×</button>
        <div id="flashCardAreaFull"></div>
      </div>
    `;
  }

  bindEvents() {
    // Tab switching
    this.shadow.addEventListener('click', (e) => {
      const tab = e.target.closest('.tab')
      if (tab) {
        this.changeTab(tab.dataset.tab)
      }

      // Close full-screen
      if (e.target.closest('.close-full')) {
        this.shadow.querySelector('.panel').classList.remove('full-screen')
      }
    })

    // Botón generar flashcards
    const btn = this.shadow.querySelector("#btnGenerateFlash")
    if (btn) btn.addEventListener("click", () => this.generateFlashcards());

    // Delegación en la lista de temas/tests
    const list = this.shadow.querySelector('#conceptsContainer')
    if (list) {
      list.addEventListener('click', (e) => {
        const temaEl = e.target.closest('.tema-header')
        if (temaEl) {
          const tema = temaEl.dataset.tema
          // toggle show tests under tema
          const inner = temaEl.nextElementSibling
          if (inner && inner.classList.contains('tema-inner')) {
            inner.style.display = inner.style.display === 'block' ? 'none' : 'block'
          }
          return
        }

        const testEl = e.target.closest('.test-item')
        if (testEl) {
          const tema = testEl.dataset.tema
          const name = testEl.dataset.name
          this.shadow.querySelector('#temaSelected').value = tema
          this.shadow.querySelector('#testSelected').value = name
          // highlight selection
          Array.from(this.shadow.querySelectorAll('.test-item')).forEach(el => el.classList.remove('selected'))
          testEl.classList.add('selected')
          // show preview
          this.showFlashPreview(tema, name)
        }
      })
    }

    // Selects in generate tab
    const temaSel = this.shadow.querySelector('#selectTema')
    const testSel = this.shadow.querySelector('#selectTest')
    if (temaSel) {
      temaSel.addEventListener('change', () => this.loadTestsForTema(temaSel.value))
    }
  }

  /* ===============================================================
     📌 CARGAR LISTA DE TEMAS + TESTS (exacto como assistant-form)
     =============================================================== */
  async loadSavedTests() {
    const container = this.shadow.querySelector('#conceptsContainer')
    container.innerHTML = "<p>Cargando temas...</p>";

    try {
      const res = await fetch('/api/admin/assistants/saved-tests');
      const data = await res.json();

      if (!data.success || !data.temas?.length) {
        container.innerHTML = "<p>No hay tests guardados.</p>";
        return;
      }

      // Save temas for later (populate selects)
      this._savedTemas = data.temas || [];

      container.innerHTML = this._savedTemas.map(t => {
        let testsHtml = (t.tests || []).map(test => `<div class="test-item" data-tema="${t.tema}" data-name="${test.name}">${test.name}</div>`).join('');
        return `<div class="tema-header" data-tema="${t.tema}">${t.tema}</div><div class="tema-inner" style="display:none">${testsHtml}</div>`;
      }).join('');

      // Populate selectTema in the 'generate' tab if present
      const selectTema = this.shadow.querySelector('#selectTema');
      if (selectTema) {
        selectTema.innerHTML = '<option value="">Selecciona tema</option>';
        this._savedTemas.forEach(t => {
          const opt = document.createElement('option');
          opt.value = t.tema;
          opt.text = t.tema;
          selectTema.appendChild(opt);
        });
      }
    // removed extra closing brace
    } catch (err) {
      console.error('Error loading temas:', err)
    }
  }

  async loadTestsForTema(tema) {
    const sel = this.shadow.querySelector('#selectTest')
    sel.innerHTML = '<option value="">Selecciona test</option>';
    if (!tema) return
    try {
      // use cached temas loaded in loadSavedTests to populate tests for the selected tema
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

  /* ===============================================================
     ⚡ ENVIAR AL BACKEND Y GENERAR FLASHCARDS
     =============================================================== */
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (data.success) {
        document.dispatchEvent(new CustomEvent('notice', { detail: { message: 'Flashcards generadas correctamente!', type: 'success' } }))
        // show some preview
        this.showFlashcardsPreview(data.flashcards || data)
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
    area.innerHTML = `<p style="color:var(--muted)">Vista previa para <b>${tema}</b>${test ? ' / ' + test : ''}</p>`
  }

  showFlashcardsPreview(flashcards) {
    const panel = this.shadow.querySelector('.panel')
    panel.classList.add('full-screen')
    const area = this.shadow.querySelector('#flashCardAreaFull')
    area.innerHTML = ''
    if (!flashcards || !flashcards.length) {
      area.innerHTML = '<p>No se generaron flashcards</p>'
      return
    }
    const wrapper = document.createElement('div');
    wrapper.style.display = 'grid';
    wrapper.style.gridTemplateColumns = '1fr 1fr';
    wrapper.style.gap = '10px';
    area.innerHTML = (flashcards || []).map(card => {
      return `<div class="flashcard"><div class="flashcard-header"><span class="flashcard-title">${card.concepto || card.title || 'Sin título'}</span></div><div>${card.texto || card.text || 'Sin contenido'}</div></div>`;
    }).join('');
  }
}

customElements.define('flashcards-form-component', FlashcardsFormComponent);
