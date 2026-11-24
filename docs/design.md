# Design

Identidade da Clusters #16053 aplicada a um app que é usado em pé, na arena, com luz forte e pressa.

## Por que o tema é claro

A primeira versão era escura. Na prática ela ficava "apagada": os cards quase não se separavam do fundo (contraste de 1,07:1 entre os dois) e os rótulos, em lilás acinzentado e pequenos, sumiam. Sob a iluminação da arena isso piora.

O tema claro resolve com três coisas:

- **Fundo lavanda bem claro e cards brancos**, separados por uma borda fina e uma sombra curta (`--shadow-card`).
- **Texto índigo quase preto**, com contraste de 18:1 no branco. O texto secundário tem 10:1 e o terciário 6,1:1, então nada fica abaixo do mínimo de leitura (4,5:1).
- **Números grandes e pesados** nos destaques (44px, peso 800), para ler de relance entre partidas.

## Tokens

Os nomes dizem o papel da cor, não o tom. Assim dá pra trocar o tema sem que o código "minta".

| Token                      | Cor                               | Uso                                          |
| -------------------------- | --------------------------------- | -------------------------------------------- |
| `--bg`                     | `#F1F0F8`                         | Fundo da página                              |
| `--surface`                | `#FFFFFF`                         | Cards, campos, menu                          |
| `--surface-2`              | `#E8E7F4`                         | Pílulas, ícones, blocos internos             |
| `--surface-3`              | `#DEDCEF`                         | Trilhos de barra, etiquetas, pressionado     |
| `--text` / `-2` / `-3`     | `#15142C` / `#3F3D6A` / `#5F5D8A` | Texto principal, secundário, terciário       |
| `--select` / `--on-select` | `#2F2D7A` / `#FFFFFF`             | Opção escolhida, aba ativa, foco             |
| `--crimson`                | `#D42A57`                         | Ação principal (Próximo, Salvar)             |
| `--brand-gradient`         | carmim → magenta → índigo         | Só no ATIROU e no "Começou"                  |
| `--alliance-red` / `-blue` | `#D63A26` / `#1F74D6`             | Alianças (texto branco por cima)             |
| `--good` / `--good-text`   | `#3DD68C` / `#167A4C`             | Acerto (botões) / texto verde no fundo claro |
| `--warning`                | `#8A5A00`                         | Aviso de "sem conexão" e alertas             |

Todo texto branco sobre cor (carmim, alianças, seleção) passa de 4,5:1.

O logo tem partes brancas, então no topo ele fica dentro de um selo índigo (`--brand-ink`).

## Cores dos gráficos

Ficam em `src/features/dashboard/dashboard.css` e estão documentadas em [dashboard.md](dashboard.md).
