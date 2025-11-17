# Plan Técnico: Integración Chat WhatsApp en Modal del Paciente

**Fecha:** 17 de Noviembre de 2025
**Versión:** 1.0
**Estimado:** 50-60 minutos
**Desarrollador asignado:** _____________

---

## 🎯 Objetivo

Reemplazar los textareas simples de "Historia Clínica" y "Tareas Pendientes" por un sistema de chat tipo WhatsApp que unifique:
- Historia Clínica (mensajes de texto)
- Tareas Pendientes (mensajes de texto)
- Notas de Voz (mensajes de audio)

Todo en una interfaz moderna estilo WhatsApp con persistencia en PostgreSQL.

---

## 📊 Arquitectura Actual vs Nueva

### **ANTES (Sistema Actual):**
```
Modal del Paciente
├── Datos de Ingreso
├── Datos de Egreso
└── 📝 Seguimiento del Paciente
    ├── Historia Clínica: <textarea> (guardado manual con onblur)
    ├── Tareas Pendientes: <textarea> (guardado manual con onblur)
    └── Notas de Voz: Sistema separado (audio-notes.js)
```

**Archivos involucrados:**
- `js/pacientes-ui.js` - Render del modal (líneas 450-490)
- `js/simple-notes.js` - Guardado de textareas
- `js/modules/audio-notes.js` - Sistema de audio separado

### **DESPUÉS (Sistema Nuevo):**
```
Modal del Paciente
├── Datos de Ingreso
├── Datos de Egreso
└── 💬 Seguimiento del Paciente (Chat WhatsApp)
    └── clinical-chat.js
        ├── Tab: Historia Clínica (texto + audio)
        └── Tab: Tareas Pendientes (texto + audio)
```

**Archivos nuevos:**
- `js/modules/clinical-chat.js` - Módulo de chat (✅ Ya creado)
- `css/clinical-chat.css` - Estilos del chat (✅ Ya creado)

---

## 📁 Archivos a Modificar

### **1. index.html**
**Ubicación:** `/var/www/intraneuro-dev/index.html`

**Acción:** Agregar imports de CSS y JS

**Código a agregar** (antes del cierre de `</head>`):
```html
<!-- Clinical Chat System -->
<link rel="stylesheet" href="css/clinical-chat.css">
```

**Código a agregar** (antes del cierre de `</body>`, después de otros scripts):
```html
<!-- Clinical Chat Module -->
<script src="js/modules/clinical-chat.js"></script>
```

---

### **2. js/pacientes-ui.js**
**Ubicación:** `/var/www/intraneuro-dev/js/pacientes-ui.js`

**Acción:** Reemplazar sección "Seguimiento del Paciente" (líneas ~450-490)

**ELIMINAR estas líneas:**
```javascript
<div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid var(--border-color);">
    <h3 style="font-weight: 600; color: var(--text-secondary); margin-bottom: 1rem;">
        📝 Seguimiento del Paciente
    </h3>

    <div class="simple-notes-container">
        <!-- Historia Clínica - TEXTAREA SIMPLE -->
        <div class="note-section">
            <label><strong>Historia Clínica:</strong></label>
            <textarea
                id="historia-${patient.id}"
                class="note-textarea"
                rows="5"
                placeholder="Escribe la historia clínica aquí..."
                onblur="saveSimpleNote(${patient.id}, 'historia')"
            >${patient.observations || ''}</textarea>
        </div>

        <!-- Tareas Pendientes - TEXTAREA SIMPLE -->
        <div class="note-section" style="margin-top: 15px;">
            <label><strong>Tareas Pendientes:</strong></label>
            <textarea
                id="tareas-${patient.id}"
                class="note-textarea"
                rows="5"
                placeholder="Escribe las tareas pendientes aquí..."
                onblur="saveSimpleNote(${patient.id}, 'tareas')"
            >${patient.pendingTasks || ''}</textarea>
        </div>

        <!-- Mensaje de estado -->
        <div id="save-status-${patient.id}" style="margin-top: 10px; text-align: center; color: green; display: none;">
            ✓ Guardado automáticamente
        </div>
    </div>
</div>
```

**AGREGAR en su lugar:**
```javascript
<!-- Clinical Chat System -->
<div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid var(--border-color);">
    <h3 style="font-weight: 600; color: var(--text-secondary); margin-bottom: 1rem;">
        💬 Seguimiento del Paciente
    </h3>

    <!-- Chat Container -->
    <div id="clinical-chat-container-${patient.id}"></div>
</div>
```

---

### **3. js/pacientes-refactored.js** (o archivo donde se inicializa el modal)
**Ubicación:** `/var/www/intraneuro-dev/js/pacientes-refactored.js`

**Acción:** Inicializar el chat cuando se abre el modal del paciente

**Buscar la función** que renderiza/abre el modal del paciente (probablemente `openPatientModal` o `renderPatientModal`)

