// Módulo de renderizado
import { statuses, getFilteredProjects, hasActiveFilters, capitalize, formatDate, findStatusLabel } from "./projects.js";
import { getTasksSummary } from "./tasks.js";

let projects = [];
let filters = {};
let callbacks = {};

export function initializeRender(projectsData, filtersData, callbackFunctions) {
  projects = projectsData;
  filters = filtersData;
  callbacks = callbackFunctions;
}

export function renderBoard(boardElement, projectCardTemplate) {
  boardElement.innerHTML = "";
  boardElement.classList.add("board--visible");

  const filteredProjects = getFilteredProjects(projects, filters);
  const filtersApplied = hasActiveFilters(filters);

  statuses.forEach((status) => {
    const projectsByStatus = filteredProjects.filter(
      (item) => item.status === status.key
    );

    const column = document.createElement("section");
    column.className = "column";
    column.dataset.status = status.key;

    const header = document.createElement("div");
    header.className = "column__header";
    header.innerHTML = `
      <h3 class="column__title">${status.label}</h3>
      <span class="column__count">${projectsByStatus.length}</span>
    `;

    const body = document.createElement("div");
    body.className = "column__body";
    body.dataset.status = status.key;

    body.addEventListener("dragover", (event) => {
      event.preventDefault();
      body.classList.add("is-over");
    });

    body.addEventListener("dragleave", () => {
      body.classList.remove("is-over");
    });

    body.addEventListener("drop", (event) => {
      event.preventDefault();
      body.classList.remove("is-over");
      const projectId = event.dataTransfer.getData("text/plain");
      if (callbacks.onStatusUpdate) {
        callbacks.onStatusUpdate(projectId, status.key);
      }
    });

    if (projectsByStatus.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = filtersApplied
        ? "Sin coincidencias para los filtros aplicados"
        : "Aún no hay proyectos en esta columna";
      body.appendChild(empty);
    } else {
      projectsByStatus.forEach((project) => {
        const card = projectCardTemplate.content.firstElementChild.cloneNode(true);
        fillProjectCard(card, project);
        body.appendChild(card);
      });
    }

    column.appendChild(header);
    column.appendChild(body);
    boardElement.appendChild(column);
  });
}

function fillProjectCard(card, project) {
  card.dataset.id = project.id;

  const title = card.querySelector(".project__title");
  title.textContent = project.name;

  const priority = card.querySelector(".project__priority");
  priority.textContent = capitalize(project.priority);
  priority.className = `project__priority project__priority--${project.priority}`;

  const meta = card.querySelector(".project__meta");
  meta.innerHTML = createMetaHTML(project);

  const description = card.querySelector(".project__description");
  description.textContent = project.description || "Sin descripción";

  const people = card.querySelector(".project__people");
  people.innerHTML = createPeopleHTML(project);

  // Agregar badge de tareas si existen
  const tasksSummary = getTasksSummary(project);
  if (tasksSummary.total > 0) {
    const tasksBadge = document.createElement("div");
    tasksBadge.className = "project__tasks-badge";
    tasksBadge.innerHTML = `
      <span class="badge badge--tasks">
        ${tasksSummary.total} tarea${tasksSummary.total !== 1 ? "s" : ""}
        (${tasksSummary.done}/${tasksSummary.total})
      </span>
    `;
    const footer = card.querySelector(".project__footer");
    if (footer) {
      footer.insertBefore(tasksBadge, footer.firstChild);
    }
  }

  card.addEventListener("dragstart", (event) => {
    card.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", project.id);
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("is-dragging");
  });

  card.addEventListener("dblclick", () => {
    if (callbacks.onEdit) {
      callbacks.onEdit(project.id);
    }
  });

  const moveLeft = card.querySelector(".project__move-left");
  const moveRight = card.querySelector(".project__move-right");
  const editButton = card.querySelector(".project__edit");
  const deleteButton = card.querySelector(".project__delete");
  const viewDetailButton = card.querySelector(".project__view-detail");

  if (moveLeft) {
    moveLeft.addEventListener("click", () => {
      if (callbacks.onMove) {
        callbacks.onMove(project.id, -1);
      }
    });
  }

  if (moveRight) {
    moveRight.addEventListener("click", () => {
      if (callbacks.onMove) {
        callbacks.onMove(project.id, 1);
      }
    });
  }

  if (editButton) {
    editButton.addEventListener("click", () => {
      if (callbacks.onEdit) {
        callbacks.onEdit(project.id);
      }
    });
  }

  if (deleteButton) {
    deleteButton.addEventListener("click", () => {
      if (callbacks.onDelete) {
        callbacks.onDelete(project.id);
      }
    });
  }

  if (viewDetailButton) {
    viewDetailButton.addEventListener("click", () => {
      if (callbacks.onViewDetail) {
        callbacks.onViewDetail(project.id);
      }
    });
  }

  if (moveLeft && moveRight) {
    toggleMoveButtons(moveLeft, moveRight, project.status);
  }
}

