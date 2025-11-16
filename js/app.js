// Aplicación principal - Gestión de Proyectos
import { loadProjects, saveProjects } from "./storage.js";
import {
  statuses,
  createProject,
  updateProjectStatus,
  moveProject,
  deleteProject,
  getFilteredProjects,
  hasActiveFilters,
  toSearchableString,
} from "./projects.js";
import {
  addTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getTaskStatuses,
  getTasksSummary,
} from "./tasks.js";
import {
  initializeRender,
  renderBoard,
  renderList,
  updateFiltersSummary,
  synchronizeAreaOptions,
} from "./render.js";
import {
  loadPeople,
  addDeveloper,
  removeDeveloper,
  addOwner,
  removeOwner,
  addArea,
  removeArea,
  getDevelopers,
  getOwners,
  getAreas,
  getAllPeople,
} from "./people.js";

// Referencias DOM
const board = document.getElementById("board");
const listView = document.getElementById("listView");
const listBody = document.getElementById("listBody");
const toggleViewButton = document.getElementById("toggleView");
const projectForm = document.getElementById("projectForm");
const formAreaSelect = document.getElementById("area");
const cancelEditButton = document.getElementById("cancelEdit");
const importButton = document.getElementById("importButton");
const exportButton = document.getElementById("exportButton");
const importFileInput = document.getElementById("importFile");
const filtersForm = document.getElementById("filtersForm");
const filterSearchInput = document.getElementById("filterSearch");
const filterAreaSelect = document.getElementById("filterArea");
const filterPrioritySelect = document.getElementById("filterPriority");
const filterStatusSelect = document.getElementById("filterStatus");
const clearFiltersButton = document.getElementById("clearFilters");
const filtersSummary = document.getElementById("filtersSummary");

// Modal de detalle del proyecto
const projectDetailModal = document.getElementById("projectDetailModal");
const modalCloseButton = document.getElementById("modalClose");
const modalOverlay = document.getElementById("modalOverlay");
const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const taskFormTitle = document.getElementById("taskFormTitle");
const cancelTaskEditButton = document.getElementById("cancelTaskEdit");

// Referencias para administración de personas
const ownerForm = document.getElementById("ownerForm");
const developerForm = document.getElementById("developerForm");
const areaForm = document.getElementById("areaForm");
const ownersList = document.getElementById("ownersList");
const developersList = document.getElementById("developersList");
const areasList = document.getElementById("areasList");
const ownerSelect = document.getElementById("owner");
const developersSelect = document.getElementById("developers");
const taskAssignedToSelect = document.getElementById("taskAssignedTo");

let projects = [];
let currentView = "list";
let currentProjectId = null;
let currentTaskId = null;
const filters = {
  search: "",
  area: "",
  priority: "",
  status: "",
};

initialize();

