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
    rows.push(`<div><dt>Estimación</dt><dd>${project.estimate} h</dd></div>`);
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
      <td>${project.estimate ? `${project.estimate} h` : "-"}</td>
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

