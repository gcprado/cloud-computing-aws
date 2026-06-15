const AWS = require("aws-sdk");

const dynamo = new AWS.DynamoDB.DocumentClient();

// ------------------------------------------------------------
// 0. Campos permitidos para update (whitelist)
// ------------------------------------------------------------
const allowedFields = [
  "name",
  "description",
  "quantity",
  "weight_kg",
  "length_cm",
  "width_cm",
  "height_cm",
  "entry_date",
  "exit_date",
  "category",
  "warehouse_zone",
  "unit_value"
];

// ------------------------------------------------------------
// 0. Helper response
// ------------------------------------------------------------
const response = (statusCode, body) => ({
  statusCode,
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  try {

    // ------------------------------------------------------------
    // 1. Obtener ID desde la URL
    // ------------------------------------------------------------
    const id = event.pathParameters?.id;

    if (!id) {
      return response(400, {
        message: "El id es obligatorio"
      });
    }

    // ------------------------------------------------------------
    // 2. Leer datos del body
    // ------------------------------------------------------------
    let data;
    try {
      data = JSON.parse(event.body || "{}");
    } catch (parseError) {
      return response(400, {
        message: "Body inválido, debe ser JSON válido",
        error: parseError.message
      });
    }

    // ------------------------------------------------------------
    // 3. Construir UpdateExpression dinámicamente (seguro)
    // ------------------------------------------------------------
    let UpdateExpression = "SET ";
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};

    let hasFields = false;

    const addField = (field, value, useAlias = false) => {
      if (value !== undefined && allowedFields.includes(field)) {

        hasFields = true;

        if (useAlias) {
          UpdateExpression += `#${field} = :${field}, `;
          ExpressionAttributeNames[`#${field}`] = field;
        } else {
          UpdateExpression += `${field} = :${field}, `;
        }

        ExpressionAttributeValues[`:${field}`] = value;
      }
    };

    // ------------------------------------------------------------
    // 4. Mapear campos actualizables
    // ------------------------------------------------------------
    addField("name", data.name, true);
    addField("description", data.description);
    addField("quantity", data.quantity);
    addField("weight_kg", data.weight_kg);
    addField("length_cm", data.length_cm);
    addField("width_cm", data.width_cm);
    addField("height_cm", data.height_cm);
    addField("entry_date", data.entry_date);
    addField("exit_date", data.exit_date);
    addField("category", data.category);
    addField("warehouse_zone", data.warehouse_zone);
    addField("unit_value", data.unit_value);

    // ------------------------------------------------------------
    // 5. Validación: evitar update vacío
    // ------------------------------------------------------------
    if (!hasFields) {
      return response(400, {
        message: "No hay campos válidos para actualizar"
      });
    }

    // quitar última coma y espacio
    UpdateExpression = UpdateExpression.slice(0, -2);

    // ------------------------------------------------------------
    // 6. Parámetros DynamoDB
    // ------------------------------------------------------------
    const params = {
      TableName: process.env.TABLE_NAME,
      Key: { id },

      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,

      ReturnValues: "ALL_NEW"
    };

    // ------------------------------------------------------------
    // 7. Ejecutar update
    // ------------------------------------------------------------
    const result = await dynamo.update(params).promise();

    // ------------------------------------------------------------
    // 8. Respuesta HTTP
    // ------------------------------------------------------------
    return response(200, {
      message: "Item actualizado correctamente",
      item: result.Attributes
    });

  } catch (error) {

    // ------------------------------------------------------------
    // 9. Manejo de errores
    // ------------------------------------------------------------
    console.error("ERROR UPDATE ITEM:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error actualizando item",
        error: error.message
      })
    };
  }
};
