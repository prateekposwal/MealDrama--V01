export type HealthCategory =
  | 'whole-grain'
  | 'refined-grain'
  | 'lean-protein'
  | 'red-meat'
  | 'processed-meat'
  | 'healthy-fat'
  | 'unhealthy-fat'
  | 'veg-fruit'
  | 'starchy-veg'
  | 'legume'
  | 'dairy'
  | 'sugary-beverage'
  | 'healthy-beverage'
  | 'fried'
  | 'dessert';

export interface PlateBalanceScore {
  total: number;
  max: number;
  categories: {
    vegFruit: number;
    wholeGrain: number;
    protein: number;
    healthyFat: number;
    limitSugary: number;
    limitRedMeat: number;
  };
  breakdown: string[];
  suggestions: string[];
}


