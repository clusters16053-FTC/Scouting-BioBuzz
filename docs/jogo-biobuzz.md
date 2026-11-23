# Jogo BIOBUZZ — resumo para scouting

Fonte: _BIOBUZZ Competition Manual_, versão Team Update 09 (seção 10). Em caso de dúvida, o manual oficial manda.

Os valores usados pelo código ficam em [`src/config/game.js`](../src/config/game.js).

## Partida

| Período   | Duração | Observação                              |
| --------- | ------- | --------------------------------------- |
| AUTO      | 30 s    | Robôs sem controle dos pilotos          |
| Transição | 8 s     | Robôs parados                           |
| TELEOP    | 2 min   | FLOWERS só pontuam no **último minuto** |

É 2 contra 2: **4 robôs por partida**, então cada scouter acompanha um robô.

## Elementos

- **POLLEN:** 40 bolas amarelas (~2,8 in). Cada robô começa com 4 de preload.
- **NECTAR:** 8 vermelhas + 8 azuis (~3,6 in).
- **HIVE:** uma por aliança, com 2 CELLS. Lançar POLLEN no CELL virado pra cima faz a HIVE virar (**TIP**).
- **FLOWER:** 4 no campo. A aliança com o NECTAR da sua cor mais em cima "possui" a FLOWER.
- **GARDEN:** zona da aliança em cada canto.
- **LOADING ZONE:** onde o robô faz PARK.

## Pontuação (Tabela 10-2)

| Ação                                    | AUTO | TELEOP |
| --------------------------------------- | ---- | ------ |
| LEAVE                                   | 3    | –      |
| PARK                                    | 5    | 5      |
| HIVE TIP                                | 20   | 20     |
| POLLEN/NECTAR que sobra no CELL de cima | –    | 2      |
| Bônus de NECTAR mais embaixo            | –    | 5      |
| POLLEN/NECTAR numa FLOWER possuída      | –    | 2      |
| POLLEN/NECTAR no GARDEN                 | –    | 1      |

Faltas: **MINOR = 5** e **MAJOR = 20** pontos para o adversário.

## Ranking Points (eventos comuns)

| RP           | Condição                 | Valor |
| ------------ | ------------------------ | ----- |
| WIN / TIE    | Vencer / empatar         | 3 / 1 |
| SWARM        | LEAVE + PARK ≥ 16 pontos | 1     |
| POLLINATOR 1 | ≥ 4 TIPS                 | 1     |
| POLLINATOR 2 | ≥ 7 TIPS                 | 1     |

## Regras que afetam estratégia

- Cada robô controla **no máximo 4** POLLEN/NECTAR por vez.
- Não pode controlar o NECTAR do adversário.
- NECTAR na FLOWER antes do último minuto = MAJOR FOUL por NECTAR.

## O que isso significa para o scouting

O **TIP é da aliança**: os dois robôs lançam no mesmo CELL. Por isso o scouter registra os **ciclos do robô dele**: quanto tempo leva para coletar e ficar pronto, quantos POLLEN coletou e quantos acertou. Isso mostra a contribuição individual para os TIPS (precisão e ritmo). Placar e TIPS oficiais podem ser puxados depois dos resultados da _FIRST_.