async function initialize() {
  cancelEditButton.style.display = "none";
  if (cancelTaskEditButton) {
    cancelTaskEditButton.style.display = "none";
  }

  projects = await loadProjects();

  // Inicializar administración de personas y áreas
  initializePeopleAdmin();
  updateAllSelects();

  // Inicializar render con callbacks
  initializeRender(projects, filters, {
    onStatusUpdate: handleStatusUpdate,
    onMove: handleMoveProject,
    onEdit: editProject,
    onDelete: handleDeleteProject,
    onViewDetail: viewProjectDetail,
  });

  renderBoard(board, document.getElementById("projectCardTemplate"));
  renderList(listBody);
  updateFiltersSummary(filtersSummary);
  updateView();

  projectForm.addEventListener("submit", handleSubmit);
  toggleViewButton.addEventListener("click", handleToggleView);
  cancelEditButton.addEventListener("click", resetForm);
  importButton.addEventListener("click", () => importFileInput.click());
  exportButton.addEventListener("click", exportProjects);
  importFileInput.addEventListener("change", handleImportFile);

  if (filtersForm) {
    filtersForm.addEventListener("submit", (event) => event.preventDefault());
  }
  if (filterSearchInput) {
    filterSearchInput.addEventListener("input", handleFiltersChange);
  }
  if (filterAreaSelect) {
    filterAreaSelect.addEventListener("change", handleFiltersChange);
  }
  if (filterPrioritySelect) {
    filterPrioritySelect.addEventListener("change", handleFiltersChange);
  }
  if (filterStatusSelect) {
    filterStatusSelect.addEventListener("change", handleFiltersChange);
  }
  if (clearFiltersButton) {
    clearFiltersButton.addEventListener("click", handleClearFilters);
  }

  // Eventos del modal
  if (modalCloseButton) {
    modalCloseButton.addEventListener("click", closeProjectDetailModal);
  }
  if (modalOverlay) {
    modalOverlay.addEventListener("click", closeProjectDetailModal);
  }
  if (taskForm) {
    taskForm.addEventListener("submit", handleTaskSubmit);
  }
  if (cancelTaskEditButton) {
    cancelTaskEditButton.addEventListener("click", resetTaskForm);
  }

  // Cerrar modal con ESC
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && projectDetailModal?.classList.contains("modal--visible")) {
      closeProjectDetailModal();
    }
  });

  // Inicializar sistema de pestañas
  initializeTabs();
}

// Sistema de pestañas
function initializeTabs() {
  const tabButtons = document.querySelectorAll(".tabs__tab");
  const tabPanels = document.querySelectorAll(".tabs__panel");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetTab = button.dataset.tab;

      // Desactivar todas las pestañas
      tabButtons.forEach((btn) => {
        btn.classList.remove("tabs__tab--active");
        btn.setAttribute("aria-selected", "false");
      });

      tabPanels.forEach((panel) => {
        panel.classList.remove("tabs__panel--active");
      });

      // Activar la pestaña seleccionada
      button.classList.add("tabs__tab--active");
      button.setAttribute("aria-selected", "true");
      document.getElementById(`${targetTab}-panel`).classList.add("tabs__panel--active");
    });
  });
}

// Funciones de administración de personas y áreas
function initializePeopleAdmin() {
  renderPeopleLists();
  
  if (areaForm) {
    areaForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("newArea");
      const name = input.value.trim();
      if (name && addArea(name)) {
        input.value = "";
        renderPeopleLists();
        updateAllSelects();
      }
    });
  }
  
  if (ownerForm) {
    ownerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("newOwner");
      const name = input.value.trim();
      if (name && addOwner(name)) {
        input.value = "";
        renderPeopleLists();
        updateAllSelects();
      }
    });
  }
  
  if (developerForm) {
    developerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("newDeveloper");
      const name = input.value.trim();
      if (name && addDeveloper(name)) {
        input.value = "";
        renderPeopleLists();
        updateAllSelects();
      }
    });
  }
}

function renderPeopleLists() {
  // Renderizar áreas
  if (areasList) {
    const areas = getAreas();
    areasList.innerHTML = areas.map(area => `
      <li class="people-admin__item">
        <span>${area}</span>
        <button class="button button--ghost button--small" data-action="remove-area" data-name="${area}" type="button">
          Eliminar
        </button>
      </li>
    `).join("");
    
    areasList.querySelectorAll("[data-action='remove-area']").forEach(btn => {
      btn.addEventListener("click", () => {
        if (confirm(`¿Eliminar el área "${btn.dataset.name}"?`)) {
          removeArea(btn.dataset.name);
          renderPeopleLists();
          updateAllSelects();
        }
      });
    });
  }
  
  // Renderizar responsables
  if (ownersList) {
    const owners = getOwners();
    ownersList.innerHTML = owners.map(owner => `
      <li class="people-admin__item">
        <span>${owner}</span>
        <button class="button button--ghost button--small" data-action="remove-owner" data-name="${owner}" type="button">
          Eliminar
        </button>
      </li>
    `).join("");
    
    ownersList.querySelectorAll("[data-action='remove-owner']").forEach(btn => {
      btn.addEventListener("click", () => {
        if (confirm(`¿Eliminar el responsable "${btn.dataset.name}"?`)) {
          removeOwner(btn.dataset.name);
          renderPeopleLists();
          updateAllSelects();
        }
      });
    });
  }
  
  // Renderizar desarrolladores
  if (developersList) {
    const developers = getDevelopers();
    developersList.innerHTML = developers.map(dev => `
      <li class="people-admin__item">
        <span>${dev}</span>
        <button class="button button--ghost button--small" data-action="remove-developer" data-name="${dev}" type="button">
          Eliminar
        </button>
      </li>
    `).join("");
    
    developersList.querySelectorAll("[data-action='remove-developer']").forEach(btn => {
      btn.addEventListener("click", () => {
        if (confirm(`¿Eliminar el desarrollador "${btn.dataset.name}"?`)) {
          removeDeveloper(btn.dataset.name);
          renderPeopleLists();
          updateAllSelects();
        }
      });
    });
  }
}