function createMetaHTML(project) {
  const rows = [];

  rows.push(`<div><dt>Área</dt><dd>${project.area || "Sin área"}</dd></div>`);

  if (project.points !== null && project.points !== undefined && project.points !== "") {
    rows.push(`<div><dt>Puntos</dt><dd>${project.points}</dd></div>`);
  }

  if (project.estimate) {
    rows.push(`<div><dt>Estimación</dt><dd title="Horas laborales de 8 a 18hs. de lunes a viernes">${project.estimate} h</dd></div>`);
  }

  if (project.startDate) {
    rows.push(`<div><dt>Inicio</dt><dd>${formatDate(project.startDate)}</dd></div>`);
  }

  if (project.endDate) {
    rows.push(`<div><dt>Fin</dt><dd>${formatDate(project.endDate)}</dd></div>`);
  }

  rows.push(
    `<div><dt>Responsable</dt><dd>${project.owner || "Sin asignar"}</dd></div>`
  );

  return rows.join("");
}

function createPeopleHTML(project) {
  const developers = project.developers || [];
  if (!developers.length) {
    return `<span class="badge">Sin desarrolladores asignados</span>`;
  }

  return developers.map((dev) => `<span class="badge">${dev}</span>`).join("");
}

function toggleMoveButtons(moveLeft, moveRight, statusKey) {
  const index = statuses.findIndex((status) => status.key === statusKey);
  if (moveLeft) moveLeft.disabled = index <= 0;
  if (moveRight) moveRight.disabled = index >= statuses.length - 1;
}

