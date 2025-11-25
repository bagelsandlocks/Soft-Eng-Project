import { handler } from "./index.mjs";

const event = {
  shopperID: "123456",
  token: "abcdef-token",
  date: "2025-01-20",
  storeChain: "Walmart",
  store: "Walmart #123",
  receiptName: "Test Receipt"
};

handler(event).then(console.log).catch(console.error);
