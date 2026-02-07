# INTRANEURO - Sistema de Gestión Hospitalaria

## Estado del Sistema (Actualizado 7-Febrero-2026)

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║  PRODUCCIÓN:                                                                  ║
║  ├── URL: https://intraneurodavila.com                                        ║
║  ├── Frontend: /var/www/intraneuro-vue/dist (Vue 3 + Vite build)             ║
║  ├── Backend: /var/www/intraneuro/backend/ → PM2 "intraneuro-api" (:3001)    ║
║  ├── Uploads: /var/www/intraneuro/uploads/                                    ║
║  └── Base de datos: intraneuro_db (300 pacientes al 7-feb-2026)              ║
║                                                                               ║
║  Sistema en uso activo 24/7                                                   ║
║                                                                               ║
║  LEGACY (frontend anterior, ya no se sirve):                                  ║
║  └── /var/www/intraneuro/ (vanilla JS - reemplazado por Vue)                 ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

| Componente | Valor |
|------------|-------|
| **Frontend (Nginx root)** | `/var/www/intraneuro-vue/dist` |
| **Backend PM2** | `intraneuro-api` (puerto 3001) — código en `/var/www/intraneuro/backend/` |
| **Uploads** | `/var/www/intraneuro/uploads/` |
| **Base de datos** | `intraneuro_db` |
| **Frontend legacy** | `/var/www/intraneuro/` (vanilla JS, ya no se sirve) |

---

## Descripción

Sistema web para gestión de pacientes en clínica psiquiátrica. Incluye control de admisiones, observaciones médicas, asignación de camas, tareas pendientes y reportes estadísticos.

**URL Producción**: https://intraneurodavila.com
**Repositorio**: https://github.com/Ignacio1972/intraneuro-3.0
**Stack**: Vue 3 + Vite + Tailwind v4 + DaisyUI v5 + Node.js + Express + PostgreSQL + Nginx + PM2

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
Frontend:      Vue 3.5 + Vite 6 + Tailwind v4 + DaisyUI v5
Backend:       Node.js 20.x + Express
Gestor:        PM2
Base de datos: PostgreSQL 14
Web Server:    Nginx 1.18.0
SSL:           Let's Encrypt (renovación automática)
Firewall:      UFW (puertos 22, 80, 443)
```

### Proceso PM2

| Proceso | Puerto | Código | BD |
|---------|--------|--------|-----|
| `intraneuro-api` | 3001 | /var/www/intraneuro/backend | intraneuro_db |

---

## Estructura del Proyecto

### Frontend en producción: `/var/www/intraneuro-vue/`

```
/var/www/intraneuro-vue/
├── dist/                       # Build de producción (Nginx root)
│   ├── index.html
│   └── assets/                # JS/CSS compilados con hash
│
├── src/
│   ├── main.js                # Entry point
│   ├── App.vue                # Layout raíz
│   ├── assets/
│   │   └── main.css           # Tailwind v4 + DaisyUI v5 + tema personalizado
│   ├── components/
│   │   ├── AppHeader.vue      # Navbar + Drawer móvil
│   │   ├── AppToast.vue       # Sistema de notificaciones
│   │   ├── PatientCard.vue    # Card de paciente (móvil)
│   │   ├── NewPatientModal.vue # Modal nuevo ingreso con OCR
│   │   ├── DiagnosisModal.vue # Modal acordeón de diagnósticos
│   │   ├── ServiceModal.vue   # Modal selector de servicio
│   │   ├── DoctorModal.vue    # Modal selector de médico
│   │   └── VoiceNotes.vue     # Grabación/reproducción notas de voz
│   ├── views/
│   │   ├── LoginView.vue      # Login
│   │   ├── DashboardView.vue  # Pacientes activos
│   │   ├── PatientView.vue    # Detalle de paciente
│   │   └── ArchivosView.vue   # Pacientes egresados
│   ├── stores/
│   │   ├── auth.js            # Autenticación (JWT en localStorage)
│   │   └── patients.js        # Pacientes, filtros, CRUD, observaciones, tareas
│   ├── services/
│   │   └── api.js             # Cliente Axios configurado
│   └── router/
│       └── index.js           # Rutas con guards de autenticación
│
├── vite.config.js             # Configuración Vite
├── package.json               # Dependencias npm
└── CLAUDE.md                  # Instrucciones del proyecto Vue
```

### Backend: `/var/www/intraneuro/backend/`

```
/var/www/intraneuro/backend/
├── server.js                  # Punto de entrada principal
├── .env                       # Variables de entorno (NO commitear)
├── package.json               # Dependencias npm
└── src/
    ├── controllers/           # Lógica de negocio
    ├── models/                # Modelos Sequelize (ORM)
    ├── routes/                # Definición de endpoints
    └── middleware/            # Middlewares (auth, validación)
