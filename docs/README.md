# 📚 Documentación Técnica - IntraNeuro v3.0

Bienvenido a la documentación técnica del sistema IntraNeuro.

---

## 🗂️ Índice de Documentos

### 📋 Documentación General

| Documento | Descripción | Audiencia |
|-----------|-------------|-----------|
| [CLAUDE.md](../CLAUDE.md) | Documentación general del sistema completo | Todos |
| [ANALISIS_ARQUITECTURA.md](../ANALISIS_ARQUITECTURA.md) | Análisis detallado de la arquitectura actual | Arquitectos / Tech Leads |
| [REFACTORING_GUIDE.md](../REFACTORING_GUIDE.md) | Guía del refactoring v2.7.0 (completado) | Desarrolladores |

---

## 🏗️ Migración a Arquitectura Modular (v3.0)

### Documentos de Planificación

| Documento | Descripción | Para quién | Tiempo lectura |
|-----------|-------------|------------|----------------|
| [RESUMEN_EJECUTIVO_MODAL_MODULAR.md](../RESUMEN_EJECUTIVO_MODAL_MODULAR.md) | Resumen ejecutivo para decisiones | Product Owners / Managers | 10 min |
| [ROADMAP_MODAL_MODULAR.md](../ROADMAP_MODAL_MODULAR.md) | Plan completo de migración a componentes | Tech Leads / Arquitectos | 45 min |

### Documentos de Implementación

| Documento | Descripción | Para quién | Tiempo lectura |
|-----------|-------------|------------|----------------|
| [QUICK_START_MODULAR.md](QUICK_START_MODULAR.md) | Guía rápida para empezar | Desarrolladores | 10 min |
| [COMPONENT_EXAMPLES.md](COMPONENT_EXAMPLES.md) | Ejemplos completos de código | Desarrolladores | 30 min |

---

## 🚀 Guía de Lectura Rápida

### Si eres Product Owner / Manager:
1. Lee [RESUMEN_EJECUTIVO_MODAL_MODULAR.md](../RESUMEN_EJECUTIVO_MODAL_MODULAR.md) (10 min)
2. Revisa métricas y timeline
3. Aprueba o solicita ajustes

### Si eres Tech Lead / Arquitecto:
1. Lee [RESUMEN_EJECUTIVO_MODAL_MODULAR.md](../RESUMEN_EJECUTIVO_MODAL_MODULAR.md) (10 min)
2. Lee [ROADMAP_MODAL_MODULAR.md](../ROADMAP_MODAL_MODULAR.md) completo (45 min)
3. Revisa riesgos y plan de migración
4. Asigna recursos y timeline

### Si eres Desarrollador que implementará:
1. Lee [QUICK_START_MODULAR.md](QUICK_START_MODULAR.md) (10 min)
2. Ejecuta checklist de setup
3. Consulta [COMPONENT_EXAMPLES.md](COMPONENT_EXAMPLES.md) mientras desarrollas
4. Sigue el roadmap fase por fase

### Si eres nuevo en el proyecto:
1. Lee [CLAUDE.md](../CLAUDE.md) primero (30 min)
2. Revisa [ANALISIS_ARQUITECTURA.md](../ANALISIS_ARQUITECTURA.md) (20 min)
3. Luego continúa según tu rol (arriba)

---

## 📊 Visión General de la Migración

```
Versión Actual: v2.7.0
├── Sistema de edición refactorizado ✅
├── Dropdowns unificados ✅
└── Modal de pacientes (monolítico) ⚠️

Versión Objetivo: v3.0.0-modular
├── Sistema de edición refactorizado ✅
├── Dropdowns unificados ✅
└── Modal de pacientes (modular) ✨ NUEVO
    ├── ModalOrchestrator
    └── Componentes independientes
```

---

## 🎯 Objetivos de la Migración

**Problema:**
- Modal monolítico de ~6,284 líneas
- Difícil agregar funcionalidades
- Testing complicado
- Alto acoplamiento

**Solución:**
- Arquitectura modular de componentes
- Componentes de ~200-300 líneas
- Testing unitario por componente
- Bajo acoplamiento

**Beneficios:**
- ✅ -85% tamaño archivo principal
- ✅ -60% tiempo para agregar features
- ✅ -75% código duplicado
- ✅ Testing más fácil
- ✅ Escalabilidad

---

## 📅 Timeline

**Total:** 2-3 semanas (16-20 horas de desarrollo)

```
Semana 1: Preparación e Infraestructura Base
Semana 2: Migración de Componentes
Semana 3: Testing, Deploy y Monitoreo
```

Ver detalles completos en [ROADMAP_MODAL_MODULAR.md](../ROADMAP_MODAL_MODULAR.md).

---

## 🔧 Stack Tecnológico

### Backend
- Node.js 20.19.5
- Express.js
- PostgreSQL 14
- Sequelize ORM
- JWT Authentication

### Frontend
- Vanilla JavaScript (ES6+)
- HTML5 + CSS3
- Fetch API
- Arquitectura modular (v3.0)

### Infraestructura
- Nginx (reverse proxy)
- PM2 (process manager)
- Let's Encrypt (SSL/TLS)
- Ubuntu 22.04 LTS

---

## 🆘 Soporte

**Repositorio:** https://github.com/Ignacio1972/intraneuro-3.0
**Documentación base:** [CLAUDE.md](../CLAUDE.md)

**Para preguntas:**
1. Revisar documentación relevante arriba
2. Consultar `CLAUDE.md` para info general
3. Crear issue en GitHub si el problema persiste

---

## 📝 Historial de Documentación

| Versión | Fecha | Documentos Agregados |
|---------|-------|----------------------|
| **v3.0** | 18/11/2025 | Documentación de migración modular |
| **v2.7** | 15/11/2025 | Refactoring de edición y dropdowns |
| **v2.6** | Oct 2025 | Sistema de filtros y servicios |

---

## 🎓 Contribuir a la Documentación

Si encuentras errores o tienes sugerencias:

1. Crea un issue en GitHub
2. O haz un PR con los cambios propuestos
3. Sigue el formato de los documentos existentes
4. Actualiza este README si agregas documentos nuevos

---

**Última actualización:** 18 de Noviembre de 2025
**Versión de la documentación:** 3.0

---

*Generado con Claude Code - IntraNeuro v3.0*
