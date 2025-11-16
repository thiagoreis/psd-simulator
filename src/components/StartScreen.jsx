import React, { useEffect, useState } from 'react';

export default function StartScreen({ loading, error, total, defaultConfig, canResume, onStart, onResume, onClearSaved }) {
  const [quantity, setQuantity] = useState(defaultConfig.quantity ?? 20);
  const [showImmediate, setShowImmediate] = useState(defaultConfig.showImmediate ?? false);

  const [timerEnabled, setTimerEnabled] = useState(defaultConfig.timerEnabled ?? true);
  const [minutes, setMinutes] = useState(defaultConfig.minutes ?? 30);

  const [perQuestionTimerEnabled, setPerQuestionTimerEnabled] = useState(defaultConfig.perQuestionTimerEnabled ?? false);
  const [perQuestionSeconds, setPerQuestionSeconds] = useState(defaultConfig.perQuestionSeconds ?? 60);

  useEffect(() => {
    setQuantity(defaultConfig.quantity ?? 20);
    setShowImmediate(defaultConfig.showImmediate ?? false);
    setTimerEnabled(defaultConfig.timerEnabled ?? true);
    setMinutes(defaultConfig.minutes ?? 30);
    setPerQuestionTimerEnabled(defaultConfig.perQuestionTimerEnabled ?? false);
    setPerQuestionSeconds(defaultConfig.perQuestionSeconds ?? 60);
  }, [defaultConfig]);

  const canStart = !loading && !error && total > 0;

  return (
    <section className="card">
      <h2>Configurar simulado</h2>
      <div className="muted" style={{ marginBottom: 8 }}>
        {loading && 'Carregando questions.json...'}
        {!loading && error && <span style={{ color: 'var(--danger)' }}>Erro: {error}</span>}
        {!loading && !error && <span>{total} questões disponíveis.</span>}
      </div>

      <div className="form-row">
        <label htmlFor="qtd">Quantidade de questões</label>
        <input
          id="qtd"
          type="number"
          min="1"
          max={Math.max(1, total)}
          value={quantity}
          onChange={e => setQuantity(Number(e.target.value))}
        />
      </div>

      <div className="form-row">
        <label>
          <input
            type="checkbox"
            checked={showImmediate}
            onChange={e => setShowImmediate(e.target.checked)}
          />
          Mostrar se acertei/errei ao avançar
        </label>
      </div>

      <div className="form-row">
        <label>
          <input
            type="checkbox"
            checked={timerEnabled}
            onChange={e => setTimerEnabled(e.target.checked)}
          />
          Ativar timer total
        </label>
        <input
          type="number"
          min="1"
          step="1"
          value={minutes}
          disabled={!timerEnabled}
          onChange={e => setMinutes(Number(e.target.value))}
          title="Minutos"
        />
        <span className="muted">min</span>
      </div>

      <div className="form-row">
        <label>
          <input
            type="checkbox"
            checked={perQuestionTimerEnabled}
            onChange={e => setPerQuestionTimerEnabled(e.target.checked)}
          />
          Ativar timer por questão
        </label>
        <input
          type="number"
          min="5"
          step="5"
          value={perQuestionSeconds}
          disabled={!perQuestionTimerEnabled}
          onChange={e => setPerQuestionSeconds(Number(e.target.value))}
          title="Segundos por questão"
        />
        <span className="muted">seg</span>
      </div>

      <div className="actions" style={{ flexWrap: 'wrap' }}>
        <button
          className="btn primary"
          disabled={!canStart}
          onClick={() =>
            onStart({
              quantity: Number(quantity),
              showImmediate,
              timerEnabled,
              minutes: Number(minutes) || 1,
              perQuestionTimerEnabled,
              perQuestionSeconds: Number(perQuestionSeconds) || 60
            })
          }
        >
          Iniciar
        </button>

        {canResume && (
          <>
            <button className="btn" onClick={onResume}>Retomar simulado salvo</button>
            <button className="btn danger" onClick={onClearSaved}>Descartar simulado salvo</button>
          </>
        )}
      </div>
    </section>
  );
}