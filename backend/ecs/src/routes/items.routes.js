const express = require("express");

const router = express.Router();

const {
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem
} = require("../controllers/items.controller");

/**
 * @openapi
 * /items:
 *   get:
 *     summary: Get all inventory items
 *     tags:
 *       - Items
 *     responses:
 *       200:
 *         description: List of inventory items
 */
router.get("/", listItems);

/**
 * @openapi
 * /items/{id}:
 *   get:
 *     summary: Get an item by ID
 *     tags:
 *       - Items
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item found
 *       404:
 *         description: Item not found
 */
router.get("/:id", getItem);

/**
 * @openapi
 * /items:
 *   post:
 *     summary: Create a new inventory item
 *     tags:
 *       - Items
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Item created
 *       400:
 *         description: Validation error
 */
router.post("/", createItem);

/**
 * @openapi
 * /items/{id}:
 *   put:
 *     summary: Update an inventory item
 *     tags:
 *       - Items
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Item updated
 */
router.put("/:id", updateItem);

/**
 * @openapi
 * /items/{id}:
 *   delete:
 *     summary: Delete an inventory item
 *     tags:
 *       - Items
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item deleted
 */
router.delete("/:id", deleteItem);

module.exports = router;
