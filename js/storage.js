// Módulo de almacenamiento - Gestión de localStorage
const STORAGE_KEY = "gestionProjects";
const STORAGE_KEY_METADATA = "gestionProjectsMetadata";
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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    
    // Guardar metadata con timestamp de última actualización
    const metadata = {
      lastUpdate: new Date().toISOString(),
      lastUpdateTimestamp: Date.now(),
      totalProjects: projects.length,
    };
    localStorage.setItem(STORAGE_KEY_METADATA, JSON.stringify(metadata));
    
    return true;
  } catch (error) {
    console.error("Error al guardar proyectos", error);
    return false;
  }
}

export function getMetadata() {
  try {
    const data = localStorage.getItem(STORAGE_KEY_METADATA);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error("Error al obtener metadata", error);
    return null;
  }
}

export function getLastUpdate() {
  const metadata = getMetadata();
  if (metadata && metadata.lastUpdate) {
    return new Date(metadata.lastUpdate);
  }
  return null;
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

  // Si el proyecto ya tiene el formato correcto (tiene id y name), preservar los datos originales
  // Esto evita que se pierdan datos al normalizar proyectos ya guardados
  if (rawProject.id && rawProject.name) {
    // Proyecto ya normalizado, preservar todos los datos
    return {
      id: String(rawProject.id).trim(),
      name: String(rawProject.name).trim(),
      area: String(rawProject.area ?? "").trim(),
      owner: String(rawProject.owner ?? "").trim(),
      developers: Array.isArray(rawProject.developers) 
        ? rawProject.developers.map(d => String(d).trim()).filter(Boolean)
        : (typeof rawProject.developers === "string" && rawProject.developers
          ? rawProject.developers.split(",").map(d => d.trim()).filter(Boolean)
          : []),
      estimate: String(rawProject.estimate ?? "").trim(),
      points: rawProject.points !== null && rawProject.points !== undefined 
        ? Number(rawProject.points) 
        : null,
      startDate: String(rawProject.startDate ?? "").trim(),
      endDate: String(rawProject.endDate ?? "").trim(),
      priority: String(rawProject.priority ?? "media").trim(),
      status: String(rawProject.status ?? "en-analisis").trim(),
      description: String(rawProject.description ?? "").trim(),
      tasks: Array.isArray(rawProject.tasks) ? rawProject.tasks : [],
    };
  }

  // Proyecto sin normalizar, aplicar normalización completa
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

