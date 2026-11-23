# Como contribuir

Guia rápido para manter o repositório organizado. Vale para todo mundo da equipe.

## Fluxo de trabalho

A branch `main` é **o site que está no ar**. Todo push nela vira deploy de produção na Vercel. Por isso ninguém trabalha direto na `main`:

```bash
# 1. Atualize sua main
git checkout main
git pull

# 2. Crie uma branch para a sua tarefa
git checkout -b feat/contador-auto

# 3. Trabalhe e faça commits pequenos
git add .
git commit -m "feat(partida): adiciona contador de acertos no AUTO"

# 4. Envie a branch
git push -u origin feat/contador-auto
```

Depois abra um **Pull Request** no GitHub. A Vercel cria um link de preview só daquela branch, então dá pra testar no celular antes de juntar na `main`.

## Nome das branches

`tipo/descricao-curta`, por exemplo:

| Prefixo     | Quando usar                             |
| ----------- | --------------------------------------- |
| `feat/`     | Funcionalidade nova                     |
| `fix/`      | Correção de bug                         |
| `docs/`     | Só documentação                         |
| `style/`    | Visual / CSS, sem mudar comportamento   |
| `refactor/` | Reorganização de código, sem mudar nada |
| `chore/`    | Configuração, dependências, ferramentas |

## Mensagens de commit

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/):

```
tipo(escopo): descrição no imperativo
```

Exemplos:

- `feat(pit): adiciona campo de tração`
- `fix(dashboard): corrige média quando a equipe não tem partidas`
- `docs: explica regras de segurança do Firestore`

O escopo é opcional e normalmente é a pasta em `features/` (`partida`, `pit`, `dashboard`).

## Antes de abrir o PR

```bash
npm run check
```

Isso roda lint, formatação e build. O GitHub Actions roda o mesmo comando em todo PR, então se passar aí, passa lá.

## Padrões de código

- Código (variáveis, funções, campos no banco) em **inglês**; textos da tela em **português**.
- Valores do jogo (pontos, limiares) ficam **só** em `src/config/game.js`.
- Mudou um campo de formulário (`*-schema.js`)? Atualize junto `firestore.rules`, os testes e `docs/modelo-de-dados.md`.
- Formatação é automática: instale as extensões recomendadas do VS Code (ele sugere ao abrir o projeto).
