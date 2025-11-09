import { createCategory, deleteCategory, getCategories } from "./categories"
import {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  toggleDepartmentStatus,
} from "./departments"

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
}
