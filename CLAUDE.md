# INTRANEURO - Sistema de Gestión Hospitalaria

## 🏥 Descripción
Sistema web completo para gestión de pacientes en clínica psiquiátrica. Incluye control de admisiones, observaciones médicas, asignación de camas, tareas pendientes y reportes estadísticos.

**URL Producción**: https://intraneurodavila.com
**Repositorio**: https://github.com/Ignacio1972/intraneuro-3.0
**Stack**: Node.js + Express + PostgreSQL + Nginx + PM2

---

## 🖥️ Infraestructura

### Servidor de Producción
```
IP: 64.176.7.170
Proveedor: Vultr VPS
RAM: 1 GB
Disco: 23 GB SSD
OS: Ubuntu 22.04 LTS
SSH: root@64.176.7.170
```

### Stack Tecnológico
```
Backend:       Node.js 20.19.5
Gestor:        PM2 6.0.13
Base de datos: PostgreSQL 14
Web Server:    Nginx 1.18.0
SSL:           Let's Encrypt (renovación automática)
Firewall:      UFW (puertos 22, 80, 443)
```

---

## 📁 Estructura del Proyecto

```
/var/www/intraneuro-dev/
├── backend/                    # API REST Node.js + Express
│   ├── server.js              # Punto de entrada principal
│   ├── .env                   # Variables de entorno (NO commitear)
│   ├── package.json           # Dependencias npm
│   └── src/
│       ├── controllers/       # Lógica de negocio
│       │   ├── auth.controller.js
│       │   ├── patients.controller.js
│       │   ├── admissions.controller.js
│       │   ├── diagnosis.controller.js  # ✨ NUEVO: Gestión de diagnósticos
│       │   └── ...
│       ├── models/            # Modelos Sequelize (ORM)
│       │   ├── index.js
│       │   ├── patient.model.js
│       │   ├── admission.model.js
│       │   ├── user.model.js
│       │   ├── diagnosis.model.js       # ✨ NUEVO: Modelo diagnósticos
│       │   └── ...
│       ├── routes/            # Definición de endpoints
│       │   ├── index.js
│       │   ├── auth.routes.js
│       │   ├── patients.routes.js
│       │   ├── diagnosis.routes.js      # ✨ NUEVO: Rutas diagnósticos
│       │   └── ...
│       └── middleware/        # Middlewares (auth, validación)
│           └── auth.middleware.js
│
├── js/                        # Frontend JavaScript (Vanilla)
│   ├── api.js                # Cliente HTTP para el API
│   ├── auth.js               # Gestión de autenticación
│   ├── main.js               # Inicialización y routing
│   ├── pacientes-refactored.js  # Módulo principal de pacientes (refactorizado)
│   ├── pacientes-ui.js       # UI de pacientes
│   ├── simple-notes.js       # Sistema de notas simplificado
│   ├── data-catalogos.js     # Catálogos de datos (diagnósticos, previsiones)
│   ├── debug-dropdowns.js    # ✨ NUEVO: Debug para dropdowns
│   └── modules/
│       ├── dropdown-system.js      # ✨ NUEVO: Sistema unificado de dropdowns v2.0
│       ├── services.js             # Gestión de servicios hospitalarios
│       └── pacientes/
│           ├── pacientes-api.js
│           ├── pacientes-edit.js   # Sistema original (funciones sobrescritas)
│           ├── pacientes-edit-refactored.js  # ✨ NUEVO: Sistema refactorizado
│           ├── pacientes-service-edit.js     # ✨ NUEVO: Edición de servicios
│           └── pacientes-discharge.js        # Gestión de egresos
│
├── css/                       # Estilos CSS
│   ├── main.css
│   ├── pacientes.css
│   ├── modal.css
│   └── ...
│
├── assets/                    # Recursos estáticos
│   └── libs/
│       └── fuse.min.js       # ✨ NUEVO: Búsqueda fuzzy para dropdowns
│
├── scripts/                   # Scripts de mantenimiento
│   ├── backup_automatico.sh
│   ├── restaurar_backup.sh
│   ├── backup_archivos_criticos.sh
│   ├── cleanup_deprecated_fase1.sh     # ✨ NUEVO: Limpieza automatizada
│   └── create_stable_release.sh        # ✨ NUEVO: Generación de releases
│
├── deprecated/                # ✨ NUEVO: Archivos obsoletos (no eliminar aún)
│   ├── pacientes.js          # Reemplazado por pacientes-refactored.js
│   ├── chat-notes.js         # Reemplazado por simple-notes.js
│   ├── pacientes-edit-improved.js  # Intento intermedio no usado
│   └── fix-prevision-edit.js       # Integrado en edit-refactored.js
│
├── dev-tools/                 # ✨ NUEVO: Herramientas de desarrollo/testing
│   ├── test-dropdowns.html
│   ├── test-edit-refactored.html
│   └── verify-refactoring.html
│
├── backups/                   # Backups automáticos
│   └── automaticos/
│
├── index.html                 # Dashboard principal
├── archivos.html             # Gestión de archivos
├── ficha.html                # Ficha de pacientes
├── CLAUDE.md                 # Esta documentación
├── ANALISIS_ARQUITECTURA.md  # ✨ NUEVO: Análisis detallado del sistema
├── REFACTORING_GUIDE.md      # ✨ NUEVO: Guía de migración
├── REFACTORING_PENDIENTE.md  # ✨ NUEVO: Estado del refactoring (COMPLETADO)
└── MODAL_ARCHITECTURE_PROPOSAL.md  # ✨ NUEVO: Propuesta arquitectura modular
```