**AGREGAR al final de esa función:**
```javascript
// Inicializar Clinical Chat
setTimeout(async () => {
    const container = document.getElementById(`clinical-chat-container-${patient.id}`);
    if (container && patient.admission && patient.admission.id) {
        try {
            const chat = new ClinicalChat(patient.id, patient.admission.id);
            await chat.init(container);
            console.log(`✅ Chat inicializado para paciente ${patient.id}`);
        } catch (error) {
            console.error('Error inicializando chat:', error);
            container.innerHTML = '<p style="color: red; padding: 20px;">Error al cargar el chat</p>';
        }
    }
}, 100);
```

**Nota:** El `setTimeout` de 100ms asegura que el DOM esté completamente renderizado antes de inicializar el chat.

---

## 🔧 Detalles Técnicos

### **Flujo de Datos:**

```
1. Usuario abre modal del paciente
   ↓
2. Se renderiza <div id="clinical-chat-container-${patient.id}">
   ↓
3. Se inicializa: new ClinicalChat(patientId, admissionId)
   ↓
4. El chat carga datos del backend:
   - GET /api/patients/:id/admission/observations
   - GET /api/patients/:id/admission/tasks
   - GET /api/audio/admission/:admissionId
   ↓
5. Convierte observaciones/tareas/audios → formato chat
   ↓
6. Renderiza mensajes en UI tipo WhatsApp
   ↓
7. Usuario envía mensaje/audio
   ↓
8. Se guarda inmediatamente en backend:
   - POST /api/patients/:id/admission/observations (texto)
   - POST /api/patients/:id/admission/tasks (texto)
   - POST /api/audio (audio)
```

### **Migración de Datos:**

**NO se requiere script de migración** porque:
- El módulo `clinical-chat.js` ya convierte automáticamente datos antiguos
- Las observaciones/tareas existentes se cargan como mensajes "received"
- Los audios existentes se cargan desde la tabla `audio_notes`

**Formato de conversión:**
```javascript
// Observación antigua (texto plano)
{
  id: 123,
  observation: "Paciente estable",
  created_at: "2025-11-15 10:30:00"
}

// Se convierte a:
{
  id: "obs-123",
  messageType: "text",
  text: "Paciente estable",
  timestamp: "15-11-2025, 10:30:00",
  author: "Sistema",
  type: "received"
}
```

---

## 🧪 Plan de Testing

### **1. Testing Manual (15 min)**

**Caso 1: Paciente con datos existentes**
```
1. Abrir modal de paciente con observaciones/tareas existentes
2. ✅ Verificar que los datos antiguos se muestren como mensajes
3. ✅ Verificar que haya separadores de fecha (Hoy, Ayer, etc.)
4. ✅ Verificar que se muestren timestamps y autores
```

**Caso 2: Enviar mensaje de texto**
```
1. Escribir texto en el input
2. Presionar Enter o botón Enviar
3. ✅ Verificar que el mensaje aparezca inmediatamente (tipo "sent", fondo verde)
4. ✅ Verificar en PostgreSQL que se guardó:
   SELECT * FROM observations ORDER BY created_at DESC LIMIT 1;
5. ✅ Recargar página y verificar que el mensaje persista
```

**Caso 3: Grabar audio**
```
1. Click en botón del micrófono 🎤
2. Permitir acceso al micrófono (navegador pedirá permiso)
3. Hablar 5-10 segundos
4. Click en ⏹️ para detener
5. ✅ Verificar que el audio aparezca como burbuja con waveform
6. ✅ Click en ▶ y verificar que se reproduzca
7. ✅ Verificar en PostgreSQL:
   SELECT * FROM audio_notes ORDER BY created_at DESC LIMIT 1;
8. ✅ Verificar que el archivo exista en /uploads/audio/YYYY/MM/
```

**Caso 4: Cambiar entre tabs**
```
1. Click en tab "Tareas Pendientes"
2. ✅ Verificar que cambie el contenido
3. Enviar una tarea
4. ✅ Verificar que se guarde como task (no observation)
5. Cambiar a "Historia Clínica"
6. ✅ Verificar que los mensajes sean diferentes
```

**Caso 5: Mobile responsive**
```
1. Abrir DevTools → Responsive Mode (Ctrl+Shift+M)
2. Cambiar a iPhone/Android
3. ✅ Verificar que el chat se vea bien
4. ✅ Verificar que el botón del micrófono sea táctil (48x48px)
```

### **2. Verificación en Base de Datos**

```sql
-- Ver últimas observaciones
SELECT id, observation, created_by, created_at
FROM observations
ORDER BY created_at DESC
LIMIT 10;

-- Ver últimas tareas
SELECT id, task, created_by, created_at
FROM pending_tasks
ORDER BY created_at DESC
LIMIT 10;

-- Ver últimos audios
SELECT id, filename, duration_seconds, note_type, created_by, created_at
FROM audio_notes
WHERE is_deleted = false
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔄 Plan de Rollback

**Si algo falla, revertir en este orden:**

### **Opción 1: Rollback Git (Recomendado)**
```bash
# Guardar trabajo actual
git stash

