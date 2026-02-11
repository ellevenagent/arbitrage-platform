#!/bin/bash
# 🚀 Git Push Script - Arbitrage Platform
# Uso: ./push_to_github.sh

echo "📤 Preparando para push no GitHub..."
echo ""
echo "PASSOS:"
echo ""
echo "1. Crie o repositório em:"
echo "   https://github.com/new"
echo ""
echo "   Repository name: arbitrage-platform"
echo "   Description: Real-time crypto arbitrage detection platform"
echo "   Private ou Public: escolha"
echo "   ❌ NÃO marque 'Add a README file'"
echo ""
echo "2. Execute:"
echo ""
cat << 'EOF'
cd /home/ubuntu/.openclaw/workspace/arbitrage-platform

# Adicionar origin (substitua SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/arbitrage-platform.git

# Push (irá pedir usuário e token)
git branch -M main
git push -u origin main
EOF
echo ""
echo "3. Para autenticação:"
echo "   - Username: seu usuário do GitHub"
echo "   - Password: TOKEN PESSOAL (não a senha!)"
echo ""
echo "   Criar token:"
echo "   https://github.com/settings/tokens"
echo "   → Generate new token (classic)"
echo "   → Marque: repo, workflow"
echo "   → Copie e use como password"
echo ""
echo "4. Após push, faça deploy no Railway:"
echo "   https://railway.app/new"
echo ""
echo "📖 Veja DEPLOY_RAILWAY.md para instruções completas!"
