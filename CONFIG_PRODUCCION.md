# CONFIGURACIÓN DE PRODUCCIÓN - INTRANEURO
## Sistema Restaurado: 11 Septiembre 2025

### 🔐 ACCESO AL SISTEMA
- **URL:** https://intraneurodavila.com
- **Código de acceso:** 4321
- **Usuario BD:** sistema / Password: 4321

### 📊 BASE DE DATOS ACTIVA
- **Base de datos:** `intraneuro_db` (producción real)
- **Total pacientes:** 35
- **Pacientes activos:** 5
  1. Demetrio Joaquín Silva Huerta - Cama 484
  2. Elena Tiozzo - Cama 264
  3. Jorge Vasquez - Cama 479
  4. Juan Luis Saavedra Uribe - Cama I453
  5. Rosa Sofía Rain Curin - Cama 477

### ⚙️ CONFIGURACIÓN BACKEND
```bash
# Archivo: /var/www/intraneuro/backend/.env
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=intraneuro_db        # BD con datos reales
DB_USER=intraneuro_user
DB_PASS=IntraNeuro2025
JWT_SECRET=mi_secreto_staging_2025
JWT_EXPIRE=8h
FRONTEND_URL=https://intraneurodavila.com
```

### 🚀 SERVICIOS
```bash
# Ver estado
pm2 status

# Reiniciar API
pm2 restart intraneuro-api

# Ver logs
pm2 logs intraneuro-api --lines 50
```

### 💾 BACKUPS DISPONIBLES
- `/var/www/intraneuro/backups/db_backup_CRITICAL_20250910.sql` - Backup del 10 sept
- `/root/backup_completo_intraneuro_db.sql` - Backup completo de BD funcional

### 🛠️ COMANDOS ÚTILES
```bash
# Backup de base de datos
sudo -u postgres pg_dump intraneuro_db > backup_$(date +%Y%m%d).sql

# Ver pacientes activos
sudo -u postgres psql -d intraneuro_db -c "SELECT name, bed FROM patients p JOIN admissions a ON p.id = a.patient_id WHERE a.status = 'active';"

# Verificar API
curl https://intraneurodavila.com/api/health
```

### ⚠️ NOTAS IMPORTANTES
1. **NO MODIFICAR** directamente en producción sin backup
2. La BD `intraneuro_staging` está vacía, no usar
3. La BD `intraneuro_db` contiene todos los datos reales
4. El sistema usa autenticación simple con código 4321
5. Todos los archivos .env se manejan solo en el VPS

### 📝 ÚLTIMA ACTUALIZACIÓN
- **Fecha:** 11 Septiembre 2025
- **Estado:** Sistema 100% funcional
- **Backups antiguos eliminados:** Sí
- **BD activa:** intraneuro_db