function updateAllSelects() {
  // Actualizar select de áreas en formulario
  if (formAreaSelect) {
    const currentValue = formAreaSelect.value;
    formAreaSelect.innerHTML = "";
    const areas = getAreas();
    areas.forEach(area => {
      const option = document.createElement("option");
      option.value = area;
      option.textContent = area;
      formAreaSelect.appendChild(option);
    });
    if (areas.includes(currentValue)) {
      formAreaSelect.value = currentValue;
    }
  }
  
  // Actualizar select de áreas en filtros
  if (filterAreaSelect) {
    const currentValue = filterAreaSelect.value;
    filterAreaSelect.innerHTML = '<option value="">Todas</option>';
    const areas = getAreas();
    areas.forEach(area => {
      const option = document.createElement("option");
      option.value = area;
      option.textContent = area;
      filterAreaSelect.appendChild(option);
    });
    if (areas.includes(currentValue)) {
      filterAreaSelect.value = currentValue;
    }
  }
  
  // Actualizar select de responsables
  if (ownerSelect) {
    const currentValue = ownerSelect.value;
    ownerSelect.innerHTML = '<option value="">Sin asignar</option>';
    const owners = getOwners();
    owners.forEach(owner => {
      const option = document.createElement("option");
      option.value = owner;
      option.textContent = owner;
      ownerSelect.appendChild(option);
    });
    if (owners.includes(currentValue)) {
      ownerSelect.value = currentValue;
    }
  }
  
  // Actualizar select múltiple de desarrolladores
  if (developersSelect) {
    const currentSelected = Array.from(developersSelect.selectedOptions).map(opt => opt.value);
    developersSelect.innerHTML = "";
    const developers = getDevelopers();
    developers.forEach(dev => {
      const option = document.createElement("option");
      option.value = dev;
      option.textContent = dev;
      if (currentSelected.includes(dev)) {
        option.selected = true;
      }
      developersSelect.appendChild(option);
    });
  }
  
  // Actualizar select de "Asignado a" en tareas (responsables + desarrolladores)
  if (taskAssignedToSelect) {
    const currentValue = taskAssignedToSelect.value;
    taskAssignedToSelect.innerHTML = '<option value="">Sin asignar</option>';
    const allPeople = getAllPeople();
    allPeople.forEach(person => {
      const option = document.createElement("option");
      option.value = person;
      option.textContent = person;
      taskAssignedToSelect.appendChild(option);
    });
    if (allPeople.includes(currentValue)) {
      taskAssignedToSelect.value = currentValue;
    }
  }
  
  // Sincronizar áreas con proyectos existentes
  synchronizeAreaOptions(formAreaSelect, filterAreaSelect, projects);
}

function handleSubmit(event) {
  event.preventDefault();

  projects = createProject(new FormData(projectForm), projects);
  updateAllSelects();
  refreshViews();
  resetForm();
}

