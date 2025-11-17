// Módulo de dashboard y métricas
import { getTasksSummary } from "./tasks.js";
import { getStatuses } from "./people.js";

export function calculateDashboardMetrics(projects) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Obtener estados administrados dinámicamente
  const statuses = getStatuses();
  const statusKeys = statuses.map(s => s.key);
  
  // Identificar el estado "terminado" (puede tener diferentes keys)
  const finishedStatusKey = statuses.find(s => 
    s.key === "terminado" || 
    s.key.includes("termin") || 
    s.label.toLowerCase().includes("termin")
  )?.key || "terminado";
  
  // Métricas generales
  let totalEstimatedHours = 0;
  let totalTaskHours = 0;
  let totalDelayedHours = 0;
  let totalProjects = projects.length;
  
  // Inicializar proyectos por estado dinámicamente
  let projectsByStatus = {};
  statusKeys.forEach(key => {
    projectsByStatus[key] = 0;
  });
  
  // Métricas por desarrollador
  const developerMetrics = {};
  const developerTaskHours = {};
  const developerProjects = {}; // Proyectos asignados a cada desarrollador
  
  // Proyectos con demora
  const delayedProjects = [];
  
  // Nuevas métricas de gestión
  const projectsByArea = {};
  const projectsByPriority = {};
  const upcomingProjects = []; // Proyectos próximos a vencer (7, 15, 30 días)
  const atRiskProjects = []; // Proyectos en riesgo (cerca de fecha límite)
  const incompleteProjects = []; // Proyectos sin información crítica
  const projectsWithoutTasks = [];
  const tasksWithoutAssignee = [];
  const completedProjects = []; // Proyectos terminados
  let totalTasks = 0;
  let projectsWithDates = 0;
  
  projects.forEach((project) => {
    // Contar por estado (incluye todos los estados, incluso si no están en la lista administrada)
    if (project.status) {
      if (projectsByStatus.hasOwnProperty(project.status)) {
        projectsByStatus[project.status]++;
      } else {
        // Si el estado no está en la lista administrada, agregarlo dinámicamente
        projectsByStatus[project.status] = 1;
      }
    }
    
    // Contar por área
    const area = project.area || "Sin área";
    if (!projectsByArea[area]) {
      projectsByArea[area] = { count: 0, hours: 0 };
    }
    projectsByArea[area].count++;
    
    // Contar por prioridad
    const priority = project.priority || "a-definir";
    if (!projectsByPriority[priority]) {
      projectsByPriority[priority] = { count: 0, hours: 0 };
    }
    projectsByPriority[priority].count++;
    
    // Horas estimadas del proyecto
    const projectEstimate = parseFloat(project.estimate) || 0;
    totalEstimatedHours += projectEstimate;
    projectsByArea[area].hours += projectEstimate;
    projectsByPriority[priority].hours += projectEstimate;
    
    // Proyectos terminados (usando el estado identificado dinámicamente)
    if (project.status === finishedStatusKey) {
      completedProjects.push({
        name: project.name,
        area: project.area,
        endDate: project.endDate,
      });
    }
    
    // Proyectos sin tareas
    if (!project.tasks || project.tasks.length === 0) {
      projectsWithoutTasks.push({
        name: project.name,
        area: project.area,
        status: project.status,
      });
    } else {
      totalTasks += project.tasks.length;
      // Tareas sin asignar
      project.tasks.forEach(task => {
        if (!task.assignedTo || task.assignedTo.trim() === "") {
          tasksWithoutAssignee.push({
            projectName: project.name,
            taskTitle: task.title,
            area: project.area,
          });
        }
      });
    }
    
    // Proyectos con fechas
    if (project.startDate || project.endDate) {
      projectsWithDates++;
    }
    
    // Proyectos sin información crítica
    const missingInfo = [];
    if (!project.area || project.area.trim() === "") missingInfo.push("Área");
    if (!project.owner || project.owner.trim() === "") missingInfo.push("Responsable");
    if (!project.developers || project.developers.length === 0) missingInfo.push("Desarrolladores");
    if (!project.estimate || project.estimate.trim() === "") missingInfo.push("Estimación");
    if (!project.startDate || project.startDate.trim() === "") missingInfo.push("Fecha inicio");
    if (!project.endDate || project.endDate.trim() === "") missingInfo.push("Fecha fin");
    
    if (missingInfo.length > 0) {
      incompleteProjects.push({
        name: project.name,
        area: project.area,
        missingInfo: missingInfo,
      });
    }
    
    // Horas de tareas
    if (project.tasks && Array.isArray(project.tasks)) {
      const taskSummary = getTasksSummary(project);
      totalTaskHours += taskSummary.totalEstimatedTime;
      
      // Distribuir horas de tareas por desarrollador
      project.tasks.forEach((task) => {
        if (task.estimatedTime) {
          const assignedTo = task.assignedTo || "";
          if (assignedTo) {
            // Puede haber múltiples desarrolladores separados por comas
            const developers = assignedTo.split(",").map(d => d.trim()).filter(Boolean);
            const hoursPerDev = task.estimatedTime / developers.length;
            developers.forEach(dev => {
              developerTaskHours[dev] = (developerTaskHours[dev] || 0) + hoursPerDev;
              // Agregar proyecto a la lista del desarrollador si no está ya
              if (!developerProjects[dev]) {
                developerProjects[dev] = [];
              }
              if (!developerProjects[dev].includes(project.name)) {
                developerProjects[dev].push(project.name);
              }
            });
          }
        }
      });
    }
    
    // Distribuir horas estimadas del proyecto por desarrollador
    if (project.developers && Array.isArray(project.developers) && project.developers.length > 0) {
      const hoursPerDev = projectEstimate / project.developers.length;
      project.developers.forEach((dev) => {
        developerMetrics[dev] = (developerMetrics[dev] || 0) + hoursPerDev;
        // Agregar proyecto a la lista del desarrollador
        if (!developerProjects[dev]) {
          developerProjects[dev] = [];
        }
        developerProjects[dev].push(project.name);
      });
    }
    
    // Calcular demoras y proyectos próximos a vencer
    if (project.endDate) {
      const endDate = new Date(project.endDate);
      endDate.setHours(0, 0, 0, 0);
      
      if (endDate < today && project.status !== finishedStatusKey) {
        const daysDelayed = Math.ceil((today - endDate) / (1000 * 60 * 60 * 24));
        const delayedHours = daysDelayed * 8; // 8 horas laborales por día
        
        totalDelayedHours += delayedHours;
        delayedProjects.push({
          name: project.name,
          area: project.area,
          endDate: project.endDate,
          daysDelayed: daysDelayed,
          estimatedHours: projectEstimate,
        });
      } else if (endDate >= today && project.status !== finishedStatusKey) {
        const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        
        // Proyectos próximos a vencer (7, 15, 30 días)
        if (daysUntilEnd <= 30) {
          upcomingProjects.push({
            name: project.name,
            area: project.area,
            endDate: project.endDate,
            daysUntilEnd: daysUntilEnd,
            priority: project.priority,
            status: project.status,
          });
        }
        
        // Proyectos en riesgo (menos de 7 días y no terminados)
        if (daysUntilEnd <= 7 && daysUntilEnd > 0) {
          atRiskProjects.push({
            name: project.name,
            area: project.area,
            endDate: project.endDate,
            daysUntilEnd: daysUntilEnd,
            priority: project.priority,
          });
        }
      }
    }
  });
  
  // Combinar horas de proyectos y tareas por desarrollador
  const developerTotalHours = {};
  Object.keys(developerMetrics).forEach(dev => {
    developerTotalHours[dev] = (developerMetrics[dev] || 0) + (developerTaskHours[dev] || 0);
  });
  Object.keys(developerTaskHours).forEach(dev => {
    if (!developerTotalHours[dev]) {
      developerTotalHours[dev] = developerTaskHours[dev];
    }
  });
  
  // Ordenar proyectos próximos a vencer
  upcomingProjects.sort((a, b) => a.daysUntilEnd - b.daysUntilEnd);
  atRiskProjects.sort((a, b) => a.daysUntilEnd - b.daysUntilEnd);
  
  // Calcular promedios
  const avgHoursPerProject = totalProjects > 0 ? totalEstimatedHours / totalProjects : 0;
  const avgTasksPerProject = totalProjects > 0 ? totalTasks / totalProjects : 0;
  
  return {
    totalEstimatedHours,
    totalTaskHours,
    totalHours: totalEstimatedHours + totalTaskHours,
    totalDelayedHours,
    totalProjects,
    totalTasks,
    projectsByStatus,
    projectsByArea,
    projectsByPriority,
    developerMetrics,
    developerTaskHours,
    developerTotalHours,
    developerProjects,
    delayedProjects,
    upcomingProjects,
    atRiskProjects,
    incompleteProjects,
    projectsWithoutTasks,
    tasksWithoutAssignee,
    completedProjects,
    avgHoursPerProject,
    avgTasksPerProject,
    projectsWithDates,
  };
}

