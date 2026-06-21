const express = require("express");
const swaggerUi = require("swagger-ui-express");

const swaggerSpec = require("./docs/swagger");

const healthRoutes = require("./routes/health.routes");
const itemsRoutes = require("./routes/items.routes");

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use("/health", healthRoutes);
app.use("/items", itemsRoutes);

const swaggerHtml = swaggerUi.generateHTML(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }'
});

app.get("/docs", (req, res) => {
  res.send(swaggerHtml);
});

app.get("/docs/", (req, res) => {
  res.send(swaggerHtml);
});

app.use("/docs", swaggerUi.serveFiles(swaggerSpec, {}));

app.get("/openapi.json", (req, res) => {
  res.json(swaggerSpec);
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
