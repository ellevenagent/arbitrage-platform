#!/bin/bash
# 🚀 Git Push Script - Arbitrage Platform
# Uso: ./push_to_github.sh

set -e

REPO_URL="https://github.com/ellevenagent/arbitrage-platform.git"

echo "📤 Verificando repositório..."

# Verificar se remote existe
if git remote get-url origin &>/dev/null; then
    echo "✅ Remote 'origin' já configurado"
else
    echo "🔗 Adicionando remote origin..."
    git remote add origin "$REPO_URL"
fi

# Push
echo "🚀 Fazendo push para GitHub..."
git push -u origin main

echo ""
echo "✅ Push realizado com sucesso!"
echo "📦 Repositório: https://github.com/ellevenagent/arbitrage-platform"
echo ""
echo "📋 Próximo passo: Deploy no Railway"
echo "   → https://railway.app/new"
