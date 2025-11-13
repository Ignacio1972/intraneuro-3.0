#!/bin/bash
# =====================================================
# BACKUP DE ARCHIVOS CRÍTICOS ANTES DE NORMALIZACIÓN
# Sistema: INTRANEURO
# =====================================================

# Configuración
BACKUP_DIR="/var/www/intraneuro/backups/archivos_criticos"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}======================================"
echo "BACKUP DE ARCHIVOS CRÍTICOS"
echo "======================================"
echo -e "Timestamp: $TIMESTAMP${NC}"
echo ""

# Crear directorio de backup
mkdir -p "$BACKUP_PATH"

echo -e "${YELLOW}Creando backup de archivos críticos...${NC}"

# 1. Backend - Archivos principales
echo "1. Copiando archivos del backend..."
mkdir -p "$BACKUP_PATH/backend"
cp -r /var/www/intraneuro/backend/src "$BACKUP_PATH/backend/"
cp /var/www/intraneuro/backend/server.js "$BACKUP_PATH/backend/"
cp /var/www/intraneuro/backend/.env "$BACKUP_PATH/backend/"
cp /var/www/intraneuro/backend/package.json "$BACKUP_PATH/backend/"

# 2. Frontend - JavaScript
echo "2. Copiando archivos JavaScript..."
mkdir -p "$BACKUP_PATH/js"
cp /var/www/intraneuro/js/*.js "$BACKUP_PATH/js/"

# 3. HTML principal
echo "3. Copiando archivos HTML..."
mkdir -p "$BACKUP_PATH/html"
cp /var/www/intraneuro/index.html "$BACKUP_PATH/html/"
cp /var/www/intraneuro/archivos.html "$BACKUP_PATH/html/" 2>/dev/null || true

# 4. Archivos de configuración
echo "4. Copiando configuraciones..."
mkdir -p "$BACKUP_PATH/config"
cp /var/www/intraneuro/CLAUDE.md "$BACKUP_PATH/config/" 2>/dev/null || true

# 5. Scripts existentes
echo "5. Copiando scripts..."
mkdir -p "$BACKUP_PATH/scripts"
cp /var/www/intraneuro/scripts/*.sh "$BACKUP_PATH/scripts/" 2>/dev/null || true
cp /var/www/intraneuro/scripts/*.sql "$BACKUP_PATH/scripts/" 2>/dev/null || true

# 6. Crear archivo de información del backup
cat > "$BACKUP_PATH/INFO.txt" << EOF
========================================
BACKUP DE ARCHIVOS CRÍTICOS - INTRANEURO
========================================
Fecha: $(date)
Timestamp: $TIMESTAMP
Usuario: $(whoami)
Motivo: Pre-normalización de nombres de médicos

Archivos incluidos:
- Backend (src/, server.js, .env, package.json)
- Frontend JavaScript (todos los .js)
- HTML principales (index.html, archivos.html)
- Configuración (CLAUDE.md)
- Scripts actuales

Para restaurar:
1. Detener servicios: pm2 stop intraneuro-api
2. Copiar archivos desde este backup a /var/www/intraneuro/
3. Reiniciar servicios: pm2 restart intraneuro-api

========================================
EOF

# 7. Crear archivo comprimido
echo ""
echo -e "${YELLOW}Comprimiendo backup...${NC}"
cd "$BACKUP_DIR"
tar -czf "backup_critico_$TIMESTAMP.tar.gz" "backup_$TIMESTAMP/"

# 8. Verificar integridad
if [ -f "$BACKUP_DIR/backup_critico_$TIMESTAMP.tar.gz" ]; then
    SIZE=$(du -h "$BACKUP_DIR/backup_critico_$TIMESTAMP.tar.gz" | cut -f1)
    echo -e "${GREEN}✅ Backup creado exitosamente${NC}"
    echo "   Archivo: $BACKUP_DIR/backup_critico_$TIMESTAMP.tar.gz"
    echo "   Tamaño: $SIZE"
    
    # Listar contenido del backup
    echo ""
    echo "Contenido del backup:"
    tar -tzf "$BACKUP_DIR/backup_critico_$TIMESTAMP.tar.gz" | head -20
    echo "..."
    
    # Limpiar directorio temporal
    rm -rf "$BACKUP_PATH"
else
    echo -e "${RED}❌ Error creando el backup${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}======================================"
echo "BACKUP COMPLETADO"
echo "======================================${NC}"
echo ""
echo "Para restaurar en caso de emergencia:"
echo "cd $BACKUP_DIR"
echo "tar -xzf backup_critico_$TIMESTAMP.tar.gz"
echo "cp -r backup_$TIMESTAMP/* /var/www/intraneuro/"
echo ""