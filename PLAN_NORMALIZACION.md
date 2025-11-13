# 📋 PLAN COMPLETO DE NORMALIZACIÓN DE MÉDICOS
## Sistema INTRANEURO - Octubre 2024

---

## ✅ FASE 1: PREPARACIÓN (COMPLETADA)
- [x] Script SQL de normalización (`/scripts/normalizar_medicos.sql`)
- [x] Script de validación post-limpieza (`/scripts/validar_normalizacion.sh`)
- [x] Script de rollback (`/scripts/rollback_medicos.sql`)
- [x] Script maestro de ejecución (`/scripts/ejecutar_normalizacion.sh`)
- [x] Backup de archivos críticos (`backup_critico_20251002_223225.tar.gz`)

---

## ✅ FASE 2: PREVENCIÓN FUTURA (COMPLETADA)
- [x] Utilidad de normalización (`/backend/src/utils/normalizeDoctor.js`)
- [x] Integración en controlador de pacientes
- [x] Tests de normalización (100% exitosos)

---

## 📊 DATOS DEL PROBLEMA

### Registros afectados en la base de datos:
```
"Andrés de la Cerda" → 41 registros totales (4 variaciones)
"Jorge Villacura" → 13 registros totales (2 variaciones)  
"Nicolás Rebolledo" → 12 registros totales (3 variaciones)
"Domingo Prieto" → 1 registro (1 variación)
```

### Causas identificadas:
1. **Espacios extras al final** (más común)
2. **Tildes faltantes** (Andres vs Andrés)
3. **Capitalización incorrecta** (De vs de)
4. **Entrada manual inconsistente**

---

## 🚀 EJECUCIÓN DEL PLAN

### ⚠️ ANTES DE EJECUTAR:
1. **Verificar horario**: Idealmente domingo 2-4 AM
2. **Notificar al equipo** si es necesario
3. **Verificar espacio en disco** para backups

### 📝 PASOS DE EJECUCIÓN:

#### 1. BACKUP COMPLETO (YA CREADO)
```bash
ls -la /var/www/intraneuro/backups/archivos_criticos/
# backup_critico_20251002_223225.tar.gz
```

#### 2. EJECUTAR NORMALIZACIÓN
```bash
# Opción A: Script automático (recomendado)
sudo bash /var/www/intraneuro/scripts/ejecutar_normalizacion.sh

# Opción B: Paso a paso manual
psql -U intraneuro_user -d intraneuro_db < /var/www/intraneuro/scripts/normalizar_medicos.sql
```

#### 3. VALIDAR RESULTADOS
```bash
bash /var/www/intraneuro/scripts/validar_normalizacion.sh
```

#### 4. VERIFICAR APLICACIÓN
- Acceder a https://intraneurodavila.com
- Revisar filtro de médicos en página principal
- Verificar en archivos.html que no hay duplicados

---

## 🔄 ROLLBACK (SI ES NECESARIO)

### Opción 1: Rollback de nombres solamente
```bash
psql -U intraneuro_user -d intraneuro_db < /var/www/intraneuro/scripts/rollback_medicos.sql
```

### Opción 2: Restaurar backup completo
```bash
cd /var/www/intraneuro/backups/archivos_criticos/
tar -xzf backup_critico_20251002_223225.tar.gz
cp -r backup_20251002_223225/* /var/www/intraneuro/
pm2 restart intraneuro-api
```

---

## ✅ VERIFICACIÓN POST-IMPLEMENTACIÓN

### Tests automáticos:
```bash
# Verificar normalización funcionando
node /var/www/intraneuro/scripts/test_normalizacion.js

# Verificar base de datos
bash /var/www/intraneuro/scripts/validar_normalizacion.sh
```

### Verificación manual:
1. [ ] Filtros de médicos sin duplicados
2. [ ] Nuevos ingresos se normalizan automáticamente
3. [ ] Sistema funcionando normalmente
4. [ ] Sin errores en logs

---

## 📈 BENEFICIOS ESPERADOS

1. **Reducción de duplicados**: De 11 médicos únicos a 7
2. **Mejora UX**: Filtros más limpios y precisos
3. **Prevención futura**: Nuevos ingresos normalizados automáticamente
4. **Datos consistentes**: Reportes y estadísticas más precisos

---

## 🔐 SEGURIDAD

- ✅ Backup completo creado
- ✅ Script de rollback disponible
- ✅ Transacciones SQL para atomicidad
- ✅ Validación antes de commit
- ✅ Tests pasando al 100%

---

## 📞 CONTACTO EN CASO DE PROBLEMAS

Si algo sale mal durante la ejecución:
1. NO entrar en pánico
2. Ejecutar rollback inmediatamente
3. Verificar logs en `/root/.pm2/logs/`
4. Restaurar backup si es necesario

---

**Documento preparado**: Octubre 2, 2024  
**Sistema**: INTRANEURO v2.0  
**Estado**: LISTO PARA EJECUTAR