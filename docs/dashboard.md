# Dashboard

A dashboard serve para **decidir estratégia entre as partidas**. Ela lê os relatórios do evento atual em tempo real: quando um scouter salva uma partida e o celular dele sincroniza, os números mudam sozinhos.

Os cálculos ficam em [`analytics.js`](../src/features/dashboard/analytics.js) (médias de cada equipe) e [`metrics.js`](../src/features/dashboard/metrics.js) (nome e direção de cada métrica, posições, líderes, atalhos e comparação), com testes em [`tests/unit/`](../tests/unit/).

## Telas

| Tela                | Para quê                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| **Visão geral**     | Onde a Clusters está em cada categoria, os 3 líderes de cada categoria e todas as equipes numa métrica  |
| **Equipes**         | Tabela de todas as equipes com atalhos de um toque (filtro + ordenação) e estrela de favorita           |
| **Ficha da equipe** | Tudo sobre um robô: cada número com a posição no evento, consistência, comportamento, pit e observações |
| **Comparar**        | De 2 a 4 equipes lado a lado, com o melhor valor de cada linha destacado                                |
| **Simular partida** | Escolher os 4 robôs, comparar as alianças e rabiscar a estratégia no quadro da arena                    |

### Atalhos

- **Busca no topo:** número ou nome abre a ficha. No computador, a tecla `/` coloca o cursor na busca; ↑ ↓ escolhem e Enter abre.
- **Atalhos da aba Equipes:** Favoritas, Melhores no CELL, Mais precisos, Ciclo rápido, Pontuam na FLOWER (em partida ou no pit), Fazem defesa (metade das partidas ou mais), Sem problemas e Sem entrevista de pit.
- **Links:** o atalho escolhido e as equipes da comparação ficam no endereço (`/dashboard/equipes?atalho=ciclo`, `/dashboard/comparar?equipes=16053,8743`). Dá para mandar o link no grupo e quem abrir vê a mesma coisa.
- **Favoritas (★):** compartilhadas por toda a equipe, em tempo real. Servem para montar a lista de olho da escolha de aliança.

### Posição no evento

Cada número da ficha vem com a posição ("3º de 16") e uma barrinha que vai do pior ao melhor do evento. Só entram no ranking equipes que jogaram e têm aquele número. Empate divide a posição (1º, 2º, 2º, 4º). No tempo de ciclo, problemas e variação, **menor é melhor**.

### Poucos dados

Com menos de **3 partidas**, a média ainda muda muito. Essas equipes aparecem apagadas na tabela e com a etiqueta **poucos dados** nos líderes, na ficha e na comparação. Elas não são escondidas: no começo do evento ninguém tem 3 partidas.

## O que cada número significa

As médias usam **só partidas jogadas**. Partida em que o robô não apareceu conta em "partidas", mas não puxa a média para baixo.

| Métrica             | Cálculo                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------- |
| Acertos por partida | Média de POLLEN acertados no CELL (AUTO + TELEOP)                                        |
| Precisão            | Total de acertos ÷ total de POLLEN coletados (= tiros), somando todas as partidas        |
| Tempo de ciclo      | Média de todos os ciclos do TELEOP, sem o preload: coletar e ficar pronto para atirar    |
| Ciclos por partida  | Média de ciclos no TELEOP                                                                |
| Pior / melhor       | Menor e maior número de acertos numa partida (consistência)                              |
| Últimas 3           | Média de acertos nas 3 partidas mais recentes, comparada com a média geral (tendência)   |
| Variação            | Desvio padrão dos acertos por partida (±). Quanto menor, mais dá para contar com a média |
| LEAVE+PARK          | Pontos de LEAVE (3) + PARK no AUTO (5) + PARK no final (5), em média por partida         |
| FLOWER / GARDEN     | Média de NECTAR e POLLEN na FLOWER e no GARDEN por partida                               |
| Taxas (%)           | Em quantas partidas jogadas aconteceu: LEAVE, PARK, jogou/sofreu defesa, teve problema   |
| Piloto              | Média das notas de 1 a 5 (partidas sem nota ficam de fora)                               |

### Simular partida: comparação

As projeções **somam as médias** das duas equipes da aliança. É uma estimativa, não uma previsão garantida.

- **Acertos esperados:** soma dos acertos por partida.
- **LEAVE+PARK esperado vs. 16:** mostra se a aliança costuma chegar no **SWARM RP** (16 pontos de LEAVE + PARK).
- **Alertas:** equipe sem partidas registradas, problema em 1 a cada 3 partidas ou mais, defesa em metade das partidas ou mais, quem tira POLLEN/NECTAR da FLOWER e aliança sem ninguém pontuando na FLOWER.

- **Placar estimado (OPR):** soma do OPR das duas equipes de cada aliança. Só aparece com a API oficial ligada e as 4 equipes com OPR.
- **As 4 equipes lado a lado:** a mesma tabela da aba Comparar, com o número de cada equipe na cor da aliança.

### Simular partida: quadro da arena

Um quadro para desenhar a estratégia em cima do campo, no dedo (celular ou tablet) ou no mouse.

