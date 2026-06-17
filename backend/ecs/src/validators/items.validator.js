const validateItem = (data) => {
  if (!data.id || typeof data.id !== "string") {
    return "El campo 'id' es obligatorio y debe ser string";
  }

  if (!data.name || typeof data.name !== "string") {
    return "El campo 'name' es obligatorio y debe ser string";
  }

  if (data.quantity === undefined || typeof data.quantity !== "number") {
    return "El campo 'quantity' es obligatorio y debe ser number";
  }

  if (data.unit_value !== undefined && typeof data.unit_value !== "number") {
    return "El campo 'unit_value' debe ser number";
  }

  return null;
};

const validateUpdateData = (data) => {
  if (data.name !== undefined && typeof data.name !== "string") {
    return "El campo 'name' debe ser string";
  }

  if (data.quantity !== undefined && typeof data.quantity !== "number") {
    return "El campo 'quantity' debe ser number";
  }

  if (data.unit_value !== undefined && typeof data.unit_value !== "number") {
    return "El campo 'unit_value' debe ser number";
  }

  return null;
};

module.exports = {
  validateItem,
  validateUpdateData
};
