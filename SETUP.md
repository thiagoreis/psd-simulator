# Como usar o simulador

Este projeto transforma seu arquivo README.md (com questões no padrão `- [ ]` e `- [x]`) em um JSON e roda um simulador no navegador.

## Pré-requisitos

- Node.js 16+ instalado.

## Passos

1) Coloque seu arquivo `README.md` (com as 300 questões) na raiz do projeto.

2) Instale dependências:
```bash
npm install
```

3) Gere o arquivo de questões:
```bash
npm run build
```
Isso cria `public/questions.json` a partir do seu `README.md`.

4) (Opcional) Se seu README referencia imagens (ex.: `images/burndown.jpg`), copie a pasta `images/` para dentro da pasta `public/` mantendo o caminho relativo:
```
public/images/...
```

5) Rode o servidor local e abra o simulador:
```bash
npm start
```
Abra no navegador: http://localhost:5173

6) Na tela inicial:
- Clique em “Carregar questões” (deve indicar quantas foram carregadas).
- Selecione a quantidade de questões que quer praticar.
- Clique em “Iniciar”.

7) Durante o simulado:
- Responda e avance. Você pode habilitar a opção de “Mostrar se acertei/errei ao avançar” antes de iniciar.
- Ao finalizar, veja o resumo (acertos/erros) e o gabarito detalhado.

## Formato esperado do README.md

Cada pergunta deve ser um título nível 3 (`###`) seguido de opções como itens de lista:
```markdown
### Exemplo de pergunta?

- [ ] Opção incorreta
- [x] Opção correta
- [x] Outra correta (se houver múltipla escolha)
- [ ] Outra incorreta
```

O parser automaticamente identifica quando a pergunta possui múltiplas corretas.

## Dicas

- Se alguma pergunta não aparecer, verifique se ela tem ao menos uma opção no formato `- [ ]` / `- [x]`.
- Se imagens não carregarem, confirme o caminho relativo (coloque as imagens dentro de `public/`).
- Para trocar a quantidade padrão de questões, edite o valor do input na tela inicial.