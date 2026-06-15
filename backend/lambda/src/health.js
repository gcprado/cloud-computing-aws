exports.handler = async () => {

  // ------------------------------------------------------------
  // Endpoint de verificación de estado de la API
  // ------------------------------------------------------------
  return {
    statusCode: 200,
    body: JSON.stringify({
      status: "OK",
      message: "API funcionando correctamente",
      timestamp: new Date().toISOString(),
      service: "inventory-api"
    })
  };

};