- **Robôs:** as 4 equipes escolhidas aparecem como peças com o número, na cor da aliança (a nossa com borda escura). Tocar num robô e arrastar move ele.
- **Ferramentas:** caneta, seta (caminho do robô, com ponta) e borracha (passa o dedo em cima do risco). Quatro cores, desfazer, refazer e limpar a fase (pede confirmação).
- **Fases:** AUTO, TELEOP e FINAL têm desenhos próprios. Robô que não foi movido numa fase continua onde estava na anterior.
- **Girar o campo:** mostra o campo do lado da outra aliança.
- **Tela cheia:** o campo ocupa a tela toda. Com o tablet ou o celular deitado, as ferramentas vão para a lateral.
- **Baixar imagem:** gera uma imagem com as 3 fases lado a lado. No celular abre o menu de compartilhar, para mandar direto no grupo.
- **Onde fica salvo:** só neste aparelho, um quadro por confronto (as 4 equipes), guardando os 20 mais recentes. Para mostrar aos outros, use a imagem.

O campo é um **esquema próprio** (não é a arte da FIRST), visto de cima com a **aliança vermelha embaixo**. As posições de HIVES, FLOWERS, GARDENS e LOADING ZONES foram medidas numa vista de cima do campo e conferidas com as medidas do manual (seção 9): 144 × 144 in, grade de 6 × 6 TILES, GARDEN de ~23 × 2 in e LOADING ZONE de ~23 × 11 in. Elas ficam em [`field-layout.js`](../src/features/strategy/field-layout.js). Na HIVE, o CELL branco é o virado para cima (o que aceita lançamento no começo da partida).

## Dados oficiais da FIRST

Com a [API oficial](ftc-api.md) ligada, a dashboard também mostra ranking oficial, RS e vitórias/derrotas de cada equipe.

### OPR

**OPR** (Offensive Power Rating) estima quantos pontos cada equipe soma à aliança por partida, descontando a força do parceiro. Cada aliança numa partida vira uma equação ("robô A + robô B = pontos da aliança"); com várias partidas, o app acha os valores que melhor encaixam em todas (mínimos quadrados).

- Usa só classificatórias jogadas e os pontos **sem as faltas** recebidas do adversário.
- No começo do evento, quando duas equipes só jogaram juntas, os pontos são divididos entre elas.
- OPR mede **pontos**, não o que o robô fez: não vê defesa e mistura o placar inteiro. Ele complementa o scouting, não substitui. É por isso que os acertos no CELL continuam sendo a métrica principal.

### Conferência com a tabela oficial

Na Visão geral, o app compara os relatórios com a tabela oficial (só partidas já jogadas):

- **Cobertura:** quantos robôs que jogaram têm relatório.
- **Corrigidos automaticamente:** o número anotado nem está inscrito no evento (ex.: 8734 em vez de 8743). É erro de digitação: o relatório passa a contar para a equipe da tabela.
- **Confira com o scouter:** o número anotado é de outra equipe inscrita. Não dá para saber se errou o número ou a posição, então o app só avisa.
- **Sem relatório:** robôs que jogaram e ninguém anotou.

## O que a dashboard **não** calcula, e por quê

- **TIPs por equipe:** o TIP é da aliança (os dois robôs lançam no mesmo CELL) e o manual não diz quantos POLLEN viram um TIP. Inventar esse número daria um ranking falso. A contribuição de cada robô é medida em **acertos no CELL**; os TIPs da aliança aparecem no placar detalhado oficial, na ficha da equipe.
- **Pontos totais da equipe:** pelo mesmo motivo. Só aparece o que dá para atribuir a um robô (LEAVE, PARK, FLOWER, GARDEN), com esse nome.

## Cuidados com os dados

- **Relatórios repetidos:** se dois scouters registrarem a mesma equipe na mesma partida, vale o mais recente. O ranking avisa quantos foram descartados.
- **Formato antigo:** relatórios de partida de versões antigas do formulário (`schemaVersion` diferente de 2) ficam de fora, com aviso.
- **Ciclos absurdos:** ciclo com mais de 300 s, mais acertos que POLLEN coletados ou valores quebrados é descartado, e os totais são **recalculados** a partir dos ciclos válidos. As regras do banco não conseguem validar cada item da lista de ciclos.
- **Poucas partidas:** ver [Poucos dados](#poucos-dados).
- **Sem internet:** a dashboard mostra o que está salvo no aparelho e avisa no topo.

## Cores dos gráficos

As cores foram validadas com script para daltonismo e contraste no fundo branco dos cards (separação mínima ΔE 8):

| Uso                   | Cor       |
| --------------------- | --------- |
| AUTO                  | `#5552D4` |
| TELEOP                | `#D63564` |
| Nossa equipe (ênfase) | `#D63564` |
| Demais equipes        | `#A9A7D6` |

O lilás das demais equipes tem contraste abaixo de 3:1 de propósito (é o "apagado" da ênfase). Por isso toda barra tem o valor escrito na ponta e existe uma tabela com os mesmos números.

## Custo no plano grátis

Cada pessoa com a dashboard aberta lê os relatórios do evento **uma vez** ao abrir (~150 leituras num evento inteiro) e depois só os que mudam. A foto do pit só é baixada ao abrir a ficha da equipe. Com 5 pessoas abrindo a dashboard 20 vezes no dia, são uns 15 mil de leitura, abaixo do limite grátis de 50 mil por dia.
