# Pokémon Database - React + Supabase

Uma aplicação para gerenciar sua jornada Pokémon, incluindo jogos, equipe e batalhas.

## 🚀 Setup do Projeto

### 1. Instalação das dependências

```bash
npm install
```

### 2. Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. No SQL Editor do Supabase, execute o script `Contexto.sql` para criar as tabelas
3. Copie o arquivo `.env.example` para `.env.local`
4. Preencha as variáveis no `.env.local`:

```env
VITE_SUPABASE_URL=https://seuprojectid.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### 3. Como encontrar suas credenciais do Supabase:

- **URL**: No dashboard do seu projeto, vá em `Settings > API` e copie a "Project URL"
- **Anon Key**: Na mesma página, copie a "anon public" key

### 4. Executar o projeto

```bash
npm run dev
```

## 🗄️ Estrutura do Banco de Dados

O banco possui 4 tabelas principais:

- **games**: Seus jogos Pokémon (ex: Sword, Scarlet)
- **pokemons**: Sua box global de Pokémon capturados
- **battles**: Registro de batalhas (ginásios, rivais, etc)
- **battle_participation**: Quais Pokémon participaram de cada batalha

## 🔐 Autenticação

O projeto usa o sistema de autenticação do Supabase com:

- Registro de novos usuários
- Login/logout
- Row Level Security (RLS) para proteger os dados de cada usuário

## 🛠️ Tecnologias Utilizadas

- React 19 + TypeScript
- Vite
- Supabase (Backend + Auth)
- CSS Modules
- ESLint + TypeScript ESLint

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React reutilizáveis
│   ├── Auth.tsx        # Componente de autenticação
│   └── Auth.module.css # Estilos do Auth
├── pages/              # Páginas da aplicação
│   ├── Dashboard.tsx   # Página principal (Dashboard)
│   ├── Dashboard.module.css
│   ├── Games.tsx       # Página de gerenciamento de jogos
│   └── Games.module.css
├── hooks/              # React hooks customizados
│   └── useAuth.ts      # Hook para gerenciar autenticação
├── lib/                # Configurações e utilitários
│   └── supabase.ts     # Cliente e tipos do Supabase
├── styles/             # Estilos globais
│   └── global.css      # CSS global e variáveis
├── App.tsx             # Componente principal com navegação
├── App.module.css      # Estilos do App
└── main.tsx            # Entry point
```

## ✨ Funcionalidades Implementadas

### ✅ Autenticação

- Login e cadastro de usuários
- Proteção de rotas com autenticação
- Logout

### ✅ Dashboard

- Visão geral do sistema
- Navegação para diferentes seções
- Informações do usuário logado

### ✅ Gerenciamento de Jogos

- Listagem de todos os jogos cadastrados
- Formulário para adicionar novos jogos
- Campos: Nome, Região e Plataforma
- Mensagens de sucesso e erro
- Atualização automática da lista

## 🎨 CSS Modules

O projeto utiliza CSS Modules para escopo local de estilos:

- Cada componente/página tem seu próprio arquivo `.module.css`
- Variáveis CSS globais definidas em `styles/global.css`
- Sintaxe: `className={styles['nome-da-classe']}`

## 🎯 Como usar

1. **Faça login ou cadastre-se** na tela inicial
2. **Dashboard**: Veja a visão geral e navegue entre as seções
3. **Meus Jogos**:
   - Adicione jogos usando o formulário
   - Veja todos os seus jogos cadastrados
   - Cada jogo mostra nome, região, plataforma e data de cadastro

## 📝 Próximas Funcionalidades

- [ ] Gerenciamento de Pokémon (adicionar, editar, deletar)
- [ ] Registro de batalhas
- [ ] Relacionamento entre Pokémon e jogos
- [ ] Estatísticas e gráficos
- [ ] Filtros e busca
- [ ] Exportação de dados

## 🌐 Servidor de Desenvolvimento

O projeto está rodando em: **http://localhost:5175/** (ou outra porta disponível)
