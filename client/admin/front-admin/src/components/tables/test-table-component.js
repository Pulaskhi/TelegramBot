class TestComponent extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.questions = [];
  }

  set dataQuestions(val) {
    try {
      const parsed = Array.isArray(val) ? val : JSON.parse(val);
      this.questions = this._normalizeQuestions(parsed);
      this._render();
    } catch (e) {
      console.error('❌ dataQuestions inválido:', e);
      this.questions = [];
      this._render();
    }
  }

  connectedCallback() {
    if (!this.questions?.length) {
      const dataAttr = this.getAttribute('data-questions');
      if (dataAttr) {
        try {
          const parsed = JSON.parse(dataAttr);
          this.questions = this._normalizeQuestions(parsed);
        } catch (e) {
          console.error('❌ Error parseando data-questions:', e);
        }
      }
    }
    this._render();
  }

  _normalizeQuestions(arr) {
    return (arr || []).map((q) => {
      const pregunta = q.pregunta || q.question || q.text || 'Pregunta sin texto';
      const respuestas = q.respuestas || q.opciones || q.answers || q.options || [];
      const opcionesLimpias = (Array.isArray(respuestas) ? respuestas : Object.values(respuestas)).map((txt, i) => {
        const letter = String.fromCharCode(65 + i);
        return { key: letter, label: `${letter}) ${txt}` };
      });

      let correcta = 'A';
      if (typeof q.correcta === 'number') correcta = String.fromCharCode(64 + q.correcta);
      else if (typeof q.correcta === 'string') correcta = q.correcta.toUpperCase().trim();
      else if (typeof q.correct === 'number') correcta = String.fromCharCode(64 + q.correct);
      else if (typeof q.correct === 'string') correcta = q.correct.toUpperCase().trim();

      return { pregunta, opciones: opcionesLimpias, correcta };
    });
  }

  _render() {
    const style = `
      <style>
        :host{display:block;height:100%}
        *{box-sizing:border-box;font-family:Nunito Sans, sans-serif}
        .container{background:#fff;border-radius:12px;padding:18px;display:flex;flex-direction:column;height:100%;max-width:100%;box-sizing:border-box}
        .content{flex:1;overflow:auto;padding-right:6px;padding-bottom:72px;max-width:100%;word-break:break-word}
        .question{margin-bottom:1rem;padding:12px;border-radius:8px;border:1px solid #eee;background:#fff;word-break:break-word}
        .question.correct{border-color:#22c55e;background:#e8f9ef}
        .question.incorrect{border-color:#ef4444;background:#fdf0f0}
        .question-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
        .q-counter{display:inline-block;margin-right:10px;padding:4px 8px;background:rgba(15,23,42,0.03);border-radius:6px;font-weight:700;color:#374151;font-size:0.9rem}
        .options label{display:flex;align-items:center;gap:8px;padding:6px 4px;cursor:pointer;white-space:normal}
        .flag-wrap{display:flex;gap:8px;align-items:center}
        .bad-comment{display:none;margin-top:8px}
        .toolbar{display:flex;gap:8px;align-items:center;margin-top:8px;position:sticky;bottom:0;background:linear-gradient(180deg, rgba(255,255,255,0), #fff);padding-top:8px}
        .btn{background:#2563eb;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer}
        .btn-trained{background:#fbbf24;color:#111}
        .btn-bad{background:#ef4444}
        .btn-single{background:#e0e7ff;color:#1e3a8a;padding:6px 10px;border-radius:6px;border:1px solid #c7d2fe}
        .result{margin-left:auto;font-weight:700}
      </style>`;

    this.shadow.innerHTML = `${style}<div class="container"><div class="content"></div>
      <div class="toolbar"><button class="btn">Corregir</button><button class="btn btn-trained">Guardar entrenadas</button><button class="btn btn-bad">Guardar malas</button><div class="result"></div></div></div>`;

    const content = this.shadow.querySelector('.content');
    content.innerHTML = '';

    this.questions.forEach((q, idx) => {
      const div = document.createElement('div');
      div.className = 'question';
      div.dataset.index = idx;

      const header = document.createElement('div');
      header.className = 'question-header';
      const counter = document.createElement('span');
      counter.className = 'q-counter';
      counter.textContent = `${idx + 1}/${this.questions.length}`;
      const h = document.createElement('h4');
      h.textContent = q.pregunta;
      header.appendChild(counter);
      header.appendChild(h);

      const flagWrap = document.createElement('div');
      flagWrap.className = 'flag-wrap';

      const usefulLabel = document.createElement('label');
      const useful = document.createElement('input');
      useful.type = 'checkbox';
      useful.className = 'useful-flag';
      usefulLabel.appendChild(useful);
      usefulLabel.appendChild(document.createTextNode(' Útil'));
      flagWrap.appendChild(usefulLabel);

      const badLabel = document.createElement('label');
      const bad = document.createElement('input');
      bad.type = 'checkbox';
      bad.className = 'bad-flag';
      badLabel.appendChild(bad);
      badLabel.appendChild(document.createTextNode(' Mala'));
      flagWrap.appendChild(badLabel);

      header.appendChild(flagWrap);
      div.appendChild(header);

      const options = document.createElement('div');
      options.className = 'options';
      q.opciones.forEach((opt) => {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `q-${idx}`;
        radio.value = opt.key;
        label.appendChild(radio);
        label.appendChild(document.createTextNode(` ${opt.label}`));
        options.appendChild(label);
      });
      div.appendChild(options);

      const singleBtn = document.createElement('button');
      singleBtn.className = 'btn-single';
      singleBtn.textContent = '✅ Corregir esta';
      singleBtn.addEventListener('click', () => this._checkSingleQuestion(idx));
      div.appendChild(singleBtn);

      const badComment = document.createElement('div');
      badComment.className = 'bad-comment';
      const ta = document.createElement('textarea');
      badComment.appendChild(ta);
      div.appendChild(badComment);

      bad.addEventListener('change', () => {
        badComment.style.display = bad.checked ? 'block' : 'none';
        if (bad.checked) useful.checked = false;
      });
      useful.addEventListener('change', () => {
        if (useful.checked) bad.checked = false;
      });

      content.appendChild(div);
    });

    this.shadow.querySelector('.btn').addEventListener('click', () => this._checkAll());
    this.shadow.querySelector('.btn-trained').addEventListener('click', () => this._saveTrained());
    this.shadow.querySelector('.btn-bad').addEventListener('click', () => this._saveBad());
  }

  _checkSingleQuestion(i) {
    const q = this.questions[i];
    const questionDiv = this.shadow.querySelector(`.question[data-index="${i}"]`);
    if (!questionDiv) return;
    questionDiv.classList.remove('correct', 'incorrect');
    questionDiv.querySelectorAll('.icon').forEach((el) => el.remove());
    const selected = this.shadow.querySelector(`input[name="q-${i}"]:checked`);
    const allLabels = questionDiv.querySelectorAll('.options label');

    if (selected) {
      const selectedValue = selected.value;
      allLabels.forEach((label) => {
        const input = label.querySelector("input[type='radio']");
        const value = input.value;
        const icon = document.createElement('span');
        icon.classList.add('icon');

        if (value === q.correcta) {
          icon.textContent = '✅';
          icon.classList.add('correct');
          label.appendChild(icon);
        }
        if (value === selectedValue && selectedValue !== q.correcta) {
          icon.textContent = '❌';
          icon.classList.add('incorrect');
          label.appendChild(icon);
        }
      });

      if (selected.value === q.correcta) questionDiv.classList.add('correct');
      else questionDiv.classList.add('incorrect');
    } else {
      questionDiv.classList.add('incorrect');
    }
  }

  _checkAll() {
    this.questions.forEach((_, i) => this._checkSingleQuestion(i));
    const total = this.questions.length;
    const correct = this.shadow.querySelectorAll('.question.correct').length;
    const percent = Math.round((correct / Math.max(total, 1)) * 100);
    const passed = percent >= 50;
    const grade = passed ? 'Aprobado' : 'Suspenso';
    this.shadow.querySelector('.result').innerHTML = `✅ Aciertos: ${correct} / ${total} (${percent}%) — <strong>${grade}</strong>`;
  }

  async _saveTrained() {
    const selectedQuestions = [];
    this.questions.forEach((q, i) => {
      const isChecked = this.shadow.querySelector(`.question[data-index="${i}"] .useful-flag`)?.checked;
      if (isChecked) selectedQuestions.push(q);
    });

    if (selectedQuestions.length === 0) return alert('No hay preguntas marcadas como útiles.');
    await this._sendToBackend(selectedQuestions, 'save-trained');
  }

  async _saveBad() {
    const badQuestions = [];
    this.questions.forEach((q, i) => {
      const badFlag = this.shadow.querySelector(`.question[data-index="${i}"] .bad-flag`);
      if (badFlag?.checked) {
        const comment = this.shadow.querySelector(`.question[data-index="${i}"] textarea`)?.value?.trim() || '';
        badQuestions.push({ ...q, comentario: comment });
      }
    });

    if (badQuestions.length === 0) return alert('No hay preguntas marcadas como malas.');
    await this._sendToBackend(badQuestions, 'save-bad');
  }

  async _sendToBackend(selectedQuestions, route) {
    try {
      const tema = this.getAttribute('data-tema') || 'SIN_TEMA';
      const sourceTest = this.getAttribute('data-source') || 'custom';
      const feedback = this.shadow.querySelector('.feedback-text')?.value?.trim() || '';

      const res = await fetch(`/api/admin/assistants/${route}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedQuestions, sourceTest, tema, feedback }),
      });

      const data = await res.json();
      if (data.success) alert(`Guardado (${data.file}). Total preguntas: ${data.total || selectedQuestions.length}`);
      else alert('Error al guardar preguntas.');
    } catch (err) {
      console.error('❌ Error guardando preguntas:', err);
      alert('Error guardando preguntas');
    }
  }
}

if (!customElements.get('test-component')) {
  customElements.define('test-component', TestComponent);
}

