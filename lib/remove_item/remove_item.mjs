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
    // Validate input
    if (!event.shopperID || !event.token || !event.receiptID || !event.itemID) {
      throw new Error("shopperID, token, receipt_id, and item_id are required")
    }
    
    const shopperID = event.shopperID
    const token = event.token
    const receipt_id = event.receiptID
    const item_id = event.itemID

    //Verify shopper is logged in
    const verifyCredentials = () => {
      return new Promise((resolve, reject) => {
        const query = `SELECT * FROM Shoppers WHERE id = ? AND credentials = ?`
        pool.query(query, [shopper_id,token], (error, rows) => {
          if (error) {
            reject(new Error("Database error: " + error.sqlMessage))
          } else {
            resolve(rows && rows.length > 0)
          }
        })
      })
    }
    
    // Verify receipt exists
    const verifyReceipt = () => {
      return new Promise((resolve, reject) => {
        const query = `SELECT * FROM Receipts WHERE id = ?`
        pool.query(query, [receipt_id], (error, rows) => {
          if (error) {
            reject(new Error("Database error: " + error.sqlMessage))
          } else {
            resolve(rows && rows.length > 0)
          }
        })
      })
    }

    // Verify item exists in receipt
    const verifyItem = () => {
      return new Promise((resolve, reject) => {
        const query = `SELECT * FROM ReceiptItems WHERE id = ? AND receipt_id = ?`
        pool.query(query, [item_id,receipt_id], (error, rows) => {
          if (error) {
            reject(new Error("Database error: " + error.sqlMessage))
          } else {
            resolve(rows && rows.length > 0)
          }
        })
      })
    }
    
    // Remove item from receipt
    const removeItem = () => {
      return new Promise((resolve, reject) => {
        const query = `DELETE FROM ReceiptItems WHERE receipt_id = ? AND id = ?`
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
  
    const loggedin = await verifyCredentials()
    if (!loggedin){
      throw new Error("Invalid credentials.")
    }

    const receiptExists = await verifyReceipt()
    if (!receiptExists){
      throw new Error("Receipt does not exist.")
    }

    const itemExists = await verifyItem()
    if (!itemExists){
      throw new Error("Item is not in receipt.")
    }
    
    await removeItem()
    
    /*
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

    */
    
    result = {"Item removed successfully"}
    code = 200
    
  } catch (error) {
    result = { error: error.message }
    code = 400
  }
  
  const response = {
    statusCode: code,
    body: JSON.stringify(result)
  }
  
  pool.end()
  return response
}
