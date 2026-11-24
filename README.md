# 🐝 Scouting BIOBUZZ — Clusters FTC #16053

Sistema de scouting da equipe **Clusters FTC #16053** para a temporada **BIOBUZZ (2026-2027)** da _FIRST_ Tech Challenge.

Os scouters preenchem os formulários no celular, **mesmo sem internet** perto da arena. Quando o aparelho volta a ter wifi, os dados sobem sozinhos e o dashboard da equipe atualiza em tempo real.

```
preenche (offline) ──► sobe pro sistema (quando tem wifi) ──► dashboard atualiza sozinho
```

## Stack

| Peça                        | Função                                       | Custo  |
| --------------------------- | -------------------------------------------- | ------ |
| **React + Vite**            | Interface (formulários e dashboard)          | Grátis |
| **Vercel**                  | Hospedagem e deploy automático a cada push   | Grátis |
| **Firebase Firestore**      | Banco de dados com sync offline e tempo real | Grátis |
| **PWA** (`vite-plugin-pwa`) | App instalável que abre sem internet         | Grátis |

Detalhes e motivos de cada escolha em [`docs/arquitetura.md`](docs/arquitetura.md).

## Rodando no seu computador

Pré-requisito: [Node.js](https://nodejs.org/) 22 ou superior.

```bash
git clone https://github.com/clusters16053-FTC/scouting-biobuzz.git
cd scouting-biobuzz
npm ci
```

Depois escolha um modo:

- **Com o banco real:** copie `.env.example` para `.env.local`, preencha com os dados do Firebase e rode `npm run dev`.
- **Com banco falso, local** (precisa do [Java 21+](https://adoptium.net/)): `npm run dev:emulators`. Código da equipe de teste: `clusters-dev`.

Abra o endereço que aparecer no terminal (normalmente `http://localhost:5173`). Configuração completa do Firebase em [`docs/firebase.md`](docs/firebase.md).

> **`npm ci` ou `npm install`?** Use `npm ci` para instalar: ele segue o `package-lock.json` à risca e não o altera. Use `npm install <pacote>` só quando for **adicionar** uma dependência.

## Scripts

| Comando                 | O que faz                                                                |
| ----------------------- | ------------------------------------------------------------------------ |
| `npm run dev`           | Servidor de desenvolvimento com recarga automática                       |
| `npm run dev:emulators` | Mesmo servidor, mas com Firebase falso no computador (precisa de Java)   |
| `npm run build`         | Gera a versão de produção na pasta `dist/`                               |
| `npm run preview`       | Serve o `dist/` localmente pra testar o build                            |
| `npm run lint`          | Procura erros comuns no código (oxlint)                                  |
| `npm run format`        | Formata todos os arquivos (Prettier)                                     |
| `npm run test:unit`     | Testes rápidos da lógica (ex.: cálculo dos ciclos)                       |
| `npm run test:rules`    | Testa as regras de segurança do banco (precisa de Java)                  |
| `npm run check`         | Lint + formatação + testes unitários + build — rode antes de abrir um PR |

## Estrutura de pastas

```
scouting-biobuzz/
├── .github/              # Templates de issue/PR e CI (GitHub Actions)
├── api/                  # Funções da Vercel (ponte com a API da FIRST)
├── docs/                 # Documentação do projeto
├── public/               # Arquivos servidos como estão (ícones)
├── scripts/              # Scripts auxiliares (ex.: preparar o emulador)
├── server/               # Código que roda só no servidor (a ponte, com o token)
├── src/
│   ├── app/              # Casca do app: rotas, layout, navegação
│   ├── components/       # Peças de formulário reutilizáveis (Counter, Segmented, ChipGroup…)
│   ├── config/           # Constantes do jogo (pontuação, limiares de RP)
│   ├── features/         # Uma pasta por funcionalidade
│   │   ├── access/       # Entrar na equipe (login + código)
│   │   ├── event/        # Evento atual (salvo no aparelho)
│   │   ├── home/
│   │   ├── match-scouting/
│   │   ├── pit-scouting/
│   │   ├── official/     # Dados oficiais da FIRST: busca, cópia no aparelho, OPR, conferência
│   │   └── dashboard/    # Visão geral, equipes, ficha, comparar, próxima partida e os cálculos
│   ├── lib/              # Firebase, caminhos do banco, IDs, compressão de imagem
│   ├── styles/           # CSS global e tokens de design
│   └── main.jsx          # Ponto de entrada
├── tests/
│   ├── unit/             # Testes rápidos da lógica (rodam em qualquer lugar)
│   └── rules/            # Testes das regras de segurança (precisam do emulador)
├── firestore.rules       # Regras de segurança do banco
├── firebase.json         # Configuração do Firebase CLI e emuladores
├── index.html
├── vercel.json           # Configuração de rotas na Vercel
└── vite.config.js
```

**Por que `features/`?** Tudo que pertence a uma tela (componentes, lógica, estilos) fica junto. Quando você mexe no formulário de partida, só abre `features/match-scouting/`.

## Documentação

- [Arquitetura](docs/arquitetura.md) — como as peças se conectam e o fluxo offline
- [Modelo de dados](docs/modelo-de-dados.md) — campos coletados e estrutura no Firestore
- [Firebase](docs/firebase.md) — criar o projeto, segurança e limites grátis
- [Dashboard](docs/dashboard.md) — o que cada número significa e o que não é calculado
- [Design](docs/design.md) — por que o tema é claro, tokens de cor e contraste
- [API oficial da FIRST](docs/ftc-api.md) — ligar a integração, o que ela faz e como protege o token
- [Jogo BIOBUZZ](docs/jogo-biobuzz.md) — resumo das regras que importam pro scouting
- [Como contribuir](CONTRIBUTING.md) — branches, commits e pull requests

## Roadmap

- [x] **1. Definição** — campos coletados e modelo de dados
- [x] **2. Base** — projeto, organização do repositório e deploy
- [x] **3. Firebase** — banco, regras de segurança e entrada com código da equipe
- [x] **4. Formulários** — scouting de partida (por fases) e de pit (com foto)
- [ ] **5. Offline (PWA)** — fila de pendentes e indicador de sincronização
- [x] **6. Dashboard** — ranking, ficha da equipe e preparação de partida
- [ ] **7. Teste de campo** — modo avião, vários aparelhos, conflitos
- [ ] **8. Polimento** — usabilidade e ajustes finais