# Volver al commit anterior
git log --oneline -5  # Ver últimos commits
git reset --hard <commit-hash-anterior>

# Reiniciar servicios (si es necesario)
pm2 restart intraneuro-api
```

### **Opción 2: Rollback Manual**
```bash
# 1. Eliminar imports del index.html
# Quitar:
# <link rel="stylesheet" href="css/clinical-chat.css">
# <script src="js/modules/clinical-chat.js"></script>

# 2. Restaurar js/pacientes-ui.js desde backup
cp js/pacientes-ui.js.backup js/pacientes-ui.js

# 3. Limpiar cache del navegador (Ctrl+Shift+Delete)
```

### **Opción 3: Backup antes de empezar**
```bash
# Crear backup de archivos críticos
cp index.html index.html.backup
cp js/pacientes-ui.js js/pacientes-ui.js.backup
cp js/pacientes-refactored.js js/pacientes-refactored.js.backup

# Crear tag git
git tag -a "pre-chat-integration" -m "Antes de integrar chat WhatsApp"
```

---

## ⚠️ Consideraciones Importantes

### **1. Compatibilidad con sistema actual:**
- ✅ Los endpoints del API NO cambian
- ✅ La estructura de BD NO cambia
- ✅ Los datos antiguos se migran automáticamente
- ✅ El sistema de audio existente se reutiliza

### **2. Dependencias:**
- ✅ `localStorage.getItem('token')` - JWT para autenticación
- ✅ `localStorage.getItem('user')` - Usuario actual
- ✅ Función `apiRequest()` debe estar disponible globalmente

### **3. Navegadores soportados:**
- Chrome/Edge: ✅ Completamente soportado
- Firefox: ✅ Completamente soportado
- Safari: ✅ Soportado (requiere HTTPS para micrófono)
- Mobile (iOS/Android): ✅ Soportado

### **4. Permisos del micrófono:**
El navegador pedirá permiso la primera vez que se intente grabar.
**Requiere HTTPS** (ya implementado en producción).

### **5. Formato de audio:**
- Formato: `audio/webm` (estándar en navegadores modernos)
- Tamaño máximo: 10MB (configurado en backend)
- Duración máxima: 5 minutos (configurado en backend)

---

## 📝 Checklist de Implementación

**Antes de empezar:**
- [ ] Crear backup de archivos críticos
- [ ] Crear tag git `pre-chat-integration`
- [ ] Verificar que `clinical-chat.js` y `clinical-chat.css` existan
- [ ] Verificar acceso a base de datos

**Durante implementación:**
- [ ] Modificar `index.html` (agregar CSS + JS)
- [ ] Modificar `js/pacientes-ui.js` (reemplazar textareas)
- [ ] Modificar archivo de inicialización del modal (agregar init del chat)
- [ ] Verificar que no haya errores en consola del navegador

**Testing:**
- [ ] Probar con paciente con datos existentes
- [ ] Enviar mensaje de texto
- [ ] Grabar mensaje de audio
- [ ] Cambiar entre tabs
- [ ] Verificar en mobile
- [ ] Verificar guardado en PostgreSQL

**Después de implementar:**
- [ ] Commit con mensaje descriptivo
- [ ] Crear tag git `post-chat-integration`
- [ ] Actualizar CLAUDE.md si es necesario
- [ ] Notificar al equipo del cambio

---

## 🆘 Troubleshooting

### **Error: "ClinicalChat is not defined"**
**Causa:** El archivo `clinical-chat.js` no se cargó correctamente.
**Solución:**
```bash
# Verificar que el archivo exista
ls -la /var/www/intraneuro-dev/js/modules/clinical-chat.js

# Verificar permisos
chmod 644 /var/www/intraneuro-dev/js/modules/clinical-chat.js

# Verificar que esté en index.html
grep "clinical-chat.js" /var/www/intraneuro-dev/index.html
```

### **Error: "No authenticated" al enviar mensajes**
**Causa:** No hay token JWT en localStorage.
**Solución:** Cerrar sesión y volver a iniciar sesión.

### **El chat no se inicializa**
**Causa:** El `patient.admission` es null o undefined.
**Solución:** Verificar que el paciente tenga una admisión activa:
```sql
SELECT * FROM admissions WHERE patient_id = X AND status = 'active';
```

### **Audio no se graba**
**Causa:** Permisos del micrófono no otorgados o sitio no es HTTPS.
**Solución:** Verificar que el sitio use HTTPS. Verificar permisos en configuración del navegador.

---

## 📞 Contacto

**Desarrollador original:** Claude
**Repositorio:** https://github.com/Ignacio1972/intraneuro-3.0
**Ambiente Dev:** https://dev.intraneurodavila.com
**Ambiente Prod:** https://intraneurodavila.com

---

**Fecha de creación:** 17 de Noviembre de 2025
**Última actualización:** 17 de Noviembre de 2025
**Versión del documento:** 1.0
