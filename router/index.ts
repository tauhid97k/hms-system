import { createCategory, deleteCategory, getCategories } from "./categories";
import {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  toggleDepartmentStatus,
} from "./departments";
import {
  getSpecializations,
  getSpecialization,
  createSpecialization,
  updateSpecialization,
  deleteSpecialization,
  toggleSpecializationStatus,
} from "./specializations";
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
} from "./patients";
import {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  toggleDoctorAvailability,
} from "./doctors";
import {
  getAppointments,
  getAppointment,
  getAppointmentBills,
  getAppointmentEvents,
  getAppointmentPrescriptions,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  callNextPatient,
  getQueue,
} from "./appointments";
import { getBills, getBill, updateBillStatus } from "./bills";

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
  appointments: {
    getAll: getAppointments,
    getOne: getAppointment,
    getBills: getAppointmentBills,
    getEvents: getAppointmentEvents,
    getPrescriptions: getAppointmentPrescriptions,
    create: createAppointment,
    update: updateAppointment,
    updateStatus: updateAppointmentStatus,
    callNextPatient: callNextPatient,
    getQueue: getQueue,
  },
  bills: {
    getAll: getBills,
    getOne: getBill,
    updateStatus: updateBillStatus,
  },
};
