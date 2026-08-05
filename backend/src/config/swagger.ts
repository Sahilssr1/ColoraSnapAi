export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Calora AI - Enterprise Nutrition & Health Tracking API',
    version: '1.0.0',
    description: `
      # Calora AI API Documentation
      Production-ready REST API for AI food vision recognition, barcode lookup, nutrition logging, analytics, and health goals.
      
      ## Authentication
      All protected endpoints require a Bearer token in the \`Authorization\` header:
      \`Authorization: Bearer <your_access_token>\`
    `,
    contact: {
      name: 'Calora Engineering Support',
      email: 'api@calora.ai',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server',
    },
    {
      url: 'https://api.calora.ai/api/v1',
      description: 'Production Cloud API',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          avatar: { type: 'string', nullable: true },
          height: { type: 'number', description: 'Height in cm' },
          weight: { type: 'number', description: 'Weight in kg' },
          age: { type: 'integer' },
          gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'] },
          goal: { type: 'string', enum: ['LOSE_WEIGHT', 'MAINTAIN', 'GAIN_WEIGHT'] },
          activityLevel: { type: 'string', enum: ['SEDENTARY', 'LIGHT', 'MODERATE', 'VERY_ACTIVE', 'EXTRA_ACTIVE'] },
        },
      },
      Goal: {
        type: 'object',
        properties: {
          targetCalories: { type: 'number', example: 2150 },
          targetProtein: { type: 'number', example: 165 },
          targetCarbs: { type: 'number', example: 210 },
          targetFat: { type: 'number', example: 60 },
          targetWater: { type: 'number', example: 3000 },
          targetFiber: { type: 'number', example: 35 },
          targetSodium: { type: 'number', example: 2300 },
          targetSugar: { type: 'number', example: 45 },
        },
      },
      Food: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Grilled Chicken Breast' },
          brand: { type: 'string', nullable: true },
          barcode: { type: 'string', nullable: true },
          servingSize: { type: 'number', example: 100 },
          servingUnit: { type: 'string', example: 'g' },
          calories: { type: 'number', example: 165 },
          protein: { type: 'number', example: 31 },
          carbs: { type: 'number', example: 0 },
          fat: { type: 'number', example: 3.6 },
          fiber: { type: 'number', example: 0 },
          sugar: { type: 'number', example: 0 },
          sodium: { type: 'number', example: 74 },
          cholesterol: { type: 'number', example: 85 },
          potassium: { type: 'number', example: 256 },
          vitaminA: { type: 'number', example: 6 },
          vitaminC: { type: 'number', example: 0 },
          vitaminD: { type: 'number', example: 0.1 },
          calcium: { type: 'number', example: 15 },
          iron: { type: 'number', example: 1.04 },
          magnesium: { type: 'number', example: 29 },
          zinc: { type: 'number', example: 1.0 },
          omega3: { type: 'number', example: 0.08 },
          glycemicLoad: { type: 'number', example: 0 },
          confidenceScore: { type: 'number', example: 0.98 },
        },
      },
      MealLog: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          mealType: { type: 'string', enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] },
          quantity: { type: 'number', example: 1.5 },
          calories: { type: 'number', example: 247.5 },
          protein: { type: 'number', example: 46.5 },
          carbs: { type: 'number', example: 0 },
          fat: { type: 'number', example: 5.4 },
          date: { type: 'string', format: 'date' },
          food: { $ref: '#/components/schemas/Food' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register new user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  name: { type: 'string' },
                  age: { type: 'integer' },
                  height: { type: 'number' },
                  weight: { type: 'number' },
                  gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'] },
                  goal: { type: 'string', enum: ['LOSE_WEIGHT', 'MAINTAIN', 'GAIN_WEIGHT'] },
                  activityLevel: { type: 'string', enum: ['SEDENTARY', 'LIGHT', 'MODERATE', 'VERY_ACTIVE', 'EXTRA_ACTIVE'] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User successfully created' },
          409: { description: 'Email already in use' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Log in with email & password',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authentication successful, returns tokens and profile' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/google': {
      post: {
        summary: 'Authenticate with Google ID token',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['idToken'],
                properties: {
                  idToken: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  avatar: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'OAuth authentication successful' },
        },
      },
    },
    '/auth/apple': {
      post: {
        summary: 'Authenticate with Apple Identity token',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['identityToken'],
                properties: {
                  identityToken: { type: 'string' },
                  userIdentifier: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Apple OAuth authentication successful' },
        },
      },
    },
    '/scan/image': {
      post: {
        summary: 'AI Vision Food Recognition and Nutrition Estimation',
        tags: ['AI Scanner'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  image: {
                    type: 'string',
                    format: 'binary',
                    description: 'Photo of the meal or food plate',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'AI detected foods, estimated grams, complete 30+ micronutrient breakdown & confidence score',
          },
        },
      },
    },
    '/scan/barcode': {
      post: {
        summary: 'Scan Barcode with OpenFoodFacts & USDA Fallback',
        tags: ['Barcode Scanner'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['barcode'],
                properties: {
                  barcode: { type: 'string', example: '011110001001' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Product found with complete nutritional panel' },
          404: { description: 'Barcode not found; suggest photo scan' },
        },
      },
    },
    '/foods/search': {
      get: {
        summary: 'Search foods by query with autocomplete',
        tags: ['Foods'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Matching foods list' },
        },
      },
    },
    '/meal': {
      post: {
        summary: 'Log a meal entry',
        tags: ['Meals'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['foodId', 'mealType', 'quantity', 'date'],
                properties: {
                  foodId: { type: 'string', format: 'uuid' },
                  mealType: { type: 'string', enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] },
                  quantity: { type: 'number', example: 1.5 },
                  date: { type: 'string', format: 'date', example: '2026-08-04' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Meal logged successfully' },
        },
      },
    },
    '/meal/today': {
      get: {
        summary: "Get today's logged meals and macro totals",
        tags: ['Meals'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Today's meal entries grouped by type" },
        },
      },
    },
    '/dashboard': {
      get: {
        summary: 'Get complete dashboard data (calories remaining, macros, water, insights)',
        tags: ['Dashboard'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'date', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          200: { description: 'Comprehensive dashboard payload' },
        },
      },
    },
    '/analytics': {
      get: {
        summary: 'Get weekly & monthly nutrition trends, macro ratios, and deficiency reports',
        tags: ['Analytics & AI Insights'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'period', in: 'query', schema: { type: 'string', enum: ['week', 'month', 'year'], default: 'week' } },
        ],
        responses: {
          200: { description: 'Deep health analytics' },
        },
      },
    },
  },
};
