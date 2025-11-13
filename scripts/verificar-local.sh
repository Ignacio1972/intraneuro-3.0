#!/bin/bash
# Script de verificación para desarrollo local

echo "🔍 Verificando configuración local..."
echo "====================================="

# Verificar que estamos en desarrollo
if grep -q "NODE_ENV=development" backend/.env; then
    echo "✅ Ambiente: DESARROLLO"
else
    echo "❌ ERROR: No estás en modo desarrollo!"
    exit 1
fi

# Verificar puerto correcto
if grep -q "PORT=3001" backend/.env; then
    echo "✅ Puerto backend: 3001"
else
    echo "❌ ERROR: Puerto incorrecto en backend/.env"
    exit 1
fi

# Verificar api.js apunta a local
if grep -q "localhost:3001" js/api.js; then
    echo "✅ API apunta a localhost:3001"
else
    echo "❌ ERROR: api.js no apunta a localhost!"
    exit 1
fi

# Verificar BD local
if grep -q "DB_NAME=intraneuro_desarrollo" backend/.env; then
    echo "✅ Base de datos: intraneuro_desarrollo (local)"
else
    echo "❌ ERROR: Usando BD incorrecta!"
    exit 1
fi

# Verificar rama git
BRANCH=$(git branch --show-current)
if [[ $BRANCH != "main" ]] && [[ $BRANCH != "master" ]]; then
    echo "✅ Rama git: $BRANCH (no es main)"
else
    echo "⚠️  ADVERTENCIA: Estás en la rama principal!"
fi

echo "====================================="
echo "✅ Configuración local verificada"
echo ""
echo "Para iniciar el servidor:"
echo "  cd backend && npm start"
echo "  En otra terminal: cd .. && python3 -m http.server 8080"