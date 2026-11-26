# API oficial da FIRST

O app usa a [FTC Events API](https://ftc-events.firstinspires.org/services/API) para puxar a lista de equipes, a tabela de partidas, os resultados e o ranking dos eventos oficiais. É opcional: sem ela, o app funciona igual, só sem os dados oficiais.

## Como funciona

```
celular ──► /api/ftc (função na Vercel, guarda o token) ──► ftc-api.firstinspires.org
   ▲                    └ a Vercel guarda a resposta por 1 min (1 h para equipes e eventos)
   └ guarda uma cópia no aparelho (funciona offline perto da arena)
```

- **O token é senha.** Por isso ele não vai para o navegador: fica nas variáveis `FTC_API_USERNAME` e `FTC_API_KEY`, **sem** o prefixo `VITE_`. Variáveis com `VITE_` são copiadas para o JavaScript do site; sem o prefixo, só o servidor enxerga.
- **A ponte só aceita 6 consultas** da temporada BIOBUZZ: eventos (do Brasil), equipes, tabela, resultados, ranking e placar detalhado. Ninguém consegue usar a ponte para outra coisa.
- **No aparelho**, cada evento tem um pacote guardado. Com internet, o app atualiza sozinho (a dashboard a cada 2 minutos). Sem internet, usa o último pacote e mostra a hora dele.

| Arquivo                                     | O que faz                                            |
| ------------------------------------------- | ---------------------------------------------------- |
| `server/ftc-api.js`                         | A ponte: valida o pedido, chama a FIRST com o token  |
| `api/ftc.js`                                | Encaixa a ponte como função da Vercel                |
| `vite.config.js`                            | Serve a mesma ponte no `npm run dev`                 |
| `src/features/official/official-data.js`    | Traduz as respostas da FIRST e faz OPR e conferência |
| `src/features/official/official-store.js`   | Busca, guarda no aparelho e atualiza                 |
| `src/features/official/official-summary.js` | Junta nomes, ranking e OPR ao resumo da dashboard    |

## Ligar a integração (uma vez só)

1. **Cadastro:** <https://ftc-events.firstinspires.org/services/API/register>. O usuário é o que você escolher; o token (AuthorizationKey) chega por e-mail.
2. **No seu computador:** no `.env.local`, acrescente:
   ```
   FTC_API_USERNAME=seu-usuario
   FTC_API_KEY=o-token-do-email
   ```
   Reinicie o `npm run dev`.
3. **Na Vercel:** Project → **Settings → Environment Variables** → adicione as mesmas duas variáveis (Production e Preview) → **Deployments → ⋯ → Redeploy**.
4. **Teste:** abra `https://SEU-SITE/api/ftc?resource=events`. Deve aparecer a lista de eventos do Brasil. A resposta nunca contém o token.

| Resposta da ponte       | Significado                                                |
| ----------------------- | ---------------------------------------------------------- |
| `200`                   | Funcionando                                                |
| `503` `nao-configurado` | Faltam as variáveis (ou faltou o Redeploy)                 |
| `502` `token-recusado`  | A FIRST não aceitou usuário/token: confira se copiou certo |
| `404` `nao-encontrado`  | Esse código de evento não existe na FIRST (ex.: scrimmage) |

> **Nunca** coloque o token no chat, no GitHub ou com `VITE_` na frente. Se vazar, peça outro no mesmo site de cadastro.

## O que muda no app

**Evento oficial.** Ao trocar de evento, aparecem os eventos oficiais do Brasil. Tocar num deles usa o código oficial (ex.: `BRFOQ`). Para scrimmage, continua dando para digitar um código próprio.

**Formulário de partida.**

- Partida + aliança + posição → o número da equipe aparece sozinho, com o nome.
- Depois de salvar, "Começar partida N" já traz a equipe da mesma posição na próxima partida.
- Número que não bate com a tabela: aviso com botão "Usar".
- Número que não está inscrito no evento: aviso.
- O app nunca apaga um número que o scouter digitou de propósito.

**Dashboard.**

- Nomes oficiais das equipes, e equipes inscritas sem relatório também aparecem.
- Ranking oficial, RS e vitórias/derrotas na ficha, na tabela e na comparação.
- **OPR** calculado com os placares oficiais (ver [dashboard.md](dashboard.md#opr)).
- **Resultados oficiais** na ficha, com a próxima partida e o placar detalhado de cada partida.
- **Conferência** na Visão geral (ver [dashboard.md](dashboard.md#conferência-com-a-tabela-oficial)).
- **Simular partida:** um botão preenche os 4 robôs da próxima partida da Clusters, e o placar estimado usa o OPR.

## Limites

- **Placar detalhado:** os nomes dos campos (TIPs, SWARM...) mudam a cada temporada e só ficam claros numa resposta real. Por isso a ficha mostra todos os campos numéricos que a FIRST mandar, com o nome legível, sem interpretar.
- **Atraso:** os resultados chegam à FIRST pelo sistema de pontuação do evento e, na maioria dos eventos, são atualizados ao vivo. A ponte ainda guarda por até 1 minuto.
- **Uso:** a FIRST pede que os dados não sejam usados para fins comerciais e que as telas tenham um link para a página da API. O link "Fonte: FIRST" cumpre isso.

## Testes

- `tests/unit/ftc-api.test.js`: a ponte, com uma API da FIRST simulada (token no cabeçalho certo, nunca na resposta, paginação, erros).
- `tests/unit/official-data.test.js`: tradução das respostas, próxima partida, OPR e conferência.
- `tests/unit/official-summary.test.js`: junção com o resumo da dashboard.