export function renderDashboard(containerElement, projects) {
  if (!containerElement) {
    console.warn("Dashboard container not found");
    return;
  }
  
  if (!projects || !Array.isArray(projects)) {
    containerElement.innerHTML = '<div class="empty-state">No hay proyectos para mostrar</div>';
    return;
  }
  
  try {
    const metrics = calculateDashboardMetrics(projects);
    
    containerElement.innerHTML = `
    <!-- Métricas generales -->
    <div class="dashboard__section">
      <h3 class="dashboard__section-title">Métricas Generales</h3>
      <div class="dashboard__metrics-grid">
        <div class="dashboard__metric-card">
          <div class="dashboard__metric-icon">📊</div>
          <div class="dashboard__metric-content">
            <div class="dashboard__metric-label">Total de Proyectos</div>
            <div class="dashboard__metric-value">${metrics.totalProjects}</div>
          </div>
        </div>
        <div class="dashboard__metric-card">
          <div class="dashboard__metric-icon">⏱️</div>
          <div class="dashboard__metric-content">
            <div class="dashboard__metric-label">Horas Estimadas (Proyectos)</div>
            <div class="dashboard__metric-value">${Math.round(metrics.totalEstimatedHours)} h</div>
          </div>
        </div>
        <div class="dashboard__metric-card">
          <div class="dashboard__metric-icon">✅</div>
          <div class="dashboard__metric-content">
            <div class="dashboard__metric-label">Horas Estimadas (Tareas)</div>
            <div class="dashboard__metric-value">${Math.round(metrics.totalTaskHours)} h</div>
          </div>
        </div>
        <div class="dashboard__metric-card">
          <div class="dashboard__metric-icon">📈</div>
          <div class="dashboard__metric-content">
            <div class="dashboard__metric-label">Total de Horas</div>
            <div class="dashboard__metric-value">${Math.round(metrics.totalHours)} h</div>
          </div>
        </div>
        <div class="dashboard__metric-card dashboard__metric-card--warning">
          <div class="dashboard__metric-icon">⚠️</div>
          <div class="dashboard__metric-content">
            <div class="dashboard__metric-label">Horas de Demora</div>
            <div class="dashboard__metric-value">${Math.round(metrics.totalDelayedHours)} h</div>
          </div>
        </div>
        <div class="dashboard__metric-card dashboard__metric-card--danger">
          <div class="dashboard__metric-content">
            <div class="dashboard__metric-label">Proyectos con Demora</div>
            <div class="dashboard__metric-value">${metrics.delayedProjects.length}</div>
          </div>
        </div>
        <div class="dashboard__metric-card">
          <div class="dashboard__metric-icon">📋</div>
          <div class="dashboard__metric-content">
            <div class="dashboard__metric-label">Total de Tareas</div>
            <div class="dashboard__metric-value">${metrics.totalTasks}</div>
          </div>
        </div>
        <div class="dashboard__metric-card">
          <div class="dashboard__metric-icon">📈</div>
          <div class="dashboard__metric-content">
            <div class="dashboard__metric-label">Promedio Horas/Proyecto</div>
            <div class="dashboard__metric-value">${Math.round(metrics.avgHoursPerProject)} h</div>
          </div>
        </div>
        <div class="dashboard__metric-card">
          <div class="dashboard__metric-icon">📝</div>
          <div class="dashboard__metric-content">
            <div class="dashboard__metric-label">Promedio Tareas/Proyecto</div>
            <div class="dashboard__metric-value">${metrics.avgTasksPerProject.toFixed(1)}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Distribución por estado -->
    <div class="dashboard__section">
      <h3 class="dashboard__section-title">Proyectos por Estado</h3>
      <div class="dashboard__status-chart">
        ${(() => {
          const statuses = getStatuses();
          const statusMap = {};
          statuses.forEach(s => {
            statusMap[s.key] = s.label;
          });
          
          return Object.entries(metrics.projectsByStatus)
            .filter(([status, count]) => count > 0) // Solo mostrar estados con proyectos
            .map(([status, count]) => {
              const percentage = metrics.totalProjects > 0 ? (count / metrics.totalProjects) * 100 : 0;
              const statusLabel = statusMap[status] || status;
              return `
                <div class="dashboard__status-item">
                  <div class="dashboard__status-header">
                    <span class="dashboard__status-label">${statusLabel}</span>
                    <span class="dashboard__status-count">${count} proyectos</span>
                  </div>
                  <div class="dashboard__status-bar">
                    <div class="dashboard__status-bar-fill dashboard__status-bar-fill--${status}" style="width: ${percentage}%"></div>
                  </div>
                  <div class="dashboard__status-percentage">${percentage.toFixed(1)}%</div>
                </div>
              `;
            }).join("");
        })()}
      </div>
    </div>
    
    <!-- Horas por desarrollador -->
    <div class="dashboard__section">
      <h3 class="dashboard__section-title">Horas por Desarrollador</h3>
      <div class="dashboard__developers-grid">
        ${Object.keys(metrics.developerTotalHours).length > 0 
          ? Object.entries(metrics.developerTotalHours)
              .sort((a, b) => b[1] - a[1])
              .map(([developer, hours]) => {
                const projectHours = metrics.developerMetrics[developer] || 0;
                const taskHours = metrics.developerTaskHours[developer] || 0;
                const maxHours = Math.max(...Object.values(metrics.developerTotalHours), 1);
                const percentage = maxHours > 0 ? (hours / maxHours) * 100 : 0;
                const projectsList = metrics.developerProjects[developer] || [];
                const projectsTooltip = projectsList.length > 0 
                  ? projectsList.join(", ") 
                  : "Sin proyectos asignados";
                
                return `
                  <div class="dashboard__developer-card">
                    <div class="dashboard__developer-header">
                      <span class="dashboard__developer-name">${developer}</span>
                      <span class="dashboard__developer-hours" title="${projectsTooltip}">${Math.round(hours)} h</span>
                    </div>
                    <div class="dashboard__developer-bar">
                      <div class="dashboard__developer-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="dashboard__developer-details">
                      <span>Proyectos: ${Math.round(projectHours)} h</span>
                      <span>Tareas: ${Math.round(taskHours)} h</span>
                    </div>
                  </div>
                `;
              }).join("")
          : '<p class="dashboard__empty">No hay desarrolladores asignados</p>'}
      </div>
    </div>
    
    <!-- Proyectos con demora -->
    ${metrics.delayedProjects.length > 0 ? `
      <div class="dashboard__section">
        <h3 class="dashboard__section-title">Proyectos con Demora</h3>
        <div class="dashboard__delayed-table">
          <table>
            <thead>
              <tr>
                <th>Proyecto</th>
                <th>Área</th>
                <th>Fecha Fin</th>
                <th>Días de Demora</th>
                <th>Horas Estimadas</th>
              </tr>
            </thead>
            <tbody>
              ${metrics.delayedProjects
                .sort((a, b) => b.daysDelayed - a.daysDelayed)
                .map(project => `
                  <tr>
                    <td>${project.name}</td>
                    <td>${project.area || "-"}</td>
                    <td>${project.endDate ? new Date(project.endDate).toLocaleDateString("es-ES") : "-"}</td>
                    <td class="dashboard__delayed-days">${project.daysDelayed} días</td>
                    <td>${project.estimatedHours || 0} h</td>
                  </tr>
                `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}
    
    <!-- Proyectos próximos a vencer -->
    ${metrics.upcomingProjects.length > 0 ? `
      <div class="dashboard__section">
        <h3 class="dashboard__section-title">Proyectos Próximos a Vencer (30 días)</h3>
        <div class="dashboard__delayed-table">
          <table>
            <thead>
              <tr>
                <th>Proyecto</th>
                <th>Área</th>
                <th>Fecha Fin</th>
                <th>Días Restantes</th>
                <th>Prioridad</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${metrics.upcomingProjects.map(project => `
                <tr>
                  <td>${project.name}</td>
                  <td>${project.area || "-"}</td>
                  <td>${project.endDate ? new Date(project.endDate).toLocaleDateString("es-ES") : "-"}</td>
                  <td class="${project.daysUntilEnd <= 7 ? 'dashboard__delayed-days' : ''}">${project.daysUntilEnd} días</td>
                  <td><span class="badge badge--priority-${project.priority}">${project.priority || "-"}</span></td>
                  <td>${project.status || "-"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}
    
    <!-- Proyectos en riesgo -->
    ${metrics.atRiskProjects.length > 0 ? `
      <div class="dashboard__section">
        <h3 class="dashboard__section-title dashboard__section-title--warning">⚠️ Proyectos en Riesgo (menos de 7 días)</h3>
        <div class="dashboard__delayed-table">
          <table>
            <thead>
              <tr>
                <th>Proyecto</th>
                <th>Área</th>
                <th>Fecha Fin</th>
                <th>Días Restantes</th>
                <th>Prioridad</th>
              </tr>
            </thead>
            <tbody>
              ${metrics.atRiskProjects.map(project => `
                <tr>
                  <td>${project.name}</td>
                  <td>${project.area || "-"}</td>
                  <td>${project.endDate ? new Date(project.endDate).toLocaleDateString("es-ES") : "-"}</td>
                  <td class="dashboard__delayed-days">${project.daysUntilEnd} días</td>
                  <td><span class="badge badge--priority-${project.priority}">${project.priority || "-"}</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}
    
    <!-- Distribución por área -->
    ${Object.keys(metrics.projectsByArea).length > 0 ? `
      <div class="dashboard__section">
        <h3 class="dashboard__section-title">Distribución por Área</h3>
        <div class="dashboard__status-chart">
          ${Object.entries(metrics.projectsByArea)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([area, data]) => {
              const percentage = metrics.totalProjects > 0 ? (data.count / metrics.totalProjects) * 100 : 0;
              return `
                <div class="dashboard__status-item">
                  <div class="dashboard__status-header">
                    <span class="dashboard__status-label">${area}</span>
                    <span class="dashboard__status-count">${data.count} proyectos (${Math.round(data.hours)} h)</span>
                  </div>
                  <div class="dashboard__status-bar">
                    <div class="dashboard__status-bar-fill" style="width: ${percentage}%"></div>
                  </div>
                  <div class="dashboard__status-percentage">${percentage.toFixed(1)}%</div>
                </div>
              `;
            }).join("")}
        </div>
      </div>
    ` : ''}
    
    <!-- Distribución por prioridad -->
    ${Object.keys(metrics.projectsByPriority).length > 0 ? `
      <div class="dashboard__section">
        <h3 class="dashboard__section-title">Distribución por Prioridad</h3>
        <div class="dashboard__status-chart">
          ${Object.entries(metrics.projectsByPriority)
            .map(([priority, data]) => {
              const percentage = metrics.totalProjects > 0 ? (data.count / metrics.totalProjects) * 100 : 0;
              const priorityLabels = {
                "alta": "Alta",
                "media": "Media",
                "baja": "Baja",
                "a-definir": "A Definir",
              };
              return `
                <div class="dashboard__status-item">
                  <div class="dashboard__status-header">
                    <span class="dashboard__status-label">${priorityLabels[priority] || priority}</span>
                    <span class="dashboard__status-count">${data.count} proyectos (${Math.round(data.hours)} h)</span>
                  </div>
                  <div class="dashboard__status-bar">
                    <div class="dashboard__status-bar-fill dashboard__status-bar-fill--${priority}" style="width: ${percentage}%"></div>
                  </div>
                  <div class="dashboard__status-percentage">${percentage.toFixed(1)}%</div>
                </div>
              `;
            }).join("")}
        </div>
      </div>
    ` : ''}
    
    <!-- Proyectos sin información crítica -->
    ${metrics.incompleteProjects.length > 0 ? `
      <div class="dashboard__section">
        <h3 class="dashboard__section-title dashboard__section-title--warning">⚠️ Proyectos con Información Incompleta</h3>
        <div class="dashboard__delayed-table">
          <table>
            <thead>
              <tr>
                <th>Proyecto</th>
                <th>Área</th>
                <th>Información Faltante</th>
              </tr>
            </thead>
            <tbody>
              ${metrics.incompleteProjects.map(project => `
                <tr>
                  <td>${project.name}</td>
                  <td>${project.area || "-"}</td>
                  <td>${project.missingInfo.join(", ")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}
    
    <!-- Proyectos sin tareas -->
    ${metrics.projectsWithoutTasks.length > 0 ? `
      <div class="dashboard__section">
        <h3 class="dashboard__section-title">Proyectos sin Tareas</h3>
        <div class="dashboard__delayed-table">
          <table>
            <thead>
              <tr>
                <th>Proyecto</th>
                <th>Área</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${metrics.projectsWithoutTasks.map(project => `
                <tr>
                  <td>${project.name}</td>
                  <td>${project.area || "-"}</td>
                  <td>${project.status || "-"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}
    
    <!-- Tareas sin asignar -->
    ${metrics.tasksWithoutAssignee.length > 0 ? `
      <div class="dashboard__section">
        <h3 class="dashboard__section-title">Tareas sin Asignar</h3>
        <div class="dashboard__delayed-table">
          <table>
            <thead>
              <tr>
                <th>Tarea</th>
                <th>Proyecto</th>
                <th>Área</th>
              </tr>
            </thead>
            <tbody>
              ${metrics.tasksWithoutAssignee.map(task => `
                <tr>
                  <td>${task.taskTitle}</td>
                  <td>${task.projectName}</td>
                  <td>${task.area || "-"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}
    `;
  } catch (error) {
    console.error("Error rendering dashboard:", error);
    containerElement.innerHTML = `<div class="empty-state">Error al cargar el dashboard: ${error.message}</div>`;
  }
}

