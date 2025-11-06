const statuses = [
  { key: "en-analisis", label: "En análisis" },
  { key: "en-desarrollo", label: "En desarrollo" },
  { key: "terminado", label: "Terminado" },
];

const STORAGE_KEY = "gestionProjects";
const DATA_URL = "data/projects.json";

const board = document.getElementById("board");
const listView = document.getElementById("listView");
const listBody = document.getElementById("listBody");
const toggleViewButton = document.getElementById("toggleView");
const projectForm = document.getElementById("projectForm");
const cancelEditButton = document.getElementById("cancelEdit");
const importButton = document.getElementById("importButton");
const exportButton = document.getElementById("exportButton");
const importFileInput = document.getElementById("importFile");

let projects = [];
let currentView = "list";

initialize();

async function initialize() {
  cancelEditButton.style.display = "none";

  projects = await loadProjects();

  renderBoard();
  renderList();
  updateView();

  projectForm.addEventListener("submit", handleSubmit);
  toggleViewButton.addEventListener("click", handleToggleView);
  cancelEditButton.addEventListener("click", resetForm);
  importButton.addEventListener("click", () => importFileInput.click());
  exportButton.addEventListener("click", exportProjects);
  importFileInput.addEventListener("change", handleImportFile);
}

async function loadProjects() {
  const stored = getStoredProjects();
  if (stored.length) {
    return stored;
  }

  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Respuesta no válida (${response.status})`);
    }

    const data = await response.json();
    const normalized = normalizeImportedData(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch (error) {
    console.error("No se pudieron cargar los proyectos iniciales", error);
    return [];
  }
}

function getStoredProjects() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : [];
    return normalizeImportedData(parsed);
  } catch (error) {
    console.error("No se pudieron parsear los proyectos almacenados", error);
    return [];
  }
}

function saveProjects() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function handleSubmit(event) {
  event.preventDefault();

  const formData = new FormData(projectForm);
  const id = formData.get("projectId") || crypto.randomUUID();
  const project = {
    id,
    name: formData.get("name").trim(),
    area: formData.get("area"),
    owner: formData.get("owner")?.trim() || "",
    developers: formatDevelopers(formData.get("developers")),
    estimate: formData.get("estimate")?.trim() || "",
    points: parsePoints(formData.get("points")),
    startDate: sanitizeDate(formData.get("startDate")),
    endDate: sanitizeDate(formData.get("endDate")),
    priority: formData.get("priority"),
    status: formData.get("status"),
    description: formData.get("description")?.trim() || "",
  };

  const existingIndex = projects.findIndex((item) => item.id === id);

  if (existingIndex >= 0) {
    projects[existingIndex] = project;
  } else {
    projects.push(project);
  }

  saveProjects();
  renderBoard();
  renderList();
  resetForm();
}

function formatDevelopers(value) {
  if (!value) return [];

  return value
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function parsePoints(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function renderBoard() {
  board.innerHTML = "";
  board.classList.add("board--visible");

  const template = document.getElementById("projectCardTemplate");

  statuses.forEach((status) => {
    const column = document.createElement("section");
    column.className = "column";
    column.dataset.status = status.key;

    const header = document.createElement("div");
    header.className = "column__header";
    header.innerHTML = `
      <h3 class="column__title">${status.label}</h3>
      <span class="column__count">${projects.filter((p) => p.status === status.key).length}</span>
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
      updateProjectStatus(projectId, status.key);
    });

    const projectsByStatus = projects.filter((item) => item.status === status.key);

    if (projectsByStatus.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Aún no hay proyectos en esta columna";
      body.appendChild(empty);
    } else {
      projectsByStatus.forEach((project) => {
        const card = template.content.firstElementChild.cloneNode(true);
        fillProjectCard(card, project);
        body.appendChild(card);
      });
    }

    column.appendChild(header);
    column.appendChild(body);
    board.appendChild(column);
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

  card.addEventListener("dragstart", (event) => {
    card.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", project.id);
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("is-dragging");
  });

  const moveLeft = card.querySelector(".project__move-left");
  const moveRight = card.querySelector(".project__move-right");
  const editButton = card.querySelector(".project__edit");
  const deleteButton = card.querySelector(".project__delete");

  moveLeft.addEventListener("click", () => moveProject(project.id, -1));
  moveRight.addEventListener("click", () => moveProject(project.id, 1));
  editButton.addEventListener("click", () => editProject(project.id));
  deleteButton.addEventListener("click", () => deleteProject(project.id));

  toggleMoveButtons(moveLeft, moveRight, project.status);
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
  const developers = project.developers;
  if (!developers.length) {
    return `<span class="badge">Sin desarrolladores asignados</span>`;
  }

  return developers.map((dev) => `<span class="badge">${dev}</span>`).join("");
}

