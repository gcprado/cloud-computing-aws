const express = require("express");
const router = express.Router();

const {
  healthCheck
} = require("../controllers/health.controller");

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Service is healthy
 */

router.get("/", healthCheck);

module.exports = router;
