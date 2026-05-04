import { GoogleGenAI, Type } from "@google/genai";
import { Meal, Ingredient } from '../types';

// NOTE: For development, API key is in .env as VITE_GEMINI_API_KEY
// For production, move AI calls to backend to keep key secure
const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || ''
});

export const generateRecipeDetails = async (mealName: string, diet: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
      contents: `Provide a simple 3-step cooking method and exact ingredient list for ${mealName} (${diet}). Keep it brief for a mobile card.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            method: { type: Type.ARRAY, items: { type: Type.STRING } },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.STRING },
                  category: { type: Type.STRING }
                }
              }
            },
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const suggestSubstitute = async (ingredientName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
      contents: `Suggest 2 simple substitutes for ${ingredientName} in Indian cooking. Return just the names separated by comma.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "No suggestion available";
  }
}

export const suggestOverrideMeal = async (
  slot: string,
  reason: string,
  currentDiet: string,
  extraContext: string
) => {
  try {
    const prompt = `Suggest a single meal name for ${slot}. Reason for change: ${reason}. Current household diet context: ${currentDiet}. Additional Info: ${extraContext}. Return JSON with 'name' and 'description'.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || '{"name": "Masala Khichdi", "description": "Comfort food"}');
  } catch (error) {
    console.error("Gemini Override Error", error);
    return { name: "Vegetable Pulao", description: "Quick and easy alternative" };
  }
}

export const getAlternativeMeals = async (slot: string, currentMeal: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
      contents: `Suggest 4 alternative popular ${slot} meals similar to but distinct from "${currentMeal}". Return just a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Alternatives Error", error);
    return ["Paneer Butter Masala", "Aloo Gobi", "Dal Tadka", "Mix Veg"];
  }
}
export const searchMealsAI = async (query: string, slot: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
      contents: `Find 5 popular Indian ${slot} dishes that match the search query "${query}". Return a JSON array of objects with 'name', 'cuisine', and 'image' (use a generic food placeholder URL like https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              cuisine: { type: Type.STRING },
              image: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {

    console.error("Gemini Search Error", error);
    return [];
  }
}

export const getMealsByCategory = async (category: string, slot: string) => {
  // Mocking distinct behaviors for categories with some chaos/randomness or AI later
  // For now, we mix some mock data + AI call if needed.

  // Simple prompt strategy:
  const prompts: { [key: string]: string } = {
    'Wellness': `Suggest 5 healthy, nutrient-dense ${slot} options valid for Indian diet. High protein or fiber.`,
    'Quick': `Suggest 5 ${slot} meals that can be cooked in under 20 minutes.`,
    'Trending': `Suggest 5 trending or popular modern Indian ${slot} dishes.`,
    'ChefSpecial': `Suggest 5 gourmet/restaurant-style ${slot} dishes that are impressive but manageable.`
  };

  const prompt = prompts[category] || `Suggest 5 popular ${slot} dishes.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
      contents: `${prompt} Return JSON array of objects with 'name', 'cuisine', 'calories' (number), 'difficulty' (Easy/Medium/Hard) and 'image' (use generic unsplash food url).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              cuisine: { type: Type.STRING },
              calories: { type: Type.NUMBER },
              difficulty: { type: Type.STRING },
              image: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Gemini Category Error", e);
    return [
      { name: "Khichdi", cuisine: "Indian", calories: 300, difficulty: "Easy" },
      { name: "Upma", cuisine: "South Indian", calories: 250, difficulty: "Easy" }
    ];
  }
};