function toggleMoveButtons(moveLeft, moveRight, statusKey) {
  const index = statuses.findIndex((status) => status.key === statusKey);
  moveLeft.disabled = index <= 0;
  moveRight.disabled = index >= statuses.length - 1;
}

function moveProject(projectId, direction) {
  const index = projects.findIndex((project) => project.id === projectId);
  if (index === -1) return;

  const statusIndex = statuses.findIndex((status) => status.key === projects[index].status);
  const newIndex = statusIndex + direction;

  if (newIndex < 0 || newIndex >= statuses.length) return;

  projects[index].status = statuses[newIndex].key;
  saveProjects();
  renderBoard();
  renderList();
}

function editProject(projectId) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return;

  document.getElementById("projectId").value = project.id;
  document.getElementById("name").value = project.name;
  const areaSelect = document.getElementById("area");
  if (project.area) {
    const existingOption = [...areaSelect.options].find(
      (option) => option.value === project.area
    );
    if (existingOption) {
      areaSelect.value = project.area;
    } else {
      const option = new Option(project.area, project.area, true, true);
      areaSelect.add(option);
    }
  } else {
    areaSelect.selectedIndex = 0;
  }
  document.getElementById("owner").value = project.owner;
  document.getElementById("developers").value = project.developers.join(", ");
  document.getElementById("estimate").value = project.estimate;
  document.getElementById("points").value = project.points ?? "";
  document.getElementById("startDate").value = project.startDate;
  document.getElementById("endDate").value = project.endDate;
  document.getElementById("priority").value = project.priority;
  document.getElementById("status").value = project.status;
  document.getElementById("description").value = project.description;

  document.getElementById("form-title").textContent = "Editar proyecto";
  cancelEditButton.style.display = "inline-flex";
}

function deleteProject(projectId) {
  const confirmation = confirm("¿Quieres eliminar este proyecto?");
  if (!confirmation) return;

  projects = projects.filter((project) => project.id !== projectId);
  saveProjects();
  renderBoard();
  renderList();
}

function resetForm() {
  projectForm.reset();
  document.getElementById("projectId").value = "";
  document.getElementById("form-title").textContent = "Nuevo proyecto";
  cancelEditButton.style.display = "none";
}

function handleToggleView() {
  currentView = currentView === "list" ? "board" : "list";
  updateView();
}

function updateView() {
  const showBoard = currentView === "board";
  board.style.display = showBoard ? "grid" : "none";
  listView.classList.toggle("list--hidden", showBoard);
  toggleViewButton.textContent = showBoard ? "Ver como lista" : "Ver como tablero";
}

function updateProjectStatus(projectId, status) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return;

  project.status = status;
  saveProjects();
  renderBoard();
  renderList();
}

