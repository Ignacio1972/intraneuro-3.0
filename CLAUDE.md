# INTRANEURO - Sistema de Gestión Hospitalaria

## Estado del Sistema (Actualizado 17-Enero-2026)

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║  PRODUCCIÓN:                                                                  ║
║  ├── URL: https://intraneurodavila.com                                        ║
║  ├── Código: /var/www/intraneuro/                                             ║
║  ├── Backend: pm2 process "intraneuro-api" (puerto 3001)                      ║
║  └── Base de datos: intraneuro_db (253 pacientes al 17-ene-2026)              ║
║                                                                               ║
║  Sistema en uso activo 24/7                                                   ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

| Componente | Valor |
|------------|-------|
| **Código** | `/var/www/intraneuro/` |
| **Backend PM2** | `intraneuro-api` (puerto 3001) |
| **Base de datos** | `intraneuro_db` |
| **Nginx root** | `/var/www/intraneuro` |

---

## Descripción

Sistema web para gestión de pacientes en clínica psiquiátrica. Incluye control de admisiones, observaciones médicas, asignación de camas, tareas pendientes y reportes estadísticos.

**URL Producción**: https://intraneurodavila.com
**Repositorio**: https://github.com/Ignacio1972/intraneuro-3.0
**Stack**: Node.js + Express + PostgreSQL + Nginx + PM2

---

## Infraestructura

### Servidor

```
IP:        64.176.7.170
Proveedor: Vultr VPS
RAM:       1 GB
Disco:     23 GB SSD
OS:        Ubuntu 22.04 LTS
SSH:       root@64.176.7.170
```

### Stack Tecnológico

```
Backend:       Node.js 20.x
Gestor:        PM2
Base de datos: PostgreSQL 14
Web Server:    Nginx 1.18.0
SSL:           Let's Encrypt (renovación automática)
Firewall:      UFW (puertos 22, 80, 443)
```

### Proceso PM2

| Proceso | Puerto | Código | BD |
|---------|--------|--------|-----|
| `intraneuro-api` | 3001 | /var/www/intraneuro | intraneuro_db |

---

## Estructura del Proyecto

```
/var/www/intraneuro/
├── backend/                    # API REST Node.js + Express
│   ├── server.js              # Punto de entrada principal
│   ├── .env                   # Variables de entorno (NO commitear)
│   ├── package.json           # Dependencias npm
│   └── src/
│       ├── controllers/       # Lógica de negocio
│       ├── models/            # Modelos Sequelize (ORM)
│       ├── routes/            # Definición de endpoints
│       └── middleware/        # Middlewares (auth, validación)
│
├── js/                        # Frontend JavaScript (Vanilla)
│   ├── api.js                # Cliente HTTP para el API
│   ├── auth.js               # Gestión de autenticación
│   ├── main.js               # Inicialización y routing
│   ├── pacientes-refactored.js
│   ├── pacientes-ui.js
│   └── modules/
│       ├── dropdown-system.js
│       ├── services.js
│       └── pacientes/
│
├── css/                       # Estilos CSS
├── assets/                    # Recursos estáticos
├── uploads/                   # Archivos subidos (OCR, audio, etc.)
├── index.html                 # Dashboard principal
├── egreso.html               # Página de egresos
├── ficha.html                # Ficha de pacientes
└── archivos.html             # Gestión de archivos
```

---

## Configuración

### Base de Datos

```bash
Host:     localhost
Port:     5432
Database: intraneuro_db
User:     intraneuro_user
Password: IntraNeuro2025
```

**Estadísticas actuales** (17-ene-2026):
- Pacientes: 253
- Admisiones: 258

**Tablas principales:**
- `users` - Usuarios del sistema
- `patients` - Pacientes
- `admissions` - Admisiones/ingresos
- `observations` - Observaciones médicas
- `pending_tasks` - Tareas pendientes
- `timeline_events` - Línea de tiempo de eventos
- `audio_notes` - Notas de audio
- `diagnosis_catalog` - Catálogo de diagnósticos
- `doctors` - Médicos

### Backend (.env)

**Archivo**: `/var/www/intraneuro/backend/.env`

```env
PORT=3001
HOST=127.0.0.1
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=intraneuro_db
DB_USER=intraneuro_user
DB_PASS=IntraNeuro2025
JWT_SECRET=mi_secreto_staging_2025
JWT_EXPIRE=8h
FRONTEND_URL=https://intraneurodavila.com

# Google Cloud Vision OCR
GOOGLE_VISION_KEY_PATH=/var/www/intraneuro/google vision key/ultimate-member-404121-c1f9eb254b45.json
OCR_UPLOAD_DIR=/var/www/intraneuro/uploads/ocr-temp
OCR_MAX_FILE_SIZE=5242880
```

### Nginx

**Archivo**: `/etc/nginx/sites-enabled/intraneurodavila`

```nginx
server {
    server_name intraneurodavila.com www.intraneurodavila.com 64.176.7.170;

    root /var/www/intraneuro;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /uploads/ {
        alias /var/www/intraneuro/uploads/;
        autoindex off;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 10s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/intraneurodavila.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/intraneurodavila.com/privkey.pem;
}
```

---

## Comandos de Gestión

### Acceso SSH

```bash
ssh root@64.176.7.170
# Password: Raul Labbe 14050
```

### Gestión del Backend (PM2)

```bash
# Ver procesos
pm2 list

# Logs en tiempo real
pm2 logs intraneuro-api

# Reiniciar backend
pm2 restart intraneuro-api

# Detener/Iniciar
pm2 stop intraneuro-api
pm2 start intraneuro-api

# Ver monitoreo
pm2 monit

# Guardar configuración
pm2 save
```

### Gestión de Nginx

