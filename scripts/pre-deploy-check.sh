#!/bin/bash
# Script de verificación PRE-DEPLOY
# EJECUTAR SIEMPRE antes de hacer push a producción

echo "🛡️  VERIFICACIÓN PRE-DEPLOY"
echo "============================"

ERRORS=0

# 1. Verificar que NO hay credenciales de producción
if grep -q "IntraNeuro2025" backend/.env; then
    echo "❌ ERROR: .env contiene credenciales de producción!"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ .env sin credenciales de producción"
fi

# 2. Verificar api.js
if grep -q "localhost" js/api.js; then
    echo "❌ ERROR: api.js apunta a localhost!"
    echo "   Ejecuta: sed -i '' 's|http://localhost:3001|/api|g' js/api.js"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ api.js configurado para producción"
fi

# 3. Verificar archivos sensibles
if ls backend/*.backup* 2>/dev/null || ls *.env.* 2>/dev/null; then
    echo "⚠️  ADVERTENCIA: Hay archivos .backup o .env.* que no deberían subirse"
fi

# 4. Verificar modelos no modificados
if git diff --name-only | grep -q "models/.*\.js"; then
    echo "⚠️  ADVERTENCIA: Has modificado modelos de BD - ¿Estás seguro?"
fi

# 5. Verificar migraciones
if git diff --name-only | grep -q "migrations/"; then
    echo "❌ ERROR: NO modifiques migraciones!"
    ERRORS=$((ERRORS + 1))
fi

echo "============================"

if [ $ERRORS -gt 0 ]; then
    echo "❌ NO ESTÁS LISTO PARA DEPLOY - Corrige los errores"
    exit 1
else
    echo "✅ Listo para deploy (recuerda hacer backup primero)"
    echo ""
    echo "Próximos pasos:"
    echo "1. ssh root@148.113.205.115"
    echo "2. cd /var/www/intraneuro && ./scripts/backup_automatico.sh"
    echo "3. git pull origin main"
    echo "4. pm2 restart intraneuro-api"
fi