---

## ⚙️ Configuración

### PostgreSQL Database
```bash
Host:     localhost
Port:     5432
Database: intraneuro_db
User:     intraneuro_user
Password: IntraNeuro2025
```

**Tablas principales:**
- `users` - Usuarios del sistema
- `patients` - Pacientes
- `admissions` - Admisiones/ingresos
- `observations` - Observaciones médicas
- `pending_tasks` - Tareas pendientes
- `timeline_events` - Línea de tiempo de eventos

### Backend (.env)
```env
# Servidor
PORT=3000
HOST=127.0.0.1              # Solo localhost (no expuesto)
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
```

**⚠️ Importante:** El backend escucha en `127.0.0.1:3000` (localhost), NO en `0.0.0.0`. Esto evita exposición directa a Internet. Todo el tráfico público pasa por Nginx.

### Frontend (js/api.js)
```javascript
// Producción
const baseURL = '/api';

// Desarrollo local
const baseURL = 'http://localhost:3000/api';
```

### Nginx
**Archivo:** `/etc/nginx/sites-enabled/intraneurodavila`

```nginx
# Redirección HTTP → HTTPS
server {
    listen 80;
    server_name intraneurodavila.com www.intraneurodavila.com;
    return 301 https://$host$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl;
    server_name intraneurodavila.com www.intraneurodavila.com;

    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/intraneurodavila.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/intraneurodavila.com/privkey.pem;

    root /var/www/intraneuro;
    index index.html;

    # Frontend estático
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy → Backend en localhost:3000
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 10s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
}
```

### SSL/HTTPS (Let's Encrypt)
```bash
# Certificados ubicados en:
/etc/letsencrypt/live/intraneurodavila.com/
├── fullchain.pem       # Certificado completo
├── privkey.pem         # Clave privada
└── chain.pem           # Cadena de certificados

# Válido hasta: 19 de Enero 2026
# Renovación automática: Sí (systemd timer)
# Próxima verificación: Diaria a las 10:37 UTC
```

**Verificar renovación automática:**
```bash
systemctl list-timers | grep certbot
certbot certificates
```

---

## 🚀 Comandos de Gestión

