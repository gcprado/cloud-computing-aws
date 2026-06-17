const dynamoService = require("../services/dynamodb.service");
const { validateItem, validateUpdateData } = require("../validators/items.validator");

const listItems = async (req, res) => {
  try {
    const items = await dynamoService.listItems();
    
    res.status(200).json({
      message: "Items listados correctamente",
      data: items
    });
  } catch (error) {
    res.status(500).json({
      message: "Error listando items",
      error: error.message,
      data: null
    });
  }
};

const getItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await dynamoService.getItem(id);
    
    if (!item) {
      return res.status(404).json({
        message: "Item no encontrado",
        error: "Item no encontrado",
        data: null
      });
    }
    
    res.status(200).json({
      message: "Item encontrado",
      data: item
    });
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo item",
      error: error.message,
      data: null
    });
  }
};

const createItem = async (req, res) => {
  try {
    const data = req.body;
    
    const validationError = validateItem(data);
    if (validationError) {
      return res.status(400).json({
        message: "Error de validación",
        error: validationError,
        data: null
      });
    }
    
    const item = {
      id: data.id,
      name: data.name,
      description: data.description,
      quantity: data.quantity,
      weight_kg: data.weight_kg,
      length_cm: data.length_cm,
      width_cm: data.width_cm,
      height_cm: data.height_cm,
      entry_date: data.entry_date,
      exit_date: data.exit_date || null,
      category: data.category,
      warehouse_zone: data.warehouse_zone,
      unit_value: data.unit_value
    };
    
    const createdItem = await dynamoService.createItem(item);
    
    res.status(201).json({
      message: "Item creado correctamente",
      data: createdItem
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creando item",
      error: error.message,
      data: null
    });
  }
};

const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const item = await dynamoService.getItem(id);
    if (!item) {
      return res.status(404).json({
        message: "Item no encontrado",
        error: "Item no encontrado",
        data: null
      });
    }
    
    const validationError = validateUpdateData(data);
    if (validationError) {
      return res.status(400).json({
        message: "Error de validación",
        error: validationError,
        data: null
      });
    }
    
    const updatedItem = await dynamoService.updateItem(id, data);
    
    res.status(200).json({
      message: "Item actualizado correctamente",
      data: updatedItem
    });
  } catch (error) {
    res.status(500).json({
      message: "Error actualizando item",
      error: error.message,
      data: null
    });
  }
};

const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await dynamoService.getItem(id);
    if (!item) {
      return res.status(404).json({
        message: "Item no encontrado",
        error: "Item no encontrado",
        data: null
      });
    }
    
    await dynamoService.deleteItem(id);
    
    res.status(200).json({
      message: "Item eliminado correctamente",
      data: { id }
    });
  } catch (error) {
    res.status(500).json({
      message: "Error eliminando item",
      error: error.message,
      data: null
    });
  }
};

module.exports = {
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem
};
