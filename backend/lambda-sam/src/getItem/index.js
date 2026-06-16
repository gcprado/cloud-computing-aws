const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

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
        message: "ID es obligatorio",
        error: "ID es obligatorio",
        data: null
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
    const result = await dynamo.send(new GetCommand(params));

    // ------------------------------------------------------------
    // 4. Si no existe
    // ------------------------------------------------------------
    if (!result.Item) {
      return response(404, {
        message: "Item no encontrado",
        error: "Item no encontrado",
        data: null
      });
    }

    // ------------------------------------------------------------
    // 5. Respuesta OK
    // ------------------------------------------------------------
    return response(200, {
      message: "Item encontrado",
      data: result.Item
    });

  } catch (error) {

    // ------------------------------------------------------------
    // 6. Manejo de errores
    // ------------------------------------------------------------
    return response(500, {
      message: "Error obteniendo item",
      error: error.message,
      data: null
    });
  }
};
