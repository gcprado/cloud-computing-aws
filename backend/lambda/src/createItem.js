const AWS = require("aws-sdk");

const dynamo = new AWS.DynamoDB.DocumentClient();

// ------------------------------------------------------------
// 0. Helper de respuesta HTTP
// ------------------------------------------------------------
const response = (statusCode, body) => ({
  statusCode,
  body: JSON.stringify(body)
});

// ------------------------------------------------------------
// 1. Función de validación
// ------------------------------------------------------------
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

exports.handler = async (event) => {
  try {

    // ------------------------------------------------------------
    // 2. Validar body existe
    // ------------------------------------------------------------
    if (!event.body) {
      return response(400, {
        message: "Body requerido"
      });
    }

    // ------------------------------------------------------------
    // 3. Parse seguro del body
    // ------------------------------------------------------------
    let data;

    try {
      data = JSON.parse(event.body);
    } catch (err) {
      return response(400, {
        message: "JSON inválido en el body"
      });
    }

    // ------------------------------------------------------------
    // 4. Validar datos obligatorios
    // ------------------------------------------------------------
    const error = validateItem(data);

    if (error) {
      return response(400, {
        message: "Error de validación",
        error
      });
    }

    // ------------------------------------------------------------
    // 5. Crear item
    // ------------------------------------------------------------
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

    // ------------------------------------------------------------
    // 6. Guardar en DynamoDB
    // ------------------------------------------------------------
    try {
      await dynamo.put({
        TableName: process.env.TABLE_NAME,
        Item: item
      }).promise();

    } catch (dbError) {
      return response(500, {
        message: "Error guardando en DynamoDB",
        error: dbError.message
      });
    }

    // ------------------------------------------------------------
    // 7. Respuesta exitosa
    // ------------------------------------------------------------
    return response(201, {
      message: "Item creado correctamente",
      item
    });

  } catch (error) {

    // ------------------------------------------------------------
    // 8. Error inesperado
    // ------------------------------------------------------------
    return response(500, {
      message: "Error creando item",
      error: error.message
    });
  }
};
