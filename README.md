# Gestión de proyectos

Aplicación web ligera para registrar y dar seguimiento a iniciativas de desarrollo. Permite:

- Capturar estimaciones, fechas objetivo y notas.
- Asignar responsable y desarrolladores por proyecto.
- Visualizar la información como lista tabular o tablero kanban.
- Cambiar el estado de cada proyecto mediante drag & drop o controles rápidos.
- Editar o eliminar proyectos existentes. Los datos se guardan localmente en el navegador y pueden exportarse como JSON.
- Importar o exportar un archivo `JSON` para precargar, respaldar o restaurar la información.

## Uso

1. Abre `index.html` en tu navegador preferido.
2. La aplicación cargará automáticamente el catálogo inicial desde `data/projects.json`, que contiene los proyectos de referencia suministrados.
3. Completa el formulario para crear un nuevo proyecto y pulsa **Guardar proyecto**.
4. Cambia entre vista de **lista** y **tablero** con el botón en la parte superior.
5. Arrastra las tarjetas entre columnas o utiliza los controles para actualizar el estado.
6. Usa los botones **Importar JSON** y **Exportar JSON** para cargar tus propios datos o generar un respaldo actualizado.

> Nota: toda la información se almacena en `localStorage`. Cuando necesites compartirla o moverla a otro equipo, genera un archivo desde **Exportar JSON** y cárgalo nuevamente con **Importar JSON**.

> Algunos navegadores restringen el acceso a archivos locales cuando abres `index.html` directamente (protocolo `file://`). Si no ves la precarga automática, levanta un servidor estático sencillo (por ejemplo `python -m http.server`) o usa **Importar JSON** para seleccionar `data/projects.json` manualmente.

## Datos iniciales

- El archivo `data/projects.json` actúa como la base de datos local inicial e incluye las columnas suministradas (Área, Proyecto, Observaciones, Prioridad, Puntos y Estado).
- Cada registro se normaliza al formato interno de la app (`area`, `name`, `description`, `priority`, `points`, `status`, etc.).
- Puedes editar ese archivo para modificar la precarga o añadir nuevos registros. La próxima vez que abras la app y no existan datos en `localStorage`, se volverá a leer.

### Estructura de un proyecto

```json
{
  "id": "comercial-grupo-opencars-landing-corporativa",
  "area": "Comercial",
  "name": "Grupo Opencars – Landing Corporativa",
  "description": "Generar landing para exponer a las IAs y ser recomendados.",
  "priority": "a-definir",
  "points": 5,
  "status": "en-analisis",
  "owner": "Nombre del responsable",
  "developers": ["Dev 1", "Dev 2"],
  "estimate": "120",
  "startDate": "2024-01-10",
  "endDate": "2024-02-28"
}
```

Los valores aceptados para `status` son `en-analisis`, `en-desarrollo` y `terminado`. Para `priority` se admiten `alta`, `media`, `baja` y `a-definir`.
