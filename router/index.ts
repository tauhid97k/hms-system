import { createCategory, deleteCategory, getCategories } from "./categories";

export const router = {
  categories: {
    get: getCategories,
    create: createCategory,
    delete: deleteCategory,
  },
};