```

### Otros directorios en `/var/www/intraneuro/`

```
/var/www/intraneuro/
├── backend/                   # API REST (ver arriba)
├── uploads/                   # Archivos subidos (OCR, audio, etc.) — servido por Nginx
├── js/                        # Frontend LEGACY (vanilla JS, ya no se sirve)
├── css/                       # Estilos LEGACY
├── index.html                 # LEGACY — ya no es el frontend activo
└── ...
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

**Estadísticas actuales** (7-feb-2026):
- Pacientes: 300
- Admisiones: 307

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

    root /var/www/intraneuro-vue/dist;
    index index.html;

    # Headers de seguridad básicos
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (Vue SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Archivos de uploads (audios, voice notes, etc)
    location /uploads/ {
        alias /var/www/intraneuro/uploads/;
        autoindex off;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header Access-Control-Allow-Origin "*";
    }

    # === DESARROLLO VUE (temporal) ===
    location /dev {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API Proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 10s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
        send_timeout 10s;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/intraneurodavila.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/intraneurodavila.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
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

1. Verificar en qué directorio trabajas:
   - Frontend Vue: `/var/www/intraneuro-vue/`
   - Backend API: `/var/www/intraneuro/backend/`
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

### Deploy Frontend (Vue)

```bash
# 1. Ir al directorio Vue
cd /var/www/intraneuro-vue

# 2. Backup de BD
sudo -u postgres pg_dump intraneuro_db > /tmp/backup_pre_deploy_$(date +%Y%m%d_%H%M%S).sql

# 3. Actualizar código
git pull origin main

# 4. Instalar dependencias si hay cambios
npm install

# 5. Build de producción (genera /dist)
npm run build

# 6. Verificar (Nginx sirve /dist automáticamente)
curl -s https://intraneurodavila.com | head -5
```

### Deploy Backend (API)

```bash
# 1. Ir al directorio backend
cd /var/www/intraneuro/backend

# 2. Actualizar código
cd /var/www/intraneuro && git pull origin main

# 3. Instalar dependencias si hay cambios
cd backend && npm install

# 4. Reiniciar
pm2 restart intraneuro-api

# 5. Verificar
curl -s https://intraneurodavila.com/api/health
pm2 logs intraneuro-api --lines 20
```

### Rollback

```bash
# Ver commits recientes
git log --oneline -10

# Volver al commit anterior
git reset --hard <commit-hash>

# Si fue cambio de frontend: rebuild
cd /var/www/intraneuro-vue && npm run build

# Si fue cambio de backend: reiniciar
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
6. **Egresos/Archivos** - Vista de pacientes egresados (ArchivosView.vue)
7. **Dashboard** - Pacientes activos en tiempo real (DashboardView.vue)
8. **Notas de Voz** - Grabación y reproducción de audio
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

**Repositorio backend**: https://github.com/Ignacio1972/intraneuro-3.0
**Producción**: https://intraneurodavila.com

---

## Nota sobre la Transición

El frontend fue migrado de vanilla JS (`/var/www/intraneuro/`) a Vue 3 (`/var/www/intraneuro-vue/`).
El backend sigue siendo el mismo en `/var/www/intraneuro/backend/`.
Los uploads siguen en `/var/www/intraneuro/uploads/`.
El código legacy de vanilla JS (`js/`, `css/`, `index.html`, `egreso.html`, etc.) ya no se sirve pero permanece en el repositorio.

---

**Última actualización**: 7 de Febrero de 2026
**Estado**: En producción (Vue 3)
