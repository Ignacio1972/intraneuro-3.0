# 🔒 WORKFLOW DE DESARROLLO SEGURO - INTRANEURO

## ⚠️ REGLA DE ORO
**NUNCA TOCAR LA BASE DE DATOS DE PRODUCCIÓN DIRECTAMENTE**

## 📋 CHECKLIST PRE-DESARROLLO

### 1. BACKUP OBLIGATORIO (Antes de CUALQUIER cambio)
```bash
# EN PRODUCCIÓN - Crear backup completo
ssh root@148.113.205.115
cd /var/www/intraneuro
./scripts/backup_automatico.sh

# Verificar que el backup se creó
ls -lah backups/
```

### 2. CLONAR PARA DESARROLLO LOCAL
```bash
# En tu máquina local
cd ~/Desarrollo
git clone https://github.com/Ignacio1972/intraneuro.git intraneuro-local
cd intraneuro-local
```

### 3. CONFIGURAR BASE DE DATOS LOCAL
```bash
# Crear BD local SEPARADA (NUNCA usar credenciales de producción)
createdb intraneuro_desarrollo
psql intraneuro_desarrollo < estructura_limpia.sql  # Solo estructura, NO datos reales
```

### 4. CONFIGURAR AMBIENTE LOCAL
```bash
# backend/.env.local (NUNCA commitear este archivo)
PORT=3001  # Puerto diferente para no confundir
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=intraneuro_desarrollo  # BD LOCAL
DB_USER=tu_usuario_local
DB_PASS=password_local
JWT_SECRET=secret_desarrollo
FRONTEND_URL=http://localhost:8080
```

## 🚀 WORKFLOW DE DESARROLLO CON CURSOR

### PASO 1: Preparación
```bash
# Abrir proyecto en Cursor
cursor ~/Desarrollo/intraneuro-local

# Crear rama de trabajo
git checkout -b feature/nombre-cambio

# Verificar que estás en desarrollo
grep "NODE_ENV" backend/.env  # Debe decir "development"
grep "baseURL" js/api.js       # Debe ser localhost:3001
```

### PASO 2: Desarrollo
1. Hacer cambios en Cursor
2. Probar TODO localmente
3. Verificar que NO afectas:
   - Modelos de base de datos
   - Migraciones
   - Configuraciones de producción

### PASO 3: Testing Exhaustivo
```bash
# Lista de pruebas OBLIGATORIAS
✅ Login funciona
✅ CRUD de pacientes funciona
✅ No hay errores en consola
✅ No hay cambios en estructura de BD
✅ API responde correctamente
```

## 🎯 DEPLOY SEGURO A PRODUCCIÓN

### OPCIÓN A: Deploy Manual Controlado (RECOMENDADO)
```bash
# 1. BACKUP PRIMERO
ssh root@148.113.205.115
cd /var/www/intraneuro
./scripts/backup_automatico.sh

# 2. Subir cambios específicos (NO todo el proyecto)
# Desde local, copiar SOLO archivos modificados
scp js/archivo_modificado.js root@148.113.205.115:/var/www/intraneuro/js/
scp backend/src/controllers/controlador.js root@148.113.205.115:/var/www/intraneuro/backend/src/controllers/

# 3. Reiniciar SOLO si tocaste backend
pm2 restart intraneuro-api

# 4. VERIFICAR INMEDIATAMENTE
curl https://intraneurodavila.com  # Debe responder
pm2 logs intraneuro-api            # Sin errores
```

### OPCIÓN B: Deploy via Git (Más arriesgado)
```bash
# 1. SIEMPRE hacer backup primero
ssh root@148.113.205.115
cd /var/www/intraneuro
./scripts/backup_automatico.sh

# 2. Guardar configuración actual
cp backend/.env backend/.env.backup
cp js/api.js js/api.js.backup

# 3. Pull cambios
git pull origin main

# 4. RESTAURAR configuración de producción
cp backend/.env.backup backend/.env
# Verificar que api.js tiene baseURL: '/api'

# 5. Reiniciar
pm2 restart intraneuro-api
```

## 🛡️ SISTEMA DE SEGURIDAD EN 3 CAPAS

### CAPA 1: Backups Automáticos
```bash
# Crear cron para backup diario
crontab -e
# Agregar:
0 3 * * * /var/www/intraneuro/scripts/backup_automatico.sh
```

### CAPA 2: Archivos que NUNCA debes modificar
```
❌ NUNCA TOCAR:
- backend/src/models/*.js        # Modelos de BD
- migrations/*.js                 # Migraciones
- backend/.env (producción)       # Config producción
- Cualquier archivo SQL
```

### CAPA 3: Verificación Post-Deploy
```bash
# Script de verificación
cat > verificar_sistema.sh << 'EOF'
#!/bin/bash
echo "🔍 Verificando sistema..."

# 1. API responde
if curl -s https://intraneurodavila.com/api/health > /dev/null; then
    echo "✅ API funcionando"
else
    echo "❌ ERROR: API no responde"
    exit 1
fi

# 2. BD conectada
if pm2 info intraneuro-api | grep -q "online"; then
    echo "✅ Backend online"
else
    echo "❌ ERROR: Backend offline"
    exit 1
fi

# 3. Sin errores recientes
if pm2 logs intraneuro-api --lines 50 --nostream | grep -q "ERROR"; then
    echo "⚠️  ADVERTENCIA: Hay errores en logs"
else
    echo "✅ Sin errores en logs"
fi

echo "✅ Sistema operativo"
EOF
chmod +x verificar_sistema.sh
```

## 🚨 PLAN DE EMERGENCIA

### Si algo sale mal:
```bash
# 1. RESTAURAR BACKUP INMEDIATAMENTE
cd /var/www/intraneuro
./scripts/restaurar_backup.sh

# 2. Revertir cambios de código
git reset --hard HEAD~1
git push --force

# 3. Reiniciar servicios
pm2 restart intraneuro-api
nginx -s reload

# 4. Verificar
./verificar_sistema.sh
```

## 📱 CONTACTOS DE EMERGENCIA
- Mantener backup local de:
  - Último backup de BD funcionando
  - Versión estable del código
  - Configuraciones de producción

## ✅ CHECKLIST FINAL ANTES DE DEPLOY

- [ ] Backup de BD creado y verificado
- [ ] Cambios probados localmente
- [ ] NO hay cambios en modelos/migraciones
- [ ] Configuración de producción preservada
- [ ] Plan de rollback listo
- [ ] Horario de bajo tráfico elegido
- [ ] Monitoreo activo post-deploy

## 🎯 RESUMEN: REGLAS DE SUPERVIVENCIA

1. **NUNCA** modificar estructura de BD en producción
2. **SIEMPRE** hacer backup antes de cualquier cambio
3. **PROBAR** todo localmente primero
4. **COPIAR** solo archivos específicos, no todo
5. **VERIFICAR** inmediatamente después de deploy
6. **REVERTIR** al primer signo de problema

---
**IMPORTANTE**: Este documento es tu salvavidas. Síguelo AL PIE DE LA LETRA.