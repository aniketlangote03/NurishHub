/**
 * Swagger / OpenAPI Configuration
 * Auto-generates API documentation from JSDoc comments
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '🍱 Food Donation & Redistribution API',
      version: '1.0.0',
      description: `
## Production-ready REST API for the Food Donation & Redistribution System

### Modules:
- **Authentication** — JWT with refresh tokens, RBAC
- **Donations** — Post, manage, and geo-filter food donations
- **NGO Requests** — NGOs request available donations
- **Pickup** — Assign & track volunteer pickups
- **Matching** — Score-based donor↔NGO↔volunteer matching
- **Chat** — Real-time messaging between users
- **Feedback** — Ratings and reviews
- **Notifications** — In-app + email alerts
- **Analytics** — Platform-wide insights
- **Admin** — Full control dashboard

### Authentication:
Use **Bearer token** in the Authorization header:  
\`Authorization: Bearer <your_access_token>\`
      `,
      contact: {
        name: 'Food Donation System',
        email: 'support@fooddonation.com',
      },
      license: { name: 'MIT' },
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development Server' },
      { url: 'https://your-api.onrender.com', description: 'Production Server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT access token',
        },
      },
      schemas: {
        // ── User ──────────────────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'Arjun Sharma' },
            email: { type: 'string', example: 'arjun@example.com' },
            role: { type: 'string', enum: ['donor', 'ngo', 'volunteer', 'admin'] },
            phone: { type: 'string', example: '+91 98765 43210' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Donation ──────────────────────────────────────────────────────
        Donation: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            foodName: { type: 'string', example: 'Cooked Dal Rice' },
            foodType: { type: 'string', enum: ['cooked_food', 'raw_vegetables', 'fruits', 'grains', 'dairy', 'bakery', 'packaged_food', 'beverages', 'other'] },
            quantity: {
              type: 'object',
              properties: {
                value: { type: 'number', example: 10 },
                unit: { type: 'string', enum: ['kg', 'liters', 'servings', 'packets', 'boxes', 'pieces'] },
              },
            },
            expiryTime: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['available', 'requested', 'assigned', 'picked_up', 'delivered', 'expired', 'cancelled'] },
            location: {
              type: 'object',
              properties: {
                type: { type: 'string', example: 'Point' },
                coordinates: { type: 'array', items: { type: 'number' }, example: [77.5946, 12.9716] },
              },
            },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string', example: 'Bangalore' },
                state: { type: 'string', example: 'Karnataka' },
                pincode: { type: 'string', example: '560001' },
              },
            },
            isVegetarian: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Error Response ────────────────────────────────────────────────
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Something went wrong' },
          },
        },
        // ── Success Response ──────────────────────────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' },
          },
        },
        // ── Pagination ────────────────────────────────────────────────────
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            pages: { type: 'integer' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication & user management' },
      { name: 'Users', description: 'User profile management' },
      { name: 'Donations', description: 'Donation CRUD + geo queries' },
      { name: 'Requests', description: 'NGO donation requests' },
      { name: 'Pickup', description: 'Volunteer pickup tracking' },
      { name: 'Matching', description: 'Smart donor-NGO-volunteer matching' },
      { name: 'Chat', description: 'Real-time messaging' },
      { name: 'Feedback', description: 'Ratings and reviews' },
      { name: 'Notifications', description: 'In-app notifications' },
      { name: 'Admin', description: 'Admin dashboard & analytics' },
    ],
  },
  // Scan these files for @swagger JSDoc comments
  apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Mount Swagger UI on Express app
 * @param {import('express').Application} app
 */
const setupSwagger = (app) => {
  if (process.env.SWAGGER_ENABLED !== 'true') return;

  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: '🍱 Food Donation API Docs',
      customCss: `
        .swagger-ui .topbar { background: linear-gradient(135deg, #16a34a, #15803d); }
        .swagger-ui .topbar .download-url-wrapper { display: none; }
        .swagger-ui .info .title { color: #15803d; }
      `,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
      },
    })
  );

  // Raw JSON spec endpoint
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

module.exports = { setupSwagger, swaggerSpec };