### Acceso SSH
```bash
# Conectar al servidor
ssh root@64.176.7.170

# Desde servidor actual (con sshpass)
sshpass -p 'Raul Labbe 14050' ssh root@64.176.7.170
```

### Gestión del Backend (PM2)
```bash
# Ver procesos
pm2 list

# Logs en tiempo real
pm2 logs intraneuro-api

# Logs recientes (últimas 50 líneas)
pm2 logs intraneuro-api --lines 50

# Reiniciar backend
pm2 restart intraneuro-api

# Detener backend
pm2 stop intraneuro-api

# Iniciar backend
pm2 start intraneuro-api

# Ver monitoreo (CPU, RAM)
pm2 monit

# Guardar configuración actual
pm2 save
```

### Gestión de Nginx
```bash
# Estado del servicio
systemctl status nginx

# Reiniciar
systemctl restart nginx

# Recargar configuración (sin downtime)
systemctl reload nginx

# Probar configuración antes de recargar
nginx -t

# Ver logs de error
tail -f /var/log/nginx/error.log

# Ver logs de acceso
tail -f /var/log/nginx/access.log
```

### Gestión de PostgreSQL
```bash
# Estado del servicio
systemctl status postgresql

# Conectar a la base de datos
psql -U intraneuro_user -d intraneuro_db

# Hacer backup manual
sudo -u postgres pg_dump intraneuro_db > /tmp/backup_$(date +%Y%m%d).sql

# Restaurar backup
sudo -u postgres psql intraneuro_db < backup.sql

# Ver tamaño de la base de datos
psql -U intraneuro_user -d intraneuro_db -c "SELECT pg_size_pretty(pg_database_size('intraneuro_db'));"

# Ver número de pacientes
psql -U intraneuro_user -d intraneuro_db -c "SELECT COUNT(*) FROM patients;"
```

### Backups
```bash
# Ejecutar backup automático
./scripts/backup_automatico.sh

# Restaurar desde backup
./scripts/restaurar_backup.sh

# Listar backups disponibles
ls -lh backups/automaticos/

# Backup de archivos críticos
./scripts/backup_archivos_criticos.sh
```

### Git y Deploy
```bash
# Ver estado actual
git status

# Ver commits recientes
git log --oneline -10

# Ver cambios no commiteados
git diff

# Actualizar desde repositorio
git pull origin main

# Después de actualizar código
pm2 restart intraneuro-api
systemctl reload nginx

# Crear commit
git add .
git commit -m "descripción del cambio"
git push origin main
```

---

## 📊 Monitoreo y Diagnóstico

### Verificar Estado del Sistema
```bash
# Health check del API
curl -s https://intraneurodavila.com/api/health | python3 -m json.tool

# Verificar HTTPS
curl -I https://intraneurodavila.com

# Ver todos los servicios
pm2 status
systemctl status nginx postgresql

# Uso de recursos
free -h              # Memoria
df -h                # Disco
top -bn1 | head -20  # CPU y procesos
```

### Logs Importantes
```bash
# Backend (PM2)
/root/.pm2/logs/intraneuro-api-out.log    # Salida estándar
/root/.pm2/logs/intraneuro-api-error.log  # Errores

# Nginx
/var/log/nginx/access.log    # Accesos HTTP
/var/log/nginx/error.log     # Errores de Nginx

# PostgreSQL
/var/log/postgresql/postgresql-14-main.log

# Let's Encrypt
/var/log/letsencrypt/letsencrypt.log

# Ver todos los logs del backend
pm2 logs intraneuro-api --lines 100

# Ver solo errores
pm2 logs intraneuro-api --err --lines 50
```

