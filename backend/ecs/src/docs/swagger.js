const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Inventory ECS API",
      version: "1.0.0",
      description: "Inventory management API running on ECS Fargate"
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:3000",
        description: "API Gateway"
      }
    ]
  },

  apis: [
    "./src/routes/*.js"
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
