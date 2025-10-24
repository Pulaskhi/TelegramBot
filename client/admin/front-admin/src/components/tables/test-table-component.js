class TestComponent extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
    this.questions = [];
  }

  set dataQuestions(val) {
    try {
      const parsed = Array.isArray(val) ? val : JSON.parse(val);
      this.questions = this._normalizeQuestions(parsed);
      this._render();
    } catch (e) {
      console.error("❌ dataQuestions inválido:", e);
      this.questions = [];
      this._render();
    }
  }

  connectedCallback() {
    if (!this.questions?.length) {
      const dataAttr = this.getAttribute("data-questions");
      if (dataAttr) {
        try {
          const parsed = JSON.parse(dataAttr);
          this.questions = this._normalizeQuestions(parsed);
        } catch (e) {
          console.error("❌ Error parseando data-questions:", e);
        }
      }
    }
    this._render();
  }

  /**
   * 🔄 Normaliza preguntas de distintos formatos al formato interno uniforme:
   * { pregunta: "texto", opciones: [{ key: "A", label: "A) ..." }, ...], correcta: "A" }
   */
  _normalizeQuestions(arr) {
    return (arr || []).map((q) => {
      const pregunta = q.pregunta || q.question || q.text || "Pregunta sin texto";

      // ✅ Soporta distintos nombres de campo para las opciones
      const respuestas = q.respuestas || q.opciones || q.answers || q.options || [];
      const opcionesLimpias = (Array.isArray(respuestas) ? respuestas : Object.values(respuestas)).map((txt, i) => {
        const letter = String.fromCharCode(65 + i); // A, B, C, ...
        return { key: letter, label: `${letter}) ${txt}` };
      });

      // ✅ Convierte número (1,2,3) a letra (A,B,C)
      let correcta = "A";
      if (typeof q.correcta === "number") correcta = String.fromCharCode(64 + q.correcta);
      else if (typeof q.correcta === "string") correcta = q.correcta.toUpperCase().trim();
      else if (typeof q.correct === "number") correcta = String.fromCharCode(64 + q.correct);
      else if (typeof q.correct === "string") correcta = q.correct.toUpperCase().trim();

      return { pregunta, opciones: opcionesLimpias, correcta };
    });
  }

  _render() {
    this.shadow.innerHTML = `
      <style>
        * { font-family: "Nunito Sans", sans-serif; box-sizing: border-box; }
        .container {
          background: #ffffff; border-radius: 12px; padding: 20px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.08); color: #111; margin-top: 20px;
        }
        h2 { text-align: center; color: #1e3a8a; margin-bottom: 1rem; font-weight: 700; }

        .question {
          margin-bottom: 1.5rem; border: 1px solid #ddd; padding: 15px;
          border-radius: 8px; background: #fdfdfd; transition: background .2s, border-color .2s;
        }
        .question.correct { border-color: #22c55e; background: #e8f9ef; }
        .question.incorrect { border-color: #ef4444; background: #fdf0f0; }

        .question-header {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          margin-bottom: 8px;
        }
        .question-title { margin: 0; font-weight: 700; }

        .flag-wrap { display: flex; gap: 10px; }

        .useful-wrap, .bad-wrap {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: .9rem; user-select: none; cursor: pointer;
          padding: 4px 8px; border-radius: 6px; transition: all .25s ease;
        }
        .useful-wrap { background: rgba(251,191,36,0.15); color: #92400e; }
        .useful-wrap:hover { background: rgba(251,191,36,0.25); transform: scale(1.05); }
        .useful-flag { accent-color: #fbbf24; transform: scale(1.15); }

        .bad-wrap { background: rgba(239,68,68,0.15); color: #991b1b; }
        .bad-wrap:hover { background: rgba(239,68,68,0.25); transform: scale(1.05); }
        .bad-flag { accent-color: #ef4444; transform: scale(1.15); }

        .bad-comment { display: none; margin-top: 8px; }
        .bad-comment textarea {
          width: 100%;
          border-radius: 6px;
          border: 1px solid #fca5a5;
          padding: 6px 8px;
          font-size: 0.9rem;
          color: #7f1d1d;
          background: #fef2f2;
          resize: vertical;
          min-height: 50px;
        }

        .options label {
          display: flex; align-items: center; gap: 8px;
          padding: 6px 4px; cursor: pointer; color: #111; font-size: 0.95rem; line-height: 1.4;
        }
        .options input[type="radio"] { accent-color: #2563eb; transform: scale(1.1); }

        .icon { font-weight: bold; margin-left: 8px; display: inline-block; }
        .icon.correct { color: #16a34a; }
        .icon.incorrect { color: #dc2626; }

        .btn {
          background: #2563eb; color: white; border: none; padding: 10px 18px;
          border-radius: 6px; cursor: pointer; font-weight: bold;
          transition: background 0.25s ease; display: block; margin: 0.6rem auto;
        }
        .btn:hover { background: #1d4ed8; }
        .btn-trained { background: #fbbf24; color: #111; }
        .btn-trained:hover { background: #f59e0b; }
        .btn-bad { background: #ef4444; color: #fff; }
        .btn-bad:hover { background: #dc2626; }

        .btn-single {
          background: #e0e7ff; color: #1e3a8a; padding: 6px 10px;
          border-radius: 6px; font-weight: 600; font-size: 0.9rem; margin-top: 8px; border: 1px solid #c7d2fe;
        }

        .result { margin-top: 1.2rem; text-align: center; font-weight: 700; font-size: 1.1rem; padding-top: 8px; }
        .result.pass { color: #16a34a; }
        .result.fail { color: #dc2626; }

        .feedback { margin-top: 1.5rem; border-top: 1px solid #ddd; padding-top: 1rem; }
        .feedback h3 { margin: 0 0 8px; font-size: 1rem; color: #1e3a8a; }
        .feedback textarea {
          width: 100%; min-height: 70px; border-radius: 6px;
          border: 1px solid #cbd5e1; padding: 8px; resize: vertical;
        }
      </style>

      <div class="container">
        <h2>🧠 Test Generado</h2>
        <div class="content"></div>
        <button class="btn">Corregir todo</button>
        <button class="btn btn-trained">⭐ Guardar preguntas útiles</button>
        <button class="btn btn-bad">👎 Guardar preguntas malas</button>
        <div class="result"></div>

        <div class="feedback">
          <h3>📝 Comentarios generales sobre el test</h3>
          <textarea class="feedback-text" placeholder="Escribe aquí tus sugerencias o mejoras..."></textarea>
        </div>
      </div>
    `;

    const content = this.shadow.querySelector(".content");
    content.innerHTML = "";

    // 🔹 Renderizar todas las preguntas con sus opciones
    this.questions.forEach((q, idx) => {
      const div = document.createElement("div");
      div.className = "question";
      div.dataset.index = idx;

      const header = document.createElement("div");
      header.className = "question-header";
      header.innerHTML = `
        <p class="question-title"><strong>${idx + 1}. ${q.pregunta}</strong></p>
        <div class="flag-wrap">
          <label class="useful-wrap"><input type="checkbox" class="useful-flag"><span>⭐ Útil</span></label>
          <label class="bad-wrap"><input type="checkbox" class="bad-flag"><span>👎 Mala</span></label>
        </div>
      `;
      div.appendChild(header);

      const badComment = document.createElement("div");
      badComment.className = "bad-comment";
      badComment.innerHTML = `<textarea placeholder="Explica brevemente por qué esta pregunta es mala..."></textarea>`;
      div.appendChild(badComment);

      const good = header.querySelector(".useful-flag");
      const bad = header.querySelector(".bad-flag");
      bad.addEventListener("change", () => {
        good.checked = false;
        badComment.style.display = bad.checked ? "block" : "none";
      });
      good.addEventListener("change", () => {
        bad.checked = false;
        badComment.style.display = "none";
      });

      const optionsContainer = document.createElement("div");
      optionsContainer.className = "options";
      q.opciones.forEach((opt) => {
        const label = document.createElement("label");
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = `q-${idx}`;
        radio.value = opt.key;
        label.appendChild(radio);
        label.appendChild(document.createTextNode(` ${opt.label}`));
        optionsContainer.appendChild(label);
      });
      div.appendChild(optionsContainer);

      const singleBtn = document.createElement("button");
      singleBtn.className = "btn-single";
      singleBtn.textContent = "✅ Corregir esta";
      singleBtn.addEventListener("click", () => this._checkSingleQuestion(idx));
      div.appendChild(singleBtn);

      content.appendChild(div);
    });

    this.shadow.querySelector(".btn").addEventListener("click", () => this._checkAll());
    this.shadow.querySelector(".btn-trained").addEventListener("click", () => this._saveTrained());
    this.shadow.querySelector(".btn-bad").addEventListener("click", () => this._saveBad());
  }

  _checkSingleQuestion(i) {
    const q = this.questions[i];
    const questionDiv = this.shadow.querySelector(`.question[data-index="${i}"]`);
    questionDiv.classList.remove("correct", "incorrect");
    questionDiv.querySelectorAll(".icon").forEach((el) => el.remove());
    const selected = this.shadow.querySelector(`input[name="q-${i}"]:checked`);
    const allLabels = questionDiv.querySelectorAll(".options label");

    if (selected) {
      const selectedValue = selected.value;
      allLabels.forEach((label) => {
        const input = label.querySelector("input[type='radio']");
        const value = input.value;
        const icon = document.createElement("span");
        icon.classList.add("icon");

        if (value === q.correcta) {
          icon.textContent = "✅";
          icon.classList.add("correct");
          label.appendChild(icon);
        }
        if (value === selectedValue && selectedValue !== q.correcta) {
          icon.textContent = "❌";
          icon.classList.add("incorrect");
          label.appendChild(icon);
        }
      });

      if (selectedValue === q.correcta) questionDiv.classList.add("correct");
      else questionDiv.classList.add("incorrect");
    } else {
      questionDiv.classList.add("incorrect");
    }
  }

  _checkAll() {
    this.questions.forEach((_, i) => this._checkSingleQuestion(i));
    const total = this.questions.length;
    const correct = this.shadow.querySelectorAll(".question.correct").length;
    const percent = Math.round((correct / total) * 100);
    const passed = percent >= 50;
    const grade = passed ? "Aprobado 🎉" : "Suspenso 💀";
    this.shadow.querySelector(".result").innerHTML = `
      ✅ Aciertos: ${correct} / ${total} (${percent}%)
      <br><span class="${passed ? "pass" : "fail"}">${grade}</span>`;
  }

  async _saveTrained() {
    const selectedQuestions = [];
    this.questions.forEach((q, i) => {
      const isChecked = this.shadow.querySelector(`.question[data-index="${i}"] .useful-flag`)?.checked;
      if (isChecked) selectedQuestions.push(q);
    });

    if (selectedQuestions.length === 0) return alert("No hay preguntas marcadas como útiles.");
    await this._sendToBackend(selectedQuestions, "save-trained");
  }

  async _saveBad() {
  const badQuestions = [];
  this.questions.forEach((q, i) => {
    const badFlag = this.shadow.querySelector(`.question[data-index="${i}"] .bad-flag`);
    if (badFlag?.checked) {
      const comment = this.shadow.querySelector(`.question[data-index="${i}"] textarea`)?.value?.trim() || "";
      badQuestions.push({ ...q, comentario: comment });
    }
  });

  if (badQuestions.length === 0) {
    alert("No hay preguntas marcadas como malas.");
    return;
  }

  await this._sendToBackend(badQuestions, "save-bad");
}
  async _sendToBackend(selectedQuestions, route) {
    try {
      const tema = this.getAttribute("data-tema") || "SIN_TEMA";
      const sourceTest = this.getAttribute("data-source") || "custom";
      const feedback = this.shadow.querySelector(".feedback-text")?.value?.trim() || "";

      const res = await fetch(`/api/admin/assistants/${route}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedQuestions, sourceTest, tema, feedback }),
      });

      const data = await res.json();
      if (data.success)
        alert(`Guardado (${data.file}). Total preguntas: ${data.total || selectedQuestions.length}`);
      else alert("Error al guardar preguntas.");
    } catch (err) {
      console.error("❌ Error guardando preguntas:", err);
      alert("Error guardando preguntas");
    }
  }
}

if (!customElements.get("test-component")) {
  customElements.define("test-component", TestComponent);
}