### Debugging
```bash
# Verificar que backend esté escuchando solo en localhost
ss -tlnp | grep :3000
# Debe mostrar: 127.0.0.1:3000 (NO 0.0.0.0:3000)

# Verificar puertos abiertos
ss -tlnp | grep -E '(80|443|3000)'

# Verificar firewall
ufw status

# Probar conexión a BD desde backend
PGPASSWORD=IntraNeuro2025 psql -U intraneuro_user -h localhost -d intraneuro_db -c "SELECT 1;"

# Ver procesos de Node.js
ps aux | grep node

# Ver uso de memoria por proceso
pm2 monit
```

### Métricas de Producción
```bash
# Base de datos actual
echo "Pacientes:  $(psql -U intraneuro_user -d intraneuro_db -t -c 'SELECT COUNT(*) FROM patients;')"
echo "Admisiones: $(psql -U intraneuro_user -d intraneuro_db -t -c 'SELECT COUNT(*) FROM admissions;')"
echo "Usuarios:   $(psql -U intraneuro_user -d intraneuro_db -t -c 'SELECT COUNT(*) FROM users;')"

# Tamaño de la base de datos
psql -U intraneuro_user -d intraneuro_db -c "SELECT pg_size_pretty(pg_database_size('intraneuro_db'));"

# Espacio en disco
df -h /var/www/intraneuro
```

---

## 🔧 Funcionalidades del Sistema

### Módulos Principales
1. **Autenticación y Usuarios**
   - Login con JWT (tokens de 8 horas)
   - Gestión de usuarios
   - Control de sesiones

2. **Gestión de Pacientes** ✨ REFACTORIZADO
   - CRUD completo de pacientes
   - **Sistema de edición unificado** (edit-refactored.js)
   - Edición inline de todos los campos
   - Búsqueda por nombre, RUT, cama
   - Filtros por médico tratante y servicio
   - Historial completo
   - **Dropdowns inteligentes** con búsqueda fuzzy
   - Validación automática de RUT
   - Gestión de previsiones de salud
   - Catálogo completo de diagnósticos

3. **Admisiones/Ingresos**
   - Crear y gestionar admisiones
   - Asignación de camas
   - Control de fechas (ingreso, alta)
   - Estados: activa, alta, programada
   - Selección de servicio hospitalario

4. **Observaciones Médicas**
   - Registro de evolución clínica
   - Sistema de notas simplificado (textareas)
   - Historial completo por admisión
   - Guardado automático

5. **Tareas Pendientes**
   - Creación de tareas
   - Asignación a admisiones
   - Estados y seguimiento

6. **Dashboard y Reportes**
   - Estadísticas en tiempo real
   - Ocupación de camas
   - Pacientes activos
   - Filtros por servicio hospitalario
   - Exportación a Excel

7. **Gestión de Archivos**
   - Upload de documentos
   - Asociación a pacientes
   - Categorización

8. **Diagnósticos** ✨ NUEVO
   - API completa de diagnósticos
   - Catálogo de diagnósticos psiquiátricos
   - Búsqueda y autocompletado
   - Integración con sistema de pacientes

---

## 🔐 Seguridad

### Configuración Actual
✅ **HTTPS obligatorio** - Let's Encrypt con renovación automática
✅ **Backend en localhost** - No expuesto directamente a Internet
✅ **JWT tokens** - Expiración en 8 horas
✅ **CORS** - Solo dominio autorizado
✅ **Helmet.js** - Headers de seguridad HTTP
✅ **Sequelize ORM** - Prevención de SQL injection
✅ **Firewall UFW** - Solo puertos 22, 80, 443 abiertos
✅ **Validación de entrada** - En todos los endpoints

### Headers de Seguridad
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

### Credenciales
**⚠️ NUNCA commitear:**
- Archivo `.env`
- Archivos `*.backup`
- Dumps de base de datos
- Logs con información sensible

**SSH/Servidor:**
- Usuario: `root`
- IP: `64.176.7.170`
- Password: `Raul Labbe 14050`

**PostgreSQL:**
- Usuario: `intraneuro_user`
- Password: `IntraNeuro2025`

