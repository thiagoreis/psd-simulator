// Parser de README.md -> public/questions.json
// Uso: node parse-questions.js README.md
// O arquivo JSON será gerado em public/questions.json

const fs = require('fs');
const path = require('path');

function parseMarkdownToQuestions(markdown) {
  const lines = markdown.split(/\r?\n/);

  const questions = [];
  let current = null;

  const headingRegex = /^###\s+(.+?)\s*$/;
  const optionRegex = /^\s*-\s*\[([xX\s])\]\s*(.+)\s*$/;
  const imageRegex = /!\[[^\]]*]\(([^)]+)\)/;

  function finalizeCurrent() {
    if (!current) return;
    if (current.options && current.options.length > 0) {
      const correctCount = current.options.filter(o => o.correct).length;
      current.multiCorrect = correctCount > 1;
      current.title = current.title.trim();
      questions.push(current);
    }
    current = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const h = line.match(headingRegex);
    if (h) {
      finalizeCurrent();
      current = {
        id: (questions.length + 1),
        title: h[1].trim(),
        options: [],
        images: []
      };
      continue;
    }

    if (!current) continue;

    const img = line.match(imageRegex);
    if (img && img[1]) {
      current.images.push(img[1]);
      continue;
    }

    const opt = line.match(optionRegex);
    if (opt) {
      const mark = opt[1].toLowerCase();
      const text = opt[2].trim();
      if (text.length === 0) continue;
      current.options.push({
        text,
        correct: mark === 'x'
      });
    }
  }

  finalizeCurrent();

  const filtered = questions.filter(q => q.options && q.options.length > 0);
  filtered.forEach((q, idx) => { q.id = idx + 1; });

  return filtered;
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Uso: node parse-questions.js <caminho/para/README.md>');
    process.exit(1);
  }

  const mdPath = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(mdPath)) {
    console.error(`Arquivo não encontrado: ${mdPath}`);
    process.exit(1);
  }

  const markdown = fs.readFileSync(mdPath, 'utf-8');
  const questions = parseMarkdownToQuestions(markdown);

  const outDir = path.resolve(process.cwd(), 'public');
  const outPath = path.join(outDir, 'questions.json');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(outPath, JSON.stringify(questions, null, 2), 'utf-8');

  console.log(`Extraídas ${questions.length} perguntas para ${path.relative(process.cwd(), outPath)}`);
}

if (require.main === module) {
  main();
}