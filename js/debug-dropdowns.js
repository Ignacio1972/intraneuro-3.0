/**
 * Script de Debug para Sistema de Dropdowns
 * Ayuda a identificar problemas de inicialización
 */

(function() {
    'use strict';

    // Función global de debug
    window.debugDropdowns = function() {
        console.log('=== DEBUG DROPDOWNS ===');
        console.log('Timestamp:', new Date().toISOString());

        // 1. Verificar que DropdownSystem existe
        console.log('\n1. DropdownSystem cargado:', !!window.DropdownSystem);
        if (window.DropdownSystem) {
            console.log('   - Versión:', window.DropdownSystem.version);
            console.log('   - Métodos disponibles:', Object.keys(window.DropdownSystem));
        }

        // 2. Verificar contenedores
        console.log('\n2. Contenedores:');
        const diagnosisContainer = document.getElementById('diagnosis-container');
        console.log('   - diagnosis-container existe:', !!diagnosisContainer);
        if (diagnosisContainer) {
            console.log('   - HTML actual:', diagnosisContainer.innerHTML.substring(0, 200));
            console.log('   - Tiene dropdown:', !!diagnosisContainer.querySelector('.intraneuro-dropdown'));
        }

        // 3. Verificar instancia global
        console.log('\n3. Instancia global:');
        console.log('   - diagnosisDropdownInstance existe:', !!window.diagnosisDropdownInstance);
        if (window.diagnosisDropdownInstance) {
            try {
                const value = window.diagnosisDropdownInstance.getValue();
                console.log('   - Valor actual:', value);
            } catch (e) {
                console.log('   - Error obteniendo valor:', e.message);
            }
        }

        // 4. Verificar modal de admisión
        console.log('\n4. Modal de admisión:');
        const admissionModal = document.getElementById('admissionModal');
        console.log('   - admissionModal existe:', !!admissionModal);
        console.log('   - Modal visible:', admissionModal ? admissionModal.style.display !== 'none' : false);

        // 5. Verificar formulario
        console.log('\n5. Formulario:');
        const admissionForm = document.getElementById('admissionForm');
        console.log('   - admissionForm existe:', !!admissionForm);

        // 6. Listar todos los dropdowns en la página
        console.log('\n6. Todos los dropdowns en la página:');
        const allDropdowns = document.querySelectorAll('.intraneuro-dropdown');
        console.log('   - Total encontrados:', allDropdowns.length);
        allDropdowns.forEach((dropdown, index) => {
            console.log(`   - Dropdown ${index + 1}:`, {
                id: dropdown.id,
                value: dropdown.value,
                parent: dropdown.parentElement?.id
            });
        });

        // 7. Verificar estilos
        console.log('\n7. Estilos:');
        const styles = document.getElementById('dropdown-system-styles');
        console.log('   - Estilos inyectados:', !!styles);

        console.log('\n=== FIN DEBUG ===');
    };

    // Auto-ejecutar debug si hay parámetro en URL
    if (window.location.search.includes('debug=dropdowns')) {
        setTimeout(window.debugDropdowns, 2000);
    }

    // Función para reinicializar manualmente - DESHABILITADA 18/12/2025
    // El dropdown de diagnóstico fue eliminado del formulario de ingreso
    // Ahora se asigna desde el modal del paciente
    window.reinitDropdowns = function() {
        console.log('[Debug] reinitDropdowns() deshabilitado - diagnóstico se edita desde modal del paciente');
    };

    // MutationObserver DESHABILITADO - Ya no hay dropdown de diagnóstico en el ingreso
    // El diagnóstico se asigna desde el modal del paciente después del ingreso

    console.log('[Debug] Script de debug de dropdowns cargado. Usa debugDropdowns() para debug manual.');

})();