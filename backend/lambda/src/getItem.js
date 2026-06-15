const AWS = require("aws-sdk");

const dynamo = new AWS.DynamoDB.DocumentClient();

// ------------------------------------------------------------
// 0. Helper de respuesta HTTP
// ------------------------------------------------------------
const response = (statusCode, body) => ({
  statusCode,
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  try {

    // ------------------------------------------------------------
    // 1. Obtener el ID desde la URL
    // ------------------------------------------------------------
    const id = event.pathParameters?.id;

    if (!id) {
      return response(400, {
        message: "ID es obligatorio"
      });
    }

    // ------------------------------------------------------------
    // 2. Configurar consulta a DynamoDB
    // ------------------------------------------------------------
    const params = {
      TableName: process.env.TABLE_NAME,
      Key: { id }
    };

    // ------------------------------------------------------------
    // 3. Buscar item
    // ------------------------------------------------------------
    const result = await dynamo.get(params).promise();

    // ------------------------------------------------------------
    // 4. Si no existe
    // ------------------------------------------------------------
    if (!result.Item) {
      return response(404, {
        message: "Item no encontrado"
      });
    }

    // ------------------------------------------------------------
    // 5. Respuesta OK
    // ------------------------------------------------------------
    return response(200, {
      message: "Item encontrado",
      item: result.Item
    });

  } catch (error) {

    // ------------------------------------------------------------
    // 6. Manejo de errores
    // ------------------------------------------------------------
    return response(500, {
      message: "Error obteniendo item",
      error: error.message
    });
  }
};
