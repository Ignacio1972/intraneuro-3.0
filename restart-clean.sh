#!/bin/bash

echo "🔄 Reiniciando sistema INTRANEURO con caché limpio..."

# Matar procesos existentes
echo "Deteniendo servicios..."
pkill -f "node server.js"
pkill -f "python3 -m http.server"

# Esperar un momento
sleep 2

# Iniciar backend
echo "Iniciando backend..."
cd backend
npm start > /dev/null 2>&1 &

# Esperar que el backend inicie
sleep 3

# Iniciar frontend
echo "Iniciando frontend..."
cd ..
python3 -m http.server 8080 > /dev/null 2>&1 &

sleep 2

echo "✅ Sistema reiniciado"
echo ""
echo "📱 Abre http://localhost:8080 en modo incógnito o:"
echo "   1. Abre DevTools (F12)"
echo "   2. Click derecho en el botón de recargar"
echo "   3. Selecciona 'Empty Cache and Hard Reload'"
echo ""
echo "🔑 Login: sistema / 4321"