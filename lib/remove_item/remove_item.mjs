import mysql from 'mysql2'

export const handler = async (event) => {
  let result
  let code
  
  var pool = mysql.createPool({
    host: "shopcompdb.cqbii0agmq6k.us-east-1.rds.amazonaws.com",
    user: "ShopCompAdmin",
    password: "ShopComp:pass",
    database: "ShopComp"
  })

  try {
    // Validate input
    if (!event.shopperID || !event.token || !event.receipt_id || !event.item_id) {
      throw new Error("shopperID, token, receipt_id, and item_id are required")
    }
    
    const shopperID = event.shopperID
    const token = event.token
    const receipt_id = event.receipt_id
    const item_id = event.item_id
    
    // Verify receipt belongs to user and is draft
    const verifyReceipt = () => {
      return new Promise((resolve, reject) => {
        const query = `
          SELECT r.receipt_id, r.status 
          FROM Receipts r
          JOIN Shoppers s ON r.shopper_id = s.shopperID
          WHERE r.receipt_id = ? AND s.shopperID = ? AND s.credentials = ? AND r.status = 'draft'
        `
        pool.query(query, [receipt_id, shopperID, token], (error, rows) => {
          if (error) {
            reject(new Error("Database error: " + error.sqlMessage))
          } else if (!rows || rows.length === 0) {
            reject(new Error("Receipt not found or unauthorized"))
          } else {
            resolve(true)
          }
        })
      })
    }
    
    await verifyReceipt()
    
    // Remove item from receipt
    const removeItem = () => {
      return new Promise((resolve, reject) => {
        const query = `DELETE FROM ReceiptItems WHERE receipt_id = ? AND item_id = ?`
        pool.query(query, [receipt_id, item_id], (error, deleteResult) => {
          if (error) {
            reject(new Error("Database error: " + error.sqlMessage))
          } else if (deleteResult.affectedRows === 0) {
            reject(new Error("Item not found in receipt"))
          } else {
            resolve(deleteResult)
          }
        })
      })
    }
    
    await removeItem()
    
    // Update receipt total
    const updateTotal = () => {
      return new Promise((resolve, reject) => {
        const query = `
          UPDATE Receipts 
          SET total_amount = (SELECT COALESCE(SUM(quantity * price_paid), 0) FROM ReceiptItems WHERE receipt_id = ?)
          WHERE receipt_id = ?
        `
        pool.query(query, [receipt_id, receipt_id], (error) => {
          if (error) {
            reject(new Error("Database error: " + error.sqlMessage))
          } else {
            resolve()
          }
        })
      })
    }
    
    await updateTotal()
    
    result = {
      statusCode: 200,
      message: "Item removed successfully"
    }
    code = 200
    
  } catch (err) {
    result = {
      statusCode: 400,
      error: err.message
    }
    code = 400
  } finally {
    pool.end()
  }
  
  const response = {
    statusCode: code,
    body: JSON.stringify(result)
  }
  
  return response
}
