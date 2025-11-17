// Funciones para colapsar/expandir el formulario de proyecto
function initializeProjectFormCollapse() {
  const isCollapsed = localStorage.getItem("projectFormCollapsed") === "true";
  if (isCollapsed && projectForm) {
    projectForm.classList.add("form--collapsed");
    if (toggleProjectFormIcon) {
      toggleProjectFormIcon.textContent = "▶";
    }
  }
}

function handleToggleProjectForm() {
  if (!projectForm) return;
  
  const isCollapsed = projectForm.classList.contains("form--collapsed");
  
  if (isCollapsed) {
    projectForm.classList.remove("form--collapsed");
    if (toggleProjectFormIcon) {
      toggleProjectFormIcon.textContent = "▼";
    }
    localStorage.setItem("projectFormCollapsed", "false");
  } else {
    projectForm.classList.add("form--collapsed");
    if (toggleProjectFormIcon) {
      toggleProjectFormIcon.textContent = "▶";
    }
    localStorage.setItem("projectFormCollapsed", "true");
  }
}

