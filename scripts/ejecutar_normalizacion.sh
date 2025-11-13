#!/bin/bash
# =====================================================
# SCRIPT MAESTRO DE NORMALIZACIÓN
# Sistema: INTRANEURO
# =====================================================
# IMPORTANTE: Ejecutar con sudo o como usuario root
# =====================================================

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
DB_NAME="intraneuro_db"
DB_USER="intraneuro_user"
export PGPASSWORD="IntraNeuro2025"
BACKUP_DIR="/var/www/intraneuro/backups/normalizacion"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${GREEN}======================================"
echo "PROCESO DE NORMALIZACIÓN DE MÉDICOS"
echo "======================================"
echo -e "Timestamp: $TIMESTAMP${NC}"
echo ""

# Crear directorio de backup si no existe
mkdir -p "$BACKUP_DIR"

# PASO 1: Backup completo de la base de datos
echo -e "${YELLOW}PASO 1: Creando backup completo...${NC}"
pg_dump -U $DB_USER -d $DB_NAME | gzip > "$BACKUP_DIR/intraneuro_pre_normalizacion_$TIMESTAMP.sql.gz"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup creado: $BACKUP_DIR/intraneuro_pre_normalizacion_$TIMESTAMP.sql.gz${NC}"
else
    echo -e "${RED}❌ Error creando backup. Abortando...${NC}"
    exit 1
fi

# PASO 2: Mostrar estado actual
echo ""
echo -e "${YELLOW}PASO 2: Estado actual de la base de datos...${NC}"
psql -U $DB_USER -d $DB_NAME << EOF
SELECT 'Total de variaciones actuales:' as info;
SELECT admitted_by, COUNT(*) as cantidad
FROM admissions
WHERE admitted_by LIKE '%Cerda%' 
   OR admitted_by LIKE '%Villacura%'
   OR admitted_by LIKE '%Rebolledo%'
   OR admitted_by LIKE '%Prieto%'
GROUP BY admitted_by
ORDER BY admitted_by;
EOF

# PASO 3: Confirmación del usuario
echo ""
echo -e "${YELLOW}⚠️  ADVERTENCIA: Este proceso modificará la base de datos en PRODUCCIÓN${NC}"
echo "Se normalizarán los nombres de médicos eliminando duplicados."
echo ""
read -p "¿Desea continuar? (escriba 'SI' para confirmar): " confirmacion

if [ "$confirmacion" != "SI" ]; then
    echo -e "${RED}Proceso cancelado por el usuario${NC}"
    exit 0
fi

# PASO 4: Ejecutar normalización
echo ""
echo -e "${YELLOW}PASO 4: Ejecutando normalización...${NC}"

# Crear archivo temporal con el script y COMMIT automático
cat > /tmp/normalizar_temp.sql << 'SQLEOF'
-- Iniciar transacción
BEGIN;

-- Crear tabla de respaldo
CREATE TABLE IF NOT EXISTS admissions_backup_medicos AS 
SELECT id, admitted_by, discharged_by, updated_at 
FROM admissions;

-- Normalización de admitted_by
UPDATE admissions 
SET admitted_by = 'Andrés de la Cerda', updated_at = CURRENT_TIMESTAMP
WHERE admitted_by IN ('Andrés de la Cerda ', 'Andrés De la Cerda ', 'Andres de la Cerda');

UPDATE admissions 
SET admitted_by = 'Jorge Villacura', updated_at = CURRENT_TIMESTAMP
WHERE admitted_by = 'Jorge Villacura ';

UPDATE admissions 
SET admitted_by = 'Nicolás Rebolledo', updated_at = CURRENT_TIMESTAMP
WHERE admitted_by IN ('Nicolás Rebolledo ', 'Nicolas Rebolledo');

UPDATE admissions 
SET admitted_by = 'Domingo Prieto', updated_at = CURRENT_TIMESTAMP
WHERE admitted_by = 'Domingo Prieto ';

-- Normalización de discharged_by
UPDATE admissions 
SET discharged_by = 'Andrés de la Cerda', updated_at = CURRENT_TIMESTAMP
WHERE discharged_by IN ('Andrés de la Cerda ', 'Andrés De la Cerda ', 'Andres de la Cerda');

UPDATE admissions 
SET discharged_by = 'Jorge Villacura', updated_at = CURRENT_TIMESTAMP
WHERE discharged_by = 'Jorge Villacura ';

UPDATE admissions 
SET discharged_by = 'Nicolás Rebolledo', updated_at = CURRENT_TIMESTAMP
WHERE discharged_by IN ('Nicolás Rebolledo ', 'Nicolas Rebolledo');

UPDATE admissions 
SET discharged_by = 'Domingo Prieto', updated_at = CURRENT_TIMESTAMP
WHERE discharged_by = 'Domingo Prieto ';

-- Confirmar cambios
COMMIT;
SQLEOF

# Ejecutar el script
psql -U $DB_USER -d $DB_NAME < /tmp/normalizar_temp.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Normalización ejecutada exitosamente${NC}"
else
    echo -e "${RED}❌ Error durante la normalización${NC}"
    echo "Puede restaurar desde: $BACKUP_DIR/intraneuro_pre_normalizacion_$TIMESTAMP.sql.gz"
    exit 1
fi

# PASO 5: Validar resultados
echo ""
echo -e "${YELLOW}PASO 5: Validando resultados...${NC}"
bash /var/www/intraneuro/scripts/validar_normalizacion.sh

# PASO 6: Resumen final
echo ""
echo -e "${GREEN}======================================"
echo "PROCESO COMPLETADO"
echo "======================================"
echo -e "${NC}Backup guardado en: $BACKUP_DIR/intraneuro_pre_normalizacion_$TIMESTAMP.sql.gz"
echo ""
echo "Si necesita revertir los cambios:"
echo "1. psql -U $DB_USER -d $DB_NAME < /var/www/intraneuro/scripts/rollback_medicos.sql"
echo "2. O restaurar el backup completo:"
echo "   gunzip < $BACKUP_DIR/intraneuro_pre_normalizacion_$TIMESTAMP.sql.gz | psql -U $DB_USER -d $DB_NAME"
echo ""

# Limpiar archivo temporal
rm -f /tmp/normalizar_temp.sql