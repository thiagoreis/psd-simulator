import React, { useEffect, useMemo, useState } from 'react';
import StartScreen from './components/StartScreen.jsx';
import Quiz from './components/Quiz.jsx';
import Results from './components/Results.jsx';
import { loadState, saveState, clearState } from './utils/persist.js';

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function App() {
  const [allQuestions, setAllQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');

  const [mode, setMode] = useState('start'); // start | quiz | results

  const [quizConfig, setQuizConfig] = useState({
    quantity: 20,
    showImmediate: false,
    timerEnabled: true,
    minutes: 30,
    perQuestionTimerEnabled: false,
    perQuestionSeconds: 60
  });

  const [quizQuestions, setQuizQuestions] = useState([]);
  const [results, setResults] = useState(null);
  const [canResume, setCanResume] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setLoadErr('');
        const res = await fetch('/questions.json', { cache: 'no-store' });
        if (!res.ok) throw new Error('Não foi possível carregar public/questions.json. Execute "npm run questions".');
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Nenhuma pergunta encontrada em questions.json.');
        }
        setAllQuestions(data);
      } catch (e) {
        setLoadErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    };
    load();

    const persisted = loadState();
    setCanResume(!!persisted);
  }, []);

  function startQuiz(cfg) {
    const qty = Math.max(1, Math.min(cfg.quantity, allQuestions.length));
    const selected = shuffle(allQuestions).slice(0, qty);

    clearState();

    setQuizQuestions(selected);
    setQuizConfig(cfg);
    setResults(null);
    setMode('quiz');
  }

  function resumeQuiz() {
    const persisted = loadState();
    if (!persisted) return;

    setQuizConfig(persisted.config);
    setQuizQuestions(persisted.questions);
    setMode('quiz');
  }

  function finishQuiz(res) {
    setResults(res);
    setMode('results');
    clearState();
    setCanResume(false);
  }

  function restart() {
    setMode('start');
    setResults(null);
  }

  const content = useMemo(() => {
    if (mode === 'start') {
      return (
        <StartScreen
          loading={loading}
          error={loadErr}
          total={allQuestions.length}
          defaultConfig={quizConfig}
          canResume={canResume}
          onStart={startQuiz}
          onResume={resumeQuiz}
          onClearSaved={() => {
            clearState();
            setCanResume(false);
          }}
        />
      );
    }
    if (mode === 'quiz') {
      return (
        <Quiz
          questions={quizQuestions}
          config={quizConfig}
          onFinish={finishQuiz}
          onPersist={(data) => saveState(data)}
        />
      );
    }
    if (mode === 'results') {
      return (
        <Results
          results={results}
          total={quizQuestions.length}
          onRestart={restart}
        />
      );
    }
    return null;
  }, [mode, loading, loadErr, allQuestions, quizConfig, quizQuestions, results, canResume]);

  return (
    <main className="container">
      <header className="header">
        <h1>Simulado Scrum PSD</h1>
        <p className="subtitle">React + Vite • Timer total • Timer por questão • Persistência • Exportação</p>
      </header>
      {content}
      <footer className="footer">
        <span>Use "npm run questions" para gerar public/questions.json a partir do seu README.md</span>
      </footer>
    </main>
  );
}