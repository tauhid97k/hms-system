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
  getSpecializations,
  getSpecialization,
  createSpecialization,
  updateSpecialization,
  deleteSpecialization,
  toggleSpecializationStatus,
} from "./specializations"
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
} from "./patients"
import {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  toggleDoctorAvailability,
} from "./doctors"
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
  specializations: {
    getAll: getSpecializations,
    getOne: getSpecialization,
    create: createSpecialization,
    update: updateSpecialization,
    delete: deleteSpecialization,
    toggleStatus: toggleSpecializationStatus,
  },
  patients: {
    getAll: getPatients,
    getOne: getPatient,
    create: createPatient,
    update: updatePatient,
    delete: deletePatient,
  },
  doctors: {
    getAll: getDoctors,
    getOne: getDoctor,
    create: createDoctor,
    update: updateDoctor,
    delete: deleteDoctor,
    toggleAvailability: toggleDoctorAvailability,
  },
  visits: {
    getOne: getVisit,
  },
}
