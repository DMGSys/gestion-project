// Módulo de gestión de proyectos
import { saveProjects } from "./storage.js";

export const statuses = [
  { key: "en-analisis", label: "En análisis" },
  { key: "en-desarrollo", label: "En desarrollo" },
  { key: "terminado", label: "Terminado" },
];

export function formatDevelopers(value) {
  if (!value) return [];

  // Si es un array (select múltiple), retornarlo directamente
  if (Array.isArray(value)) {
    return value.map((name) => name.trim()).filter(Boolean);
  }

  // Si es string (input de texto o valor único), dividir por comas
  return value
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

export function parsePoints(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function createProject(formData, existingProjects) {
  const id = formData.get("projectId") || crypto.randomUUID();
  // Para select múltiple, usar getAll en lugar de get
  const developers = formData.getAll("developers");
  const ownerValue = formData.get("owner")?.trim() || "";
  
  const project = {
    id,
    name: formData.get("name").trim(),
    area: formData.get("area"),
    owner: ownerValue,
    developers: formatDevelopers(developers),
    estimate: formData.get("estimate")?.trim() || "",
    points: parsePoints(formData.get("points")),
    startDate: sanitizeDate(formData.get("startDate")),
    endDate: sanitizeDate(formData.get("endDate")),
    priority: formData.get("priority"),
    status: formData.get("status"),
    description: formData.get("description")?.trim() || "",
    tasks: [], // Inicializar con array vacío de tareas
  };

  const existingIndex = existingProjects.findIndex((item) => item.id === id);

  if (existingIndex >= 0) {
    // Preservar tareas existentes al editar
    project.tasks = existingProjects[existingIndex].tasks || [];
    existingProjects[existingIndex] = project;
  } else {
    existingProjects.push(project);
  }

  // Verificar que los datos se guarden correctamente
  const saved = saveProjects(existingProjects);
  if (!saved) {
    console.error("Error al guardar proyectos");
  }
  
  return existingProjects;
}

export function updateProjectStatus(projects, projectId, status) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return projects;

  project.status = status;
  saveProjects(projects);
  return projects;
}

export function moveProject(projects, projectId, direction) {
  const index = projects.findIndex((project) => project.id === projectId);
  if (index === -1) return projects;

  const statusIndex = statuses.findIndex((status) => status.key === projects[index].status);
  const newIndex = statusIndex + direction;

  if (newIndex < 0 || newIndex >= statuses.length) return projects;

  projects[index].status = statuses[newIndex].key;
  saveProjects(projects);
  return projects;
}

export function deleteProject(projects, projectId) {
  const filtered = projects.filter((project) => project.id !== projectId);
  saveProjects(filtered);
  return filtered;
}

export function getFilteredProjects(projects, filters) {
  return projects.filter((project) => {
    if (filters.area && project.area !== filters.area) {
      return false;
    }

    if (filters.priority && project.priority !== filters.priority) {
      return false;
    }

    if (filters.status && project.status !== filters.status) {
      return false;
    }

    if (filters.search) {
      const haystack = toSearchableString(
        [
          project.name,
          project.area,
          project.owner,
          project.developers.join(" "),
          project.description,
        ]
          .filter(Boolean)
          .join(" ")
      );

      if (!haystack.includes(filters.search)) {
        return false;
      }
    }

    return true;
  });
}

export function hasActiveFilters(filters) {
  return Boolean(filters.search || filters.area || filters.priority || filters.status);
}

export function toSearchableString(value) {
  return value
    ? value
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
    : "";
}

export function capitalize(value) {
  if (!value) return "";
  const normalized = value.replace(/-/g, " ");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function formatDate(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

export function findStatusLabel(statusKey) {
  return statuses.find((status) => status.key === statusKey)?.label ?? statusKey;
}

function sanitizeDate(value) {
  if (!value) return "";
  const stringValue = value.toString();
  const isValid = /^\d{4}-\d{2}-\d{2}$/.test(stringValue);
  return isValid ? stringValue : "";
}

