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
- ESLint + TypeScript ESLint

## 📁 Estrutura do Projeto

```
src/
├── components/     # Componentes React
│   └── Auth.tsx   # Componente de autenticação
├── hooks/         # React hooks customizados
│   └── useAuth.ts # Hook para gerenciar autenticação
├── lib/           # Configurações e utilitários
│   └── supabase.ts # Cliente e tipos do Supabase
├── App.tsx        # Componente principal
└── main.tsx       # Entry point
```

{
files: ['**/*.{ts,tsx}'],
extends: [
// Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },

},
])

````

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
````
