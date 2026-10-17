# Guia de Publicação no Vercel - BellaPDV

O projeto já está **100% configurado e pronto para deploy no Vercel**, tanto para o frontend (React + Vite SPA) quanto para os endpoints de backend (Serverless Functions em `/api`).

---

## 🚀 Método 1: Deploy Rápido via GitHub (Recomendado)

1. **Suba o projeto no seu GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: configuracao vercel para bellapdv"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   git push -u origin main
   ```

2. **Acesse o Vercel**:
   - Vá para [vercel.com](https://vercel.com) e faça login com sua conta do GitHub.
   - Clique em **"Add New..."** > **"Project"**.
   - Selecione o repositório que você acabou de subir e clique em **"Import"**.

3. **Configurações do Projeto no Vercel**:
   O Vercel detectará automaticamente as configurações através do arquivo `vercel.json` já criado:
   - **Framework Preset**: Vite
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Variáveis de Ambiente (Environment Variables)**:
   Na seção **"Environment Variables"** da tela de deploy no Vercel, adicione:
   - `GEMINI_API_KEY`: Sua chave de API do Google Gemini (necessária para as funções de voz neural e IA)
   - `ASAAS_API_KEY`: *(Opcional)* Chave de integração do Asaas caso utilize cobranças reais

5. **Clique em "Deploy"**:
   Em cerca de 1 a 2 minutos, o Vercel finalizará a compilação e fornecerá sua URL pública de produção (ex: `https://bellapdv.vercel.app`).

---

## ⚡ Método 2: Deploy Direto via Vercel CLI (Terminal)

Se preferir publicar diretamente pelo terminal:

1. Instale ou execute a CLI do Vercel:
   ```bash
   npx vercel
   ```
2. Siga as instruções no terminal (faça login se solicitado e confirme as opções padrão).
3. Para publicar diretamente em produção:
   ```bash
   npx vercel --prod
   ```

---

## 🛠️ O que foi configurado no projeto:

- `vercel.json`: Regras de roteamento SPA (para navegação em `/pos`, `/schedule`, `/finance`, etc.) e roteamento de `/api/*` para as Serverless Functions do Vercel.
- `api/index.ts`: Ponto de entrada Serverless Function para o Express API (atendendo Gemini AI, TTS e proxies).
- `server.ts`: Otimizado com carregamento dinâmico do Vite (não gera peso extra em produção) e suporte a ambientes serverless.
- `.vercelignore`: Exclui artefatos desnecessários de build do Electron e logs.
