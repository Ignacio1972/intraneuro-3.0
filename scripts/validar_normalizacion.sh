#!/bin/bash
# =====================================================
# SCRIPT DE VALIDACIÓN POST-NORMALIZACIÓN
# Sistema: INTRANEURO
# =====================================================

echo "======================================"
echo "VALIDACIÓN DE NORMALIZACIÓN DE MÉDICOS"
echo "======================================"
echo ""

# Configuración de base de datos
DB_NAME="intraneuro_db"
DB_USER="intraneuro_user"
export PGPASSWORD="IntraNeuro2025"

# Función para ejecutar consultas
ejecutar_query() {
    psql -U $DB_USER -d $DB_NAME -t -c "$1"
}

# 1. Verificar que no existan espacios al final
echo "1. Verificando espacios al final de nombres..."
ESPACIOS=$(ejecutar_query "SELECT COUNT(*) FROM admissions WHERE (admitted_by LIKE '% ' OR discharged_by LIKE '% ');")
if [ "$ESPACIOS" -eq 0 ]; then
    echo "   ✅ OK: No hay nombres con espacios al final"
else
    echo "   ❌ ERROR: Encontrados $ESPACIOS registros con espacios al final"
fi

# 2. Verificar que no existan variaciones conocidas
echo ""
echo "2. Verificando variaciones problemáticas..."
VARIACIONES=$(ejecutar_query "SELECT COUNT(*) FROM admissions WHERE admitted_by IN ('Andres de la Cerda', 'Andrés De la Cerda ', 'Nicolas Rebolledo');")
if [ "$VARIACIONES" -eq 0 ]; then
    echo "   ✅ OK: No hay variaciones problemáticas"
else
    echo "   ❌ ERROR: Aún existen $VARIACIONES variaciones sin normalizar"
fi

# 3. Mostrar conteo actual de médicos
echo ""
echo "3. Conteo de registros por médico normalizado:"
echo ""
psql -U $DB_USER -d $DB_NAME << EOF
SELECT 
    admitted_by as "Médico",
    COUNT(*) as "Admisiones"
FROM admissions 
WHERE admitted_by IN (
    'Andrés de la Cerda',
    'Jorge Villacura', 
    'Nicolás Rebolledo',
    'Domingo Prieto',
    'Estudio'
)
GROUP BY admitted_by
ORDER BY admitted_by;
EOF

# 4. Verificar integridad de datos
echo ""
echo "4. Verificando integridad de datos..."
TOTAL_ORIGINAL=$(ejecutar_query "SELECT COUNT(*) FROM admissions_backup_medicos;")
TOTAL_ACTUAL=$(ejecutar_query "SELECT COUNT(*) FROM admissions;")

if [ "$TOTAL_ORIGINAL" = "$TOTAL_ACTUAL" ]; then
    echo "   ✅ OK: Cantidad de registros se mantiene ($TOTAL_ACTUAL registros)"
else
    echo "   ❌ ERROR: Discrepancia en cantidad de registros"
    echo "   Original: $TOTAL_ORIGINAL / Actual: $TOTAL_ACTUAL"
fi

# 5. Verificar que no se perdieron datos
echo ""
echo "5. Verificando que no hay valores NULL inesperados..."
NULLS=$(ejecutar_query "SELECT COUNT(*) FROM admissions a JOIN admissions_backup_medicos b ON a.id = b.id WHERE b.admitted_by IS NOT NULL AND a.admitted_by IS NULL;")
if [ "$NULLS" -eq 0 ]; then
    echo "   ✅ OK: No se perdieron datos durante la normalización"
else
    echo "   ❌ ERROR: Se detectaron $NULLS valores perdidos"
fi

# 6. Mostrar resumen
echo ""
echo "======================================"
echo "RESUMEN DE VALIDACIÓN"
echo "======================================"

# Contar médicos únicos antes y después
MEDICOS_ANTES=$(ejecutar_query "SELECT COUNT(DISTINCT admitted_by) FROM admissions_backup_medicos WHERE admitted_by IS NOT NULL;")
MEDICOS_DESPUES=$(ejecutar_query "SELECT COUNT(DISTINCT admitted_by) FROM admissions WHERE admitted_by IS NOT NULL;")

echo "Médicos únicos antes: $MEDICOS_ANTES"
echo "Médicos únicos después: $MEDICOS_DESPUES"
echo "Reducción de duplicados: $((MEDICOS_ANTES - MEDICOS_DESPUES))"

echo ""
echo "Validación completada."
echo "======================================"