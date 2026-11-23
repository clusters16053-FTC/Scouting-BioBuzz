# Dashboard

A dashboard serve para **decidir estratégia entre as partidas**. Ela lê os relatórios do evento atual em tempo real: quando um scouter salva uma partida e o celular dele sincroniza, os números mudam sozinhos.

Todos os cálculos ficam em [`src/features/dashboard/analytics.js`](../src/features/dashboard/analytics.js) e têm testes em [`tests/unit/analytics.test.js`](../tests/unit/analytics.test.js).

## Telas

| Tela                 | Para quê                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------- |
| **Ranking**          | Visão do evento: números gerais, gráfico de acertos por partida e tabela ordenável de equipes |
| **Ficha da equipe**  | Tudo sobre um robô: desempenho, partida a partida, comportamento, pit, foto e observações     |
| **Preparar partida** | Escolher os 4 robôs da próxima partida e comparar as alianças                                 |

## O que cada número significa

As médias usam **só partidas jogadas**. Partida em que o robô não apareceu conta em "partidas", mas não puxa a média para baixo.

| Métrica             | Cálculo                                                                                |
| ------------------- | -------------------------------------------------------------------------------------- |
| Acertos por partida | Média de POLLEN acertados no CELL (AUTO + TELEOP)                                      |
| Precisão            | Total de acertos ÷ total de POLLEN coletados (= tiros), somando todas as partidas      |
| Tempo de ciclo      | Média de todos os ciclos do TELEOP, sem o preload: coletar e ficar pronto para atirar  |
| Ciclos por partida  | Média de ciclos no TELEOP                                                              |
| Pior / melhor       | Menor e maior número de acertos numa partida (consistência)                            |
| Últimas 3           | Média de acertos nas 3 partidas mais recentes, comparada com a média geral (tendência) |
| LEAVE+PARK          | Pontos de LEAVE (3) + PARK no AUTO (5) + PARK no final (5), em média por partida       |
| FLOWER / GARDEN     | Média de NECTAR e POLLEN na FLOWER e no GARDEN por partida                             |
| Taxas (%)           | Em quantas partidas jogadas aconteceu: LEAVE, PARK, jogou/sofreu defesa, teve problema |
| Piloto              | Média das notas de 1 a 5 (partidas sem nota ficam de fora)                             |

### Preparar partida

As projeções **somam as médias** das duas equipes da aliança. É uma estimativa, não uma previsão garantida.

- **Acertos esperados:** soma dos acertos por partida.
- **LEAVE+PARK esperado vs. 16:** mostra se a aliança costuma chegar no **SWARM RP** (16 pontos de LEAVE + PARK).
- **Alertas:** equipe sem partidas registradas, problema em 1 a cada 3 partidas ou mais, defesa em metade das partidas ou mais, quem tira POLLEN/NECTAR da FLOWER e aliança sem ninguém pontuando na FLOWER.

## O que a dashboard **não** calcula, e por quê

- **TIPs por equipe:** o TIP é da aliança (os dois robôs lançam no mesmo CELL) e o manual não diz quantos POLLEN viram um TIP. Inventar esse número daria um ranking falso. A contribuição para os TIPs é medida em **acertos no CELL**.
- **Pontos totais da equipe:** pelo mesmo motivo. Só aparece o que dá para atribuir a um robô (LEAVE, PARK, FLOWER, GARDEN), com esse nome.

## Cuidados com os dados

- **Relatórios repetidos:** se dois scouters registrarem a mesma equipe na mesma partida, vale o mais recente. O ranking avisa quantos foram descartados.
- **Formato antigo:** relatórios de partida de versões antigas do formulário (`schemaVersion` diferente de 2) ficam de fora, com aviso.
- **Ciclos absurdos:** ciclo com mais de 300 s, mais acertos que POLLEN coletados ou valores quebrados é descartado, e os totais são **recalculados** a partir dos ciclos válidos. As regras do banco não conseguem validar cada item da lista de ciclos.
- **Poucas partidas:** equipes com menos de 2 partidas aparecem apagadas na tabela. Uma partida só não diz muito.
- **Sem internet:** a dashboard mostra o que está salvo no aparelho e avisa no topo.

## Cores dos gráficos

As cores foram validadas com script para daltonismo e contraste no fundo escuro (separação mínima ΔE 8):

| Uso                   | Cor       |
| --------------------- | --------- |
| AUTO                  | `#8280E6` |
| TELEOP                | `#E5517B` |
| Nossa equipe (ênfase) | `#E5517B` |
| Demais equipes        | `#5C5B8F` |

O cinza das demais equipes tem contraste abaixo de 3:1 de propósito (é o "apagado" da ênfase). Por isso toda barra tem o valor escrito na ponta e existe uma tabela com os mesmos números.

## Custo no plano grátis

Cada pessoa com a dashboard aberta lê os relatórios do evento **uma vez** ao abrir (~150 leituras num evento inteiro) e depois só os que mudam. A foto do pit só é baixada ao abrir a ficha da equipe. Com 5 pessoas abrindo a dashboard 20 vezes no dia, são uns 15 mil de leitura, abaixo do limite grátis de 50 mil por dia.
