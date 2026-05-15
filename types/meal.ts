export type MealType = 'breakfast' | 'lunch' | 'snacks' | 'dinner';

export type Category = 'gravy' | 'roti' | 'rice' | 'sides' | 'beverages';

export interface CategoryOption {
  id: string;
  name: string;
  icon: string;
}

export interface MealCategories {
  gravy: CategoryOption | null;
  roti: CategoryOption | null;
  rice: CategoryOption | null;
  sides: CategoryOption[];
  beverages: CategoryOption[];
}

export interface MealCardData {
  id: string;
  name: string;
  icon: string;
  region: string;
  tags: string[];
  categories: MealCategories;
  availableOptions: Record<Category, CategoryOption[]>;
}

export interface TraySlotItem {
  id: string;
  mealId: string;
  name: string;
  icon: string;
  quantity: number;
  categories: MealCategories;
  availableOptions: Record<Category, CategoryOption[]>;
}

export interface MealSlotState {
  slotKey: string;
  date: string;
  mealType: MealType;
  items: TraySlotItem[];
}
