// Sistema SIMPLIFICADO de notas - Solo texto plano que se guarda y carga
// NO más chat, NO más complejidad

// Función simple para guardar notas
async function saveSimpleNote(patientId, type) {
    try {
        const textarea = document.getElementById(`${type === 'historia' ? 'historia' : 'tareas'}-${patientId}`);
        if (!textarea) return;

        const text = textarea.value.trim();
        const statusDiv = document.getElementById(`save-status-${patientId}`);

        // Mostrar estado "Guardando..."
        if (statusDiv) {
            statusDiv.textContent = '⏳ Guardando...';
            statusDiv.style.color = 'orange';
            statusDiv.style.display = 'block';
        }

        // Determinar el endpoint según el tipo
        const endpoint = type === 'historia'
            ? `/patients/${patientId}/admission/observations`
            : `/patients/${patientId}/admission/tasks`;

        // NO guardar solo si es exactamente []
        if (text === '[]') {
            console.log('Saltando guardado de []');
            if (statusDiv) {
                statusDiv.style.display = 'none';
            }
            return;
        }

        // Si el texto está vacío, enviarlo como string vacío para borrar
        const textToSave = text || '';

        // Guardar el texto COMPLETO (reemplazar todo lo anterior)
        const response = await apiRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify({
                [type === 'historia' ? 'observation' : 'task']: textToSave,
                created_by: sessionStorage.getItem('currentUser') || 'Usuario'
            })
        });

        // Actualizar el objeto local
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
            if (type === 'historia') {
                patient.observations = textToSave;
            } else {
                patient.pendingTasks = textToSave;
            }
        }

        // Mostrar confirmación
        if (statusDiv) {
            if (textToSave === '') {
                statusDiv.textContent = '✓ Contenido borrado';
            } else {
                statusDiv.textContent = '✓ Guardado automáticamente';
            }
            statusDiv.style.color = 'green';
            statusDiv.style.display = 'block';

            // Ocultar mensaje después de 3 segundos
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        }

        console.log(`✓ ${type} guardada para paciente ${patientId}`);

    } catch (error) {
        console.error(`Error guardando ${type}:`, error);

        const statusDiv = document.getElementById(`save-status-${patientId}`);
        if (statusDiv) {
            statusDiv.textContent = '❌ Error al guardar';
            statusDiv.style.color = 'red';
            statusDiv.style.display = 'block';
        }

        // Mostrar error al usuario
        if (typeof showToast === 'function') {
            showToast(`Error al guardar ${type}`, 'error');
        }
    }
}

// Función para cargar notas al abrir el modal
async function loadSimpleNotes(patientId) {
    try {
        // Cargar observaciones más recientes
        const obsResponse = await apiRequest(`/patients/${patientId}/admission/observations`);
        const tasksResponse = await apiRequest(`/patients/${patientId}/admission/tasks`);

        // Tomar el texto más reciente
        let historiaText = '';
        let tareasText = '';

        if (obsResponse && obsResponse.length > 0) {
            // Buscar la primera observación válida (que no sea JSON array)
            for (let obs of obsResponse) {
                if (obs.observation && obs.observation.trim() !== '') {
                    // Verificar si es un JSON array y saltarlo
                    try {
                        const parsed = JSON.parse(obs.observation);
                        if (Array.isArray(parsed)) {
                            continue; // Saltar arrays JSON
                        }
                    } catch (e) {
                        // No es JSON, es texto simple - usarlo
                        if (obs.observation !== '[]') {
                            historiaText = obs.observation;
                            break;
                        }
                    }
                }
            }
        }

        if (tasksResponse && tasksResponse.length > 0) {
            // Buscar la primera tarea válida (que no sea JSON array)
            for (let task of tasksResponse) {
                if (task.task && task.task.trim() !== '') {
                    // Verificar si es un JSON array y saltarlo
                    try {
                        const parsed = JSON.parse(task.task);
                        if (Array.isArray(parsed)) {
                            continue; // Saltar arrays JSON
                        }
                    } catch (e) {
                        // No es JSON, es texto simple - usarlo
                        if (task.task !== '[]') {
                            tareasText = task.task;
                            break;
                        }
                    }
                }
            }
        }

        // Actualizar los textareas si existen
        const historiaTextarea = document.getElementById(`historia-${patientId}`);
        const tareasTextarea = document.getElementById(`tareas-${patientId}`);

        if (historiaTextarea) {
            historiaTextarea.value = historiaText;
        }

        if (tareasTextarea) {
            tareasTextarea.value = tareasText;
        }

        // Actualizar el objeto patient
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
            patient.observations = historiaText;
            patient.pendingTasks = tareasText;
        }

        console.log(`✓ Notas cargadas para paciente ${patientId}`);

    } catch (error) {
        console.error('Error cargando notas:', error);

        // Si hay error, inicializar vacío
        const historiaTextarea = document.getElementById(`historia-${patientId}`);
        const tareasTextarea = document.getElementById(`tareas-${patientId}`);

        if (historiaTextarea) historiaTextarea.value = '';
        if (tareasTextarea) tareasTextarea.value = '';
    }
}

// Agregar estilos para las textareas
if (!document.getElementById('simple-notes-styles')) {
    const style = document.createElement('style');
    style.id = 'simple-notes-styles';
    style.textContent = `
        .simple-notes-container {
            padding: 15px;
            background: #f9f9f9;
            border-radius: 8px;
        }

        .note-section {
            margin-bottom: 15px;
        }

        .note-section label {
            display: block;
            margin-bottom: 5px;
            color: #333;
        }

        .note-textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            font-family: inherit;
            resize: vertical;
        }

        .note-textarea:focus {
            outline: none;
            border-color: #4CAF50;
            box-shadow: 0 0 3px rgba(76, 175, 80, 0.3);
        }

        .note-textarea::placeholder {
            color: #999;
        }
    `;
    document.head.appendChild(style);
}

// Función helper para abrir modal con carga de notas
window.openPatientModalWithNotes = async function(patientId) {
    // Primero abrir el modal
    if (typeof openPatientModal === 'function') {
        openPatientModal(patientId);
    }

    // Luego cargar las notas
    setTimeout(() => {
        loadSimpleNotes(patientId);
    }, 100); // Pequeño delay para asegurar que el DOM esté listo
};