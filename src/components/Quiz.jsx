import React, { useEffect, useMemo, useState } from 'react';

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function evaluate(questions, answers) {
  const details = [];
  let correctCount = 0;
  questions.forEach((q, idx) => {
    const selected = new Set(answers[idx] || []);
    const correctSet = new Set();
    q.options.forEach((o, i) => o.correct && correctSet.add(i));
    const isCorrect = setsEqual(selected, correctSet);
    if (isCorrect) correctCount++;
    details.push({
      idx,
      title: q.title,
      images: q.images || [],
      correct: isCorrect,
      selected: Array.from(selected.values()),
      correctIndexes: Array.from(correctSet.values()),
      options: q.options
    });
  });
  return { details, correctCount };
}

function useCountdown(enabled, secondsInitial, deps, onExpire) {
  const [remaining, setRemaining] = useState(enabled ? secondsInitial : null);

  useEffect(() => {
    if (!enabled) return;
    setRemaining(secondsInitial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!enabled) return;
    if (remaining === null) return;
    if (remaining <= 0) {
      onExpire?.();
      return;
    }
    const t = setTimeout(() => setRemaining((s) => (s ?? 0) - 1), 1000);
    return () => clearTimeout(t);
  }, [enabled, remaining, onExpire]);

  const mm = Math.max(0, Math.floor((remaining ?? 0) / 60));
  const ss = Math.max(0, (remaining ?? 0) % 60);
  const formatted = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;

  return { remaining, formatted, setRemaining };
}

