const listItems = (req, res) => {
  res.status(200).json({
    message: "List items endpoint"
  });
};

const getItem = (req, res) => {
  res.status(200).json({
    message: `Get item ${req.params.id}`
  });
};

const createItem = (req, res) => {
  res.status(201).json({
    message: "Create item endpoint"
  });
};

const updateItem = (req, res) => {
  res.status(200).json({
    message: `Update item ${req.params.id}`
  });
};

const deleteItem = (req, res) => {
  res.status(200).json({
    message: `Delete item ${req.params.id}`
  });
};

module.exports = {
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem
};
