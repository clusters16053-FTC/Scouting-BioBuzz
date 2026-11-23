# Modelo de dados

## Estrutura no Firestore

O Firestore guarda **documentos** (parecidos com objetos JSON) dentro de **coleções**.

```
config/
  └── access                     → { teamCode } — secreto, só pelo console
members/
  └── {uid}                      → { name, code, joinedAt } — 1 por aparelho
events/
  └── {eventId}                  ex.: "BRCEFOR" (código do evento)
        ├── matchReports/
        │     └── {id aleatório}   → 1 documento por robô por partida
        ├── pitReports/
        │     └── {id aleatório}   → 1 documento por entrevista no pit
        └── pitPhotos/
              └── {mesmo id do pitReport} → { image, createdBy }
```

Quem pode ler e escrever cada coleção está em [firebase.md](firebase.md).

### Decisões

| Decisão                              | Motivo                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------- |
| ID aleatório gerado no celular       | Dois scouters offline nunca geram o mesmo ID; reenviar cai no mesmo documento e não duplica |
| Separar por evento                   | O dashboard lê só o evento atual: mais rápido e gasta menos da cota grátis                  |
| Campo `schemaVersion`                | Se o formulário mudar no meio da temporada, o dashboard lê relatórios antigos e novos       |
| Pit também com ID aleatório          | Duas entrevistas da mesma equipe offline não se apagam; o dashboard mostra a mais recente   |
| Campos em inglês, telas em português | Padrão de mercado; o usuário só vê português                                                |
| Foto em `pitPhotos`, separada        | O dashboard monta a tabela sem baixar todas as fotos; a foto só carrega ao abrir a equipe   |
| `createdBy` em todo relatório        | Registra qual aparelho enviou; a regra do banco impede escrever em nome de outro            |
| `syncedAt` (hora do servidor)        | Mostra quando o relatório chegou ao banco, diferente de `createdAt` (hora do preenchimento) |

## Relatório de partida (`matchReports`)

| Fase          | Campo                                                 | Tipo                                             |
| ------------- | ----------------------------------------------------- | ------------------------------------------------ |
| Pré           | `matchNumber`                                         | número                                           |
|               | `alliance`                                            | `"red"` \| `"blue"`                              |
|               | `station`                                             | `1` \| `2`                                       |
|               | `teamNumber`                                          | número                                           |
|               | `scouter`                                             | texto                                            |
|               | `noShow`                                              | booleano                                         |
| AUTO          | `auto.leave`                                          | booleano                                         |
|               | `auto.made` / `auto.missed`                           | número (lançamentos no CELL)                     |
|               | `auto.park`                                           | booleano                                         |
| TELEOP        | `teleop.made` / `teleop.missed`                       | número (lançamentos no CELL)                     |
|               | `teleop.intake`                                       | lista: `"floor"`, `"flower"`, `"garden"`         |
| Último minuto | `endgame.nectarFlower`                                | número                                           |
|               | `endgame.pollenFlower`                                | número                                           |
|               | `endgame.garden`                                      | número                                           |
|               | `endgame.park`                                        | booleano                                         |
| Geral         | `defensePlayed` / `defenseReceived`                   | `"none"` \| `"low"` \| `"high"`                  |
|               | `issues`                                              | lista: `"stopped"`, `"tipped"`, `"disconnected"` |
|               | `driverRating`                                        | número de 0 a 5 (0 = sem nota)                   |
|               | `notes`                                               | texto                                            |
| Metadados     | `schemaVersion`, `createdAt`, `syncedAt`, `createdBy` | —                                                |

Exemplo:

```json
{
  "schemaVersion": 1,
  "matchNumber": 12,
  "alliance": "red",
  "station": 1,
  "teamNumber": 16053,
  "scouter": "Ana",
  "noShow": false,
  "auto": { "leave": true, "made": 3, "missed": 1, "park": false },
  "teleop": { "made": 9, "missed": 4, "intake": ["floor", "flower"] },
  "endgame": { "nectarFlower": 2, "pollenFlower": 1, "garden": 0, "park": true },
  "defensePlayed": "low",
  "defenseReceived": "none",
  "issues": [],
  "driverRating": 4,
  "notes": "ciclo rápido, erra de longe",
  "createdAt": "2026-12-05T14:32:10Z",
  "syncedAt": "2026-12-05T14:41:02Z",
  "createdBy": "uid-do-aparelho"
}
```

## Relatório de pit (`pitReports`)

| Campo            | Tipo                                                             |
| ---------------- | ---------------------------------------------------------------- |
| `teamNumber`     | número                                                           |
| `teamName`       | texto                                                            |
| `drivetrain`     | `"mecanum"` \| `"tank"` \| `"swerve"` \| `"other"`               |
| `launchesCell`   | booleano                                                         |
| `launchRange`    | `"close"` \| `"far"` \| `"both"` \| `"none"` (não lança)         |
| `placesNectar`   | booleano                                                         |
| `intake`         | lista: `"floor"`, `"flower"`, `"garden"`                         |
| `auto.actions`   | lista: `"leave"`, `"preload"`, `"cycles"`, `"park"`              |
| `auto.cycles`    | número estimado                                                  |
| `auto.startSide` | texto                                                            |
| `strategy`       | texto (até 500)                                                  |
| `hasPhoto`       | booleano — se existe foto em `pitPhotos` com o mesmo id          |
| Metadados        | `schemaVersion`, `createdAt`, `syncedAt`, `scouter`, `createdBy` |

## Foto do pit (`pitPhotos`)

| Campo       | Tipo                                         |
| ----------- | -------------------------------------------- |
| `image`     | texto (JPEG em base64, ~800 px, até ~300 KB) |
| `createdBy` | uid do aparelho                              |

> **Por que a foto fica no Firestore?** O Firebase Storage exige o plano pago. Um documento do Firestore aguenta até 1 MiB, então uma foto comprimida no celular cabe com folga.

## Onde cada coisa é definida

| O quê                                    | Arquivo                                                  |
| ---------------------------------------- | -------------------------------------------------------- |
| Campos e opções da partida               | `src/features/match-scouting/match-schema.js`            |
| Campos e opções do pit                   | `src/features/pit-scouting/pit-schema.js`                |
| Validação no servidor                    | `firestore.rules` (`validMatchReport`, `validPitReport`) |
| Testes que garantem os dois em sincronia | `tests/firestore.rules.test.js`                          |

Os testes montam os relatórios com as mesmas funções do app (`toMatchDocument`, `toPitDocument`). Se um campo mudar no formulário e não nas regras, o CI fica vermelho.

## Limites validados pelas regras

| Campo                               | Limite                           |
| ----------------------------------- | -------------------------------- |
| `matchNumber`                       | 1 a 999                          |
| `teamNumber`                        | 1 a 99999                        |
| Contadores (`made`, `missed`, etc.) | 0 a 99, inteiros                 |
| `auto.cycles` (pit)                 | 0 a 20                           |
| `notes`, `strategy`                 | até 500 caracteres               |
| `teamName`                          | até 60 caracteres                |
| `scouter`                           | até 40 caracteres                |
| Foto (`pitPhotos.image`)            | até 400.000 caracteres (~300 KB) |

Qualquer campo a mais, a menos ou com tipo errado é recusado.

## Fora do escopo (por enquanto)

- **Faltas:** difícil de ver da arquibancada.
- **TIPS e placar da aliança:** podem vir dos resultados oficiais da _FIRST_ numa etapa futura.
