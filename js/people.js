// Módulo de gestión de responsables, desarrolladores y áreas
const STORAGE_KEY_PEOPLE = "gestionPeople";

const DEFAULT_DEVELOPERS = [
  "Diego Gatica",
  "Alan Basualdo",
  "Vicente D'alesandro",
  "Gaspar Diaz"
];

const DEFAULT_OWNERS = [
  "Diego Gatica"
];

const DEFAULT_AREAS = [
  "Comercial",
  "Contabilidad",
  "Finanzas",
  "IT",
  "Logística",
  "Postventa",
  "Todas",
  "CCHH"
];

export function loadPeople() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PEOPLE);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        developers: Array.isArray(parsed.developers) ? parsed.developers : DEFAULT_DEVELOPERS,
        owners: Array.isArray(parsed.owners) ? parsed.owners : DEFAULT_OWNERS,
        areas: Array.isArray(parsed.areas) ? parsed.areas : DEFAULT_AREAS,
      };
    }
    // Si no hay datos guardados, usar valores por defecto
    return {
      developers: [...DEFAULT_DEVELOPERS],
      owners: [...DEFAULT_OWNERS],
      areas: [...DEFAULT_AREAS],
    };
  } catch (error) {
    console.error("Error al cargar personas", error);
    return {
      developers: [...DEFAULT_DEVELOPERS],
      owners: [...DEFAULT_OWNERS],
      areas: [...DEFAULT_AREAS],
    };
  }
}

export function savePeople(people) {
  try {
    localStorage.setItem(STORAGE_KEY_PEOPLE, JSON.stringify(people));
  } catch (error) {
    console.error("Error al guardar personas", error);
  }
}

export function addDeveloper(name) {
  const people = loadPeople();
  const trimmedName = name.trim();
  
  if (!trimmedName || people.developers.includes(trimmedName)) {
    return false;
  }
  
  people.developers.push(trimmedName);
  people.developers.sort();
  savePeople(people);
  return true;
}

export function removeDeveloper(name) {
  const people = loadPeople();
  const index = people.developers.indexOf(name);
  
  if (index === -1) {
    return false;
  }
  
  people.developers.splice(index, 1);
  savePeople(people);
  return true;
}

export function addOwner(name) {
  const people = loadPeople();
  const trimmedName = name.trim();
  
  if (!trimmedName || people.owners.includes(trimmedName)) {
    return false;
  }
  
  people.owners.push(trimmedName);
  people.owners.sort();
  savePeople(people);
  return true;
}

export function removeOwner(name) {
  const people = loadPeople();
  const index = people.owners.indexOf(name);
  
  if (index === -1) {
    return false;
  }
  
  people.owners.splice(index, 1);
  savePeople(people);
  return true;
}

export function getAllPeople() {
  const people = loadPeople();
  // Combinar responsables y desarrolladores, eliminando duplicados
  const all = [...new Set([...people.owners, ...people.developers])];
  return all.sort();
}

export function getDevelopers() {
  return loadPeople().developers;
}

export function getOwners() {
  return loadPeople().owners;
}

export function addArea(name) {
  const people = loadPeople();
  const trimmedName = name.trim();
  
  if (!trimmedName || people.areas.includes(trimmedName)) {
    return false;
  }
  
  people.areas.push(trimmedName);
  people.areas.sort();
  savePeople(people);
  return true;
}

export function removeArea(name) {
  const people = loadPeople();
  const index = people.areas.indexOf(name);
  
  if (index === -1) {
    return false;
  }
  
  people.areas.splice(index, 1);
  savePeople(people);
  return true;
}

export function getAreas() {
  return loadPeople().areas;
}

export function updateArea(oldName, newName) {
  const people = loadPeople();
  const index = people.areas.indexOf(oldName);
  
  if (index === -1) {
    return false;
  }
  
  const trimmedNewName = newName.trim();
  if (!trimmedNewName || people.areas.includes(trimmedNewName)) {
    return false;
  }
  
  people.areas[index] = trimmedNewName;
  people.areas.sort();
  savePeople(people);
  return true;
}

export function updateOwner(oldName, newName) {
  const people = loadPeople();
  const index = people.owners.indexOf(oldName);
  
  if (index === -1) {
    return false;
  }
  
  const trimmedNewName = newName.trim();
  if (!trimmedNewName || people.owners.includes(trimmedNewName)) {
    return false;
  }
  
  people.owners[index] = trimmedNewName;
  people.owners.sort();
  savePeople(people);
  return true;
}

export function updateDeveloper(oldName, newName) {
  const people = loadPeople();
  const index = people.developers.indexOf(oldName);
  
  if (index === -1) {
    return false;
  }
  
  const trimmedNewName = newName.trim();
  if (!trimmedNewName || people.developers.includes(trimmedNewName)) {
    return false;
  }
  
  people.developers[index] = trimmedNewName;
  people.developers.sort();
  savePeople(people);
  return true;
}

