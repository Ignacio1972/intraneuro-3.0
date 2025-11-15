#!/bin/bash
# Script de limpieza de archivos deprecated - Fase 1
# INTRANEURO - Sistema de Gestión Hospitalaria
# Fecha: 14 de Noviembre de 2025
# Riesgo: BAJO (solo mueve archivos, no elimina)

set -e  # Salir si hay algún error

echo "=========================================="
echo "INTRANEURO - Limpieza de Arquitectura"
echo "Fase 1: Mover archivos deprecated"
echo "=========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Directorio base
BASE_DIR="/var/www/intraneuro-dev"
cd "$BASE_DIR"

echo -e "${YELLOW}⚠️  IMPORTANTE: Este script solo MUEVE archivos, NO los elimina${NC}"
echo -e "${YELLOW}   Podrás revertir fácilmente si es necesario${NC}"
echo ""
read -p "¿Deseas continuar? (s/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
    echo -e "${RED}✗ Operación cancelada${NC}"
    exit 1
fi

echo ""
echo "Paso 1: Creando carpetas de organización..."

# Crear carpeta para archivos deprecated
if [ ! -d "deprecated" ]; then
    mkdir -p deprecated
    echo -e "${GREEN}✓ Carpeta 'deprecated' creada${NC}"
else
    echo -e "${YELLOW}⚠ Carpeta 'deprecated' ya existe${NC}"
fi

# Crear carpeta para herramientas de desarrollo
if [ ! -d "dev-tools" ]; then
    mkdir -p dev-tools
    echo -e "${GREEN}✓ Carpeta 'dev-tools' creada${NC}"
else
    echo -e "${YELLOW}⚠ Carpeta 'dev-tools' ya existe${NC}"
fi

echo ""
echo "Paso 2: Moviendo archivos deprecated..."

# Array de archivos a mover con sus rutas
declare -a DEPRECATED_FILES=(
    "js/pacientes.js:deprecated/pacientes.js"
    "js/chat-notes.js:deprecated/chat-notes.js"
    "js/modules/pacientes/pacientes-edit-improved.js:deprecated/pacientes-edit-improved.js"
)

MOVED_COUNT=0
for file_pair in "${DEPRECATED_FILES[@]}"; do
    IFS=':' read -r source dest <<< "$file_pair"

    if [ -f "$source" ]; then
        mv "$source" "$dest"
        echo -e "${GREEN}✓ Movido: $source → $dest${NC}"
        ((MOVED_COUNT++))
    else
        echo -e "${YELLOW}⚠ No encontrado: $source (ya movido?)${NC}"
    fi
done

echo ""
echo "Paso 3: Moviendo archivos de prueba/desarrollo..."

# Array de archivos de prueba
declare -a TEST_FILES=(
    "test-edit-refactored.html"
    "verify-refactoring.html"
    "test-dropdowns.html"
)

TEST_MOVED=0
for file in "${TEST_FILES[@]}"; do
    if [ -f "$file" ]; then
        mv "$file" "dev-tools/"
        echo -e "${GREEN}✓ Movido: $file → dev-tools/${NC}"
        ((TEST_MOVED++))
    else
        echo -e "${YELLOW}⚠ No encontrado: $file (ya movido?)${NC}"
    fi
done

echo ""
echo "Paso 4: Creando archivo README en deprecated..."

cat > deprecated/README.md << 'EOF'
# Archivos Deprecated - INTRANEURO

Esta carpeta contiene archivos que han sido reemplazados por versiones refactorizadas pero se mantienen temporalmente por precaución.

## Archivos en esta carpeta:

### `pacientes.js` (1,613 líneas, 58 KB)
- **Reemplazado por:** `pacientes-refactored.js`
- **Razón:** Código monolítico migrado a arquitectura modular
- **Fecha de deprecación:** 14 de Noviembre de 2025
- **Seguro eliminar después de:** 14 de Diciembre de 2025 (30 días)

