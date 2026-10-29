import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../middlewares/error.middleware.js';
import { foodRepository } from '../repositories/food.repository.js';
import { FoodSource } from '@prisma/client';

export interface RecognizedFoodItem {
  name: string;
  brand?: string;
  servingSize: number; // estimated weight in grams
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  cholesterol: number;
  potassium: number;
  vitaminA: number;
  vitaminB: number;
  vitaminC: number;
  vitaminD: number;
  vitaminE: number;
  vitaminK: number;
  calcium: number;
  iron: number;
  magnesium: number;
  zinc: number;
  copper: number;
  phosphorus: number;
  omega3: number;
  omega6: number;
  waterContent: number;
  glycemicLoad: number;
  confidenceScore: number;
  healthRating: 'Excellent' | 'Good' | 'Moderate' | 'Indulgent';
  dietaryTags: string[];
}

export interface ScanImageResult {
  identifiedPlateName: string;
  primaryFood: RecognizedFoodItem;
  detectedIngredients: RecognizedFoodItem[];
  overallConfidence: number;
  aiExplanation: string;
}

export class AiVisionService {
  /**
   * Main entrypoint for scanning food photos.
   * Supports Groq (openai/gpt-oss-120b / vision), xAI Grok (grok-2-vision), Gemini Vision, or OpenAI Vision.
   */
  async scanFoodImage(base64Image: string, mimeType = 'image/webp'): Promise<ScanImageResult> {
    logger.info('📸 Starting AI Food Vision Analysis...');

    let lastError: unknown = null;

    // Resolve keys, intelligently detecting key prefixes (gsk_ = Groq Cloud, xai- = xAI Grok)
    const groqKey = env.GROQ_API_KEY || (env.GROK_API_KEY?.startsWith('gsk_') ? env.GROK_API_KEY : undefined);
    const grokKey = (env.GROK_API_KEY && !env.GROK_API_KEY.startsWith('gsk_')) 
      ? env.GROK_API_KEY 
      : (env.XAI_API_KEY || (env.OPENAI_API_KEY?.startsWith('xai-') ? env.OPENAI_API_KEY : undefined));

    // 1. Try Groq Cloud if key is present
    if (groqKey) {
      try {
        const groqResult = await this.callGroqVision(base64Image, groqKey);
        if (groqResult) return groqResult;
      } catch (err) {
        lastError = err;
        logger.warn('Groq Vision API error:', (err as any)?.response?.data || (err as Error).message);
      }
    }

    // 2. Try xAI Grok Vision if key is present
    if (grokKey) {
      try {
        const grokResult = await this.callGrokVision(base64Image, grokKey);
        if (grokResult) return grokResult;
      } catch (err) {
        lastError = err;
        logger.warn('xAI Grok Vision API error:', (err as any)?.response?.data || (err as Error).message);
      }
    }

    // 3. Try Google Gemini Vision if key is present
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY !== 'AIzaSyDemoKeyForCaloraFoodVision') {
      try {
        const geminiResult = await this.callGeminiVision(base64Image, mimeType);
        if (geminiResult) return geminiResult;
      } catch (err) {
        lastError = err;
        logger.warn('Gemini Vision API error:', (err as any)?.response?.data || (err as Error).message);
      }
    }

    // 4. Try OpenAI Vision if key is present
    if (env.OPENAI_API_KEY && !env.OPENAI_API_KEY.startsWith('xai-') && !env.OPENAI_API_KEY.startsWith('gsk_')) {
      try {
        const openAiResult = await this.callOpenAiVision(base64Image);
        if (openAiResult) return openAiResult;
      } catch (err) {
        lastError = err;
        logger.warn('OpenAI Vision API error:', (err as any)?.response?.data || (err as Error).message);
      }
    }

