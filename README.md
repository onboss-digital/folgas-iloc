# Folgas iLoc — Sistema de Gestão de Escalas e Folgas 5x2

Plataforma SaaS moderna e intuitiva para planejamento, organização e acompanhamento de escalas de trabalho e folgas no modelo 5x2, desenvolvida em conformidade com as diretrizes da Consolidação das Leis do Trabalho (CLT) e calendário oficial de feriados nacionais do Brasil.

---

## Visão Geral do Produto

O **Folgas iLoc** resolve a complexidade operacional da gestão de equipes de varejo, atendimento e operações. A plataforma permite que o administrador estruture a escala semanal com poucos cliques, determine folgas compensatórias e publique a programação oficial para consulta em tempo real pelos colaboradores.

### Diferenciais da Solução
- **Montagem Visual Dinâmica:** Definição direta de trabalho e folga com 1 clique sobre a célula do dia, sem modais lentos ou formulários longos.
- **Isolamento e Segurança de Dados:** Colaboradores visualizam exclusivamente os membros e escalas da sua própria equipe.
- **Feriados Nacionais Oficiais:** Reconhecimento algorítmico de feriados fixos e móveis nacionais (incluindo o Dia da Consciência Negra — Lei nº 14.759/2023).
- **Link Público Seguro:** Compartilhamento restrito via token exclusivo controlado pelo administrador.
- **Operação Híbrida (Nuvem + Offline):** Suporte nativo a persistência no Supabase (PostgreSQL) com fallback transparente para armazenamento local em caso de instabilidade.

---

## Tecnologias Utilizadas

- **Framework Web:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19)
- **Linguagem:** [TypeScript 5](https://www.typescriptlang.org/) (Modo estrito ativado)
- **Estilização e Design:** [Tailwind CSS v4](https://tailwindcss.com/) com tipografia corporativa [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Banco de Dados e Auth:** [Supabase](https://supabase.com/) (PostgreSQL 15+, Row Level Security, Supabase Auth)
- **Análise Estática:** ESLint com padrões oficiais Next.js

---

## Estrutura do Projeto

```text
folgas-iloc/
├── public/                 # Ativos estáticos e ícones
├── src/
│   ├── app/
│   │   ├── escala-publica/ # Página pública para consulta de escala via token
│   │   ├── globals.css     # Estilos globais e tokens de design neutro
│   │   ├── layout.tsx      # Layout raiz com fontes e viewport mobile
│   │   └── page.tsx        # Aplicação principal, roteamento e autenticação
│   ├── components/
│   │   ├── auth/           # Formulários e telas de autenticação
│   │   ├── escala/         # Quadro de escalas, histórico e cartões de link
│   │   ├── funcionario/    # Painel diário do colaborador
│   │   ├── modal/          # Modais de publicação e compartilhamento
│   │   ├── perfil/         # Gestão de perfil e credenciais do usuário
│   │   ├── tabs/           # Painéis administrativos e abas de navegação
│   │   ├── BottomNav.tsx   # Navegação inferior responsiva para celular
│   │   ├── Header.tsx      # Barra superior de navegação desktop
│   │   └── Toast.tsx       # Notificações contextuais do sistema
│   ├── lib/
│   │   ├── holidays.ts     # Cálculo oficial de feriados nacionais brasileiros
│   │   ├── scheduleEngine.ts # Motor de escalas, regras 5x2 e validações CLT
│   │   └── supabase.ts     # Cliente e sincronização de dados na nuvem
│   └── types/
│       └── index.ts        # Definições de tipos TypeScript do sistema
├── .env.example            # Modelo de configuração de variáveis de ambiente
├── .gitignore              # Regras de exclusão do repositório
├── package.json            # Dependências e scripts do projeto
├── supabase_schema.sql     # Script SQL de criação do banco e políticas RLS
└── tsconfig.json           # Configurações do compilador TypeScript
```

---

## Configuração e Instalação

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18.18 ou superior.
- Gerenciador de pacotes `npm`, `pnpm` ou `yarn`.
- (Opcional) Conta no [Supabase](https://supabase.com/) para persistência em nuvem.

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/folgas-iloc.git
cd folgas-iloc
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
Copie o arquivo de exemplo e crie seu arquivo `.env.local`:
```bash
cp .env.example .env.local
```

Abra o arquivo `.env.local` e informe as credenciais do seu projeto Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-publica
```

> **Nota:** Caso você não configure o Supabase imediatamente, a aplicação continuará funcionando perfeitamente em modo de persistência local no navegador.

### 4. Configurar o Banco de Dados (Supabase)
1. Acesse o painel do seu projeto no Supabase.
2. Navegue até a seção **SQL Editor** -> **New Query**.
3. Copie todo o conteúdo do arquivo [`supabase_schema.sql`](./supabase_schema.sql) e execute o script.
4. O script criará as tabelas `employees`, `schedules` e `company_settings`, os índices de consulta e as políticas de **Row Level Security (RLS)**.

---

## Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento local na porta 3000 |
| `npm run build` | Compila o projeto com otimização total de produção |
| `npm run start` | Inicia o servidor Next.js em modo de produção |
| `npm run lint` | Executa a verificação estática de código com o ESLint |

---

## Perfis de Acesso e Regras de Negócio

### Administrador
- Cadastro, edição e convite de colaboradores.
- Gestão e personalização de equipes da filial.
- Montagem do quadro de escalas semanal, salvamento de rascunhos e publicação oficial.
- Geração de links seguros para compartilhamento externo.
- Parâmetros da empresa (regime 5x2, cobertura mínima e expediente).

### Colaborador
- Login com credenciais corporativas.
- Painel personalizado exibindo o status de trabalho ou folga do dia.
- Horários de entrada, intervalo e saída previstos.
- Visualização dos turnos e folgas dos colegas pertencentes exclusivamente à sua equipe.
- Edição do perfil pessoal e atualização de senha.

---

## Segurança e Proteção de Dados

- **Row Level Security (RLS):** Toda consulta ao banco no Supabase valida a identidade e privilégios do usuário via JWT.
- **Proteção contra Vazamento:** Arquivos de credenciais (`.env*`, `.pem`) são rigorosamente bloqueados pelo `.gitignore`.
- **Isolamento de Equipes:** Regras lógicas no cliente e no servidor impedem o acesso cruzado de informações confidenciais entre departamentos diferentes.
- **Links com Token Único:** O link público utiliza um token alfanumérico não sequencial gerado dinamicamente no momento da publicação.

---

## Licença

Este projeto é desenvolvido para uso corporativo sob licença proprietária. Todos os direitos reservados.
