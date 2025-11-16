// Módulo de almacenamiento - Gestión de localStorage
const STORAGE_KEY = "gestionProjects";
const DATA_URL = "data/projects.json";

export async function loadProjects() {
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

export function getStoredProjects() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : [];
    return normalizeImportedData(parsed);
  } catch (error) {
    console.error("No se pudieron parsear los proyectos almacenados", error);
    return [];
  }
}

export function saveProjects(projects) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
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
  
  // Normalizar tareas - asegurar que siempre sea un array
  const tasks = normalizeTasks(rawProject.tasks || []);

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
    tasks,
  };
}

function normalizeTasks(tasks) {
  if (!Array.isArray(tasks)) {
    return [];
  }

  return tasks.map((task) => {
    if (typeof task !== "object" || !task) {
      return null;
    }

    return {
      id: task.id || crypto.randomUUID(),
      title: String(task.title || "").trim(),
      description: String(task.description || "").trim(),
      assignedTo: String(task.assignedTo || "").trim(),
      estimatedTime: typeof task.estimatedTime === "number" ? task.estimatedTime : null,
      status: normalizeTaskStatus(task.status),
    };
  }).filter(Boolean);
}

function normalizeTaskStatus(value) {
  if (!value) return "pendiente";
  const normalized = value.toString().trim().toLowerCase();
  
  if (normalized.includes("progreso") || normalized.includes("proceso")) return "en-progreso";
  if (normalized.includes("hecha") || normalized.includes("complet")) return "hecha";
  return "pendiente";
}

function normalizeDevelopers(value) {
  if (Array.isArray(value)) {
    return value.map((item) => item.toString().trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
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
  if (!value) return "en-analisis";
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