### `chat-notes.js` (22 KB)
- **Reemplazado por:** `simple-notes.js`
- **Razón:** Sistema demasiado complejo, problemas de sincronización
- **Fecha de deprecación:** 14 de Noviembre de 2025
- **Seguro eliminar después de:** 14 de Diciembre de 2025 (30 días)

### `pacientes-edit-improved.js` (271 líneas, 9.9 KB)
- **Reemplazado por:** `pacientes-edit-refactored.js`
- **Razón:** Nunca se llegó a usar, fue un paso intermedio
- **Fecha de deprecación:** 14 de Noviembre de 2025
- **Seguro eliminar después de:** 14 de Diciembre de 2025 (30 días)

## Restauración

Si necesitas restaurar algún archivo:

```bash
# Ejemplo: restaurar pacientes.js
cp /var/www/intraneuro-dev/deprecated/pacientes.js /var/www/intraneuro-dev/js/

# Descomentar en index.html línea 316
# Comentar pacientes-refactored.js en index.html línea 312
```

## Eliminación permanente

Después de 30 días sin incidentes, ejecutar:

```bash
rm -rf /var/www/intraneuro-dev/deprecated
```

---
**Fecha de creación:** 14 de Noviembre de 2025
**Eliminar después de:** 14 de Diciembre de 2025
EOF

echo -e "${GREEN}✓ README creado en deprecated/${NC}"

echo ""
echo "Paso 5: Creando archivo README en dev-tools..."

cat > dev-tools/README.md << 'EOF'
# Herramientas de Desarrollo - INTRANEURO

Esta carpeta contiene archivos HTML de prueba y debugging utilizados durante el desarrollo.

## Archivos en esta carpeta:

### `test-edit-refactored.html`
- **Propósito:** Testing del sistema de edición refactorizado
- **Uso:** Comparación lado a lado del sistema original vs refactorizado
- **Acceso:** http://localhost/dev-tools/test-edit-refactored.html

### `verify-refactoring.html`
- **Propósito:** Verificación del sistema de edición refactorizado
- **Uso:** Chequeo de salud del módulo PacientesEditRefactored
- **Acceso:** http://localhost/dev-tools/verify-refactoring.html

### `test-dropdowns.html`
- **Propósito:** Testing del sistema de dropdowns v2.0
- **Uso:** Prueba de funcionalidades de dropdowns (diagnóstico, previsión)
- **Acceso:** http://localhost/dev-tools/test-dropdowns.html

## Nota

Estos archivos son solo para desarrollo y testing. NO deben usarse en producción.

---
**Fecha de creación:** 14 de Noviembre de 2025
EOF

echo -e "${GREEN}✓ README creado en dev-tools/${NC}"

echo ""
echo "Paso 6: Generando reporte de limpieza..."

REPORT_FILE="deprecated/CLEANUP_REPORT_$(date +%Y%m%d_%H%M%S).txt"

cat > "$REPORT_FILE" << EOF
REPORTE DE LIMPIEZA - INTRANEURO
Fecha: $(date '+%Y-%m-%d %H:%M:%S')
Ejecutado por: $(whoami)
Servidor: $(hostname)

========================================
ARCHIVOS MOVIDOS A /deprecated
========================================

EOF

for file_pair in "${DEPRECATED_FILES[@]}"; do
    IFS=':' read -r source dest <<< "$file_pair"
    if [ -f "$dest" ]; then
        size=$(du -h "$dest" | cut -f1)
        lines=$(wc -l < "$dest")
        echo "✓ $source ($size, $lines líneas)" >> "$REPORT_FILE"
    fi
done

cat >> "$REPORT_FILE" << EOF

========================================
ARCHIVOS MOVIDOS A /dev-tools
========================================

EOF

for file in "${TEST_FILES[@]}"; do
    if [ -f "dev-tools/$file" ]; then
        size=$(du -h "dev-tools/$file" | cut -f1)
        echo "✓ $file ($size)" >> "$REPORT_FILE"
    fi
done

