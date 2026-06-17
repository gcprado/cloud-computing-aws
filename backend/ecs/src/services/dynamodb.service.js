const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || "InventoryItemsECS";

const createItem = async (item) => {
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: item
  });
  
  await dynamo.send(command);
  return item;
};

const listItems = async () => {
  const command = new ScanCommand({
    TableName: TABLE_NAME
  });
  
  const result = await dynamo.send(command);
  return result.Items || [];
};

const getItem = async (id) => {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { id }
  });
  
  const result = await dynamo.send(command);
  return result.Item;
};

const updateItem = async (id, data) => {
  const updateExpression = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};
  
  Object.keys(data).forEach((key, index) => {
    const placeholder = `#field${index}`;
    const valuePlaceholder = `:value${index}`;
    updateExpression.push(`${placeholder} = ${valuePlaceholder}`);
    expressionAttributeNames[placeholder] = key;
    expressionAttributeValues[valuePlaceholder] = data[key];
  });
  
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { id },
    UpdateExpression: `SET ${updateExpression.join(", ")}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW"
  });
  
  const result = await dynamo.send(command);
  return result.Attributes;
};

const deleteItem = async (id) => {
  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { id }
  });
  
  await dynamo.send(command);
  return { id };
};

module.exports = {
  createItem,
  listItems,
  getItem,
  updateItem,
  deleteItem
};
