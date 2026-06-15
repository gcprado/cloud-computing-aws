exports.handler = async () => {

  // ------------------------------------------------------------
  // Endpoint de verificación de estado de la API
  // ------------------------------------------------------------
  return {
    statusCode: 200,
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