cat >> "$REPORT_FILE" << EOF

========================================
ESTADÍSTICAS
========================================

Archivos deprecated movidos: $MOVED_COUNT
Archivos de prueba movidos: $TEST_MOVED
Total archivos movidos: $((MOVED_COUNT + TEST_MOVED))

Espacio liberado de /js: ~90 KB

========================================
SIGUIENTE PASO
========================================

1. Verificar que la aplicación funciona correctamente
2. Revisar logs del servidor por 48 horas
3. Si todo está bien, mantener archivos deprecated por 30 días
4. Después de 30 días sin incidentes, eliminar carpeta deprecated

Comando para restaurar si es necesario:
  bash /var/www/intraneuro-dev/scripts/restore_deprecated.sh

========================================
EOF

echo -e "${GREEN}✓ Reporte generado: $REPORT_FILE${NC}"

echo ""
echo "Paso 7: Creando script de restauración..."

cat > scripts/restore_deprecated.sh << 'RESTORE_SCRIPT'
#!/bin/bash
# Script de restauración de archivos deprecated
# Usar solo si hay problemas después de la limpieza

set -e

echo "=========================================="
echo "RESTAURACIÓN DE ARCHIVOS DEPRECATED"
echo "=========================================="
echo ""

BASE_DIR="/var/www/intraneuro-dev"
cd "$BASE_DIR"

echo "⚠️  Este script restaurará los archivos deprecated a sus ubicaciones originales"
echo ""
read -p "¿Deseas continuar? (s/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
    echo "Operación cancelada"
    exit 1
fi

# Restaurar archivos
cp deprecated/pacientes.js js/
cp deprecated/chat-notes.js js/
cp deprecated/pacientes-edit-improved.js js/modules/pacientes/

echo ""
echo "✓ Archivos restaurados"
echo ""
echo "SIGUIENTE PASO MANUAL:"
echo "1. Editar index.html línea 316: Descomentar pacientes.js"
echo "2. Editar index.html línea 312: Comentar pacientes-refactored.js"
echo "3. Reiniciar servicios si es necesario"
echo ""

RESTORE_SCRIPT

chmod +x scripts/restore_deprecated.sh
echo -e "${GREEN}✓ Script de restauración creado: scripts/restore_deprecated.sh${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}✓ LIMPIEZA COMPLETADA EXITOSAMENTE${NC}"
echo "=========================================="
echo ""
echo "📊 Resumen:"
echo "  • Archivos deprecated movidos: $MOVED_COUNT"
echo "  • Archivos de prueba movidos: $TEST_MOVED"
echo "  • Total archivos reorganizados: $((MOVED_COUNT + TEST_MOVED))"
echo ""
echo "📁 Nuevas carpetas:"
echo "  • /deprecated - Archivos antiguos (eliminar después de 30 días)"
echo "  • /dev-tools - Herramientas de desarrollo y testing"
echo ""
echo "📋 Archivos generados:"
echo "  • deprecated/README.md - Información de archivos deprecated"
echo "  • dev-tools/README.md - Información de herramientas de desarrollo"
echo "  • $REPORT_FILE - Reporte completo de la operación"
echo "  • scripts/restore_deprecated.sh - Script de restauración de emergencia"
echo ""
echo "🔍 Próximos pasos:"
echo "  1. ✅ Verificar que la aplicación funciona normalmente"
echo "  2. ⏰ Monitorear por 48 horas"
echo "  3. 📅 Después de 30 días sin problemas, eliminar /deprecated"
echo ""
echo -e "${YELLOW}⚠️  Si hay algún problema, ejecuta:${NC}"
echo -e "${YELLOW}   bash scripts/restore_deprecated.sh${NC}"
echo ""
echo "=========================================="

# Crear un marcador de fecha para recordar eliminar deprecated
echo "$(date -d '+30 days' '+%Y-%m-%d')" > deprecated/.delete_after

echo ""
echo -e "${GREEN}✓ Operación completada sin errores${NC}"
echo ""
