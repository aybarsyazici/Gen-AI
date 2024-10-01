export type ImprovedRecipe = {
  recipeText: string;
  annotations: { [key: string]: Array<[string, number]> };
  explanations: { [key: string]: string };
};
