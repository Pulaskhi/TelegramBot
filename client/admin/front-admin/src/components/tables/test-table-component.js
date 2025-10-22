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

  _normalizeQuestions(arr) {
    const stripLetterPrefix = (s) => {
      const m =
        typeof s === "string"
          ? s.trim().match(/^[A-Za-z]\)\s*(.*)$/)
          : null;
      return m ? m[1] : typeof s === "string" ? s.trim() : "";
    };

    const letterFrom = (v) => {
      if (typeof v === "number") return String.fromCharCode(65 + v);
      if (typeof v === "string") {
        const m = v.trim().match(/[A-Za-z]/);
        return m ? m[0].toUpperCase() : "A";
      }
      return "A";
    };

    return (arr || []).map((q) => {
      const pregunta =
        q.pregunta || q.question || q.text || "Pregunta sin texto";

      let opcionesRaw = q.opciones || q.options || q.answers || [];
      if (!Array.isArray(opcionesRaw)) opcionesRaw = [];

      opcionesRaw = opcionesRaw.map((opt) => {
        if (typeof opt === "string") return opt;
        if (opt && typeof opt === "object")
          return opt.text || opt.label || opt.value || "";
        return "";
      });

      const opcionesLimpias = opcionesRaw.map(stripLetterPrefix);
      const opciones = opcionesLimpias.map((txt, i) => {
        const letter = String.fromCharCode(65 + i);
        return {
          key: letter,
          label: `${letter}) ${txt}`,
        };
      });

      const correcta = letterFrom(
        q.correcta ?? q.correct ?? q.correct_index ?? q.answer
      );

      return { pregunta, opciones, correcta };
    });
  }

  _render() {
    this.shadow.innerHTML = `
      <style>
        * { font-family: "Nunito Sans", sans-serif; box-sizing: border-box; }
        .container {
          background: #ffffff;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.08);
          color: #111;
          margin-top: 20px;
        }

        h2 {
          text-align: center;
          color: #1e3a8a;
          margin-bottom: 1rem;
          font-weight: 700;
        }

        .question {
          margin-bottom: 1.5rem;
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 8px;
          background: #fdfdfd;
          transition: background 0.2s ease, border-color 0.2s ease;
        }

        .question.correct {
          border-color: #22c55e;
          background: #e8f9ef;
        }

        .question.incorrect {
          border-color: #ef4444;
          background: #fdf0f0;
        }

        .options label {
          display: block;
          padding: 6px 4px;
          cursor: pointer;
          color: #111;
          position: relative;
          font-size: 0.95rem;
          line-height: 1.4;
        }

        .options input[type="radio"] {
          accent-color: #2563eb;
          margin-right: 8px;
          transform: scale(1.1);
        }

        /* ✅ y ❌ */
        .icon {
          font-weight: bold;
          margin-left: 8px;
          display: inline-block;
        }
        .icon.correct { color: #16a34a; }
        .icon.incorrect { color: #dc2626; }

        .btn {
          background: #2563eb;
          color: white;
          border: none;
          padding: 10px 18px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          transition: background 0.25s ease;
          display: block;
          margin: 0 auto;
        }

        .btn:hover {
          background: #1d4ed8;
        }

        .result {
          margin-top: 1.2rem;
          text-align: center;
          font-weight: 700;
          font-size: 1.1rem;
          padding-top: 8px;
        }

        .result.pass { color: #16a34a; }
        .result.fail { color: #dc2626; }
      </style>

      <div class="container">
        <h2>🧠 Test Generado</h2>
        <div class="content"></div>
        <button class="btn">Corregir</button>
        <div class="result"></div>
      </div>
    `;

    const content = this.shadow.querySelector(".content");
    content.innerHTML = "";

    this.questions.forEach((q, idx) => {
      const div = document.createElement("div");
      div.className = "question";
      div.dataset.index = idx;

      const optionsHtml = q.opciones
        .map(
          (opt) => `
            <label>
              <input type="radio" name="q-${idx}" value="${opt.key}">
              ${opt.label}
            </label>
          `
        )
        .join("");

      div.innerHTML = `
        <p><strong>${idx + 1}. ${q.pregunta}</strong></p>
        <div class="options">${optionsHtml}</div>
      `;
      content.appendChild(div);
    });

    this.shadow.querySelector(".btn").addEventListener("click", () =>
      this._checkAnswers()
    );
  }

  _checkAnswers() {
    let correct = 0;

    this.questions.forEach((q, i) => {
      const questionDiv = this.shadow.querySelector(
        `.question[data-index="${i}"]`
      );
      questionDiv.classList.remove("correct", "incorrect");
      questionDiv.querySelectorAll(".icon").forEach((el) => el.remove());

      const selected = this.shadow.querySelector(
        `input[name="q-${i}"]:checked`
      );

      const allOptions = questionDiv.querySelectorAll("label");

      if (selected) {
        const selectedValue = selected.value;

        allOptions.forEach((label) => {
          const input = label.querySelector("input");
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

        if (selectedValue === q.correcta) {
          correct++;
          questionDiv.classList.add("correct");
        } else {
          questionDiv.classList.add("incorrect");
        }
      } else {
        questionDiv.classList.add("incorrect");
      }
    });

    const resultDiv = this.shadow.querySelector(".result");
    const total = this.questions.length;
    const percent = Math.round((correct / total) * 100);
    const passed = percent >= 50;
    const grade = passed ? "Aprobado 🎉" : "Suspenso 💀";

    resultDiv.innerHTML = `
      ✅ Aciertos: ${correct} / ${total} (${percent}%)
      <br>
      <span class="${passed ? "pass" : "fail"}">${grade}</span>
    `;
  }
}

customElements.define("test-component", TestComponent);
