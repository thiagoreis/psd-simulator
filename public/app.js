(function () {
  const $ = (sel) => document.querySelector(sel);
  const elStart = $('#screen-start');
  const elQuiz = $('#screen-quiz');
  const elResults = $('#screen-results');

  const elStartStatus = $('#start-status');
  const elQtd = $('#qtd');
  const elBtnLoad = $('#btn-load');
  const elBtnStart = $('#btn-start');
  const elShowImmediate = $('#show-correct-immediately');

  const elProgress = $('#progress');
  const elQuestionCount = $('#question-count');
  const elQuestionArea = $('#question-area');
  const elFeedback = $('#feedback');
  const elPrev = $('#btn-prev');
  const elNext = $('#btn-next');
  const elFinish = $('#btn-finish');

  const elSummary = $('#summary');
  const elDetails = $('#details');
  const elRestart = $('#btn-restart');

  const state = {
    allQuestions: [],
    quizQuestions: [],
    current: 0,
    answers: new Map(), // key: index, val: Set of option indexes
    showCorrectImmediately: false
  };

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function loadQuestions() {
    elStartStatus.textContent = 'Carregando questions.json...';
    return fetch('./questions.json', { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('Não foi possível carregar questions.json');
        return r.json();
      })
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Nenhuma pergunta encontrada no questions.json');
        }
        state.allQuestions = data;
        elStartStatus.textContent = `Carregado: ${data.length} perguntas disponíveis.`;
        elBtnStart.disabled = false;
      })
      .catch((err) => {
        console.error(err);
        elStartStatus.textContent = 'Erro: ' + err.message;
        elBtnStart.disabled = true;
      });
  }

  function startQuiz() {
    const qtd = Math.max(1, Math.min(Number(elQtd.value || 20), state.allQuestions.length));
    const randomized = shuffle(state.allQuestions).slice(0, qtd);
    state.quizQuestions = randomized;
    state.current = 0;
    state.answers = new Map();
    state.showCorrectImmediately = elShowImmediate.checked;

    elStart.classList.add('hidden');
    elResults.classList.add('hidden');
    elQuiz.classList.remove('hidden');

    renderQuestion();
  }

  function renderProgress() {
    const total = state.quizQuestions.length;
    const idx = state.current + 1;
    const pct = Math.round((idx - 1) / total * 100);
    elProgress.innerHTML = `<span style="width:${pct}%"></span>`;
    elQuestionCount.textContent = `Pergunta ${idx} de ${total}`;
  }

  function renderQuestion() {
    const q = state.quizQuestions[state.current];
    renderProgress();
    elFeedback.classList.add('hidden');
    elFeedback.innerHTML = '';

    const selectedSet = state.answers.get(state.current) || new Set();

    const titleHtml = `<div class="question-title">${escapeHtml(q.title)}</div>`;
    const imagesHtml = (q.images && q.images.length > 0)
      ? `<div class="question-images">` + q.images.map(src => {
        const safeSrc = src.startsWith('http') ? src : src;
        return `<img src="${escapeAttr(safeSrc)}" alt="Imagem da pergunta" />`;
      }).join('') + `</div>`
      : '';

    const isMulti = q.multiCorrect;
    const optionsHtml = q.options.map((opt, i) => {
      const checked = selectedSet.has(i) ? 'checked' : '';
      const inputType = isMulti ? 'checkbox' : 'radio';
      return `
        <label class="option">
          <input type="${inputType}" name="opt" data-idx="${i}" ${checked} />
          <span>${escapeHtml(opt.text)}</span>
        </label>
      `;
    }).join('');

    elQuestionArea.innerHTML = `
      ${titleHtml}
      ${imagesHtml}
      <div class="muted">${isMulti ? 'Selecione uma ou mais alternativas' : 'Selecione uma alternativa'}</div>
      <div class="options">${optionsHtml}</div>
    `;

    // Navigation buttons
    elPrev.disabled = state.current === 0;
    elNext.textContent = state.current === state.quizQuestions.length - 1 ? 'Salvar' : 'Salvar e Próxima';
  }

  function getSelectedFromUI() {
    const inputs = elQuestionArea.querySelectorAll('input[name="opt"]');
    const selected = new Set();
    inputs.forEach((el) => {
      if (el.checked) {
        selected.add(Number(el.getAttribute('data-idx')));
      }
    });
    return selected;
  }

  function storeCurrentAnswer() {
    const selected = getSelectedFromUI();
    // Bloqueia avanço sem marcar nada
    if (selected.size === 0) return { ok: false, reason: 'Selecione ao menos uma alternativa.' };
    state.answers.set(state.current, selected);
    return { ok: true };
  }

  function setsEqual(a, b) {
    if (a.size !== b.size) return false;
    for (const v of a) if (!b.has(v)) return false;
    return true;
  }

  function isAnswerCorrect(q, selectedSet) {
    const correctSet = new Set();
    q.options.forEach((o, i) => o.correct && correctSet.add(i));
    return setsEqual(correctSet, selectedSet);
  }

  function showImmediateFeedback() {
    const q = state.quizQuestions[state.current];
    const selected = state.answers.get(state.current) || new Set();
    const correct = isAnswerCorrect(q, selected);

    elFeedback.classList.remove('hidden');
    elFeedback.classList.toggle('ok', correct);
    elFeedback.classList.toggle('err', !correct);

    const correctOptions = q.options
      .map((o, i) => ({ ...o, i }))
      .filter(o => o.correct)
      .map(o => `• ${escapeHtml(o.text)}`)
      .join('<br>');

    elFeedback.innerHTML = `
      <div class="title">${correct ? 'Correto!' : 'Resposta incorreta.'}</div>
      <div><strong>Gabarito:</strong><br>${correctOptions}</div>
    `;
  }

  function finishQuiz() {
    // Previne finalizar sem responder todas
    const total = state.quizQuestions.length;
    for (let i = 0; i < total; i++) {
      if (!state.answers.has(i) || state.answers.get(i).size === 0) {
        state.current = i;
        renderQuestion();
        alert('Você ainda não respondeu todas as perguntas. Complete para finalizar.');
        return;
      }
    }

    const details = [];
    let correctCount = 0;

    state.quizQuestions.forEach((q, idx) => {
      const selected = state.answers.get(idx) || new Set();
      const correct = isAnswerCorrect(q, selected);
      if (correct) correctCount++;

      const correctIndexes = new Set(q.options.map((o, i) => o.correct ? i : null).filter(v => v !== null));
      details.push({
        idx,
        title: q.title,
        correct,
        selected: Array.from(selected.values()),
        correctIndexes: Array.from(correctIndexes.values()),
        options: q.options
      });
    });

    const wrongCount = state.quizQuestions.length - correctCount;

    elQuiz.classList.add('hidden');
    elResults.classList.remove('hidden');

    elSummary.innerHTML = `
      <div class="result-grid">
        <div class="kpi"><div class="label">Total</div><div class="val">${state.quizQuestions.length}</div></div>
        <div class="kpi"><div class="label">Acertos</div><div class="val" style="color: var(--green)">${correctCount}</div></div>
        <div class="kpi"><div class="label">Erros</div><div class="val" style="color: var(--danger)">${wrongCount}</div></div>
      </div>
    `;

    elDetails.innerHTML = details.map(d => {
      const badge = d.correct ? '<span class="badge ok">Correto</span>' : '<span class="badge err">Errado</span>';
      const opts = d.options.map((o, i) => {
        const isCorrect = d.correctIndexes.includes(i);
        const isSelected = d.selected.includes(i);
        let mark = '';
        if (isCorrect && isSelected) mark = '✅ (correta e marcada)';
        else if (isCorrect && !isSelected) mark = '✔️ (correta)';
        else if (!isCorrect && isSelected) mark = '❌ (marcada)';
        return `<div> - ${escapeHtml(o.text)} ${mark}</div>`;
      }).join('');

      return `
        <div class="detail-item">
          <div><strong>${(d.idx + 1)}. ${escapeHtml(d.title)}</strong> ${badge}</div>
          <div style="margin-top:6px">${opts}</div>
        </div>
      `;
    }).join('');
  }

  function escapeHtml(s = '') {
    return s.replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }
  function escapeAttr(s = '') {
    return s.replace(/"/g, '&quot;');
  }

  // Eventos
  elBtnLoad.addEventListener('click', loadQuestions);
  elBtnStart.addEventListener('click', startQuiz);

  elPrev.addEventListener('click', () => {
    // Salva seleção atual (se houver) antes de voltar
    const sel = getSelectedFromUI();
    if (sel.size > 0) state.answers.set(state.current, sel);
    if (state.current > 0) {
      state.current--;
      renderQuestion();
    }
  });

  elNext.addEventListener('click', () => {
    const res = storeCurrentAnswer();
    if (!res.ok) {
      alert(res.reason);
      return;
    }

    if (state.showCorrectImmediately) {
      showImmediateFeedback();
      // Dá um pequeno delay antes de avançar
      setTimeout(() => {
        if (state.current < state.quizQuestions.length - 1) {
          state.current++;
          renderQuestion();
        }
      }, 600);
      // Se for a última, não avança automaticamente
      if (state.current === state.quizQuestions.length - 1) {
        // apenas mostra feedback; usuário decide finalizar
      }
    } else {
      if (state.current < state.quizQuestions.length - 1) {
        state.current++;
        renderQuestion();
      }
    }
  });

  elFinish.addEventListener('click', finishQuiz);
  elRestart.addEventListener('click', () => {
    // Volta para tela inicial
    elResults.classList.add('hidden');
    elStart.classList.remove('hidden');
  });

  // Tenta carregar automaticamente ao abrir
  loadQuestions();
})();