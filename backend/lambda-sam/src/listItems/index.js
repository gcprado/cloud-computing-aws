const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

// ------------------------------------------------------------
// 0. Helper de respuesta HTTP
// ------------------------------------------------------------
const response = (statusCode, body) => ({
  statusCode,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  },
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
    const result = await dynamo.send(new ScanCommand(params));

    // ------------------------------------------------------------
    // 3. Respuesta exitosa
    // ------------------------------------------------------------
    return response(200, {
      message: "Items obtenidos correctamente",
      data: result.Items
    });

  } catch (error) {

    // ------------------------------------------------------------
    // 4. Manejo de errores
    // ------------------------------------------------------------

    console.error("ERROR LIST ITEMS:", error);

    return response(500, {
      message: "Error obteniendo items",
      error: error.message,
      data: null
    });
  }
};
