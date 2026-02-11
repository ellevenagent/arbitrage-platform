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
echo "2. Repository name: arbitrage-platform"
echo "3. Description: Real-time crypto arbitrage detection platform"
echo "4. Private ou Public: escolha"
echo "5. NÃO marque 'Add a README file'"
echo "6. Create repository"
echo ""
echo "7. Execute:"
echo ""
cat << 'EOF'
cd /home/ubuntu/.openclaw/workspace/arbitrage-platform

# Se ainda não adicionou o remote:
git remote add origin https://github.com/SEU_USUARIO/arbitrage-platform.git

# Push
git branch -M main
git push -u origin main
EOF
echo ""
echo "8. Autenticação GitHub:"
echo "   - Username: seu usuário do GitHub"
echo "   - Password: TOKEN PESSOAL (não a senha!)"
echo ""
echo "9. Criar token:"
echo "   https://github.com/settings/tokens"
echo "   → Generate new token (classic)"
echo "   → Marque: repo, workflow"
echo "   → Copie o token e use como password"
echo ""
echo "10. Deploy no Railway:"
echo "    https://railway.app/new"
echo ""
echo "📖 Veja DEPLOY_RAILWAY.md!"
