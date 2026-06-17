exports.handler = async () => {

  // ------------------------------------------------------------
  // Endpoint de verificación de estado de la API
  // ------------------------------------------------------------
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    body: JSON.stringify({
      message: "API funcionando correctamente",
      data: {
        status: "OK",
        timestamp: new Date().toISOString(),
        service: "inventory-api"
      }
    })
  };

};
