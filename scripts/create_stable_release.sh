#!/bin/bash
# =================================================================
# INTRANEURO - CREAR STABLE RELEASE
# =================================================================
# Descripción: Crea un backup completo del sistema como versión estable
# Autor: Sistema INTRANEURO
# Fecha: Noviembre 2025
# =================================================================

# === CONFIGURACIÓN ===
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_BASE_DIR="/var/www/intraneuro-dev/backups/stable-releases"
TEMP_DIR="/tmp/intraneuro_stable_${TIMESTAMP}"
RELEASE_NAME="intraneuro_stable_${TIMESTAMP}"
DB_NAME="intraneuro_db"
DB_USER="intraneuro_user"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# === FUNCIONES ===
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# === INICIO ===
echo "================================================================="
echo "  INTRANEURO - Creación de Stable Release"
echo "  Timestamp: ${TIMESTAMP}"
echo "================================================================="
echo ""

# Crear directorios temporales
log_info "Creando estructura de directorios..."
mkdir -p "$TEMP_DIR"/{database,source,config,docs}

# === 1. BACKUP DE BASE DE DATOS ===
log_info "Exportando base de datos..."
if sudo -u postgres pg_dump "$DB_NAME" > "$TEMP_DIR/database/intraneuro_db.sql" 2>/dev/null; then
    log_success "Base de datos exportada exitosamente"

    # Comprimir BD
    gzip "$TEMP_DIR/database/intraneuro_db.sql"
    log_success "Base de datos comprimida"
else
    log_error "Fallo al exportar base de datos"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Obtener estadísticas de BD