function handleFiltersChange() {
  filters.search = toSearchableString(filterSearchInput?.value.trim() || "");
  filters.area = filterAreaSelect?.value || "";
  filters.priority = filterPrioritySelect?.value || "";
  filters.status = filterStatusSelect?.value || "";

  refreshViews();
}

function handleClearFilters() {
  if (filtersForm) {
    filtersForm.reset();
  }
  handleFiltersChange();
}

function refreshViews() {
  initializeRender(projects, filters, {
    onStatusUpdate: handleStatusUpdate,
    onMove: handleMoveProject,
    onEdit: editProject,
    onDelete: handleDeleteProject,
    onViewDetail: viewProjectDetail,
  });
  renderBoard(board, document.getElementById("projectCardTemplate"));
  renderList(listBody);
  updateFiltersSummary(filtersSummary);
}

function handleStatusUpdate(projectId, status) {
  projects = updateProjectStatus(projects, projectId, status);
  refreshViews();
}

function handleMoveProject(projectId, direction) {
  projects = moveProject(projects, projectId, direction);
  refreshViews();
}

function handleDeleteProject(projectId) {
  const confirmation = confirm("¿Quieres eliminar este proyecto?");
  if (!confirmation) return;

  projects = deleteProject(projects, projectId);
  refreshViews();
}

function editProject(projectId) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return;

  document.getElementById("projectId").value = project.id;
  document.getElementById("name").value = project.name;
  if (project.area) {
    const existingOption = [...formAreaSelect.options].find(
      (option) => option.value === project.area
    );
    if (existingOption) {
      formAreaSelect.value = project.area;
    } else {
      const option = new Option(project.area, project.area, true, true);
      formAreaSelect.add(option);
      const filterHasArea = [...filterAreaSelect.options].some(
        (option) => option.value === project.area
      );
      if (!filterHasArea) {
        filterAreaSelect.add(new Option(project.area, project.area));
      }
      formAreaSelect.value = project.area;
    }
  } else {
    formAreaSelect.selectedIndex = 0;
  }
  document.getElementById("owner").value = project.owner;
  
  // Seleccionar desarrolladores en el select múltiple
  const developersSelect = document.getElementById("developers");
  if (developersSelect) {
    // Limpiar selecciones previas
    Array.from(developersSelect.options).forEach(option => {
      option.selected = false;
    });
    // Seleccionar los desarrolladores del proyecto
    const projectDevelopers = project.developers || [];
    Array.from(developersSelect.options).forEach(option => {
      if (projectDevelopers.includes(option.value)) {
        option.selected = true;
      }
    });
  }
  
  document.getElementById("estimate").value = project.estimate;
  document.getElementById("points").value = project.points ?? "";
  document.getElementById("startDate").value = project.startDate;
  document.getElementById("endDate").value = project.endDate;
  document.getElementById("priority").value = project.priority;
  document.getElementById("status").value = project.status;
  document.getElementById("description").value = project.description;

  document.getElementById("form-title").textContent = "Editar proyecto";
  cancelEditButton.style.display = "inline-flex";

  // Scroll al formulario
  projectForm.scrollIntoView({ behavior: "smooth", block: "start" });
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

function normalizePriority(value) {
  if (!value) return "media";
  const normalized = String(value).trim().toLowerCase();
  if (normalized.includes("alta")) return "alta";
  if (normalized.includes("media")) return "media";
  if (normalized.includes("baja")) return "baja";
  if (normalized.includes("definir")) return "a-definir";
  return "media";
}