export function renderList(listBodyElement) {
  listBodyElement.innerHTML = "";

  const filteredProjects = getFilteredProjects(projects, filters);

  if (filteredProjects.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 12;
    const message = hasActiveFilters(filters)
      ? "No hay proyectos que coincidan con los filtros aplicados"
      : "No hay proyectos registrados";
    cell.innerHTML = `<div class="empty-state">${message}</div>`;
    row.appendChild(cell);
    listBodyElement.appendChild(row);
    return;
  }

  filteredProjects.forEach((project) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${project.name}</td>
      <td>${project.area || "-"}</td>
      <td>${project.owner || "-"}</td>
      <td>${(project.developers || []).join(", ") || "-"}</td>
      <td title="${project.estimate ? 'Horas laborales de 8 a 18hs. de lunes a viernes' : ''}">${project.estimate ? `${project.estimate} h` : "-"}</td>
      <td>${project.points ?? "-"}</td>
      <td>${project.startDate ? formatDate(project.startDate) : "-"}</td>
      <td>${project.endDate ? formatDate(project.endDate) : "-"}</td>
      <td class="table-priority table-priority--${project.priority}">${capitalize(project.priority)}</td>
      <td data-role="status"></td>
      <td class="table__observations">${project.description || "-"}</td>
      <td>
        <div class="project__actions">
          <button class="button button--ghost" data-action="view-detail" data-id="${project.id}">
            Ver detalle
          </button>
          <button class="button button--ghost" data-action="edit" data-id="${project.id}">
            Editar
          </button>
          <button class="button button--ghost" data-action="delete" data-id="${project.id}">
            Eliminar
          </button>
        </div>
      </td>
    `;

    listBodyElement.appendChild(row);

    const statusCell = row.querySelector("[data-role='status']");
    if (statusCell) {
      const statusSelect = document.createElement("select");
      statusSelect.className = "table__status-select";
      statusSelect.setAttribute(
        "aria-label",
        `Actualizar estado del proyecto ${project.name}`
      );

      statuses.forEach((status) => {
        const option = document.createElement("option");
        option.value = status.key;
        option.textContent = status.label;
        statusSelect.appendChild(option);
      });

      statusSelect.value = project.status;
      statusSelect.addEventListener("change", (event) => {
        const value = event.target.value;
        if (callbacks.onStatusUpdate) {
          callbacks.onStatusUpdate(project.id, value);
        }
      });

      statusCell.appendChild(statusSelect);
    }
  });

  listBodyElement.querySelectorAll("[data-action='edit']").forEach((button) => {
    button.addEventListener("click", () => {
      if (callbacks.onEdit) {
        callbacks.onEdit(button.dataset.id);
      }
    });
  });

  listBodyElement.querySelectorAll("[data-action='delete']").forEach((button) => {
    button.addEventListener("click", () => {
      if (callbacks.onDelete) {
        callbacks.onDelete(button.dataset.id);
      }
    });
  });

  listBodyElement.querySelectorAll("[data-action='view-detail']").forEach((button) => {
    button.addEventListener("click", () => {
      if (callbacks.onViewDetail) {
        callbacks.onViewDetail(button.dataset.id);
      }
    });
  });
}

export function renderTimeline(containerElement, dateFilters = null) {
  containerElement.innerHTML = "";
  
  const filteredProjects = getFilteredProjects(projects, filters);
  const filtersApplied = hasActiveFilters(filters);
  
  // Filtrar proyectos que tengan al menos una fecha
  let projectsWithDates = filteredProjects.filter(
    (project) => project.startDate || project.endDate
  );
  
  // Aplicar filtros de fecha si existen
  if (dateFilters && (dateFilters.from || dateFilters.to)) {
    projectsWithDates = projectsWithDates.filter((project) => {
      const startDate = project.startDate ? new Date(project.startDate) : null;
      const endDate = project.endDate ? new Date(project.endDate) : null;
      
      // Si no tiene fechas, no se muestra
      if (!startDate && !endDate) return false;
      
      const filterFrom = dateFilters.from ? new Date(dateFilters.from) : null;
      const filterTo = dateFilters.to ? new Date(dateFilters.to) : null;
      
      if (filterFrom) filterFrom.setHours(0, 0, 0, 0);
      if (filterTo) filterTo.setHours(23, 59, 59, 999);
      
      // Un proyecto se muestra si se superpone con el rango de fechas
      // Caso 1: Proyecto tiene fecha de inicio y fin
      if (startDate && endDate) {
        // El proyecto se superpone si: inicio <= filterTo Y fin >= filterFrom
        if (filterFrom && endDate < filterFrom) return false;
        if (filterTo && startDate > filterTo) return false;
        return true;
      }
      
      // Caso 2: Solo tiene fecha de inicio
      if (startDate && !endDate) {
        if (filterFrom && startDate < filterFrom) return false;
        if (filterTo && startDate > filterTo) return false;
        return true;
      }
      
      // Caso 3: Solo tiene fecha de fin
      if (!startDate && endDate) {
        if (filterFrom && endDate < filterFrom) return false;
        if (filterTo && endDate > filterTo) return false;
        return true;
      }
      
      return true;
    });
  }
  
  if (projectsWithDates.length === 0) {
    const message = filtersApplied
      ? "No hay proyectos con fechas que coincidan con los filtros aplicados"
      : "No hay proyectos con fechas registradas";
    containerElement.innerHTML = `<div class="empty-state">${message}</div>`;
    return;
  }
  
  // Calcular el rango de fechas
  const dates = projectsWithDates
    .flatMap((p) => [p.startDate, p.endDate])
    .filter(Boolean)
    .map((d) => new Date(d));
  
  if (dates.length === 0) {
    containerElement.innerHTML = `<div class="empty-state">No se pueden calcular fechas</div>`;
    return;
  }
  
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  
  // Agregar un margen de 30 días antes y después
  minDate.setDate(minDate.getDate() - 30);
  maxDate.setDate(maxDate.getDate() + 30);
  
  const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Crear contenedor de timeline
  const timelineWrapper = document.createElement("div");
  timelineWrapper.className = "timeline__wrapper";
  
  // Crear escala de tiempo
  const timeScale = document.createElement("div");
  timeScale.className = "timeline__scale";
  
  // Generar marcas de tiempo (una por mes o semana según el rango)
  const scaleInterval = totalDays > 180 ? "month" : "week";
  const marks = [];
  const current = new Date(minDate);
  
  while (current <= maxDate) {
    marks.push(new Date(current));
    if (scaleInterval === "month") {
      current.setMonth(current.getMonth() + 1);
    } else {
      current.setDate(current.getDate() + 7);
    }
  }
  
  const scaleHTML = marks
    .map((date) => {
      const position = ((date - minDate) / (maxDate - minDate)) * 100;
      return `
        <div class="timeline__mark" style="left: ${position}%">
          <span class="timeline__mark-label">${formatDate(date.toISOString().split('T')[0])}</span>
        </div>
      `;
    })
    .join("");
  
  timeScale.innerHTML = scaleHTML;
  timelineWrapper.appendChild(timeScale);
  
  // Línea de hoy
  if (today >= minDate && today <= maxDate) {
    const todayPosition = ((today - minDate) / (maxDate - minDate)) * 100;
    const todayLine = document.createElement("div");
    todayLine.className = "timeline__today";
    todayLine.style.left = `${todayPosition}%`;
    todayLine.setAttribute("title", `Hoy: ${formatDate(today.toISOString().split('T')[0])}`);
    timelineWrapper.appendChild(todayLine);
  }
  
  // Crear barras de proyectos
  const projectsContainer = document.createElement("div");
  projectsContainer.className = "timeline__projects";
  
  projectsWithDates.forEach((project, index) => {
    const projectBar = document.createElement("div");
    projectBar.className = `timeline__project timeline__project--${project.priority || "media"} timeline__project--${project.status || "en-analisis"}`;
    
    const startDate = project.startDate ? new Date(project.startDate) : null;
    const endDate = project.endDate ? new Date(project.endDate) : null;
    
    let left = 0;
    let width = 0;
    
    if (startDate && endDate) {
      left = ((startDate - minDate) / (maxDate - minDate)) * 100;
      width = ((endDate - startDate) / (maxDate - minDate)) * 100;
    } else if (startDate) {
      left = ((startDate - minDate) / (maxDate - minDate)) * 100;
      width = 5; // Ancho mínimo para proyectos sin fecha de fin
    } else if (endDate) {
      left = 0;
      width = ((endDate - minDate) / (maxDate - minDate)) * 100;
    }
    
    // Asegurar que el ancho sea mínimo
    width = Math.max(width, 2);
    left = Math.max(0, Math.min(left, 98));
    
    projectBar.style.left = `${left}%`;
    projectBar.style.width = `${width}%`;
    
    // Información del proyecto
    const projectInfo = document.createElement("div");
    projectInfo.className = "timeline__project-info";
    
    const projectName = document.createElement("div");
    projectName.className = "timeline__project-name";
    projectName.textContent = project.name;
    
    const projectMeta = document.createElement("div");
    projectMeta.className = "timeline__project-meta";
    
    const metaItems = [];
    if (project.area) metaItems.push(`Área: ${project.area}`);
    if (project.owner) metaItems.push(`Responsable: ${project.owner}`);
    if (project.startDate) metaItems.push(`Inicio: ${formatDate(project.startDate)}`);
    if (project.endDate) metaItems.push(`Fin: ${formatDate(project.endDate)}`);
    
    projectMeta.textContent = metaItems.join(" • ");
    
    projectInfo.appendChild(projectName);
    projectInfo.appendChild(projectMeta);
    projectBar.appendChild(projectInfo);
    
    // Agregar eventos
    projectBar.addEventListener("click", () => {
      if (callbacks.onViewDetail) {
        callbacks.onViewDetail(project.id);
      }
    });
    
    projectBar.setAttribute("title", `${project.name} - ${project.area || "Sin área"}`);
    projectBar.style.top = `${index * 60}px`;
    
    projectsContainer.appendChild(projectBar);
  });
  
  timelineWrapper.appendChild(projectsContainer);
  containerElement.appendChild(timelineWrapper);
  
  // Ajustar altura del contenedor
  const totalHeight = projectsWithDates.length * 60 + 100;
  containerElement.style.minHeight = `${totalHeight}px`;
}

export function updateFiltersSummary(filtersSummaryElement) {
  if (!filtersSummaryElement) return;

  const filteredProjects = getFilteredProjects(projects, filters);
  const totalProjects = projects.length;
  const filteredCount = filteredProjects.length;
  const totalPoints = filteredProjects.reduce((sum, project) => {
    return sum + (typeof project.points === "number" ? project.points : 0);
  }, 0);
  const filteredLabel = filteredCount === 1 ? "proyecto" : "proyectos";
  const totalLabel = totalProjects === 1 ? "proyecto" : "proyectos";

  const statusCounts = filteredProjects.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {});

  const breakdown = statuses
    .map((status) => `${status.label}: ${statusCounts[status.key] || 0}`)
    .join(" · ");

  const filtersActive = hasActiveFilters(filters);

  if (!filteredCount) {
    filtersSummaryElement.textContent =
      totalProjects === 0
        ? "No hay proyectos registrados todavía."
        : "Sin coincidencias con los filtros actuales.";
    return;
  }

  const prefix = filtersActive
    ? `Mostrando ${filteredCount} de ${totalProjects} ${totalLabel}.`
    : `Mostrando ${filteredCount} ${filteredLabel}.`;

  const pointsFragment = `Puntos acumulados: ${totalPoints}.`;

  filtersSummaryElement.textContent = `${prefix} ${pointsFragment} ${breakdown}`.trim();
}

export function synchronizeAreaOptions(formAreaSelect, filterAreaSelect, projectsData) {
  if (!formAreaSelect || !filterAreaSelect) return;

  const uniqueAreas = Array.from(
    new Set(
      projectsData
        .map((project) => project.area)
        .filter((area) => typeof area === "string" && area.trim() !== "")
    )
  ).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

  const formValues = new Set(
    Array.from(formAreaSelect.options).map((option) => option.value)
  );
  const filterValues = new Set(
    Array.from(filterAreaSelect.options).map((option) => option.value)
  );

  uniqueAreas.forEach((area) => {
    if (!formValues.has(area)) {
      formAreaSelect.add(new Option(area, area));
      formValues.add(area);
    }

    if (!filterValues.has(area)) {
      filterAreaSelect.add(new Option(area, area));
      filterValues.add(area);
    }
  });
}

