const healthCheck = (req, res) => {
  res.status(200).json({
    data: {
      status: "OK"
    }
  });
};

module.exports = {
  healthCheck
};