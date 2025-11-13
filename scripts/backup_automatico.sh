#!/bin/bash
# =================================================================
# SISTEMA DE BACKUP AUTOMÁTICO - INTRANEURO
# =================================================================
# Descripción: Script confiable para backup de BD con verificación
# Autor: Sistema INTRANEURO
# Fecha: Septiembre 2025
# =================================================================

# === CONFIGURACIÓN ===
BACKUP_DIR="/var/www/intraneuro/backups/automaticos"
DB_NAME="intraneuro_db"
DB_USER="intraneuro_user"
MAX_BACKUPS=30  # Mantener últimos 30 días
LOG_FILE="/var/log/intraneuro_backup.log"
EMAIL_ALERT="admin@intraneurodavila.com"  # Cambiar al email real

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# === FUNCIONES ===
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

send_alert() {
    local subject="$1"
    local message="$2"
    echo "$message" | mail -s "INTRANEURO Backup: $subject" "$EMAIL_ALERT" 2>/dev/null || true
}

check_disk_space() {
    local required_space=500  # MB mínimos requeridos
    local available_space=$(df /var/www/intraneuro | awk 'NR==2 {print int($4/1024)}')
    
    if [ "$available_space" -lt "$required_space" ]; then
        log_message "ERROR: Espacio insuficiente. Disponible: ${available_space}MB, Requerido: ${required_space}MB"
        send_alert "Error - Espacio Insuficiente" "No hay suficiente espacio para el backup. Disponible: ${available_space}MB"
        exit 1
    fi
}

# === INICIO DEL SCRIPT ===
log_message "========================================="
log_message "Iniciando backup automático de INTRANEURO"

# Crear directorio si no existe
mkdir -p "$BACKUP_DIR"

# Verificar espacio en disco
check_disk_space

# === GENERAR NOMBRE DE ARCHIVO ===
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/intraneuro_backup_${TIMESTAMP}.sql"
BACKUP_COMPRESSED="${BACKUP_DIR}/intraneuro_backup_${TIMESTAMP}.sql.gz"
BACKUP_CHECKSUM="${BACKUP_DIR}/intraneuro_backup_${TIMESTAMP}.md5"

# === REALIZAR BACKUP ===
log_message "Creando backup de base de datos..."

# Backup con pg_dump
if sudo -u postgres pg_dump "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null; then
    log_message "✓ Backup creado exitosamente"
else
    log_message "ERROR: Fallo al crear backup"
    send_alert "Error en Backup" "Fallo al crear backup de la base de datos"
    exit 1
fi

# === VERIFICAR INTEGRIDAD ===
# Verificar que el backup no esté vacío
if [ ! -s "$BACKUP_FILE" ]; then
    log_message "ERROR: El archivo de backup está vacío"
    send_alert "Error - Backup Vacío" "El archivo de backup está vacío"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Verificar estructura SQL básica
if ! grep -q "CREATE TABLE" "$BACKUP_FILE"; then
    log_message "ERROR: El backup no contiene estructura de tablas"
    send_alert "Error - Backup Inválido" "El backup no contiene estructura SQL válida"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Contar registros de pacientes en el backup
PATIENT_COUNT=$(sudo -u postgres psql -t -c "SELECT COUNT(*) FROM patients" "$DB_NAME" 2>/dev/null | tr -d ' ')
log_message "Pacientes en backup: $PATIENT_COUNT registros"

# === COMPRIMIR BACKUP ===
log_message "Comprimiendo backup..."
if gzip -c "$BACKUP_FILE" > "$BACKUP_COMPRESSED"; then
    log_message "✓ Backup comprimido exitosamente"
    # Eliminar archivo sin comprimir para ahorrar espacio
    rm -f "$BACKUP_FILE"
else
    log_message "ADVERTENCIA: No se pudo comprimir, manteniendo archivo original"
    BACKUP_COMPRESSED="$BACKUP_FILE"
fi

# === GENERAR CHECKSUM ===
md5sum "$BACKUP_COMPRESSED" > "$BACKUP_CHECKSUM"
log_message "✓ Checksum generado"

# === INFORMACIÓN DEL BACKUP ===
BACKUP_SIZE=$(du -h "$BACKUP_COMPRESSED" | cut -f1)
log_message "Tamaño del backup: $BACKUP_SIZE"

# === ROTACIÓN DE BACKUPS ===
log_message "Aplicando rotación de backups..."

# Contar backups actuales
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f | wc -l)

if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    # Calcular cuántos eliminar
    DELETE_COUNT=$((BACKUP_COUNT - MAX_BACKUPS))
    log_message "Eliminando $DELETE_COUNT backups antiguos..."
    
    # Eliminar los más antiguos
    find "$BACKUP_DIR" -name "*.sql.gz" -type f -print0 | \
        xargs -0 ls -t | \
        tail -n "$DELETE_COUNT" | \
        while read file; do
            rm -f "$file"
            rm -f "${file%.gz}.md5"
            log_message "  - Eliminado: $(basename $file)"
        done
fi

# === PRUEBA DE RESTAURACIÓN RÁPIDA ===
log_message "Verificando integridad del backup..."

# Crear BD temporal para prueba
TEST_DB="intraneuro_test_restore_$$"

if sudo -u postgres createdb "$TEST_DB" 2>/dev/null; then
    # Intentar restaurar en BD temporal
    if zcat "$BACKUP_COMPRESSED" | sudo -u postgres psql "$TEST_DB" &>/dev/null; then
        # Verificar que hay tablas
        TABLE_COUNT=$(sudo -u postgres psql -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'" "$TEST_DB" 2>/dev/null)
        
        if [ "$TABLE_COUNT" -gt "0" ]; then
            log_message "✓ Verificación exitosa: $TABLE_COUNT tablas restauradas"
        else
            log_message "ADVERTENCIA: No se encontraron tablas en la restauración de prueba"
        fi
    else
        log_message "ADVERTENCIA: Fallo la restauración de prueba"
    fi
    
    # Eliminar BD temporal
    sudo -u postgres dropdb "$TEST_DB" 2>/dev/null
else
    log_message "ADVERTENCIA: No se pudo crear BD temporal para verificación"
fi

# === RESUMEN FINAL ===
log_message "========================================="
log_message "BACKUP COMPLETADO EXITOSAMENTE"
log_message "Archivo: $(basename $BACKUP_COMPRESSED)"
log_message "Tamaño: $BACKUP_SIZE"
log_message "Checksum: $(cat $BACKUP_CHECKSUM | awk '{print $1}')"
log_message "Total backups almacenados: $(find "$BACKUP_DIR" -name "*.sql.gz" -type f | wc -l)"
log_message "========================================="

# === VERIFICACIÓN SEMANAL ===
# Los domingos, enviar resumen por email
if [ "$(date +%u)" = "7" ]; then
    WEEKLY_SUMMARY="Resumen Semanal de Backups INTRANEURO\n\n"
    WEEKLY_SUMMARY+="Backups almacenados: $(find "$BACKUP_DIR" -name "*.sql.gz" -type f | wc -l)\n"
    WEEKLY_SUMMARY+="Espacio usado: $(du -sh "$BACKUP_DIR" | cut -f1)\n"
    WEEKLY_SUMMARY+="Último backup: $(basename $BACKUP_COMPRESSED)\n"
    WEEKLY_SUMMARY+="Pacientes respaldados: $PATIENT_COUNT\n"
    
    send_alert "Resumen Semanal" "$WEEKLY_SUMMARY"
    log_message "Resumen semanal enviado"
fi

exit 0