**JWT:**
- Secret: `mi_secreto_staging_2025`
- Expiración: `8h`

---

## ⚠️ Reglas y Mejores Prácticas

### ANTES de Hacer Cambios
1. ✅ **Hacer backup** de la base de datos
2. ✅ **Verificar git status** para ver cambios actuales
3. ✅ **Probar localmente** antes de deploy
4. ✅ **Documentar** cambios significativos
5. ✅ **Revisar logs** después del cambio

### NO Hacer
❌ Modificar código directamente en producción
❌ Commitear archivos `.env`, `.backup`, o temporales
❌ Cambiar credenciales sin actualizar documentación
❌ Eliminar datos sin backup previo
❌ Exponer puerto 3000 públicamente (mantener `HOST=127.0.0.1`)
❌ Desactivar HTTPS o SSL
❌ Hacer `git push --force` a main

### SIEMPRE Hacer
✅ Usar HTTPS en producción
✅ Verificar que `HOST=127.0.0.1` en `.env`
✅ Probar autenticación después de cambios
✅ Mantener logs para debugging
✅ Revisar permisos de archivos (`.env` debe ser 600)
✅ Hacer backup antes de migraciones de BD
✅ Probar en ambiente de desarrollo primero

---

## 🔄 Flujo de Desarrollo

### 1. Desarrollo Local
```bash
# Clonar repositorio
git clone https://github.com/Ignacio1972/intraneuro
cd intraneuro

# Configurar .env para desarrollo
cd backend
cp .env.example .env
# Editar .env con configuración local

# Instalar dependencias
npm install

# Iniciar backend en desarrollo
npm run dev

# En otro terminal, servir frontend
cd ..
python3 -m http.server 8000
# O usar Live Server en VS Code
```

### 2. Testing
```bash
# Probar endpoints
curl http://localhost:3000/api/health

# Probar autenticación
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

### 3. Deploy a Producción
```bash
# En local: commit y push
git add .
git commit -m "descripción clara del cambio"
git push origin main

# En servidor de producción
ssh root@64.176.7.170
cd /var/www/intraneuro

# Backup antes de actualizar
./scripts/backup_automatico.sh

# Actualizar código
git pull origin main

# Si hay cambios en backend
cd backend
npm install  # Si hay nuevas dependencias
pm2 restart intraneuro-api

# Si hay cambios en configuración de Nginx
nginx -t && systemctl reload nginx

# Verificar que todo funcione
curl -s https://intraneurodavila.com/api/health
pm2 logs intraneuro-api --lines 20
```

### 4. Rollback (si algo falla)
```bash
# Ver commits recientes
git log --oneline -10

# Volver al commit anterior
git reset --hard <commit-hash>

# Reiniciar servicios
pm2 restart intraneuro-api

# Si es necesario, restaurar backup de BD
./scripts/restaurar_backup.sh
```

---

## 📦 Dependencias Principales

### Backend (Node.js)
```json
{
  "express": "^4.18.2",        // Framework web
  "sequelize": "^6.35.0",      // ORM para PostgreSQL
  "pg": "^8.11.3",             // Driver PostgreSQL
  "jsonwebtoken": "^9.0.2",    // Autenticación JWT
  "bcryptjs": "^2.4.3",        // Hash de passwords
  "cors": "^2.8.5",            // CORS middleware
  "helmet": "^7.1.0",          // Headers de seguridad
  "morgan": "^1.10.0",         // HTTP logging
  "dotenv": "^16.3.1"          // Variables de entorno
}
```

### Frontend
- Vanilla JavaScript (ES6+)
- HTML5 + CSS3
- Fetch API para HTTP requests
- LocalStorage para tokens JWT
- Fuse.js para búsqueda fuzzy

---

## 🎯 Refactorización Completada (Noviembre 2025)

### Sistema de Edición Unificado ✅

El sistema de edición de pacientes ha sido completamente refactorizado, eliminando duplicación de código y mejorando la mantenibilidad.

**Antes del refactoring:**
- 11 funciones separadas para edición de campos
- ~735 líneas de código duplicado
- Lógica repetida en cada función
- Difícil de mantener y extender

**Después del refactoring:**
- 1 función genérica (`editPatientField`)
- Sistema basado en configuración (`FIELD_CONFIGS`)
- ~350 líneas de código limpio
- **Reducción del 52% en código**

### Arquitectura del Sistema Refactorizado

```javascript
// Configuración centralizada
const FIELD_CONFIGS = {
    name: { label, validator, apiEndpoint, ... },
    age: { ... },
    diagnosis: { inputType: 'modal-dropdown', dropdownType: 'diagnosis' },
    prevision: { inputType: 'modal-dropdown', dropdownType: 'prevision' },
    admissionDate: { inputType: 'date', validator, transformer }
};