PATIENT_COUNT=$(sudo -u postgres psql -t -c "SELECT COUNT(*) FROM patients" "$DB_NAME" 2>/dev/null | tr -d ' ')
ADMISSION_COUNT=$(sudo -u postgres psql -t -c "SELECT COUNT(*) FROM admissions" "$DB_NAME" 2>/dev/null | tr -d ' ')
USER_COUNT=$(sudo -u postgres psql -t -c "SELECT COUNT(*) FROM users" "$DB_NAME" 2>/dev/null | tr -d ' ')
DB_SIZE=$(sudo -u postgres psql -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'))" "$DB_NAME" 2>/dev/null | tr -d ' ')

log_success "Estadísticas: $PATIENT_COUNT pacientes, $ADMISSION_COUNT admisiones, $USER_COUNT usuarios, Tamaño: $DB_SIZE"

# === 2. CÓDIGO FUENTE ===
log_info "Copiando código fuente..."

# Backend
cp -r /var/www/intraneuro-dev/backend "$TEMP_DIR/source/"
# Excluir node_modules y archivos sensibles
rm -rf "$TEMP_DIR/source/backend/node_modules"
rm -f "$TEMP_DIR/source/backend/.env"
log_success "Backend copiado (sin node_modules ni .env)"

# Frontend
mkdir -p "$TEMP_DIR/source/frontend"
cp /var/www/intraneuro-dev/*.html "$TEMP_DIR/source/frontend/" 2>/dev/null || true
cp -r /var/www/intraneuro-dev/js "$TEMP_DIR/source/frontend/" 2>/dev/null || true
cp -r /var/www/intraneuro-dev/css "$TEMP_DIR/source/frontend/" 2>/dev/null || true
cp -r /var/www/intraneuro-dev/assets "$TEMP_DIR/source/frontend/" 2>/dev/null || true
cp /var/www/intraneuro-dev/service-worker.js "$TEMP_DIR/source/frontend/" 2>/dev/null || true
log_success "Frontend copiado"

# Scripts
cp -r /var/www/intraneuro-dev/scripts "$TEMP_DIR/source/" 2>/dev/null || true
log_success "Scripts copiados"

# === 3. CONFIGURACIONES ===
log_info "Copiando configuraciones del sistema..."

# Nginx config (sin datos sensibles)
if [ -f "/etc/nginx/sites-enabled/intraneurodavila" ]; then
    cp /etc/nginx/sites-enabled/intraneurodavila "$TEMP_DIR/config/nginx_intraneuro.conf"
    log_success "Configuración de Nginx copiada"
fi

# PM2 ecosystem (si existe)
if [ -f "/var/www/intraneuro-dev/ecosystem.config.js" ]; then
    cp /var/www/intraneuro-dev/ecosystem.config.js "$TEMP_DIR/config/"
    log_success "Configuración de PM2 copiada"
fi

# Crontab
crontab -l > "$TEMP_DIR/config/crontab.txt" 2>/dev/null || echo "No crontab configured" > "$TEMP_DIR/config/crontab.txt"
log_success "Crontab exportado"

# Package.json
cp /var/www/intraneuro-dev/backend/package.json "$TEMP_DIR/config/backend_package.json" 2>/dev/null || true

# === 4. INFORMACIÓN DEL SISTEMA ===
log_info "Recopilando información del sistema..."

# Crear MANIFEST
cat > "$TEMP_DIR/docs/MANIFEST.txt" <<EOF
=================================================================
INTRANEURO - STABLE RELEASE
=================================================================

INFORMACIÓN DEL BACKUP
----------------------
Fecha de creación:    $(date '+%Y-%m-%d %H:%M:%S %Z')
Nombre del release:   ${RELEASE_NAME}
Servidor:             $(hostname)
IP:                   $(hostname -I | awk '{print $1}')

SISTEMA OPERATIVO
-----------------
Distribución:         $(lsb_release -d 2>/dev/null | cut -f2 || echo "Unknown")
Kernel:               $(uname -r)
Arquitectura:         $(uname -m)

VERSIONES DE SOFTWARE
---------------------
Node.js:              $(node --version 2>/dev/null || echo "N/A")
PostgreSQL:           $(sudo -u postgres psql --version 2>/dev/null | awk '{print $3}' || echo "N/A")
Nginx:                $(nginx -v 2>&1 | awk '{print $3}' | cut -d'/' -f2 || echo "N/A")
PM2:                  $(pm2 --version 2>/dev/null || echo "N/A")

BASE DE DATOS
-------------
Nombre:               ${DB_NAME}
Tamaño:               ${DB_SIZE}
Pacientes:            ${PATIENT_COUNT}
Admisiones:           ${ADMISSION_COUNT}
Usuarios:             ${USER_COUNT}

GIT REPOSITORY
--------------
Branch actual:        $(cd /var/www/intraneuro-dev && git branch --show-current 2>/dev/null || echo "N/A")
Último commit:        $(cd /var/www/intraneuro-dev && git log -1 --oneline 2>/dev/null || echo "N/A")
Archivos modificados: $(cd /var/www/intraneuro-dev && git status --porcelain 2>/dev/null | wc -l || echo "N/A")

CONTENIDO DEL BACKUP
--------------------
✓ Base de datos completa (PostgreSQL dump comprimido)
✓ Código fuente (Backend Node.js + Express)
✓ Frontend (HTML, CSS, JavaScript)
✓ Scripts de mantenimiento
✓ Configuraciones (Nginx, PM2, Cron)
✓ Documentación y manifests

ESTRUCTURA DE ARCHIVOS
----------------------
database/
  └── intraneuro_db.sql.gz     Base de datos comprimida
source/
  ├── backend/                 API Node.js + Express
  ├── frontend/                HTML, CSS, JavaScript
  └── scripts/                 Scripts de mantenimiento
config/
  ├── nginx_intraneuro.conf    Configuración de Nginx
  ├── ecosystem.config.js      Configuración de PM2
  ├── crontab.txt              Tareas programadas
  └── backend_package.json     Dependencias Node.js
docs/
  ├── MANIFEST.txt             Este archivo
  └── README.md                Instrucciones de restauración

=================================================================
EOF

log_success "MANIFEST creado"

# Crear README de restauración
cat > "$TEMP_DIR/docs/README.md" <<'EOF'
# INTRANEURO - Guía de Restauración de Stable Release

## 📦 Contenido del Backup

Este archivo contiene un backup completo del sistema INTRANEURO:
- ✅ Base de datos PostgreSQL (dump completo comprimido)
- ✅ Código fuente (Backend + Frontend)
- ✅ Configuraciones del sistema
- ✅ Scripts de mantenimiento

## 🔄 Proceso de Restauración

### Pre-requisitos

```bash
# Sistema base necesario
- Ubuntu 22.04 LTS (o superior)
- PostgreSQL 14+
- Node.js 20+
- Nginx
- PM2
```

### Paso 1: Verificar Integridad

```bash
# Verificar checksum MD5
md5sum -c intraneuro_stable_YYYYMMDD_HHMMSS.tar.gz.md5

# O SHA256
sha256sum -c intraneuro_stable_YYYYMMDD_HHMMSS.tar.gz.sha256
```

### Paso 2: Extraer Backup

```bash
# Extraer archivo
tar -xzf intraneuro_stable_YYYYMMDD_HHMMSS.tar.gz

# Entrar al directorio
cd intraneuro_stable_YYYYMMDD_HHMMSS
```

### Paso 3: Restaurar Base de Datos

```bash
# Crear base de datos (si no existe)
sudo -u postgres createdb intraneuro_db
sudo -u postgres createuser intraneuro_user

# Establecer password
sudo -u postgres psql -c "ALTER USER intraneuro_user WITH PASSWORD 'IntraNeuro2025';"

# Dar permisos
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE intraneuro_db TO intraneuro_user;"

# Restaurar backup
cd database
gunzip -c intraneuro_db.sql.gz | sudo -u postgres psql intraneuro_db

# Verificar restauración
sudo -u postgres psql intraneuro_db -c "SELECT COUNT(*) FROM patients;"
```

### Paso 4: Restaurar Código Fuente

```bash
# Crear directorio del proyecto
sudo mkdir -p /var/www/intraneuro

# Copiar backend
sudo cp -r source/backend /var/www/intraneuro/

# Copiar frontend
sudo cp -r source/frontend/* /var/www/intraneuro/

# Copiar scripts
sudo cp -r source/scripts /var/www/intraneuro/

# Instalar dependencias del backend
cd /var/www/intraneuro/backend
npm install
```

### Paso 5: Configurar Backend

```bash
# Crear archivo .env
cd /var/www/intraneuro/backend
cat > .env <<'ENVFILE'
# Servidor
PORT=3000
HOST=127.0.0.1
NODE_ENV=production

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=intraneuro_db
DB_USER=intraneuro_user
DB_PASS=IntraNeuro2025

# JWT
JWT_SECRET=mi_secreto_staging_2025
JWT_EXPIRE=8h

# CORS
FRONTEND_URL=https://intraneurodavila.com
ENVFILE

# Proteger archivo .env
chmod 600 .env
```

### Paso 6: Configurar Nginx

```bash
# Copiar configuración
sudo cp config/nginx_intraneuro.conf /etc/nginx/sites-available/intraneurodavila

# Crear symlink
sudo ln -s /etc/nginx/sites-available/intraneurodavila /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Si todo OK, recargar
sudo systemctl reload nginx
```

### Paso 7: Configurar PM2

```bash
# Iniciar backend con PM2
cd /var/www/intraneuro/backend
pm2 start server.js --name intraneuro-api

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup
```

### Paso 8: Configurar SSL (Let's Encrypt)

```bash
# Instalar certbot si no está
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d intraneurodavila.com -d www.intraneurodavila.com

# Verificar renovación automática
sudo systemctl status certbot.timer
```

### Paso 9: Configurar Crontab

```bash
# Instalar crontab desde backup
crontab config/crontab.txt

# Verificar
crontab -l
```

### Paso 10: Verificación Final

```bash
# Verificar servicios
sudo systemctl status nginx
sudo systemctl status postgresql
pm2 status

# Probar API
curl https://intraneurodavila.com/api/health

# Verificar logs
pm2 logs intraneuro-api --lines 20
```

## 🔍 Troubleshooting

### Error de conexión a BD
```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Verificar credenciales en .env
cat /var/www/intraneuro/backend/.env | grep DB_
```

### Backend no inicia
```bash
# Ver logs de PM2
pm2 logs intraneuro-api

# Verificar puerto 3000
ss -tlnp | grep :3000
```

### Nginx error
```bash
# Ver logs de error
sudo tail -f /var/log/nginx/error.log

# Verificar configuración
sudo nginx -t
```

## 📞 Soporte

- Repositorio: https://github.com/Ignacio1972/intraneuro
- Documentación: Ver CLAUDE.md en el proyecto

## ⚠️ Notas Importantes

1. **Credenciales**: Cambiar las credenciales por defecto en producción
2. **Firewall**: Configurar UFW para permitir solo puertos necesarios (22, 80, 443)
3. **Backups**: Configurar backups automáticos después de la restauración
4. **Permisos**: Verificar permisos de archivos y directorios
5. **Node Modules**: Siempre ejecutar `npm install` después de restaurar

---

**Última actualización**: $(date '+%Y-%m-%d')
EOF

log_success "README de restauración creado"

# === 5. OBTENER INFORMACIÓN DE GIT ===
log_info "Recopilando información de Git..."

cd /var/www/intraneuro-dev
git log -10 --oneline > "$TEMP_DIR/docs/git_commits.txt" 2>/dev/null || echo "No Git history" > "$TEMP_DIR/docs/git_commits.txt"
git status > "$TEMP_DIR/docs/git_status.txt" 2>/dev/null || echo "No Git repository" > "$TEMP_DIR/docs/git_status.txt"
git diff > "$TEMP_DIR/docs/git_diff.txt" 2>/dev/null || echo "No changes" > "$TEMP_DIR/docs/git_diff.txt"

log_success "Información de Git recopilada"

# === 6. COMPRIMIR TODO ===
log_info "Comprimiendo backup completo..."

cd /tmp
tar -czf "${RELEASE_NAME}.tar.gz" "$(basename $TEMP_DIR)" 2>/dev/null

if [ -f "${RELEASE_NAME}.tar.gz" ]; then
    log_success "Backup comprimido exitosamente"
else
    log_error "Fallo al comprimir backup"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# === 7. GENERAR CHECKSUMS ===
log_info "Generando checksums..."

# MD5
md5sum "${RELEASE_NAME}.tar.gz" > "${RELEASE_NAME}.tar.gz.md5"
log_success "MD5 checksum generado"

# SHA256
sha256sum "${RELEASE_NAME}.tar.gz" > "${RELEASE_NAME}.tar.gz.sha256"
log_success "SHA256 checksum generado"

# === 8. MOVER A DIRECTORIO FINAL ===
log_info "Moviendo archivos a directorio de stable releases..."

mkdir -p "$BACKUP_BASE_DIR"
mv "${RELEASE_NAME}.tar.gz" "$BACKUP_BASE_DIR/"
mv "${RELEASE_NAME}.tar.gz.md5" "$BACKUP_BASE_DIR/"
mv "${RELEASE_NAME}.tar.gz.sha256" "$BACKUP_BASE_DIR/"

log_success "Archivos movidos a $BACKUP_BASE_DIR"

# === 9. LIMPIAR TEMPORALES ===
log_info "Limpiando archivos temporales..."
rm -rf "$TEMP_DIR"
log_success "Limpieza completada"

# === 10. INFORMACIÓN FINAL ===
FINAL_SIZE=$(du -h "$BACKUP_BASE_DIR/${RELEASE_NAME}.tar.gz" | cut -f1)
MD5_HASH=$(cat "$BACKUP_BASE_DIR/${RELEASE_NAME}.tar.gz.md5" | awk '{print $1}')
SHA256_HASH=$(cat "$BACKUP_BASE_DIR/${RELEASE_NAME}.tar.gz.sha256" | awk '{print $1}')

echo ""
echo "================================================================="
echo "  ✅ STABLE RELEASE CREADO EXITOSAMENTE"
echo "================================================================="
echo ""
echo "📦 Archivo:     ${RELEASE_NAME}.tar.gz"
echo "📊 Tamaño:      ${FINAL_SIZE}"
echo "🔐 MD5:         ${MD5_HASH}"
echo "🔐 SHA256:      ${SHA256_HASH}"
echo "📁 Ubicación:   ${BACKUP_BASE_DIR}/"
echo ""
echo "📈 Estadísticas de BD:"
echo "   - Pacientes:   ${PATIENT_COUNT}"
echo "   - Admisiones:  ${ADMISSION_COUNT}"
echo "   - Usuarios:    ${USER_COUNT}"
echo "   - Tamaño BD:   ${DB_SIZE}"
echo ""
echo "================================================================="
echo ""

# === 11. LISTAR STABLE RELEASES ===
log_info "Stable releases disponibles:"
echo ""
ls -lh "$BACKUP_BASE_DIR"/*.tar.gz | awk '{print "  " $9 " (" $5 ")"}'
echo ""

log_success "Proceso completado exitosamente"

exit 0
