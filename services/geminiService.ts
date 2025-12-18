import { GoogleGenAI } from "@google/genai";
import { Restaurant } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFairness = async (
  name: string,
  cuisine: string,
  timeA: string,
  timeB: string,
  startA: string,
  startB: string
): Promise<string> => {
  try {
    const prompt = `
      Two people are meeting at a restaurant called "${name}" (${cuisine}).
      Person A is coming from "${startA}" and it takes them ${timeA}.
      Person B is coming from "${startB}" and it takes them ${timeB}.
      
      Provide a very short, witty, 1-sentence verdict on the fairness of this commute. 
      If it's fair, cheer them on. If it's unfair, gently tease the person with the shorter commute.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Gemini Error", error);
    return "AI is offline, but the math says: check the times!";
  }
};
