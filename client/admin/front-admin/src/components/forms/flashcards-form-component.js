class FlashcardsFormComponent extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
    this.loadSavedTests(); // cargar tests guardados al inicio
  }

  render() {
    this.shadow.innerHTML = `
      <style>
        * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
        button { cursor: pointer; padding: 8px 14px; border-radius: 6px; border: none; }
        .form { display:flex; flex-direction:column; gap:1rem; background:#f9fafb; border-radius:12px; padding:20px; }
        .tabs { display:flex; gap:10px; }
        .tab button { background:#e5e7eb; font-weight:600; }
        .tab.active button { background:#2563eb; color:white; }
        .tab-content { display:none; }
        .tab-content.active { display:block; }
        .test-list { border:1px solid #e5e7eb; padding:10px; border-radius:8px; margin-top:10px; }
        .tema-header { cursor:pointer; background:#ddd; margin-top:6px; padding:8px 10px; border-radius:6px; }
        .tema-inner { display:none; padding-left:10px; }
        .test-item { cursor:pointer; padding:6px 0; }
        .test-item:hover { color:#2563eb; }
        .form-element { margin-top: 15px; }
        input { padding: 8px; width: 100%; }
      </style>

      <section class="form">
        <div class="tabs">
          <div class="tab active" data-tab="tests"><button>Tests Disponibles</button></div>
          <div class="tab" data-tab="flashcards"><button>Generar Flashcards</button></div>
        </div>

        <div class="form__body">
          
          <!-- TAB 1: SELECCIONAR TEMA + TEST -->
          <div class="tab-content active" data-tab="tests">
            <h3>Selecciona un Test</h3>
            <div class="test-list saved-list"></div>
          </div>

          <!-- TAB 2: GENERAR FLASHCARDS -->
          <div class="tab-content" data-tab="flashcards">
            <h3>Generar Flashcards desde Test</h3>

            <div class="form-element">
              <label>Tema:</label>
              <input type="text" id="temaSelected" readonly>
            </div>

            <div class="form-element">
              <label>Test:</label>
              <input type="text" id="testSelected" readonly>
            </div>

            <button id="btnGenerateFlashcards">⚡ Generar Flashcards</button>
          </div>
        </div>
      </section>
    `;
  }

  bindEvents() {
    // Cambio de pestaña
    this.shadow.querySelector(".tabs").addEventListener("click", (e) => {
      const tab = e.target.closest(".tab");
      if (!tab) return;

      this.shadow.querySelector(".tab.active").classList.remove("active");
      tab.classList.add("active");

      this.shadow.querySelector(".tab-content.active").classList.remove("active");
      this.shadow.querySelector(`.tab-content[data-tab="${tab.dataset.tab}"]`).classList.add("active");
    });

    // Botón generar flashcards
    this.shadow.querySelector("#btnGenerateFlashcards")
      .addEventListener("click", () => this.generateFlashcards());
  }

  /* ===============================================================
     📌 CARGAR LISTA DE TEMAS + TESTS (exacto como assistant-form)
     =============================================================== */
  async loadSavedTests() {
    const list = this.shadow.querySelector('.saved-list');
    list.innerHTML = "<p>Cargando tests...</p>";

    try {
      const res = await fetch('/api/admin/assistants/saved-tests');
      const data = await res.json();

      if (!data.success || !data.temas?.length) {
        list.innerHTML = "<p>No hay tests guardados.</p>";
        return;
      }

      list.innerHTML = '';
      data.temas.forEach(grupo => {
        const header = document.createElement("div");
        header.className = "tema-header";
        header.innerHTML = `<b>${grupo.tema}</b>`;

        const inner = document.createElement("div");
        inner.className = "tema-inner";

        grupo.tests.forEach(t => {
          const row = document.createElement("div");
          row.className = "test-item";
          row.textContent = t.name;

          row.addEventListener("click", () => {
            this.shadow.querySelector('#temaSelected').value = grupo.tema;
            this.shadow.querySelector('#testSelected').value = t.name;
            this.changeTab("flashcards");
          });

          inner.appendChild(row);
        });

        header.addEventListener("click", () => {
          inner.style.display = inner.style.display === "block" ? "none" : "block";
        });

        list.appendChild(header);
        list.appendChild(inner);
      });

    } catch (err) {
      console.error("❌ Error cargando tests:", err);
      list.innerHTML = "<p>Error cargando tests.</p>";
    }
  }

  changeTab(tabName) {
    this.shadow.querySelector(".tab-content.active").classList.remove("active");
    this.shadow.querySelector(`.tab-content[data-tab="${tabName}"]`).classList.add("active");

    this.shadow.querySelector(".tab.active").classList.remove("active");
    this.shadow.querySelector(`.tab[data-tab="${tabName}"]`).classList.add("active");
  }

  /* ===============================================================
     ⚡ ENVIAR AL BACKEND Y GENERAR FLASHCARDS
     =============================================================== */
  async generateFlashcards() {
    const tema = this.shadow.querySelector("#temaSelected").value;
    const test = this.shadow.querySelector("#testSelected").value;

    if (!tema || !test) {
      alert("Selecciona primero un tema y un test");
      return;
    }

    try {
      const res = await fetch("/api/admin/assistants/flashcards-from-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema, test })
      });

      const data = await res.json();
      if (data.success) {
        alert("Flashcards generadas correctamente!");
      } else {
        alert("Error generando flashcards.");
      }
    } catch (err) {
      console.error("❌ Error:", err);
      alert("Error al comunicar con el backend.");
    }
  }
}

customElements.define("flashcards-form-component", FlashcardsFormComponent);
