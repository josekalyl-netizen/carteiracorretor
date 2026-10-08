# Carteira W3G na web — passo a passo

Guia para deixar a carteira funcionando por um endereço na internet, com login, dados na nuvem e uma cópia de segurança automática todo dia às 18h.

## Como tudo se encaixa

Pense em três lugares diferentes, cada um com uma função:

| Lugar | O que é | O que guarda |
|---|---|---|
| **Site** (GitHub, repositório `carteiracorretor`) | A "fachada da loja": o programa da carteira | Só o sistema. Nenhum dado de corretor. |
| **Nuvem** (Supabase) | O "cofre": onde os dados ficam, atrás de login | A carteira de verdade, sempre atualizada |
| **Cópia de segurança** (GitHub, repositório privado `carteira-backup`) | O "cofre reserva", em outra empresa | Uma cópia da carteira, renovada todo dia às 18h |

Se o site sair do ar, os dados continuam no cofre. Se o cofre der problema, existe o cofre reserva. Os três são gratuitos.

Tempo total: cerca de 40 minutos. Os nomes dos menus podem mudar um pouco com o tempo; a ordem é a mesma.

**O que já está pronto:** o sistema já está no GitHub, em `github.com/josekalyl-netizen/carteiracorretor`.

**Regra de ouro das chaves:** o Supabase tem duas chaves.
- A **pública** (`anon` ou `publishable`): pode ir no sistema. É essa que você manda para o Claude.
- A **secreta** (`service_role` ou `secret`): abre tudo sem login. Nunca mande para ninguém, nem cole em conversa. Ela só será colada em um lugar: o campo de segredos do GitHub (Etapa 5).

---

## Etapa 1 — Ligar o site (2 minutos)

1. Abra `github.com/josekalyl-netizen/carteiracorretor` e entre na sua conta.
2. Clique em **Settings** (engrenagem, no alto do repositório).
3. No menu da esquerda, clique em **Pages**.
4. Em **Source**, escolha **Deploy from a branch**.
5. Em **Branch**, escolha **main** e a pasta **/ (root)**. Clique em **Save**.
6. Espere 2 minutos e abra: `https://josekalyl-netizen.github.io/carteiracorretor/`

O sistema abre, mas ainda vazio e sem login. **Não lance nada nele ainda** — nesse ponto ele ainda guardaria só no navegador.

## Etapa 2 — Criar o cofre (Supabase, 10 minutos)

1. Abra `supabase.com`, clique em **Start your project** e crie sua conta.
2. Clique em **New project**.
   - **Name:** `carteira-w3g`
   - **Database Password:** clique em gerar uma senha forte e guarde-a (é a senha do banco; você quase nunca vai usar).
   - **Region:** **South America (São Paulo)**.
   - Clique em **Create new project** e espere 1 a 2 minutos.
3. Monte as "gavetas" do cofre:
   - No menu da esquerda, clique em **SQL Editor** → **New query**.
   - Abra o arquivo `nuvem/supabase.sql` (está na pasta do projeto e no GitHub), copie tudo, cole na tela e clique em **Run**.
   - Deve aparecer **Success**.
4. Crie o seu login:
   - Menu **Authentication** → **Users** → **Add user** → **Create new user**.
   - Coloque seu e-mail e uma senha forte, marque **Auto Confirm User** e confirme.
   - Esses são o e-mail e a senha que você vai digitar para entrar na carteira.
5. Feche a porta para estranhos:
   - Menu **Authentication** → **Sign In / Providers**.
   - Desligue **Allow new users to sign up** e salve.

## Etapa 3 — Conectar o site ao cofre (5 minutos)

1. No Supabase, vá em **Project Settings** (engrenagem) → **API Keys** (ou **API**).
2. Copie dois textos:
   - **Project URL** — parecido com `https://abcdefghijkl.supabase.co`
   - A chave **pública** — `anon` / `publishable`
3. Mande os dois para o Claude na conversa. Ele coloca no sistema e publica.
4. Em 2 minutos, recarregue o site com **Ctrl + F5**. Agora aparece a tela de login.

## Etapa 4 — Levar seus dados para o cofre (uma vez só, 5 minutos)

1. Abra `https://josekalyl-netizen.github.io/carteiracorretor/` e entre com o e-mail e a senha da Etapa 2.
2. O topo mostra "Nuvem vazia · restaure seu backup".
3. Vá em **Relatório** → **Restaurar backup** e escolha o seu backup mais recente.
   - Se você lançou algo no sistema antigo depois do último backup, exporte um novo lá antes (**Relatório** → **Exportar backup completo**).
