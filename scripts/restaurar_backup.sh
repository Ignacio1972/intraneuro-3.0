#!/bin/bash
# =================================================================
# SCRIPT DE RESTAURACIÓN - INTRANEURO
# =================================================================
# Uso: ./restaurar_backup.sh [archivo_backup.sql.gz]
# Si no se especifica archivo, muestra lista para elegir
# =================================================================

BACKUP_DIR="/var/www/intraneuro/backups/automaticos"
DB_NAME="intraneuro_db"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}==================================${NC}"
echo -e "${CYAN}  RESTAURACIÓN DE BASE DE DATOS  ${NC}"
echo -e "${CYAN}==================================${NC}"
echo ""

# Si se proporciona un archivo como parámetro
if [ "$1" ]; then
    BACKUP_FILE="$1"
else
    # Mostrar lista de backups disponibles
    echo -e "${YELLOW}Backups disponibles:${NC}"
    echo ""
    
    # Listar archivos con números
    i=1
    for file in $(ls -t $BACKUP_DIR/*.sql.gz 2>/dev/null); do
        size=$(du -h "$file" | cut -f1)
        date=$(basename "$file" | sed 's/intraneuro_backup_\(.*\)\.sql\.gz/\1/' | sed 's/_/ /')
        echo "  $i) $(basename $file) - $size - $date"
        i=$((i+1))
    done
    
    if [ $i -eq 1 ]; then
        echo -e "${RED}No hay backups disponibles${NC}"
        exit 1
    fi
    
    echo ""
    echo -n "Selecciona el número del backup a restaurar (1-$((i-1))): "
    read selection
    
    # Obtener el archivo seleccionado
    BACKUP_FILE=$(ls -t $BACKUP_DIR/*.sql.gz 2>/dev/null | sed -n "${selection}p")
    
    if [ -z "$BACKUP_FILE" ]; then
        echo -e "${RED}Selección inválida${NC}"
        exit 1
    fi
fi

# Verificar que el archivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: El archivo $BACKUP_FILE no existe${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}⚠️  ADVERTENCIA IMPORTANTE ⚠️${NC}"
echo -e "${YELLOW}Esta acción sobrescribirá TODOS los datos actuales${NC}"
echo -e "${YELLOW}Base de datos: $DB_NAME${NC}"
echo -e "${YELLOW}Backup a restaurar: $(basename $BACKUP_FILE)${NC}"
echo ""

# Verificar checksum si existe
CHECKSUM_FILE="${BACKUP_FILE%.sql.gz}.md5"
if [ -f "$CHECKSUM_FILE" ]; then
    echo -e "${CYAN}Verificando integridad del backup...${NC}"
    if md5sum -c "$CHECKSUM_FILE" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Integridad verificada${NC}"
    else
        echo -e "${RED}✗ Fallo en verificación de integridad${NC}"
        echo -n "¿Continuar de todos modos? (s/n): "
        read confirm
        if [ "$confirm" != "s" ]; then
            exit 1
        fi
    fi
fi

echo ""
echo -n "¿Estás SEGURO de que quieres restaurar este backup? (escribir 'SI RESTAURAR'): "
read confirm

if [ "$confirm" != "SI RESTAURAR" ]; then
    echo -e "${YELLOW}Restauración cancelada${NC}"
    exit 0
fi

# Crear backup de seguridad antes de restaurar
echo ""
echo -e "${CYAN}Creando backup de seguridad actual...${NC}"
SAFETY_BACKUP="/tmp/intraneuro_safety_$(date +%Y%m%d_%H%M%S).sql"
if sudo -u postgres pg_dump "$DB_NAME" > "$SAFETY_BACKUP" 2>/dev/null; then
    echo -e "${GREEN}✓ Backup de seguridad creado en: $SAFETY_BACKUP${NC}"
else
    echo -e "${RED}✗ No se pudo crear backup de seguridad${NC}"
    echo -n "¿Continuar sin backup de seguridad? (s/n): "
    read confirm
    if [ "$confirm" != "s" ]; then
        exit 1
    fi
fi

# Detener servicios
echo ""
echo -e "${CYAN}Deteniendo servicios...${NC}"
pm2 stop intraneuro-api > /dev/null 2>&1
echo -e "${GREEN}✓ API detenida${NC}"

# Restaurar backup
echo ""
echo -e "${CYAN}Restaurando base de datos...${NC}"

# Eliminar y recrear la BD
sudo -u postgres dropdb "$DB_NAME" 2>/dev/null
sudo -u postgres createdb "$DB_NAME" -O intraneuro_user

# Restaurar desde el backup
if zcat "$BACKUP_FILE" | sudo -u postgres psql "$DB_NAME" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Base de datos restaurada exitosamente${NC}"
    
    # Verificar restauración
    PATIENT_COUNT=$(sudo -u postgres psql -t -c "SELECT COUNT(*) FROM patients" "$DB_NAME" 2>/dev/null | tr -d ' ')
    ACTIVE_COUNT=$(sudo -u postgres psql -t -c "SELECT COUNT(*) FROM patients p JOIN admissions a ON p.id = a.patient_id WHERE a.status = 'active'" "$DB_NAME" 2>/dev/null | tr -d ' ')
    
    echo ""
    echo -e "${GREEN}Datos restaurados:${NC}"
    echo -e "  - Total pacientes: $PATIENT_COUNT"
    echo -e "  - Pacientes activos: $ACTIVE_COUNT"
else
    echo -e "${RED}✗ Error durante la restauración${NC}"
    echo -e "${YELLOW}Intentando recuperar desde backup de seguridad...${NC}"
    
    # Intentar recuperar desde el backup de seguridad
    sudo -u postgres dropdb "$DB_NAME" 2>/dev/null
    sudo -u postgres createdb "$DB_NAME" -O intraneuro_user
    
    if [ -f "$SAFETY_BACKUP" ]; then
        if sudo -u postgres psql "$DB_NAME" < "$SAFETY_BACKUP" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Recuperado desde backup de seguridad${NC}"
        else
            echo -e "${RED}✗ No se pudo recuperar. Contacte soporte técnico${NC}"
            exit 1
        fi
    fi
fi

# Reiniciar servicios
echo ""
echo -e "${CYAN}Reiniciando servicios...${NC}"
pm2 restart intraneuro-api > /dev/null 2>&1
sleep 2
echo -e "${GREEN}✓ API reiniciada${NC}"

# Verificar estado del sistema
echo ""
echo -e "${CYAN}Verificando sistema...${NC}"
if pm2 status | grep -q "online"; then
    echo -e "${GREEN}✓ Sistema funcionando correctamente${NC}"
else
    echo -e "${RED}✗ Problema con el servicio API${NC}"
    echo "Ejecutar: pm2 logs intraneuro-api"
fi

echo ""
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}  RESTAURACIÓN COMPLETADA        ${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo "Backup de seguridad guardado en: $SAFETY_BACKUP"
echo "Verificar el sistema en: https://intraneurodavila.com"