function renderList() {
  listBody.innerHTML = "";

  if (projects.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 12;
    cell.innerHTML = '<div class="empty-state">No hay proyectos registrados</div>';
    row.appendChild(cell);
    listBody.appendChild(row);
    return;
  }

  projects.forEach((project) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${project.name}</td>
      <td>${project.area || "-"}</td>
      <td>${project.owner || "-"}</td>
      <td>${project.developers.join(", ") || "-"}</td>
      <td>${project.estimate ? `${project.estimate} h` : "-"}</td>
      <td>${project.points ?? "-"}</td>
      <td>${project.startDate ? formatDate(project.startDate) : "-"}</td>
      <td>${project.endDate ? formatDate(project.endDate) : "-"}</td>
      <td class="table-priority table-priority--${project.priority}">${capitalize(project.priority)}</td>
      <td>${findStatusLabel(project.status)}</td>
      <td class="table__observations">${project.description || "-"}</td>
      <td>
        <div class="project__actions">
          <button class="button button--ghost" data-action="edit" data-id="${project.id}">
            Editar
          </button>
          <button class="button button--ghost" data-action="delete" data-id="${project.id}">
            Eliminar
          </button>
        </div>
      </td>
    `;

    listBody.appendChild(row);
  });

  listBody.querySelectorAll("[data-action='edit']").forEach((button) => {
    button.addEventListener("click", () => editProject(button.dataset.id));
  });

  listBody.querySelectorAll("[data-action='delete']").forEach((button) => {
    button.addEventListener("click", () => deleteProject(button.dataset.id));
  });
}

function findStatusLabel(statusKey) {
  return statuses.find((status) => status.key === statusKey)?.label ?? statusKey;
}

function capitalize(value) {
  if (!value) return "";
  const normalized = value.replace(/-/g, " ");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function handleImportFile(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    try {
      const content = loadEvent.target?.result;
      const parsed = JSON.parse(content);
      const normalized = normalizeImportedData(parsed);

      if (!normalized.length) {
        alert("El archivo no contiene proyectos válidos.");
        return;
      }

      projects = normalized;
      saveProjects();
      renderBoard();
      renderList();
      resetForm();
    } catch (error) {
      console.error("No se pudo importar el archivo", error);
      alert("Hubo un problema al importar el archivo JSON.");
    } finally {
      importFileInput.value = "";
    }
  };

  reader.readAsText(file);
}

function exportProjects() {
  const data = JSON.stringify(projects, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `proyectos-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function normalizeImportedData(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item) => normalizeProject(item))
    .filter((project) => Boolean(project));
}

function normalizeProject(rawProject) {
  if (!rawProject || typeof rawProject !== "object") {
    return null;
  }

  const id = (rawProject.id || rawProject.ID || crypto.randomUUID()).toString();
  const name =
    rawProject.name ||
    rawProject.project ||
    rawProject.Proyecto ||
    rawProject.nombre ||
    "";

  if (!name) {
    return null;
  }

  const area = String(rawProject.area ?? rawProject.Area ?? "").trim();
  const owner = String(
    rawProject.owner ?? rawProject.responsable ?? rawProject.Responsable ?? ""
  ).trim();
  const developers = normalizeDevelopers(
    rawProject.developers || rawProject.Desarrolladores || rawProject.desarrolladores || []
  );
  const estimate = (rawProject.estimate || rawProject.estimacion || rawProject.Estimacion || "")
    .toString()
    .trim();
  const points = normalizePoints(rawProject.points ?? rawProject.Puntos ?? null);
  const startDate = sanitizeDate(rawProject.startDate || rawProject.fechaInicio || rawProject.FechaInicio || "");
  const endDate = sanitizeDate(rawProject.endDate || rawProject.fechaFin || rawProject.FechaFin || "");
  const priority = normalizePriority(rawProject.priority || rawProject.Prioridad || "media");
  const status = normalizeStatus(rawProject.status || rawProject.Estado || "en-analisis");
  const description = (
    rawProject.description ||
    rawProject.observaciones ||
    rawProject.Observaciones ||
    ""
  )
    .toString()
    .trim();

  return {
    id,
    name: name.toString().trim(),
    area,
    owner,
    developers,
    estimate,
    points,
    startDate,
    endDate,
    priority,
    status,
    description,
  };
}

function normalizeDevelopers(value) {
  if (Array.isArray(value)) {
    return value.map((item) => item.toString().trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return formatDevelopers(value);
  }

  return [];
}

function normalizePoints(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePriority(value) {
  if (!value) return "media";
  const normalized = value.toString().trim().toLowerCase();

  if (normalized.includes("alta")) return "alta";
  if (normalized.includes("media")) return "media";
  if (normalized.includes("baja")) return "baja";
  if (normalized.includes("definir") || normalized.includes("define")) return "a-definir";

  return "media";
}

function normalizeStatus(value) {
  if (!value) return statuses[0].key;
  const normalized = value.toString().trim().toLowerCase();

  if (normalized.includes("termin")) return "terminado";
  if (normalized.includes("desar")) return "en-desarrollo";
  return "en-analisis";
}

function sanitizeDate(value) {
  if (!value) return "";
  const stringValue = value.toString();
  const isValid = /^\d{4}-\d{2}-\d{2}$/.test(stringValue);
  return isValid ? stringValue : "";
}
