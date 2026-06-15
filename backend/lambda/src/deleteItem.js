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
    // 1. Obtener ID desde la URL
    // ------------------------------------------------------------
    const id = event.pathParameters?.id;

    if (!id) {
      return response(400, {
        message: "ID es obligatorio"
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
    const result = await dynamo.delete({
      ...params,
      ReturnValues: "ALL_OLD"
    }).promise();

    // ------------------------------------------------------------
    // 4. Verificar si el item existía
    // ------------------------------------------------------------
    if (!result.Attributes) {
      return response(404, {
        message: "Item no encontrado"
      });
    }

    // ------------------------------------------------------------
    // 5. Respuesta exitosa
    // ------------------------------------------------------------
    return response(200, {
      message: "Item eliminado correctamente",
      id
    });

  } catch (error) {

    // ------------------------------------------------------------
    // 6. Manejo de errores
    // ------------------------------------------------------------
    return response(500, {
      message: "Error eliminando item",
      error: error.message
    });
  }
};
