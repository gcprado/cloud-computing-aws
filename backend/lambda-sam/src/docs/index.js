const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Inventory Lambda API",
    version: "1.0.0",
    description: "Inventory management API running on Lambda"
  },
  paths: {
    "/health": {
      get: {
        summary: "Health check endpoint",
        tags: ["Health"],
        responses: {
          200: {
            description: "Service is healthy"
          }
        }
      }
    },
    "/items": {
      get: {
        summary: "Get all inventory items",
        tags: ["Items"],
        responses: {
          200: {
            description: "List of inventory items"
          }
        }
      },
      post: {
        summary: "Create a new inventory item",
        tags: ["Items"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["id", "name", "quantity"],
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  quantity: { type: "number" },
                  description: { type: "string" },
                  category: { type: "string" },
                  unit_value: { type: "number" }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Item created"
          },
          400: {
            description: "Validation error"
          }
        }
      }
    },
    "/items/{id}": {
      get: {
        summary: "Get an item by ID",
        tags: ["Items"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          200: {
            description: "Item found"
          },
          404: {
            description: "Item not found"
          }
        }
      },
      put: {
        summary: "Update an inventory item",
        tags: ["Items"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object"
              }
            }
          }
        },
        responses: {
          200: {
            description: "Item updated"
          }
        }
      },
      delete: {
        summary: "Delete an inventory item",
        tags: ["Items"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          200: {
            description: "Item deleted"
          }
        }
      }
    }
  }
};

const swaggerUiHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inventory Lambda API - Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        spec: ${JSON.stringify(openApiSpec)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;

exports.handler = async (event) => {
  const path = event.path || event.rawPath || '';
  
  if (path.endsWith('/openapi.json')) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(openApiSpec)
    };
  }
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
      'Access-Control-Allow-Origin': '*'
    },
    body: swaggerUiHtml
  };
};