function normalizeStatus(value) {
  if (!value) return "en-analisis";
  const normalized = String(value).trim().toLowerCase();
  if (normalized.includes("termin")) return "terminado";
  if (normalized.includes("desar")) return "en-desarrollo";
  return "en-analisis";
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
      
      // Normalizar datos importados - usar la misma lógica que loadProjects
      if (!Array.isArray(parsed)) {
        alert("El archivo no contiene un array de proyectos válido.");
        return;
      }
      
      // Normalizar cada proyecto
      projects = parsed.map((item) => {
        const id = (item.id || crypto.randomUUID()).toString();
        const name = item.name || item.project || item.Proyecto || item.nombre || "";
        if (!name) return null;
        
        return {
          id,
          name: name.toString().trim(),
          area: String(item.area || "").trim(),
          owner: String(item.owner || item.responsable || "").trim(),
          developers: Array.isArray(item.developers) 
            ? item.developers.map(d => String(d).trim()).filter(Boolean)
            : (typeof item.developers === "string" 
              ? item.developers.split(",").map(d => d.trim()).filter(Boolean)
              : []),
          estimate: String(item.estimate || "").trim(),
          points: item.points ? Number(item.points) : null,
          startDate: /^\d{4}-\d{2}-\d{2}$/.test(item.startDate) ? item.startDate : "",
          endDate: /^\d{4}-\d{2}-\d{2}$/.test(item.endDate) ? item.endDate : "",
          priority: normalizePriority(item.priority || "media"),
          status: normalizeStatus(item.status || "en-analisis"),
          description: String(item.description || "").trim(),
          tasks: Array.isArray(item.tasks) ? item.tasks : [],
        };
      }).filter(Boolean);
      
      saveProjects(projects);
      synchronizeAreaOptions(formAreaSelect, filterAreaSelect, projects);
      refreshViews();
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

// Funciones del modal de detalle del proyecto
function viewProjectDetail(projectId) {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return;

  currentProjectId = projectId;

  // Llenar información del proyecto en el modal
  document.getElementById("modalProjectName").textContent = project.name;
  document.getElementById("modalProjectArea").textContent = project.area || "Sin área";
  document.getElementById("modalProjectOwner").textContent = project.owner || "Sin asignar";
  document.getElementById("modalProjectDescription").textContent =
    project.description || "Sin descripción";

  // Mostrar resumen de tareas
  const summary = getTasksSummary(project);
  const summaryElement = document.getElementById("modalTasksSummary");
  if (summaryElement) {
    summaryElement.innerHTML = `
      <div class="tasks-summary">
        <div class="tasks-summary__item">
          <span class="tasks-summary__label">Total:</span>
          <span class="tasks-summary__value">${summary.total}</span>
        </div>
        <div class="tasks-summary__item">
          <span class="tasks-summary__label">Pendientes:</span>
          <span class="tasks-summary__value">${summary.pending}</span>
        </div>
        <div class="tasks-summary__item">
          <span class="tasks-summary__label">En progreso:</span>
          <span class="tasks-summary__value">${summary.inProgress}</span>
        </div>
        <div class="tasks-summary__item">
          <span class="tasks-summary__label">Hechas:</span>
          <span class="tasks-summary__value">${summary.done}</span>
        </div>
        <div class="tasks-summary__item">
          <span class="tasks-summary__label">Tiempo estimado:</span>
          <span class="tasks-summary__value">${summary.totalEstimatedTime} h</span>
        </div>
      </div>
    `;
  }

  renderTasks();
  projectDetailModal.classList.add("modal--visible");
  if (modalOverlay) {
    modalOverlay.classList.add("modal--visible");
  }
  document.body.style.overflow = "hidden";
}

function closeProjectDetailModal() {
  projectDetailModal.classList.remove("modal--visible");
  if (modalOverlay) {
    modalOverlay.classList.remove("modal--visible");
  }
  document.body.style.overflow = "";
  currentProjectId = null;
  resetTaskForm();
}

function renderTasks() {
  if (!taskList || !currentProjectId) return;

  const project = projects.find((p) => p.id === currentProjectId);
  if (!project) return;

  const tasks = project.tasks || [];

  if (tasks.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        <p>No hay tareas registradas para este proyecto.</p>
        <p>Agrega una nueva tarea usando el formulario de arriba.</p>
      </div>
    `;
    return;
  }

  const taskStatuses = getTaskStatuses();
  taskList.innerHTML = tasks
    .map((task) => {
      const statusLabel = taskStatuses.find((s) => s.key === task.status)?.label || task.status;
      return `
        <div class="task-item" data-task-id="${task.id}">
          <div class="task-item__header">
            <h4 class="task-item__title">${task.title}</h4>
            <select class="task-item__status" data-task-id="${task.id}">
              ${taskStatuses
                .map(
                  (s) =>
                    `<option value="${s.key}" ${s.key === task.status ? "selected" : ""}>${s.label}</option>`
                )
                .join("")}
            </select>
          </div>
          ${task.description ? `<p class="task-item__description">${task.description}</p>` : ""}
          <div class="task-item__meta">
            ${task.assignedTo ? `<span class="badge">Asignado a: ${task.assignedTo}</span>` : ""}
            ${task.estimatedTime ? `<span class="badge">${task.estimatedTime} h</span>` : ""}
          </div>
          <div class="task-item__actions">
            <button class="button button--ghost task-item__edit" data-task-id="${task.id}">
              Editar
            </button>
            <button class="button button--ghost task-item__delete" data-task-id="${task.id}">
              Eliminar
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  // Event listeners para las tareas
  taskList.querySelectorAll(".task-item__status").forEach((select) => {
    select.addEventListener("change", (event) => {
      const taskId = event.target.dataset.taskId;
      const newStatus = event.target.value;
      projects = updateTaskStatus(projects, currentProjectId, taskId, newStatus);
      renderTasks();
      refreshViews();
    });
  });

  taskList.querySelectorAll(".task-item__edit").forEach((button) => {
    button.addEventListener("click", () => {
      editTask(button.dataset.taskId);
    });
  });

  taskList.querySelectorAll(".task-item__delete").forEach((button) => {
    button.addEventListener("click", () => {
      deleteTaskHandler(button.dataset.taskId);
    });
  });
}

function handleTaskSubmit(event) {
  event.preventDefault();

  if (!currentProjectId) return;

  const formData = new FormData(taskForm);
  const taskData = {
    title: formData.get("taskTitle"),
    description: formData.get("taskDescription"),
    assignedTo: formData.get("taskAssignedTo"),
    estimatedTime: formData.get("taskEstimatedTime"),
    status: formData.get("taskStatus"),
  };

  if (currentTaskId) {
    // Editar tarea existente
    projects = updateTask(projects, currentProjectId, currentTaskId, taskData);
  } else {
    // Agregar nueva tarea
    projects = addTask(projects, currentProjectId, taskData);
  }

  renderTasks();
  refreshViews();
  resetTaskForm();
}

function editTask(taskId) {
  const project = projects.find((p) => p.id === currentProjectId);
  if (!project || !project.tasks) return;

  const task = project.tasks.find((t) => t.id === taskId);
  if (!task) return;

  currentTaskId = taskId;
  document.getElementById("taskTitle").value = task.title;
  document.getElementById("taskDescription").value = task.description || "";
  document.getElementById("taskAssignedTo").value = task.assignedTo || "";
  document.getElementById("taskEstimatedTime").value = task.estimatedTime || "";
  document.getElementById("taskStatus").value = task.status;

  if (taskFormTitle) {
    taskFormTitle.textContent = "Editar tarea";
  }
  if (cancelTaskEditButton) {
    cancelTaskEditButton.style.display = "inline-flex";
  }

  // Scroll al formulario
  taskForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteTaskHandler(taskId) {
  const confirmation = confirm("¿Quieres eliminar esta tarea?");
  if (!confirmation) return;

  projects = deleteTask(projects, currentProjectId, taskId);
  renderTasks();
  refreshViews();
}

function resetTaskForm() {
  if (taskForm) {
    taskForm.reset();
  }
  currentTaskId = null;
  if (taskFormTitle) {
    taskFormTitle.textContent = "Nueva tarea";
  }
  if (cancelTaskEditButton) {
    cancelTaskEditButton.style.display = "none";
  }
}
