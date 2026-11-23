# Firebase

O Firebase é o banco de dados (Firestore) e o login (Authentication) do sistema. Tudo no plano grátis **Spark**, sem cartão de crédito.

## Como a segurança funciona

O site é público e a configuração do Firebase fica visível no JavaScript. Isso é normal. Quem protege o banco são as **regras** em [`firestore.rules`](../firestore.rules), que rodam no servidor do Google e não podem ser burladas pelo navegador.

```
1. Scouter abre o app pela 1ª vez (com internet)
2. Digita nome + CÓDIGO DA EQUIPE
3. Firebase cria um login ANÔNIMO para o aparelho (sem email, sem senha)
4. App tenta criar members/{uid} com o código
5. Regra compara com config/access.teamCode ──► bateu? vira membro
                                              └► errou? bloqueado
6. Só membros leem e escrevem relatórios
```

| Coleção                    | Quem lê            | Quem escreve                                    |
| -------------------------- | ------------------ | ----------------------------------------------- |
| `config/access`            | ninguém            | ninguém (só pelo console)                       |
| `members/{uid}`            | o próprio aparelho | o próprio aparelho, uma vez, com o código certo |
| `events/{id}/matchReports` | membros            | membros, em nome próprio                        |
| `events/{id}/pitReports`   | membros            | membros, em nome próprio                        |
| `events/{id}/pitPhotos`    | membros            | membros, foto de até ~300 KB                    |
| qualquer outro caminho     | ninguém            | ninguém                                         |

Ninguém apaga nada pelo app, nem membro. Se precisar apagar, é pelo console.

> **Trocar o código** impede que novos aparelhos entrem com o código antigo, mas quem já entrou continua com acesso. Para expulsar todo mundo, apague os documentos de `members` no console.

### Testes das regras

[`tests/rules/firestore.rules.test.js`](../tests/rules/firestore.rules.test.js) simula ataques e usos normais: quem não tem login, quem errou o código, quem tenta escrever em nome de outro... O GitHub Actions roda esses testes em todo PR.

Para rodar no seu computador (precisa do [Java 21+](https://adoptium.net/)):

```bash
npm run test:rules
```

## Criar o projeto (uma vez só)

### 1. Projeto

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) e crie um projeto (ex.: `scouting-biobuzz`).
2. **Google Analytics:** pode desativar, não usamos.

### 2. App web

1. Na página do projeto, clique no ícone **`</>`** (Web) para adicionar um app.
2. Dê um apelido (ex.: `scouting-web`). **Não** marque Firebase Hosting (usamos a Vercel).
3. Copie os valores de `apiKey`, `authDomain`, `projectId` e `appId` que aparecem no `firebaseConfig`.

### 3. Login anônimo

**Authentication → Começar → Método de login → Anônimo → Ativar → Salvar.**

### 4. Banco de dados

1. **Firestore Database → Criar banco de dados.**
2. Edição **Standard**.
3. Local: **`southamerica-east1` (São Paulo)**, o mais perto do Ceará. ⚠️ Não dá para mudar depois.
4. Comece em **modo de produção** (tudo bloqueado até publicarmos as regras).

### 5. Regras

Na aba **Regras** do Firestore, apague tudo, cole o conteúdo de `firestore.rules` e clique em **Publicar**.

> Toda vez que `firestore.rules` mudar no repositório, publique de novo. Alternativa pela linha de comando:
>
> ```bash
> npx firebase login
> npx firebase use --add        # escolha o projeto
> npx firebase deploy --only firestore:rules
> ```

### 6. Código da equipe

Na aba **Dados** do Firestore:

1. **Iniciar coleção** → ID: `config`
2. ID do documento: `access`
3. Campo `teamCode`, tipo **string**, valor: o código que a equipe vai usar (ex.: `clusters-mel-2026`). Use algo difícil de chutar e passe só para quem vai fazer scouting.

### 7. Variáveis de ambiente

**No seu computador:** copie `.env.example` para `.env.local` e preencha com os valores do passo 2. O `.env.local` não vai para o Git.

**Na Vercel:** Project → **Settings → Environment Variables** → adicione as 4 variáveis `VITE_FIREBASE_*` (marque Production e Preview). Depois vá em **Deployments → ⋯ → Redeploy**.

> **Por que redeploy?** O Vite escreve os valores das variáveis dentro do JavaScript **na hora do build**. Mudar a variável sem gerar um build novo não muda nada no site.

## Desenvolvimento local sem tocar no banco real

```bash
npm run dev:emulators
```

Sobe um Firestore e um login **falsos** no seu computador (precisa do Java 21+), cadastra o código de teste `clusters-dev` e abre o site apontando para eles. Painel dos emuladores: <http://127.0.0.1:4000>. Tudo some quando você fecha o terminal.

## Limites do plano grátis (Firestore)

| Recurso                | Por dia / mês | Nosso uso estimado por evento |
| ---------------------- | ------------- | ----------------------------- |
| Leituras de documentos | 50.000 / dia  | alguns milhares               |
| Escritas de documentos | 20.000 / dia  | ~150                          |
| Dados armazenados      | 1 GiB         | poucos MB                     |
| Transferência de saída | 10 GiB / mês  | poucos MB                     |

Acompanhe em **Firestore → Uso** no console.