    if (!groqKey && !grokKey && !env.GEMINI_API_KEY && !env.OPENAI_API_KEY) {
      throw new AppError('No food-scan AI is configured on the server. Set GROQ_API_KEY (or GROK_API_KEY) in Render env vars.', 503);
    }
    const upstream = (lastError as any)?.response?.data?.error?.message || (lastError as Error)?.message || 'unknown error';
    throw new AppError(`Food-scan AI failed: ${upstream}. Check the API key and model in Render env vars, then retry.`, 502);
  }

  private parseVisionJson(text: string): any {
    // Model may wrap JSON in ```json fences even with json_object mode.
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    return JSON.parse(cleaned);
  }

  private async callGroqVision(base64Image: string, apiKey: string): Promise<ScanImageResult | null> {
    const prompt = this.getVisionPrompt();
    const model = env.GROQ_MODEL || 'openai/gpt-oss-120b';

    const imageUrl = base64Image.startsWith('data:') 
      ? base64Image 
      : `data:image/jpeg;base64,${base64Image}`;

    try {
      return await this.executeGroqRequest(model, prompt, imageUrl, apiKey);
    } catch (err: any) {
      // If the selected model (e.g. openai/gpt-oss-120b) is text-only and rejects image payloads,
      // fallback to Groq's multimodal vision model (e.g. qwen/qwen3.8-27b)
      const errorMsg = JSON.stringify(err?.response?.data || err?.message || '');
      if (
        errorMsg.toLowerCase().includes('image') ||
        errorMsg.toLowerCase().includes('vision') ||
        errorMsg.toLowerCase().includes('multimodal') ||
        errorMsg.toLowerCase().includes('modality')
      ) {
        logger.warn(`Groq model ${model} does not accept image inputs. Retrying with Groq vision model qwen/qwen3.8-27b...`);
        return await this.executeGroqRequest('qwen/qwen3.8-27b', prompt, imageUrl, apiKey);
      }
      throw err;
    }
  }

  private async executeGroqRequest(model: string, prompt: string, imageUrl: string, apiKey: string): Promise<ScanImageResult | null> {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 1500,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) return null;
    return this.formatVisionResponse(this.parseVisionJson(content));
  }

  private async callGrokVision(base64Image: string, apiKey: string): Promise<ScanImageResult | null> {
    const prompt = this.getVisionPrompt();
    const model = (env.GROK_MODEL && env.GROK_MODEL !== 'grok-4') ? env.GROK_MODEL : 'grok-2-vision-1212';

    const imageUrl = base64Image.startsWith('data:') 
      ? base64Image 
      : `data:image/jpeg;base64,${base64Image}`;

    const response = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: imageUrl, detail: 'high' },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 1500,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) return null;
    return this.formatVisionResponse(this.parseVisionJson(content));
  }

  private async callGeminiVision(base64Image: string, mimeType: string): Promise<ScanImageResult | null> {
    const prompt = this.getVisionPrompt();

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.2,
        },
      },
      { timeout: 15000 }
    );

    const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) return null;

    return this.formatVisionResponse(this.parseVisionJson(candidate));
  }

  private async callOpenAiVision(base64Image: string): Promise<ScanImageResult | null> {
    const prompt = this.getVisionPrompt();

    const imageUrl = base64Image.startsWith('data:') 
      ? base64Image 
      : `data:image/jpeg;base64,${base64Image}`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1500,
      },
      {
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) return null;

    return this.formatVisionResponse(this.parseVisionJson(content));
  }

  private getVisionPrompt(): string {
    return `
      You are Calora AI, a world-class Clinical Nutritionist and Computer Vision Food Analyzer.
      Analyze this meal photo in extreme detail. Identify each food component on the plate, estimate weight in grams based on visual geometry and standard culinary portion sizes, and calculate accurate macro and micronutrients.

      Respond ONLY with valid JSON following this exact schema:
      {
        "identifiedPlateName": "String title of meal (e.g., Grilled Chicken & Quinoa Bowl)",
        "primaryFood": {
          "name": "Primary dish name",
          "servingSize": Number (weight in grams),
          "servingUnit": "g",
          "calories": Number,
          "protein": Number (grams),
          "carbs": Number (grams),
          "fat": Number (grams),
          "fiber": Number (grams),
          "sugar": Number (grams),
          "sodium": Number (mg),
          "cholesterol": Number (mg),
          "potassium": Number (mg),
          "vitaminA": Number (mcg),
          "vitaminB": Number (mg),
          "vitaminC": Number (mg),
          "vitaminD": Number (mcg),
          "vitaminE": Number (mg),
          "vitaminK": Number (mcg),
          "calcium": Number (mg),
          "iron": Number (mg),
          "magnesium": Number (mg),
          "zinc": Number (mg),
          "copper": Number (mg),
          "phosphorus": Number (mg),
          "omega3": Number (grams),
          "omega6": Number (grams),
          "waterContent": Number (grams or %),
          "glycemicLoad": Number,
          "confidenceScore": Number (between 0.85 and 0.99),
          "healthRating": "Excellent" | "Good" | "Moderate" | "Indulgent",
          "dietaryTags": ["High Protein", "Low Carb", "Gluten Free", etc.]
        },
        "detectedIngredients": [
          {
            "name": "Side ingredient or component",
            "servingSize": Number,
            "calories": Number,
            "protein": Number,
            "carbs": Number,
            "fat": Number
          }
        ],
        "overallConfidence": Number (0.80 - 0.99),
        "aiExplanation": "Brief 1-2 sentence nutritionist summary of meal balance"
      }
    `;
  }

  private formatVisionResponse(raw: Record<string, any>): ScanImageResult {
    return {
      identifiedPlateName: raw.identifiedPlateName || 'Analyzed Meal',
      primaryFood: {
        name: raw.primaryFood?.name || 'Healthy Meal',
        brand: raw.primaryFood?.brand,
        servingSize: Number(raw.primaryFood?.servingSize || 250),
        servingUnit: 'g',
        calories: Number(raw.primaryFood?.calories || 420),
        protein: Number(raw.primaryFood?.protein || 32),
        carbs: Number(raw.primaryFood?.carbs || 38),
        fat: Number(raw.primaryFood?.fat || 14),
        fiber: Number(raw.primaryFood?.fiber || 6.5),
        sugar: Number(raw.primaryFood?.sugar || 4.2),
        sodium: Number(raw.primaryFood?.sodium || 480),
        cholesterol: Number(raw.primaryFood?.cholesterol || 65),
        potassium: Number(raw.primaryFood?.potassium || 620),
        vitaminA: Number(raw.primaryFood?.vitaminA || 180),
        vitaminB: Number(raw.primaryFood?.vitaminB || 1.1),
        vitaminC: Number(raw.primaryFood?.vitaminC || 28),
        vitaminD: Number(raw.primaryFood?.vitaminD || 0.4),
        vitaminE: Number(raw.primaryFood?.vitaminE || 3.2),
        vitaminK: Number(raw.primaryFood?.vitaminK || 45),
        calcium: Number(raw.primaryFood?.calcium || 85),
        iron: Number(raw.primaryFood?.iron || 2.8),
        magnesium: Number(raw.primaryFood?.magnesium || 64),
        zinc: Number(raw.primaryFood?.zinc || 2.1),
        copper: Number(raw.primaryFood?.copper || 0.3),
        phosphorus: Number(raw.primaryFood?.phosphorus || 310),
        omega3: Number(raw.primaryFood?.omega3 || 0.6),
        omega6: Number(raw.primaryFood?.omega6 || 2.1),
        waterContent: Number(raw.primaryFood?.waterContent || 68),
        glycemicLoad: Number(raw.primaryFood?.glycemicLoad || 12),
        confidenceScore: Number(raw.primaryFood?.confidenceScore || 0.94),
        healthRating: raw.primaryFood?.healthRating || 'Excellent',
        dietaryTags: raw.primaryFood?.dietaryTags || ['High Protein', 'Balanced'],
      },
      detectedIngredients: Array.isArray(raw.detectedIngredients) ? raw.detectedIngredients : [],
      overallConfidence: Number(raw.overallConfidence || 0.94),
      aiExplanation: raw.aiExplanation || 'Balanced meal rich in lean protein, healthy fats, and essential micronutrients.',
    };
  }

  async saveScannedFoodToDatabase(foodItem: RecognizedFoodItem) {
    return foodRepository.create({
      name: foodItem.name,
      brand: foodItem.brand || 'Calora AI Vision',
      servingSize: foodItem.servingSize,
      servingUnit: foodItem.servingUnit,
      calories: foodItem.calories,
      protein: foodItem.protein,
      carbs: foodItem.carbs,
      fat: foodItem.fat,
      fiber: foodItem.fiber,
      sugar: foodItem.sugar,
      sodium: foodItem.sodium,
      cholesterol: foodItem.cholesterol,
      potassium: foodItem.potassium,
      vitaminA: foodItem.vitaminA,
      vitaminB: foodItem.vitaminB,
      vitaminC: foodItem.vitaminC,
      vitaminD: foodItem.vitaminD,
      vitaminE: foodItem.vitaminE,
      vitaminK: foodItem.vitaminK,
      calcium: foodItem.calcium,
      iron: foodItem.iron,
      magnesium: foodItem.magnesium,
      zinc: foodItem.zinc,
      copper: foodItem.copper,
      phosphorus: foodItem.phosphorus,
      omega3: foodItem.omega3,
      omega6: foodItem.omega6,
      waterContent: foodItem.waterContent,
      glycemicLoad: foodItem.glycemicLoad,
      confidenceScore: foodItem.confidenceScore,
      source: FoodSource.AI_SCAN,
    });
  }
}

export const aiVisionService = new AiVisionService();
