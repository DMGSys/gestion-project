## **1. Información General**

**Nombre del Proyecto:** Gestión Interna de Proyectos

**Tipo:** Aplicación Web Estática (HTML + CSS + JS)

**Objetivo:** Centralizar la administración de proyectos internos, gestionar tareas por proyecto y brindar una interfaz profesional estilo tablero Kanban / lista detallada.

---

## **2. Propósito del Sistema**

* Unificar la gestión de proyectos internos de diferentes áreas.
* Permitir desglosar cada proyecto en  **tareas asignables** , con estimaciones y estados propios.
* Mantener un diseño corporativo, limpio y fácil de navegar.
* Trabajar 100% local mediante `localStorage`.
* Importar/exportar datos en archivos JSON sin backend.

---

## **3. Estructura del Proyecto**

<pre class="overflow-visible!" data-start="992" data-end="1503"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>/proyecto
 ├── index.html             </span><span># Interfaz principal</span><span>
 ├── app.js                 </span><span># Lógica del sistema</span><span>
 ├── styles.css             </span><span># Estilos principales</span><span>
 │
 ├── /css                   </span><span># Estilos adicionales (opcional)</span><span>
 │     └── custom.css
 │
 ├── /img                   </span><span># Imágenes, logos, íconos</span><span>
 │     ├── logo.png
 │     ├── icon-add.svg
 │     └── placeholder.jpg
 │
 ├── /data                  </span><span># Datos iniciales</span><span>
 │     └── projects.json
 │
 └── /assets (opcional)     </span><span># Archivos complementarios</span><span>
</span></span></code></div></div></pre>

Esta organización facilita mantenimiento, escalabilidad y claridad visual al trabajar en Cursor u otros IDEs.

---

## **4. Diseño y Lineamientos de Estilo**

### **Paleta Profesional**

* Azul principal: `#2563eb`
* Azul suave: `#dbeafe`
* Fondo limpio: `#f6f7fb`
* Gris texto: `#1f2937`
* Gris suave: `#6b7280`

### **Estilos generales**

* Componentes blancos sobre fondo suave.
* Bordes redondeados y sombras suaves.
* Tipografía corporativa:  **Inter** .
* Grillas amplias y accesibilidad visual.

---

## **5. Funcionalidades Principales**

### **5.1. Gestión de Proyectos**

Cada proyecto contiene:

* `name` – título del proyecto
* `area` – comercial, IT, logística, etc.
* `owner` – responsable principal
* `developers` – lista de desarrolladores (array)
* `estimate` – horas estimadas
* `points` – puntos asignados
* `startDate` – fecha inicio
* `endDate` – fecha fin
* `priority` – alta, media, baja, a-definir
* `status` – en-análisis, en-desarrollo, terminado
* `description` – observaciones generales
* `tasks` – lista de tareas internas del proyecto

Vista disponibles:

* **Lista**
* **Tablero Kanban con drag & drop**

---

## **6. Gestión de Tareas por Proyecto**

Cada proyecto incorpora un subconjunto de tareas.

### **6.1. Estructura de una tarea**

<pre class="overflow-visible!" data-start="2814" data-end="3064"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-json"><span><span>{</span><span>
  </span><span>"id"</span><span>:</span><span></span><span>"uuid"</span><span>,</span><span>
  </span><span>"title"</span><span>:</span><span></span><span>"Nombre de la tarea"</span><span>,</span><span>
  </span><span>"description"</span><span>:</span><span></span><span>"Detalle breve de lo que se debe realizar"</span><span>,</span><span>
  </span><span>"assignedTo"</span><span>:</span><span></span><span>"Nombre del responsable"</span><span>,</span><span>
  </span><span>"estimatedTime"</span><span>:</span><span></span><span>3</span><span>,</span><span>
  </span><span>"status"</span><span>:</span><span></span><span>"pendiente"</span><span></span><span>// pendiente | en-progreso | hecha</span><span>
</span><span>}</span><span>
</span></span></code></div></div></pre>

### **6.2. Reglas funcionales**

* Cada proyecto puede tener *cero o muchas* tareas.
* Las tareas deben poder visualizarse dentro del detalle del proyecto.
* Las tareas mantendrán un estado independiente del estado general del proyecto.
* Los tiempos estimados podrán totalizarse en un resumen interno.
* Las tareas pueden editarse, eliminarse o marcarse como completadas.

### **6.3. Ejemplo completo de proyecto con tareas**