// Una sola función para todos los campos
async function editPatientField(event, patientId, fieldName) {
    // Lógica genérica que maneja todos los tipos de campos
}
```

### Campos Soportados

| Campo | Tipo | Estado |
|-------|------|--------|
| Nombre | text | ✅ Completado |
| Edad | number | ✅ Completado |
| Cama | text | ✅ Completado |
| RUT | text + validación | ✅ Completado |
| Médico Tratante | text | ✅ Completado |
| Descripción Diagnóstico | text | ✅ Completado |
| **Previsión** | modal-dropdown | ✅ Completado |
| **Diagnóstico** | modal-dropdown | ✅ Completado |
| **Fecha de Ingreso** | date (DD/MM/YYYY) | ✅ Completado |

### Sistema de Dropdowns v2.0 ✨

Nuevo sistema unificado de dropdowns con las siguientes características:

- **Búsqueda fuzzy** con Fuse.js
- **Dropdowns especializados:**
  - Diagnósticos psiquiátricos (catálogo completo)
  - Previsiones de salud chilenas
  - Servicios hospitalarios
- **Modal personalizado** para edición
- **Validación automática**
- **Integración transparente** con sistema de edición

### Compatibilidad

El sistema refactorizado **sobrescribe automáticamente** las funciones del sistema original:

```javascript
// Estas funciones ahora apuntan al sistema refactorizado:
editPatientPrevision()   // Antes: 196 líneas → Ahora: usa editPatientField
editDiagnosis()          // Antes: 120 líneas → Ahora: usa editPatientField
editAdmissionDate()      // Antes: 38 líneas → Ahora: usa editPatientField
```

**Ventaja:** No requiere cambios en el HTML existente. Las llamadas `onclick` siguen funcionando.

### Archivos Deprecated (En /deprecated)

Los siguientes archivos han sido movidos a la carpeta `/deprecated` pero se mantienen por seguridad:

1. **pacientes.js** (58 KB) - Reemplazado por `pacientes-refactored.js`
2. **chat-notes.js** (22 KB) - Reemplazado por `simple-notes.js`
3. **pacientes-edit-improved.js** (9.9 KB) - Intento intermedio no usado
4. **fix-prevision-edit.js** (7.6 KB) - Integrado en `edit-refactored.js`

**Nota:** Estos archivos pueden eliminarse después de 30 días de operación estable.

### Mejoras de Performance

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Líneas de código | ~6,000 | ~4,200 | -30% |
| Código duplicado | 40% | 5% | -87.5% |
| Tiempo para agregar campo | 50+ líneas | 15 líneas | -70% |
| Complejidad ciclomática | Alta | Baja | ✅ |
| Mantenibilidad | Baja | Alta | ✅ |

### Documentación Disponible

Para más detalles sobre el refactoring:

- **ANALISIS_ARQUITECTURA.md** - Análisis completo de la arquitectura actual
- **REFACTORING_GUIDE.md** - Guía paso a paso de la migración
- **REFACTORING_PENDIENTE.md** - Estado del refactoring (todas las tareas completadas)
- **MODAL_ARCHITECTURE_PROPOSAL.md** - Propuesta para futuras mejoras

---

## 🆘 Troubleshooting

### El sitio no carga
```bash
# 1. Verificar que Nginx esté corriendo
systemctl status nginx

