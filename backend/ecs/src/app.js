const express = require("express");
const swaggerUi = require("swagger-ui-express");

const swaggerSpec = require("./docs/swagger");

const healthRoutes = require("./routes/health.routes");
const itemsRoutes = require("./routes/items.routes");

const app = express();

app.use(express.json());

app.use("/health", healthRoutes);
app.use("/items", itemsRoutes);

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

app.get("/openapi.json", (req, res) => {
  res.json(swaggerSpec);
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
