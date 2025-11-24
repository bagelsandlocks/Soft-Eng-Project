import mysql from 'mysql2'

export const handler = async (event) => {
  let result
  let code
  
  // specify credentials 
  var pool = mysql.createPool({
    host: process.env.RDS_HOST,
    user: process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DATABASE
  })

  try {
    // Validate input
    if (!event.receipt_id || !event.item_id || !event.quantity || !event.price_paid) {
      throw new Error("receipt_id, item_id, quantity, and price_paid are required")
    }
    
    const receipt_id = event.receipt_id
    const item_id = event.item_id
    const quantity = parseInt(event.quantity)
    const price_paid = parseFloat(event.price_paid)
    const credentials = event.credentials
    const username = event.username
    
    // Verify receipt exists and belongs to user
    const verifyReceipt = () => {
      return new Promise((resolve, reject) => {
        const query = `
          SELECT r.receipt_id, r.status 
          FROM Receipts r
          JOIN Shoppers s ON r.username = s.username
          WHERE r.receipt_id = ? AND s.username = ? AND s.credentials = ?
        `
        pool.query(query, [receipt_id, username, credentials], (error, rows) => {
          if (error) {
            reject(new Error("Database error: " + error.sqlMessage))
          } else if (!rows || rows.length === 0) {
            reject(new Error("Receipt not found or unauthorized"))
          } else if (rows[0].status !== 'draft') {
            reject(new Error("Cannot modify submitted receipt"))
          } else {
            resolve(true)
          }
        })
      })
    }
    
    await verifyReceipt()
    
    // Add item to receipt
    const addItem = () => {
      return new Promise((resolve, reject) => {
        const query = `
          INSERT INTO ReceiptItems (receipt_id, item_id, quantity, price_paid) 
          VALUES (?, ?, ?, ?)
        `
        pool.query(query, [receipt_id, item_id, quantity, price_paid], (error, insertResult) => {
          if (error) {
            reject(new Error("Database error: " + error.sqlMessage))
          } else {
            resolve(insertResult)
          }
        })
      })
    }
    
    await addItem()
    
    // Update receipt total
    const updateTotal = () => {
      return new Promise((resolve, reject) => {
        const query = `
          UPDATE Receipts 
          SET total_amount = (
            SELECT SUM(quantity * price_paid) 
            FROM ReceiptItems 
            WHERE receipt_id = ?
          )
          WHERE receipt_id = ?
        `
        pool.query(query, [receipt_id, receipt_id], (error, updateResult) => {
          if (error) {
            reject(new Error("Database error: " + error.sqlMessage))
          } else {
            resolve(updateResult)
          }
        })
      })
    }
    
    await updateTotal()
    
    result = {
      statusCode: 200,
      message: "Item added to receipt successfully",
      receipt_id: receipt_id,
      item_id: item_id,
      quantity: quantity,
      price_paid: price_paid
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
