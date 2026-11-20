# Arquitetura

## Visão geral

```
┌────────────────────┐        ┌──────────────────┐        ┌──────────────────────┐
│ Celular do scouter │        │      Vercel      │        │  Firebase Firestore  │
│  (PWA instalado)   │◄───────│ hospeda o site   │        │  banco de dados      │
│                    │ 1x com │ (HTML/JS/CSS)    │        │                      │
│  formulário ──► cache local ─────────────────────────────► coleções do evento  │
│                    │  quando tem wifi                    │          │           │
└────────────────────┘                                     └──────────┼───────────┘
                                                                      │ tempo real
                                                           ┌──────────▼───────────┐
                                                           │ Dashboard (notebook) │
                                                           └──────────────────────┘
```

## Por que cada peça

### Vercel (hospedagem)

O site é **estático**: só HTML, JS e CSS, sem servidor próprio. A Vercel serve esses arquivos de graça e faz deploy sozinha a cada push no GitHub. Cada branch ganha um link de preview, então dá pra testar mudanças sem mexer no site oficial.

Alternativas avaliadas:

- **GitHub Pages:** também grátis, mas serve o site num subcaminho (`/scouting-biobuzz/`), o que complica a configuração do PWA.
- **Netlify:** o plano grátis atual funciona por créditos, cada deploy consome parte deles e o site é suspenso quando acabam. É arriscado na semana de evento.

### Firebase Firestore (banco)

- **Offline nativo:** com a persistência ligada, o Firestore guarda as escritas no aparelho e envia sozinho quando a conexão volta. Não precisamos construir fila de sincronização na mão.
- **Tempo real:** o dashboard "escuta" as coleções e atualiza sem recarregar a página.
- **Sem backend:** o navegador fala direto com o banco, e a proteção vem das **regras de segurança** do Firestore.

Alternativas avaliadas:

- **MongoDB Atlas:** a MongoDB removeu o Device Sync e a Data API em 2025. Usar o Atlas exigiria criar uma API própria e construir offline e tempo real na mão.
- **Supabase:** sem offline nativo, e projetos grátis pausam após um período sem uso.

> **Fotos:** o Firebase Storage passou a exigir o plano pago (Blaze). Por isso as fotos do pit são comprimidas no celular e salvas dentro do próprio documento no Firestore.

### PWA (Progressive Web App)

Um _service worker_ guarda os arquivos do site no aparelho. Depois que o scouter abre o site **uma vez com internet**, o app abre mesmo em modo avião.

## Fluxo no dia da competição

1. **Antes do evento, com wifi:** cada scouter abre o site e instala na tela inicial.
2. **Perto da arena, sem wifi:** o scouter preenche a partida e o relatório fica salvo no aparelho como pendente.
3. **De volta ao wifi:** o app envia os pendentes sozinho.
4. **Dashboard:** recebe os relatórios em tempo real.

### Cuidados

- **iPhone (Safari)** não sincroniza em segundo plano: o envio acontece com o app **aberto** e com internet. O app mostra um indicador de "N pendentes / tudo sincronizado".
- Cada relatório recebe um **ID gerado no celular**. Dois scouters offline nunca se sobrescrevem e reenviar não duplica.
- Existe um **backup de emergência**: exportar os pendentes em arquivo se o wifi do evento falhar.
