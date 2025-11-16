import {
  callNextPatient,
  createAppointment,
  getAppointment,
  getAppointmentBills,
  getAppointmentEvents,
  getAppointmentPrescriptions,
  getAppointments,
  getQueue,
  updateAppointment,
  updateAppointmentStatus,
} from "./appointments";
import { getBill, getBills, updateBillStatus } from "./bills";
import { createCategory, deleteCategory, getCategories } from "./categories";
import {
  createDepartment,
  deleteDepartment,
  getDepartment,
  getDepartments,
  toggleDepartmentStatus,
  updateDepartment,
} from "./departments";
import {
  createDoctor,
  deleteDoctor,
  getDoctor,
  getDoctors,
  toggleDoctorAvailability,
  updateDoctor,
} from "./doctors";
import { getMedicineInstructions } from "./medicineInstructions";
import { getMedicine, getMedicines } from "./medicines";
import {
  createPatient,
  deletePatient,
  getPatient,
  getPatients,
  updatePatient,
} from "./patients";
import {
  createPrescription,
  getPrescriptionByAppointment,
  getPrescriptionsByPatient,
} from "./prescriptions";
import {
  createSpecialization,
  deleteSpecialization,
  getSpecialization,
  getSpecializations,
  toggleSpecializationStatus,
  updateSpecialization,
} from "./specializations";

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
  medicines: {
    getAll: getMedicines,
    getOne: getMedicine,
  },
  medicineInstructions: {
    getAll: getMedicineInstructions,
  },
  prescriptions: {
    create: createPrescription,
    getByAppointment: getPrescriptionByAppointment,
    getByPatient: getPrescriptionsByPatient,
  },
};
