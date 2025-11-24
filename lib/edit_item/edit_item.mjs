import mysql from 'mysql2'

export const handler = async (event) => {
  let result
  let code
  
    const pool = mysql.createPool({
        host: process.env.RDS_HOST, 
        user: process.env.RDS_USER, 
        password: process.env.RDS_PASSWORD, 
        database: process.env.RDS_DATABASE
    });

  try {
    if (!event.receiptID || !event.itemID) {
      throw new Error("Missing receiptID or itemID.")
    }
    
    // Validate authentication
    if (!event.shopperID || !event.token) {
      throw new Error("Missing shopperID or token")
    }
    
    const shopperID = event.shopperID
    const token = event.token
    const receiptID = event.receiptID
    const itemID = event.itemID
    const itemName = event.itemName
    const price = event.price ? parseFloat(event.price) : null
    
    const checkReceiptExists = () => {
      return new Promise((resolve, reject) => {
        const query = `
          SELECT r.receipt_id, r.status 
          FROM Receipts r
          JOIN Shoppers s ON r.shopperID = s.shopperID
          WHERE r.receipt_id = ? AND s.shopperID = ? AND s.credential = ?
        `
        pool.query(query, [receiptID, shopperID, token], (error, rows) => {
          if (error) {
            reject(new Error("Database error: " + error.sqlMessage))
          } else if (!rows || rows.length === 0) {
            reject(new Error("Receipt not found."))
          } else {
            resolve(rows[0])
          }
        })
      })
    }
    
    const receipt = await checkReceiptExists()
    
    if (receipt.status !== 'draft') {
      throw new Error("Cannot edit items on a submitted receipt.")
    }
    
    const checkItemExists = () => {
      return new Promise((resolve, reject) => {
        const query = `SELECT * FROM ReceiptItems WHERE receipt_id = ? AND item_id = ?`
        pool.query(query, [receiptID, itemID], (error, rows) => {
          if (error) {
            reject(new Error("Database error: " + error.sqlMessage))
          } else if (!rows || rows.length === 0) {
            reject(new Error("Item not found in this receipt."))
          } else {
            resolve(rows[0])
          }
        })
      })
    }
    
    await checkItemExists()
    
    // Build update query
    let updates = []
    let params = []
    
    if (itemName !== undefined && itemName !== null) {
      updates.push("item_name = ?")
      params.push(itemName)
    }
    
    if (price !== null) {
      updates.push("price_paid = ?")
      params.push(price)
    }
    
    if (updates.length === 0) {
      throw new Error("No fields to update")
    }
    
    params.push(receiptID, itemID)
    
    // Update item
    const updateItem = () => {
      return new Promise((resolve, reject) => {
        const query = `UPDATE ReceiptItems SET ${updates.join(', ')} WHERE receipt_id = ? AND item_id = ?`
        pool.query(query, params, (error, updateResult) => {
          if (error) {
            reject(new Error("Database error: " + error.sqlMessage))
          } else {
            resolve(updateResult)
          }
        })
      })
    }
    
    await updateItem()
    
    // Fetch updated item for response
    const getUpdatedItem = () => {
      return new Promise((resolve, reject) => {
        const query = `SELECT item_id, item_name, price_paid FROM ReceiptItems WHERE receipt_id = ? AND item_id = ?`
        pool.query(query, [receiptID, itemID], (error, rows) => {
          if (error) {
            reject(new Error("Database error: " + error.sqlMessage))
          } else {
            resolve(rows[0])
          }
        })
      })
    }
    
    const updatedItem = await getUpdatedItem()
    
    result = {
      receiptID: receiptID,
      item: {
        itemID: updatedItem.item_id,
        itemName: updatedItem.item_name,
        price: updatedItem.price_paid
      }
    }
    code = 200
    
  } catch (err) {
    // General error catch
    result = {
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