4. Quando o topo mostrar **Nuvem em dia**, os dados estão no cofre.
5. Teste: abra o mesmo endereço no celular, faça login e veja se aparece igual.

Daqui em diante, use **somente** o endereço novo. O arquivo antigo do Chrome fica guardado como lembrança; não lance mais nada nele.

## Etapa 5 — Ligar o cofre reserva das 18h (10 minutos)

1. Crie o repositório privado:
   - No GitHub, clique no **+** (alto, à direita) → **New repository**.
   - **Repository name:** `carteira-backup`
   - Marque **Private**. (Importante: ele vai guardar dados de corretores.)
   - Não marque README, .gitignore nem licença. Clique em **Create repository**.
2. Avise o Claude que criou. Ele envia para lá o "robô" que faz a cópia.
3. Entregue as chaves ao robô (só você faz isso, direto no GitHub):
   - No repositório `carteira-backup`: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
   - Primeiro segredo — **Name:** `SUPABASE_URL` · **Secret:** a Project URL da Etapa 3. Clique em **Add secret**.
   - Segundo segredo — **Name:** `SUPABASE_CHAVE_SECRETA` · **Secret:** a chave **secreta** do Supabase (`service_role` / `secret`, na mesma tela de API Keys). Clique em **Add secret**.
   - Depois de salvo, nem você nem ninguém consegue ler o segredo de volta; só o robô usa.
4. Faça o primeiro teste na hora:
   - Aba **Actions** → **Cópia de segurança diária** → **Run workflow** → **Run workflow**.
   - Em cerca de 1 minuto aparece uma bolinha **verde**.
   - Volte para a aba **Code**: lá estão o arquivo `backup-carteira-w3g-ULTIMO.json` e a pasta `historico`.

Pronto. A partir daí o robô roda sozinho todo dia por volta das 18h (o GitHub pode atrasar alguns minutos), mesmo com seu computador desligado.

---

## Como fica no dia a dia

- **Você trabalha no site.** Cada alteração vai para o cofre em cerca de 2 segundos. O topo mostra "Nuvem em dia".
- **Sem internet:** continue trabalhando. O sistema guarda no aparelho e envia quando a conexão voltar.
- **Todo dia às 18h:** o robô copia a carteira para o cofre reserva. Você não precisa fazer nada.
- **Sistema novo:** quando o Claude melhorar o sistema, ele envia ao GitHub e o site se atualiza sozinho em 2 minutos. Seus dados não são tocados. Basta recarregar com **Ctrl + F5**.

## As camadas de segurança

1. **Cofre (Supabase):** os dados ficam na nuvem, não no navegador.
2. **Versões por dia, dentro do cofre:** uma por dia, dos últimos 90 dias. Em **Relatório** → **Versões na nuvem** você volta a carteira a um desses dias.
3. **Cofre reserva (GitHub privado):** cópia diária às 18h, em outra empresa, com 60 dias de histórico.
4. **Cópia no aparelho:** o navegador mantém a última versão, para funcionar sem internet.
5. **Backup em arquivo:** **Relatório** → **Exportar backup completo** continua existindo.

## Se algo der errado

| O que aconteceu | O que fazer |
|---|---|
| Apaguei ou estraguei algo hoje | **Relatório** → **Versões na nuvem** → escolha o dia anterior |
| O site não abre | Os dados estão seguros no cofre. Abra o arquivo `carteira-w3g.html` da pasta do projeto no computador e faça login normalmente |
| O Supabase saiu do ar ou perdeu os dados | No `carteira-backup`, baixe o `backup-carteira-w3g-ULTIMO.json` e use **Relatório** → **Restaurar backup** |
| Chegou e-mail do GitHub dizendo que o robô falhou | Abra a aba **Actions** do `carteira-backup`, clique na linha vermelha e leia a mensagem. A cópia anterior nunca é apagada por uma falha |
| Esqueci a senha da carteira | Supabase → **Authentication** → **Users** → no seu usuário, redefina a senha |
| O projeto do Supabase aparece como "pausado" | Painel do Supabase → **Restore project**. Os dados permanecem |

## Pontos de atenção

- O plano gratuito do Supabase pausa projetos parados por cerca de uma semana. O uso diário e o robô das 18h mantêm o projeto em atividade.
- O `carteira-backup` precisa continuar **privado**. O `carteiracorretor` é público, mas só tem o sistema, sem dados.
- A carteira tem dados pessoais (telefone, CPF, endereço). Use senha forte e exclusiva, e ative a verificação em duas etapas na conta do GitHub e do Supabase.
- Em computador que não é seu, use o botão de sair no topo: ele apaga a cópia daquele aparelho.
- Uma vez por mês, abra o `carteira-backup` e confira se a data da última cópia é recente.
