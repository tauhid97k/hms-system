import { createCategory, deleteCategory, getCategories } from "./categories"
import {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  toggleDepartmentStatus,
} from "./departments"
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
} from "./patients"
import { getVisit } from "./visits"

export const router = {
  categories: {
    get: getCategories,
    create: createCategory,
    delete: deleteCategory,
  },
  departments: {
    getAll: getDepartments,
    getOne: getDepartment,
    create: createDepartment,
    update: updateDepartment,
    delete: deleteDepartment,
    toggleStatus: toggleDepartmentStatus,
  },
  patients: {
    getAll: getPatients,
    getOne: getPatient,
    create: createPatient,
    update: updatePatient,
    delete: deletePatient,
  },
  visits: {
    getOne: getVisit,
  },
}