export default function Quiz({ questions, config, onFinish, onPersist }) {
  const persisted = useMemo(() => {
    try {
      const raw = localStorage.getItem('psd-sim-state-v1');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.data ?? null;
    } catch {
      return null;
    }
  }, []);

  const [current, setCurrent] = useState(persisted?.current ?? 0);
  const [answers, setAnswers] = useState(
    () => persisted?.answers ?? Array.from({ length: questions.length }, () => [])
  );
  const [feedback, setFeedback] = useState(null);

  const totalSeconds = (config.timerEnabled ? (config.minutes * 60) : null);
  const [globalRemaining, setGlobalRemaining] = useState(
    persisted?.globalRemaining ?? totalSeconds
  );

  useEffect(() => {
    if (!config.timerEnabled) return;
    if (globalRemaining === null) setGlobalRemaining(config.minutes * 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.timerEnabled, config.minutes]);

  useEffect(() => {
    if (!config.timerEnabled) return;
    if (globalRemaining === null) return;
    if (globalRemaining <= 0) {
      const res = evaluate(questions, answers);
      onFinish(res);
      return;
    }
    const t = setTimeout(() => setGlobalRemaining((s) => (s ?? 0) - 1), 1000);
    return () => clearTimeout(t);
  }, [config.timerEnabled, globalRemaining, questions, answers, onFinish]);

  const perQEnabled = config.perQuestionTimerEnabled;
  const perQSeconds = config.perQuestionSeconds;

  const {
    remaining: perQRemaining,
    formatted: perQFormatted,
    setRemaining: setPerQRemaining
  } = useCountdown(
    perQEnabled,
    perQSeconds,
    [current],
    () => {
      if (current < questions.length - 1) {
        setCurrent((c) => c + 1);
      } else {
        const res = evaluate(questions, answers);
        onFinish(res);
      }
    }
  );

  const total = questions.length;
  const q = questions[current];
  const isMulti = q?.multiCorrect;
  const progressBarPct = Math.round((current) / (total) * 100);

  useEffect(() => {
    onPersist?.({
      config,
      questions,
      current,
      answers,
      globalRemaining,
      perQRemaining: perQEnabled ? perQRemaining : null
    });
  }, [config, questions, current, answers, globalRemaining, perQEnabled, perQRemaining, onPersist]);

  useEffect(() => {
    if (perQEnabled && persisted?.perQRemaining != null) {
      setPerQRemaining(persisted.perQRemaining);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleOption(i) {
    setAnswers(prev => {
      const next = prev.map(a => [...a]);
      const arr = new Set(next[current] || []);
      if (isMulti) {
        if (arr.has(i)) arr.delete(i);
        else arr.add(i);
        next[current] = Array.from(arr.values()).sort((a, b) => a - b);
      } else {
        next[current] = [i];
      }
      return next;
    });
  }

  function saveAndNext() {
    if (!answers[current] || answers[current].length === 0) {
      alert('Selecione ao menos uma alternativa.');
      return;
    }

    if (config.showImmediate) {
      const correctTexts = q.options
        .map((o, i) => ({ o, i }))
        .filter(x => x.o.correct)
        .map(x => x.o.text);

      const correctSet = new Set(q.options.map((o, i) => (o.correct ? i : null)).filter(v => v !== null));
      const selectedSet = new Set(answers[current] || []);
      const isCorrect = setsEqual(correctSet, selectedSet);
      setFeedback({ correct: isCorrect, correctTexts });

      if (current < total - 1) {
        setTimeout(() => {
          setFeedback(null);
          setCurrent(c => c + 1);
        }, 600);
      }
      return;
    }

    if (current < total - 1) {
      setCurrent(c => c + 1);
    }
  }

  function prev() {
    setFeedback(null);
    if (current > 0) setCurrent(c => c - 1);
  }

  function finish() {
    for (let i = 0; i < total; i++) {
      if (!answers[i] || answers[i].length === 0) {
        setCurrent(i);
        alert('Você ainda não respondeu todas as perguntas. Complete para finalizar.');
        return;
      }
    }
    const res = evaluate(questions, answers);
    onFinish(res);
  }

  const fmtQuestionCount = `Pergunta ${current + 1} de ${total}`;
  const globalMm = Math.max(0, Math.floor((globalRemaining ?? 0) / 60));
  const globalSs = Math.max(0, (globalRemaining ?? 0) % 60);
  const globalFormatted = `${String(globalMm).padStart(2, '0')}:${String(globalSs).padStart(2, '0')}`;
  const globalProgressPct = config.timerEnabled && totalSeconds
    ? Math.min(100, Math.max(0, 100 * (1 - (globalRemaining ?? 0) / totalSeconds)))
    : 0;

  return (
    <section className="card">
      <div className="quiz-header">
        <div id="progress" className="progress">
          <span style={{ width: `${progressBarPct}%` }} />
        </div>
        <div id="question-count">{fmtQuestionCount}</div>
      </div>

      {(config.timerEnabled || perQEnabled) && (
        <div className="timer" style={{ flexWrap: 'wrap' }}>
          {config.timerEnabled && (
            <>
              <div className="timer-bar"><span style={{ width: `${globalProgressPct}%` }} /></div>
              <div className="timer-val">Total: {globalFormatted}</div>
            </>
          )}
          {perQEnabled && (
            <>
              <div className="timer-bar"><span style={{ width: `${Math.min(100, Math.max(0, 100 * (1 - (perQRemaining ?? 0) / perQSeconds))) }%` }} /></div>
              <div className="timer-val">Questão: {perQFormatted}</div>
            </>
          )}
        </div>
      )}

      <div className="question-title">{q.title}</div>

      {q.images && q.images.length > 0 && (
        <div className="question-images">
          {q.images.map((src, i) => (
            <img key={i} src={src.startsWith('http') ? src : src} alt="Imagem da pergunta" />
          ))}
        </div>
      )}

      <div className="muted">{isMulti ? 'Selecione uma ou mais alternativas' : 'Selecione uma alternativa'}</div>

      <div className="options">
        {q.options.map((opt, i) => {
          const selected = (answers[current] || []).includes(i);
          const type = isMulti ? 'checkbox' : 'radio';
          return (
            <label key={i} className="option">
              <input
                type={type}
                name="opt"
                checked={selected}
                onChange={() => toggleOption(i)}
              />
              <span>{opt.text}</span>
            </label>
          );
        })}
      </div>

      {feedback && (
        <div id="feedback" className={`feedback ${feedback.correct ? 'ok' : 'err'}`}>
          <div className="title">{feedback.correct ? 'Correto!' : 'Resposta incorreta.'}</div>
          <div>
            <strong>Gabarito:</strong><br />
            {feedback.correctTexts.map((t, idx) => <div key={idx}>• {t}</div>)}
          </div>
        </div>
      )}

      <div className="actions">
        <button className="btn" onClick={prev} disabled={current === 0}>Anterior</button>
        <button className="btn primary" onClick={saveAndNext}>
          {current === total - 1 ? 'Salvar' : 'Salvar e Próxima'}
        </button>
        <button className="btn danger" onClick={finish}>Finalizar</button>
      </div>
    </section>
  );
}