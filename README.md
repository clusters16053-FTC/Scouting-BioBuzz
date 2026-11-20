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
npm install
npm run dev
```

Abra o endereço que aparecer no terminal (normalmente `http://localhost:5173`).

## Scripts

| Comando           | O que faz                                             |
| ----------------- | ----------------------------------------------------- |
| `npm run dev`     | Servidor de desenvolvimento com recarga automática    |
| `npm run build`   | Gera a versão de produção na pasta `dist/`            |
| `npm run preview` | Serve o `dist/` localmente pra testar o build         |
| `npm run lint`    | Procura erros comuns no código (oxlint)               |
| `npm run format`  | Formata todos os arquivos (Prettier)                  |
| `npm run check`   | Lint + formatação + build — rode antes de abrir um PR |

## Estrutura de pastas

```
scouting-biobuzz/
├── .github/              # Templates de issue/PR e CI (GitHub Actions)
├── docs/                 # Documentação do projeto
├── public/               # Arquivos servidos como estão (ícones)
├── src/
│   ├── app/              # Casca do app: rotas, layout, navegação
│   ├── components/       # Componentes reutilizáveis entre telas
│   ├── config/           # Constantes do jogo (pontuação, limiares de RP)
│   ├── features/         # Uma pasta por funcionalidade
│   │   ├── home/
│   │   ├── match-scouting/
│   │   ├── pit-scouting/
│   │   └── dashboard/
│   ├── styles/           # CSS global e tokens de design
│   └── main.jsx          # Ponto de entrada
├── index.html
├── vercel.json           # Configuração de rotas na Vercel
└── vite.config.js
```

**Por que `features/`?** Tudo que pertence a uma tela (componentes, lógica, estilos) fica junto. Quando você mexe no formulário de partida, só abre `features/match-scouting/`.

## Documentação

- [Arquitetura](docs/arquitetura.md) — como as peças se conectam e o fluxo offline
- [Modelo de dados](docs/modelo-de-dados.md) — campos coletados e estrutura no Firestore
- [Jogo BIOBUZZ](docs/jogo-biobuzz.md) — resumo das regras que importam pro scouting
- [Como contribuir](CONTRIBUTING.md) — branches, commits e pull requests

## Roadmap

- [x] **1. Definição** — campos coletados e modelo de dados
- [ ] **2. Base** — projeto, organização do repositório e deploy _(em andamento)_
- [ ] **3. Firebase** — projeto, banco e regras de segurança
- [ ] **4. Formulários** — scouting de partida e pit online
- [ ] **5. Offline (PWA)** — fila de pendentes e indicador de sincronização
- [ ] **6. Dashboard** — ranking, médias e comparação de equipes
- [ ] **7. Teste de campo** — modo avião, vários aparelhos, conflitos
- [ ] **8. Polimento** — usabilidade e acesso por código da equipe
