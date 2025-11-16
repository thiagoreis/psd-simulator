import React from 'react';
import jsPDF from 'jspdf';

function toCSV(results, total) {
  const header = ['index', 'title', 'correct', 'selected_indexes', 'correct_indexes', 'selected_texts', 'correct_texts'];
  const rows = (results?.details ?? []).map(d => {
    const selectedTexts = d.selected.map(i => d.options[i]?.text ?? '').join(' | ');
    const correctTexts = d.correctIndexes.map(i => d.options[i]?.text ?? '').join(' | ');
    return [
      String(d.idx + 1),
      `"${(d.title || '').replace(/"/g, '""')}"`,
      d.correct ? 'true' : 'false',
      `"${d.selected.join(',')}"`,
      `"${d.correctIndexes.join(',')}"`,
      `"${selectedTexts.replace(/"/g, '""')}"`,
      `"${correctTexts.replace(/"/g, '""')}"`,
    ].join(',');
  });

  return [header.join(','), ...rows].join('\n');
}

function download(filename, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function exportCSV(results, total) {
  const csv = toCSV(results, total);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  download('resultado-simulado.csv', blob);
}

function exportPDF(results, total, correct) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const left = 40;
  const top = 40;
  let y = top;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Resultado do Simulado Scrum PSD', left, y);
  y += 24;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(`Total: ${total}  •  Acertos: ${correct}  •  Erros: ${total - correct}`, left, y);
  y += 20;

  (results?.details ?? []).forEach((d, idx) => {
    const badge = d.correct ? '[Correto]' : '[Errado]';
    const title = `${d.idx + 1}. ${d.title} ${badge}`;

    const correctTexts = d.correctIndexes.map(i => d.options[i]?.text ?? '');
    const selectedTexts = d.selected.map(i => d.options[i]?.text ?? '');

    const lines = [
      title,
      `- Corretas: ${correctTexts.join(' | ') || '-'}`,
      `- Marcadas: ${selectedTexts.join(' | ') || '-'}`,
      ''
    ];

    lines.forEach(line => {
      const split = doc.splitTextToSize(line, 515);
      split.forEach(tl => {
        if (y > 780) {
          doc.addPage();
          y = top;
        }
        doc.text(tl, left, y);
        y += 16;
      });
    });
  });

  doc.save('resultado-simulado.pdf');
}

export default function Results({ results, total, onRestart }) {
  const correct = results?.correctCount ?? 0;
  const wrong = total - correct;

  return (
    <section className="card">
      <h2>Resultado</h2>

      <div className="result-grid">
        <div className="kpi">
          <div className="label">Total</div>
          <div className="val">{total}</div>
        </div>
        <div className="kpi">
          <div className="label">Acertos</div>
          <div className="val" style={{ color: 'var(--green)' }}>{correct}</div>
        </div>
        <div className="kpi">
          <div className="label">Erros</div>
          <div className="val" style={{ color: 'var(--danger)' }}>{wrong}</div>
        </div>
      </div>

      <div className="actions" style={{ marginBottom: 8 }}>
        <button className="btn" onClick={() => exportCSV(results, total)}>Exportar CSV</button>
        <button className="btn" onClick={() => exportPDF(results, total, correct)}>Exportar PDF</button>
      </div>

      <details className="gabarito">
        <summary>Ver gabarito detalhado</summary>
        <div id="details">
          {results?.details?.map((d) => {
            const badgeCls = d.correct ? 'ok' : 'err';
            const badgeTxt = d.correct ? 'Correto' : 'Errado';
            return (
              <div key={d.idx} className="detail-item">
                <div><strong>{d.idx + 1}. {d.title}</strong> <span className={`badge ${badgeCls}`}>{badgeTxt}</span></div>
                <div style={{ marginTop: 6 }}>
                  {d.options.map((o, i) => {
                    const isCorrect = d.correctIndexes.includes(i);
                    const isSelected = d.selected.includes(i);
                    let mark = '';
                    if (isCorrect && isSelected) mark = '✅ (correta e marcada)';
                    else if (isCorrect && !isSelected) mark = '✔️ (correta)';
                    else if (!isCorrect && isSelected) mark = '❌ (marcada)';
                    return <div key={i}> - {o.text} {mark}</div>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </details>

      <div className="actions">
        <button className="btn" onClick={onRestart}>Refazer</button>
      </div>
    </section>
  );
}