<pre class="overflow-visible!" data-start="3504" data-end="4346"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-json"><span><span>{</span><span>
  </span><span>"id"</span><span>:</span><span></span><span>"it-flowise-turnos"</span><span>,</span><span>
  </span><span>"name"</span><span>:</span><span></span><span>"Integración de Turnos Quiter"</span><span>,</span><span>
  </span><span>"area"</span><span>:</span><span></span><span>"IT"</span><span>,</span><span>
  </span><span>"owner"</span><span>:</span><span></span><span>"Diego Gatica"</span><span>,</span><span>
  </span><span>"developers"</span><span>:</span><span></span><span>[</span><span>"Alan Basualdo"</span><span>]</span><span>,</span><span>
  </span><span>"estimate"</span><span>:</span><span></span><span>"120"</span><span>,</span><span>
  </span><span>"points"</span><span>:</span><span></span><span>8</span><span>,</span><span>
  </span><span>"startDate"</span><span>:</span><span></span><span>"2025-01-12"</span><span>,</span><span>
  </span><span>"endDate"</span><span>:</span><span></span><span>"2025-02-10"</span><span>,</span><span>
  </span><span>"priority"</span><span>:</span><span></span><span>"alta"</span><span>,</span><span>
  </span><span>"status"</span><span>:</span><span></span><span>"en-desarrollo"</span><span>,</span><span>
  </span><span>"description"</span><span>:</span><span></span><span>"Integración con API de Quiter usando MCP."</span><span>,</span><span>
  </span><span>"tasks"</span><span>:</span><span></span><span>[</span><span>
    </span><span>{</span><span>
      </span><span>"id"</span><span>:</span><span></span><span>"t001"</span><span>,</span><span>
      </span><span>"title"</span><span>:</span><span></span><span>"Configurar servidor MCP"</span><span>,</span><span>
      </span><span>"description"</span><span>:</span><span></span><span>"Crear endpoints para appointments."</span><span>,</span><span>
      </span><span>"assignedTo"</span><span>:</span><span></span><span>"Alan Basualdo"</span><span>,</span><span>
      </span><span>"estimatedTime"</span><span>:</span><span></span><span>6</span><span>,</span><span>
      </span><span>"status"</span><span>:</span><span></span><span>"en-progreso"</span><span>
    </span><span>}</span><span>,</span><span>
    </span><span>{</span><span>
      </span><span>"id"</span><span>:</span><span></span><span>"t002"</span><span>,</span><span>
      </span><span>"title"</span><span>:</span><span></span><span>"Integración con Flowise"</span><span>,</span><span>
      </span><span>"description"</span><span>:</span><span></span><span>"Configurar herramienta y prompt interno."</span><span>,</span><span>
      </span><span>"assignedTo"</span><span>:</span><span></span><span>"Diego Gatica"</span><span>,</span><span>
      </span><span>"estimatedTime"</span><span>:</span><span></span><span>4</span><span>,</span><span>
      </span><span>"status"</span><span>:</span><span></span><span>"pendiente"</span><span>
    </span><span>}</span><span>
  </span><span>]</span><span>
</span><span>}</span><span>
</span></span></code></div></div></pre>

---

## **7. Arquitectura Lógica (app.js)**

### **7.1. Estado principal del sistema**

<pre class="overflow-visible!" data-start="4436" data-end="4532"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-js"><span><span>projects = [
  {
    </span><span>id</span><span>: </span><span>"..."</span><span>,
    </span><span>name</span><span>: </span><span>"..."</span><span>,
    </span><span>tasks</span><span>: [ { ... } ],
    ...
  }
]
</span></span></code></div></div></pre>

### **7.2. Módulos principales**

* **Carga inicial:** `loadProjects()`
* **Persistencia:** `saveProjects()`
* **Normalización de nuevos datos:** `normalizeProject()`
* **Gestión de filtros:** área, prioridad, estado, texto
* **Renderizado del tablero:** `renderBoard()`
* **Renderizado de la lista:** `renderList()`
* **Edición de proyectos:** `editProject()`
* **Estado por drag & drop:** `updateProjectStatus()`
* **Importación y exportación JSON**

*(El módulo de tareas se incorporará ampliando el objeto de proyectos y agregando nuevos componentes de UI.)*

---

## **8. Estándares de Desarrollo**

### **HTML**

* Uso de etiquetas semánticas (`section`, `header`, `footer`).
* Uso de `<template>` para componentes repetitivos.
* Evitar estilos inline.

### **CSS**

* Uso de variables (`:root`).
* Mantener consistencia visual.
* Para ampliaciones, utilizar `/css/custom.css`.

### **JS**

* Mantener funciones puras cuando corresponda.
* Todas las mutaciones deben pasar por `saveProjects()`.
* No mezclar manipulación DOM con lógica de negocio.
* Las tareas deben administrarse en funciones independientes.

---

## **9. Extensión Recomendada**

* Crear un **modal de detalle** del proyecto con:

  * lista de tareas
  * botón “Agregar tarea”
  * editor dentro del mismo panel
* Implementar:

  * `/js/projects.js`
  * `/js/tasks.js`
  * `/js/storage.js`
  * `/js/render.js`
* Añadir exportación a Excel

  -Reporte de carga estimada por persona

---

## **10. Buenas Prácticas para Cursor**

* Etiquetar mejoras con `// TODO:`
* Señalar errores potenciales con `// FIXME:`
* Dejar comentarios claros y concisos
* Aprovechar autocompletado y sugerencias para refactorizar
* Mantener el proyecto en carpetas organizadas

---

## **11. Conclusión**

Este archivo estandariza:

* Estructura del proyecto
* Flujo de trabajo
* Nuevos requisitos: **tareas dentro de cada proyecto**
* Diseño visual
* Guías para escalar el sistema
* Organización para trabajar profesionalmente en Cursor

Si querés, puedo generarte:

➡ **El módulo JS completo para gestionar tareas**

➡ **El modal de detalle del proyecto (HTML + CSS + JS)**

➡ **La versión modular del proyecto dividido en carpetas `/js/`**

➡ **La interfaz completa en diseño estilo dashboard**