```bash
# Estado
systemctl status nginx

# Reiniciar
systemctl restart nginx

# Recargar (sin downtime)
systemctl reload nginx

# Probar configuración
nginx -t

# Logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Gestión de PostgreSQL

```bash
# Estado
systemctl status postgresql

# Conectar a la BD
PGPASSWORD=IntraNeuro2025 psql -U intraneuro_user -h localhost -d intraneuro_db

# Ver número de pacientes
PGPASSWORD=IntraNeuro2025 psql -U intraneuro_user -h localhost -d intraneuro_db -c "SELECT COUNT(*) FROM patients;"

# Backup manual
sudo -u postgres pg_dump intraneuro_db > /tmp/backup_intraneuro_db_$(date +%Y%m%d).sql

# Restaurar
sudo -u postgres psql intraneuro_db < backup.sql
```

---

## Monitoreo y Diagnóstico

### Verificar Estado del Sistema

```bash
# Health check del API
curl -s https://intraneurodavila.com/api/health | python3 -m json.tool

# Health check directo al backend
curl -s http://localhost:3001/api/health | python3 -m json.tool

# Ver todos los servicios
pm2 status
systemctl status nginx postgresql

# Uso de recursos
free -h
df -h
```

### Logs Importantes

```bash
# Backend (PM2)
/root/.pm2/logs/intraneuro-api-out.log
/root/.pm2/logs/intraneuro-api-error.log

# Ver logs en tiempo real
pm2 logs intraneuro-api --lines 100
pm2 logs intraneuro-api --err --lines 50

# Nginx
/var/log/nginx/access.log
/var/log/nginx/error.log

# PostgreSQL
/var/log/postgresql/postgresql-14-main.log
```

### Verificar Puertos

```bash
# Ver qué escucha en cada puerto
ss -tlnp | grep 3001

# Debe mostrar:
# 127.0.0.1:3001 - intraneuro-api
```

---

## Seguridad

### Configuración Actual

- HTTPS obligatorio (Let's Encrypt)
- Backend en localhost (127.0.0.1) - No expuesto
- JWT tokens con expiración de 8 horas
- CORS configurado
- Helmet.js para headers de seguridad
- Sequelize ORM (prevención SQL injection)
- Firewall UFW (solo puertos 22, 80, 443)

### Credenciales

**SSH/Servidor:**
- Usuario: `root`
- IP: `64.176.7.170`
- Password: `Raul Labbe 14050`

**PostgreSQL:**
- Usuario: `intraneuro_user`
- Password: `IntraNeuro2025`
- BD: `intraneuro_db`

**JWT:**
- Secret: `mi_secreto_staging_2025`
- Expiración: `8h`

---

## Reglas y Mejores Prácticas

### ANTES de Hacer Cambios

1. Verificar que estás en `/var/www/intraneuro/`
2. Hacer backup de la BD: `sudo -u postgres pg_dump intraneuro_db > backup.sql`
3. Verificar git status
4. Documentar cambios

### NO Hacer

- Modificar código directamente en producción sin probar
- Commitear archivos `.env`, `.backup`, o temporales
- Eliminar datos sin backup previo

### SIEMPRE Hacer

- Usar la BD: `intraneuro_db`
- Reiniciar el proceso: `pm2 restart intraneuro-api`
- Probar cambios en https://intraneurodavila.com
- Verificar logs después de cambios

---

## Flujo de Deploy

```bash
# 1. Conectar al servidor
ssh root@64.176.7.170

# 2. Ir al directorio de producción
cd /var/www/intraneuro

# 3. Backup de BD
sudo -u postgres pg_dump intraneuro_db > /tmp/backup_pre_deploy_$(date +%Y%m%d_%H%M%S).sql

# 4. Actualizar código
git pull origin main

# 5. Si hay cambios en backend
cd backend
npm install  # Si hay nuevas dependencias
pm2 restart intraneuro-api

# 6. Verificar
curl -s https://intraneurodavila.com/api/health
pm2 logs intraneuro-api --lines 20
```

### Rollback

```bash
# Ver commits recientes
git log --oneline -10

# Volver al commit anterior
git reset --hard <commit-hash>

# Reiniciar backend
pm2 restart intraneuro-api

# Si es necesario, restaurar BD
sudo -u postgres psql intraneuro_db < /tmp/backup_pre_deploy_XXXXXXXX.sql
```

---

## Funcionalidades del Sistema

### Módulos Principales

1. **Autenticación y Usuarios** - Login con JWT
2. **Gestión de Pacientes** - CRUD completo, búsqueda, filtros
3. **Admisiones/Ingresos** - Control de camas y fechas
4. **Observaciones Médicas** - Notas y evolución
5. **Tareas Pendientes** - Seguimiento de actividades
6. **Egresos** - Página dedicada (egreso.html)
7. **Dashboard** - Estadísticas en tiempo real
8. **Archivos** - Upload y gestión de documentos
9. **OCR** - Lectura de documentos con Google Vision

---

## Troubleshooting

### El sitio no carga

```bash
systemctl status nginx
tail -f /var/log/nginx/error.log
certbot certificates
systemctl restart nginx
```

### API no responde

```bash
pm2 status
pm2 logs intraneuro-api --lines 50
ss -tlnp | grep :3001
pm2 restart intraneuro-api
```

### Base de datos no conecta

```bash
systemctl status postgresql
PGPASSWORD=IntraNeuro2025 psql -U intraneuro_user -h localhost -d intraneuro_db -c "SELECT 1;"
systemctl restart postgresql
```

---

## Información de Contacto

**Repositorio**: https://github.com/Ignacio1972/intraneuro-3.0
**Producción**: https://intraneurodavila.com

---

**Última actualización**: 17 de Enero de 2026
**Estado**: En producción
