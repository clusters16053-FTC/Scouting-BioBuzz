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
|               | `auto.park`                                           | booleano                                         |
|               | `auto.cycles` + totais                                | ver [Ciclos](#ciclos-auto-e-teleop)              |
| TELEOP        | `teleop.cycles` + totais                              | ver [Ciclos](#ciclos-auto-e-teleop)              |
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
  "schemaVersion": 2,
  "matchNumber": 12,
  "alliance": "red",
  "station": 1,
  "teamNumber": 16053,
  "scouter": "Ana",
  "noShow": false,
  "auto": {
    "leave": true,
    "park": false,
    "cycles": [
      { "at": 2.1, "seconds": 2.1, "collected": 4, "hits": 4, "preload": true },
      { "at": 16.4, "seconds": 12.8, "collected": 4, "hits": 3, "preload": false }
    ],
    "totalCycles": 2,
    "totalShots": 8,
    "totalHits": 7,
    "avgCycleSeconds": 12.8
  },
  "teleop": {
    "cycles": [{ "at": 11.0, "seconds": 11.0, "collected": 3, "hits": 2, "preload": false }],
    "totalCycles": 1,
    "totalShots": 3,
    "totalHits": 2,
    "avgCycleSeconds": 11.0,
    "intake": ["floor", "flower"]
  },
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

### Ciclos (AUTO e TELEOP)

Um **ciclo** = o robô coleta POLLEN (no máximo 4, regra G407), fica pronto e atira. O scouter toca **ATIROU** quando o robô começa a atirar e depois informa **quantos coletou** (já vem 4) e **quantos acertou**.

| Campo do ciclo | Significado                                                                    |
| -------------- | ------------------------------------------------------------------------------ |
| `at`           | segundos desde o "Começou" da fase até o ATIROU                                |
| `seconds`      | **tempo de ciclo**: do fim do ciclo anterior (ou do "Começou") até o ATIROU    |
| `collected`    | POLLEN coletados = tiros (1 a 4)                                               |
| `hits`         | acertos no CELL (0 a `collected`)                                              |
| `preload`      | `true` só no 1º ciclo do AUTO (o robô já começa carregado; fica fora da média) |

Totais salvos junto, **calculados pelo app**:

| Campo             | Cálculo                                                     |
| ----------------- | ----------------------------------------------------------- |
| `totalCycles`     | quantidade de ciclos                                        |
| `totalShots`      | soma de `collected`                                         |
| `totalHits`       | soma de `hits`                                              |
| `avgCycleSeconds` | média de `seconds` **sem o preload** (`null` se não houver) |

O scouter não anota erros: **erros = `totalShots − totalHits`** e **precisão = `totalHits ÷ totalShots`**.

> **Por que salvar totais que dá para calcular?** As regras do Firestore não têm laço, então não conseguem conferir cada item da lista `cycles`. Elas validam os totais (que precisam bater com a lista) e o dashboard ignora ciclos com valores absurdos.

## Relatório de pit (`pitReports`)

`schemaVersion: 2`

| Seção     | Campo                                                            | Tipo                                                             |
| --------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| Equipe    | `teamNumber`                                                     | número (obrigatório)                                             |
|           | `teamName`                                                       | texto (até 60)                                                   |
| Robô      | `drivetrain`                                                     | `"mecanum"` \| `"tank"` \| `"swerve"` \| `"other"` (obrigatório) |
|           | `shooterShape`                                                   | `"c"` \| `"s"` \| `"other"` \| `"none"` (obrigatório)            |
| FLOWER    | `flowerPlaces`                                                   | lista: `"nectar"`, `"pollen"` (pode ser vazia)                   |
|           | `removesFromFlower`                                              | booleano — tira POLLEN ou NECTAR da FLOWER                       |
| AUTO      | `autoNotes`                                                      | texto livre (até 500)                                            |
| Final     | `strategy`                                                       | texto (até 500)                                                  |
|           | `hasPhoto`                                                       | booleano — se existe foto em `pitPhotos` com o mesmo id          |
| Metadados | `schemaVersion`, `createdAt`, `syncedAt`, `scouter`, `createdBy` | —                                                                |

Exemplo:

```json
{
  "schemaVersion": 2,
  "teamNumber": 16053,
  "teamName": "Clusters",
  "drivetrain": "mecanum",
  "shooterShape": "c",
  "flowerPlaces": ["nectar"],
  "removesFromFlower": false,
  "autoNotes": "sai da área, lança o preload e faz 2 ciclos pelo lado da HIVE",
  "strategy": "foca em TIPS",
  "hasPhoto": true,
  "scouter": "Ana",
  "createdAt": "2026-12-05T10:12:00Z",
  "syncedAt": "2026-12-05T10:20:31Z",
  "createdBy": "uid-do-aparelho"
}
```

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
| Cálculos dos ciclos                      | `src/features/match-scouting/cycles/cycle-math.js`       |
| Campos e opções do pit                   | `src/features/pit-scouting/pit-schema.js`                |
| Validação no servidor                    | `firestore.rules` (`validMatchReport`, `validPitReport`) |
| Testes que garantem os dois em sincronia | `tests/rules/firestore.rules.test.js`                    |

Os testes montam os relatórios com as mesmas funções do app (`toMatchDocument`, `toPitDocument`). Se um campo mudar no formulário e não nas regras, o CI fica vermelho.

## Limites validados pelas regras

| Campo                            | Limite                             |
| -------------------------------- | ---------------------------------- |
| `matchNumber`                    | 1 a 999                            |
| `teamNumber`                     | 1 a 99999                          |
| Contadores do final              | 0 a 99, inteiros                   |
| Ciclos por fase                  | até 30, com no máximo 4 tiros cada |
| `avgCycleSeconds`                | `null` ou de 0 a 600               |
| `notes`, `strategy`, `autoNotes` | até 500 caracteres                 |
| `teamName`                       | até 60 caracteres                  |
| `scouter`                        | até 40 caracteres                  |
| Foto (`pitPhotos.image`)         | até 400.000 caracteres (~300 KB)   |

Qualquer campo a mais, a menos ou com tipo errado é recusado.

## Fora do escopo (por enquanto)

- **Faltas:** difícil de ver da arquibancada.
- **TIPS e placar da aliança:** podem vir dos resultados oficiais da _FIRST_ numa etapa futura.
