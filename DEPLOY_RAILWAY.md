# 🚀 DEPLOY NA RAILWAY - ARBITRAGE PLATFORM

## Pré-requisitos

1. Conta no [Railway](https://railway.app)
2. Conta no [GitHub](https://github.com)

---

## 📋 PASSO A PASSO

### 1. Criar repositório no GitHub

1. Acesse: https://github.com/new
2. Repository name: `arbitrage-platform`
3. Description: "Real-time crypto arbitrage detection platform"
4. **Private** ou **Public** (escolha)
5. **NÃO** marque "Add a README file" (já temos um)
6. Clique em "Create repository"

### 2. Fazer push do código

```bash
cd /home/ubuntu/.openclaw/workspace/arbitrage-platform

# Se ainda não adicionou o remote:
git remote add origin https://github.com/SEU_USUARIO/arbitrage-platform.git

# Renomear branch para main
git branch -M main

# Primeiro push
git push -u origin main
```

**Nota:** Irá pedir username e password:
- Username: seu usuário do GitHub
- Password: **Use o token pessoal** (não a senha)

#### Criar token no GitHub:
1. https://github.com/settings/tokens
2. Generate new token (classic)
3. Marque: `repo`, `workflow`
4. Copie o token e use como password

---

### 3. Deploy no Railway

1. Acesse: https://railway.app/new
2. Clique em **"Deploy from GitHub repo"**
3. Selecione o repositório `arbitrage-platform`
4. Configure o serviço:

#### Backend Service:
- **Root Directory:** `backend`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Variables:**
  - `PORT`: 8080
  - `REDIS_URL`: (deixe vazio se não tiver Redis)
  - `MIN_ARBITRAGE_PERCENT`: 0.5
  - `MIN_VOLUME_USD`: 1000

#### Frontend Service (opcional):
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Start Command:** (não precisa, é estático)
- **Output Directory:** `dist`

---

### 4. Variáveis de Ambiente (Railway Dashboard)

No Railway, vá em Variables e adicione:

```env
# Redis (opcional - Railway tem Redis plugin)
REDIS_URL=redis://localhost:6379

# Server
PORT=8080
NODE_ENV=production

# Arbitrage Settings
MIN_ARBITRAGE_PERCENT=0.5
MIN_VOLUME_USD=1000

# APIs (para execução futura - opcional)
# BINANCE_API_KEY=
# BINANCE_API_SECRET=
# BYBIT_API_KEY=
# BYBIT_API_SECRET=
```

---

### 5. Plugins Recomendados (Railway)

1. **Redis** - Para cache e Pub/Sub
   - Vá em Resources → Add Plugin → Redis

2. **PostgreSQL** - Já temos, mas pode adicionar outro se quiser dados separados

---

### 6. Domino (Custom Domain)

No Railway:
1. Settings → Domains
2. Adicione seu domínio
3. Configure DNS conforme instruído

---

## ✅ VERIFICAÇÃO

Após deploy:

1. **Health Check:**
```
https://seu-app.railway.app/health
```

Deve retornar:
```json
{
  "status": "ok",
  "connections": {
    "binance": true,
    "bybit": true,
    "coinbase": true,
    "kraken": true
  }
}
```

2. **WebSocket Test:**
Conecte em:
```
wss://seu-app.railway.app
```

---

## 🔒 SEGURANÇA

### Para Produção:

1. **NÃO exponha API Keys** no repositório
2. Use **Railway Secrets** para credenciais
3. Configure **CORS** para seu domínio apenas
4. Use **HTTPS** sempre (Railway fornece automaticamente)

### Sandbox Mode:

Por padrão, o sistema opera em **modo somente leitura**:
- ✅ Streaming de preços (funciona sem API Keys)
- ❌ Execução de trades (requer API Keys habilitadas)

---

## 📁 Estrutura Final

```
arbitrage-platform/
├── backend/           # Node.js + WebSocket server
├── frontend/          # React dashboard
├── railway.json       # Railway config (opcional)
├── .env.example       # Variáveis de exemplo
└── README.md          # Este arquivo
```

---

## 🛠️ Troubleshooting

### WebSocket não conecta?
- Verifique firewall/portas
- Railway pode bloquear algumas portas

### Redis não conecta?
- Use Railway Redis Plugin
- Ou configure Redis externo (Redis Cloud, etc.)

### Memory issues?
- Backend precisa de pelo menos 512MB
- Configure SCALING no Railway

---

## 📞 Suporte

- Documentação CCXT: https://docs.ccxt.com
- Railway Docs: https://docs.railway.app
- WebSocket Endpoints públicos (sem API Key):
  - Binance: `wss://stream.binance.com:9443/ws`
  - Bybit: `wss://stream.bybit.com/v5/ws`
  - Coinbase: `wss://ws-feed.exchange.coinbase.com`
  - Kraken: `wss://ws.kraken.com`

---

**⚠️ IMPORTANTE:** Este projeto é para fins educacionais. Sempre teste em sandbox antes de operar com dinheiro real.
