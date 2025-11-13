# SETUP AMBIENTE DE DESARROLLO - INTRANEURO

## Objetivo
Crear ambiente de desarrollo paralelo a producción para trabajar en upgrades sin riesgo.

---

## Arquitectura Final

```
┌─────────────────────────────────────────────────────────────┐
│                    INTRANEURO - AMBIENTES                   │
├─────────────────────┬───────────────────────────────────────┤
│ AMBIENTE            │ PRODUCCIÓN       │ DESARROLLO         │
├─────────────────────┼──────────────────┼────────────────────┤
│ URL                 │ https://         │ http://            │
│                     │ intraneurodavila │ 64.176.7.170:8080  │
│                     │ .com             │                    │
├─────────────────────┼──────────────────┼────────────────────┤
│ Directorio          │ /var/www/        │ /var/www/          │
│                     │ intraneuro       │ intraneuro-dev     │
├─────────────────────┼──────────────────┼────────────────────┤
│ Backend Puerto      │ 3000             │ 3001               │
├─────────────────────┼──────────────────┼────────────────────┤
│ PM2 Proceso         │ intraneuro-api   │ intraneuro-api-dev │
├─────────────────────┼──────────────────┼────────────────────┤
│ Base de Datos       │ intraneuro_db    │ intraneuro_dev     │
├─────────────────────┼──────────────────┼────────────────────┤
│ Datos               │ 126 pacientes    │ 126 pacientes      │
│                     │ 128 admisiones   │ 128 admisiones     │
├─────────────────────┼──────────────────┼────────────────────┤
│ Estado              │ ✅ ONLINE        │ ✅ ONLINE          │
└─────────────────────┴──────────────────┴────────────────────┘
```

---

## Pasos Realizados

### 1. Backup de Seguridad ✅
```bash
./scripts/backup_automatico.sh
```
**Resultado:** Backup de 126 pacientes (24KB)

### 2. Clonar Código ✅
```bash
cp -r /var/www/intraneuro /var/www/intraneuro-dev
```
**Resultado:** Código duplicado en directorio separado

### 3. Crear Base de Datos DEV ✅
```bash
# Crear BD
sudo -u postgres psql -c "CREATE DATABASE intraneuro_dev;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE intraneuro_dev TO intraneuro_user;"

# Copiar datos de producción
sudo -u postgres pg_dump intraneuro_db > /tmp/intraneuro_prod_dump.sql
sudo -u postgres psql intraneuro_dev < /tmp/intraneuro_prod_dump.sql
```
**Resultado:** BD dev con 126 pacientes, 128 admisiones

### 4. Configurar .env para DEV ✅
```bash
# /var/www/intraneuro-dev/backend/.env
PORT=3001
HOST=127.0.0.1
NODE_ENV=development
DB_NAME=intraneuro_dev
FRONTEND_URL=http://64.176.7.170:8080
```
**Resultado:** Backend configurado para puerto 3001 y BD dev

### 5. Instalar Dependencias ✅
```bash
cd /var/www/intraneuro-dev/backend
npm install
```
**Resultado:** 210 paquetes instalados

### 6. Configurar PM2 para Backend DEV ✅
```bash
cd /var/www/intraneuro-dev/backend
pm2 start server.js --name intraneuro-api-dev --watch false
pm2 save
```
**Resultado:** Backend dev corriendo en puerto 3001

### 7. Configurar Nginx para Puerto 8080 ✅
```nginx
# /etc/nginx/sites-available/intraneuro-dev
server {
    listen 8080;
    server_name 64.176.7.170;
    root /var/www/intraneuro-dev;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
```bash
ln -s /etc/nginx/sites-available/intraneuro-dev /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```
**Resultado:** Nginx sirviendo en puerto 8080

### 8. Abrir Puerto en Firewall ✅
```bash
ufw allow 8080/tcp
```
**Resultado:** Puerto 8080 accesible desde internet

### 9. Verificación Final ✅
```bash
# Health check
curl http://localhost:8080/api/health

# Verificar puertos
ss -tlnp | grep -E ':(3000|3001|8080)'

# PM2 status
pm2 list
```
**Resultado:** Todos los servicios funcionando correctamente

---

## Acceso al Ambiente DEV

**URL:** http://64.176.7.170:8080

Funciona exactamente igual que producción pero con su propia base de datos.

---

## Comandos Útiles

### Ver Estado
```bash
# Listar procesos PM2
pm2 list

# Ver logs del ambiente dev
pm2 logs intraneuro-api-dev

# Health check
curl http://localhost:8080/api/health
```

### Gestión Backend DEV
```bash
# Reiniciar
pm2 restart intraneuro-api-dev

