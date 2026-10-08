# Carteira W3G na web — passo a passo

Objetivo: abrir a carteira por um endereço na internet, em qualquer aparelho, com login, e com os dados guardados na nuvem (não mais só no Chrome).

São duas peças, as duas com plano gratuito:

| Peça | Para quê | Serviço sugerido |
|---|---|---|
| Banco de dados + login | Guardar a carteira e exigir senha | Supabase |
| Hospedagem | Dar um endereço (link) para o arquivo | GitHub Pages |

Tempo estimado: 30 a 40 minutos. Os nomes de menus podem mudar um pouco com o tempo; a ordem das etapas é a mesma.

> Enquanto você não fizer a Parte 2, nada muda: o arquivo continua funcionando localmente como hoje.

---

## Parte 1 — Criar o banco (Supabase)

1. Acesse **supabase.com**, crie uma conta e clique em **New project**.
   - Nome: `carteira-w3g`
   - Senha do banco: crie uma forte e guarde (não é a senha de login do sistema).
   - Região: **South America (São Paulo)**.
2. Quando o projeto terminar de criar, abra **SQL Editor** → **New query**, cole todo o conteúdo do arquivo `nuvem/supabase.sql` e clique em **Run**. Deve aparecer "Success".
3. Crie o seu usuário: **Authentication** → **Users** → **Add user** → **Create new user**.
   - Informe seu e-mail e uma senha forte.
   - Marque **Auto Confirm User**.
   - Essa é a senha que você vai digitar para entrar na carteira.
4. Bloqueie cadastros de terceiros: **Authentication** → **Sign In / Providers** (ou **Settings**) → desligue **Allow new users to sign up** e salve.
5. Pegue os dois dados de conexão em **Project Settings** → **API** (ou **API Keys**):
   - **Project URL** (algo como `https://abcdefghijkl.supabase.co`)
   - Chave **anon / publishable** (texto longo).
   - Nunca use a chave `service_role` / `secret` — ela dá acesso total e não pode ir para o arquivo.

## Parte 2 — Ligar o arquivo à nuvem

1. Abra `carteira-w3g.html` no Bloco de Notas (botão direito → Abrir com).
2. Procure (Ctrl+F) por `const NUVEM`. Você vai encontrar:
   ```js
   const NUVEM = {
     url: '',
     key: ''
   };
   ```
3. Cole os dois dados entre as aspas e salve:
   ```js
   const NUVEM = {
     url: 'https://abcdefghijkl.supabase.co',
     key: 'cole-aqui-a-chave-anon'
   };
   ```
   Se preferir, me passe a URL e a chave que eu preencho e confiro para você.

## Parte 3 — Publicar (GitHub Pages)

A pasta do projeto já está preparada como repositório git, com os backups bloqueados pelo `.gitignore` (eles nunca sobem).

1. Acesse **github.com**, entre na sua conta e clique em **New repository**.
   - Nome: `carteira-w3g`
   - Visibilidade: **Public** (no plano gratuito o GitHub Pages só publica repositório público; o arquivo não contém dados de corretores, eles ficam no Supabase atrás do login).
   - Não marque README, .gitignore nem licença. Clique em **Create repository**.
2. Copie o endereço do repositório (ex.: `https://github.com/SEU-USUARIO/carteira-w3g.git`) e me envie — eu faço o envio dos arquivos daqui. Na primeira vez o Windows abre uma janela do GitHub pedindo para você autorizar.
3. No repositório, vá em **Settings** → **Pages** → em **Source** escolha **Deploy from a branch**, branch **main**, pasta **/ (root)** → **Save**.
4. Em um ou dois minutos o endereço aparece no topo dessa mesma tela: `https://SEU-USUARIO.github.io/carteira-w3g/`.

## Parte 4 — Levar os dados para a nuvem (uma vez só)

1. No sistema atual (o do Chrome), vá em **Relatório** → **Exportar backup completo**.
2. Abra o endereço novo do GitHub Pages. Vai aparecer a tela de login: entre com o e-mail e a senha criados na Parte 1.
3. A carteira abre vazia e o topo mostra "Nuvem vazia · restaure seu backup". Vá em **Relatório** → **Restaurar backup** e escolha o arquivo exportado.
4. Em alguns segundos o topo mostra **Nuvem em dia**. Pronto: os dados estão na nuvem.
5. Confira: abra o mesmo endereço no celular, faça login e veja se a carteira aparece igual.

A partir daqui, use sempre o endereço novo. O arquivo antigo do Chrome pode ficar guardado como reserva, mas não lance mais nada nele.

---

## Como fica protegido

- **Na nuvem**: cada alteração é enviada em cerca de 2 segundos. O indicador no topo mostra "Nuvem em dia", "Enviando…" ou "Sem nuvem · salvo neste aparelho".
- **Cópias diárias**: a nuvem guarda uma versão por dia dos últimos 90 dias. Em **Relatório** → **Versões na nuvem** você volta a carteira para qualquer um desses dias.
- **Sem internet**: você continua trabalhando; o navegador guarda e envia quando a conexão voltar.
- **Dois aparelhos**: se os dois alterarem ao mesmo tempo, o sistema pergunta qual versão manter em vez de sobrescrever em silêncio.
- **Login**: sem e-mail e senha ninguém vê os dados, mesmo conhecendo o endereço. O botão de sair (no topo) apaga a cópia daquele aparelho — use em computador que não é seu.
- **Backup em arquivo**: continua existindo. Vale exportar um toda sexta, como reserva fora da nuvem.

## Quando eu te entregar uma versão nova do sistema

Eu altero o arquivo nesta pasta e envio para o GitHub; o site se atualiza sozinho em um ou dois minutos. Basta recarregar a página (Ctrl+F5).

Os dados não são afetados: eles ficam no Supabase, não no arquivo. Não é mais preciso restaurar backup a cada atualização.

## Pontos de atenção

- No plano gratuito, o Supabase **pausa projetos sem uso por cerca de uma semana**. Com uso diário isso não acontece; se acontecer (férias, por exemplo), basta entrar no painel do Supabase e clicar em **Restore/Resume** — os dados permanecem.
- A carteira contém dados pessoais dos corretores (telefone, CPF, endereço). Use senha forte e exclusiva, e não compartilhe o login.
- Esqueceu a senha: no painel do Supabase, **Authentication** → **Users** → no seu usuário, redefina a senha.