# 2. Verificar logs de Nginx
tail -f /var/log/nginx/error.log

# 3. Verificar certificado SSL
certbot certificates

# 4. Reiniciar Nginx
systemctl restart nginx
```

### API no responde
```bash
# 1. Verificar que PM2 esté corriendo
pm2 status

# 2. Ver logs del backend
pm2 logs intraneuro-api --lines 50

# 3. Verificar que escuche en localhost:3000
ss -tlnp | grep :3000

# 4. Reiniciar backend
pm2 restart intraneuro-api

# 5. Verificar base de datos
systemctl status postgresql
```

### Error de autenticación
```bash
# 1. Verificar JWT_SECRET en .env
cat /var/www/intraneuro/backend/.env | grep JWT_SECRET

# 2. Limpiar caché del navegador (Ctrl+Shift+Del)

# 3. Verificar logs de backend
pm2 logs intraneuro-api --err --lines 30
```

### Base de datos no conecta
```bash
# 1. Verificar PostgreSQL
systemctl status postgresql

# 2. Probar conexión manual
PGPASSWORD=IntraNeuro2025 psql -U intraneuro_user -h localhost -d intraneuro_db -c "SELECT 1;"

# 3. Ver logs de PostgreSQL
tail -f /var/log/postgresql/postgresql-14-main.log

# 4. Reiniciar PostgreSQL
systemctl restart postgresql
```

### Certificado SSL expirado
```bash
# 1. Verificar estado del certificado
certbot certificates

# 2. Renovar manualmente
certbot renew

# 3. Recargar Nginx
systemctl reload nginx

# 4. Verificar timer de renovación automática
systemctl list-timers | grep certbot
```

### Espacio en disco lleno
```bash
# 1. Verificar uso de disco
df -h

# 2. Ver archivos grandes
du -sh /var/www/intraneuro/* | sort -h

# 3. Limpiar logs antiguos de PM2
pm2 flush

# 4. Limpiar logs de Nginx
sudo truncate -s 0 /var/log/nginx/*.log

# 5. Limpiar backups antiguos (mayores a 30 días)
find /var/www/intraneuro/backups/automaticos/ -mtime +30 -delete
```

---

## 📞 Contacto y Soporte

**Repositorio**: https://github.com/Ignacio1972/intraneuro-3.0
**Producción**: https://intraneurodavila.com

### Recursos Útiles
- [Node.js Docs](https://nodejs.org/docs)
- [Express.js Guide](https://expressjs.com/guide)
- [Sequelize Docs](https://sequelize.org/docs)
- [PM2 Documentation](https://pm2.keymetrics.io/docs)
- [Nginx Documentation](https://nginx.org/en/docs)
- [Let's Encrypt](https://letsencrypt.org/docs)
- [Fuse.js](https://fusejs.io/) - Búsqueda fuzzy

### Historial de Versiones

**v2.7.0** (15 de Noviembre de 2025)
- ✅ Sistema de edición completamente refactorizado
- ✅ Dropdowns unificados v2.0 con búsqueda fuzzy
- ✅ API de diagnósticos
- ✅ Reducción del 30% en código duplicado
- ✅ Limpieza de archivos deprecated
- ✅ Documentación completa del refactoring

**v2.6.0** (Octubre de 2025)
- Sistema de filtros por servicio hospitalario
- Mejoras en UI de pacientes

---

**Última actualización**: 15 de Noviembre de 2025
**Versión**: 2.7.0
**Estado**: ✅ En producción - Sistema refactorizado y optimizado
**Commit**: e6b1b0c