# Detener
pm2 stop intraneuro-api-dev

# Ver logs en tiempo real
pm2 logs intraneuro-api-dev --lines 50
```

### Base de Datos DEV
```bash
# Conectar a BD dev
PGPASSWORD=IntraNeuro2025 psql -U intraneuro_user -h localhost -d intraneuro_dev

# Contar pacientes
PGPASSWORD=IntraNeuro2025 psql -U intraneuro_user -h localhost -d intraneuro_dev -c "SELECT COUNT(*) FROM patients;"

# Backup de BD dev
sudo -u postgres pg_dump intraneuro_dev > /tmp/intraneuro_dev_backup.sql
```

### Sincronizar Código
```bash
# Copiar cambios de dev a producción (cuando estés listo)
rsync -av /var/www/intraneuro-dev/ /var/www/intraneuro/ \
  --exclude node_modules \
  --exclude .env \
  --exclude backups

# Reiniciar producción
cd /var/www/intraneuro/backend
npm install  # Si hay nuevas dependencias
pm2 restart intraneuro-api
```

---

## Ventajas de este Setup

✅ **Producción intocable** - Sitio público funciona sin interrupciones
✅ **Datos reales** - Copia exacta de BD de producción para pruebas realistas
✅ **Experimentación segura** - Puedes romper lo que quieras sin consecuencias
✅ **Desarrollo en paralelo** - Trabaja mientras producción opera normalmente
✅ **Testing completo** - Prueba antes de hacer deploy a producción
✅ **Rollback fácil** - Si algo falla, producción no se ve afectada

---

## Flujo de Trabajo Recomendado

### 1. Desarrollar en DEV
```bash
# Acceder a: http://64.176.7.170:8080
# Hacer cambios en: /var/www/intraneuro-dev/
# Probar funcionalidades nuevas
```

### 2. Probar en DEV
```bash
# Verificar que todo funcione correctamente
pm2 logs intraneuro-api-dev
curl http://localhost:8080/api/health
```

### 3. Backup de Producción
```bash
./scripts/backup_automatico.sh
```

### 4. Deploy a Producción
```bash
# Copiar archivos
rsync -av /var/www/intraneuro-dev/ /var/www/intraneuro/ \
  --exclude node_modules \
  --exclude .env \
  --exclude backups

# Si hay cambios en BD
sudo -u postgres pg_dump intraneuro_dev > /tmp/migration.sql
# Revisar migration.sql manualmente
sudo -u postgres psql intraneuro_db < /tmp/migration.sql

# Reiniciar
cd /var/www/intraneuro/backend
npm install
pm2 restart intraneuro-api

# Verificar
curl https://intraneurodavila.com/api/health
```

---

## Desmantelar Ambiente DEV (cuando termines)

```bash
# 1. Detener y eliminar proceso PM2
pm2 delete intraneuro-api-dev
pm2 save

# 2. Cerrar puerto en firewall
ufw delete allow 8080/tcp

# 3. Eliminar configuración Nginx
rm /etc/nginx/sites-enabled/intraneuro-dev
rm /etc/nginx/sites-available/intraneuro-dev
systemctl reload nginx

# 4. Eliminar archivos (opcional)
rm -rf /var/www/intraneuro-dev

# 5. Eliminar BD dev (opcional)
sudo -u postgres psql -c "DROP DATABASE intraneuro_dev;"
```

---

## Troubleshooting

### Backend dev no inicia
```bash
pm2 logs intraneuro-api-dev --err
# Revisar puerto 3001 no esté ocupado
ss -tlnp | grep 3001
```

### Puerto 8080 no accesible
```bash
# Verificar firewall
ufw status | grep 8080

# Verificar Nginx
nginx -t
systemctl status nginx
```

### BD dev no conecta
```bash
# Verificar que exista
sudo -u postgres psql -l | grep intraneuro_dev

# Verificar permisos
sudo -u postgres psql -c "\l intraneuro_dev"
```

---

## Estado Actual

✅ **Ambiente DEV completamente funcional**
✅ **Producción sin modificaciones**
✅ **Listo para comenzar desarrollo de nuevas funcionalidades**

**Fecha de setup:** 2025-11-12
**Ejecutado por:** Claude Code
**Tiempo total:** ~10 minutos

---

## Próximos Pasos

Ahora puedes comenzar a implementar las nuevas funcionalidades según el plan en:
- `/var/www/intraneuro-dev/PLAN_UPGRADE_PWA.md`

**Ambiente de desarrollo:** http://64.176.7.170:8080
**Producción (intocable):** https://intraneurodavila.com
