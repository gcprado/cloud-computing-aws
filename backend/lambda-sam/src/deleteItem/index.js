const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

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
    // 1. Obtener ID desde la URL
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
    // 2. Parámetros de borrado
    // ------------------------------------------------------------
    const params = {
      TableName: process.env.TABLE_NAME,
      Key: { id }
    };

    // ------------------------------------------------------------
    // 3. Ejecutar DELETE en DynamoDB (con retorno)
    // ------------------------------------------------------------
    const result = await dynamo.send(new DeleteCommand({
      ...params,
      ReturnValues: "ALL_OLD"
    }));

    // ------------------------------------------------------------
    // 4. Verificar si el item existía
    // ------------------------------------------------------------
    if (!result.Attributes) {
      return response(404, {
        message: "Item no encontrado",
        error: "Item no encontrado",
        data: null
      });
    }

    // ------------------------------------------------------------
    // 5. Respuesta exitosa
    // ------------------------------------------------------------
    return response(200, {
      message: "Item eliminado correctamente",
      data: { id }
    });

  } catch (error) {

    // ------------------------------------------------------------
    // 6. Manejo de errores
    // ------------------------------------------------------------
    return response(500, {
      message: "Error eliminando item",
      error: error.message,
      data: null
    });
  }
};
