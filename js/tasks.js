// Módulo de gestión de tareas
import { saveProjects } from "./storage.js";

const taskStatuses = [
  { key: "pendiente", label: "Pendiente" },
  { key: "en-progreso", label: "En progreso" },
  { key: "hecha", label: "Hecha" },
];

export function getTaskStatuses() {
  return taskStatuses;
}

export function addTask(projects, projectId, taskData) {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return projects;

  if (!project.tasks) {
    project.tasks = [];
  }

  const newTask = {
    id: taskData.id || crypto.randomUUID(),
    title: taskData.title.trim(),
    description: taskData.description?.trim() || "",
    assignedTo: taskData.assignedTo?.trim() || "",
    estimatedTime: taskData.estimatedTime ? Number(taskData.estimatedTime) : null,
    status: taskData.status || "pendiente",
  };

  project.tasks.push(newTask);
  saveProjects(projects);
  return projects;
}

export function updateTask(projects, projectId, taskId, taskData) {
  const project = projects.find((p) => p.id === projectId);
  if (!project || !project.tasks) return projects;

  const taskIndex = project.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) return projects;

  project.tasks[taskIndex] = {
    ...project.tasks[taskIndex],
    title: taskData.title.trim(),
    description: taskData.description?.trim() || "",
    assignedTo: taskData.assignedTo?.trim() || "",
    estimatedTime: taskData.estimatedTime ? Number(taskData.estimatedTime) : null,
    status: taskData.status || project.tasks[taskIndex].status,
  };

  saveProjects(projects);
  return projects;
}

export function deleteTask(projects, projectId, taskId) {
  const project = projects.find((p) => p.id === projectId);
  if (!project || !project.tasks) return projects;

  project.tasks = project.tasks.filter((t) => t.id !== taskId);
  saveProjects(projects);
  return projects;
}

export function updateTaskStatus(projects, projectId, taskId, newStatus) {
  const project = projects.find((p) => p.id === projectId);
  if (!project || !project.tasks) return projects;

  const task = project.tasks.find((t) => t.id === taskId);
  if (!task) return projects;

  task.status = newStatus;
  saveProjects(projects);
  return projects;
}

export function getTasksSummary(project) {
  if (!project.tasks || project.tasks.length === 0) {
    return {
      total: 0,
      pending: 0,
      inProgress: 0,
      done: 0,
      totalEstimatedTime: 0,
    };
  }

  return {
    total: project.tasks.length,
    pending: project.tasks.filter((t) => t.status === "pendiente").length,
    inProgress: project.tasks.filter((t) => t.status === "en-progreso").length,
    done: project.tasks.filter((t) => t.status === "hecha").length,
    totalEstimatedTime: project.tasks.reduce((sum, t) => {
      return sum + (t.estimatedTime || 0);
    }, 0),
  };
}

