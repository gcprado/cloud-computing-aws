const AWS = require("aws-sdk");

const dynamo = new AWS.DynamoDB.DocumentClient();

// ------------------------------------------------------------
// 0. Helper de respuesta HTTP
// ------------------------------------------------------------
const response = (statusCode, body) => ({
  statusCode,
  body: JSON.stringify(body)
});

exports.handler = async () => {
  try {

    // ------------------------------------------------------------
    // 1. Parámetros de consulta (leer toda la tabla)
    // ------------------------------------------------------------
    const params = {
      TableName: process.env.TABLE_NAME
    };

    // ------------------------------------------------------------
    // 2. Escanear DynamoDB (equivalente a SELECT *)
    // ------------------------------------------------------------
    const result = await dynamo.scan(params).promise();

    // ------------------------------------------------------------
    // 3. Respuesta exitosa
    // ------------------------------------------------------------
    return response(200, {
      message: "Items obtenidos correctamente",
      items: result.Items
    });

  } catch (error) {

    // ------------------------------------------------------------
    // 4. Manejo de errores
    // ------------------------------------------------------------

    console.error("ERROR LIST ITEMS:", error);

    return response(500, {
      message: "Error obteniendo items",
      error: error.message
    });
  }
};
