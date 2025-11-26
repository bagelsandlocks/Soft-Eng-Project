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
    if (!event.receiptID || !event.id) {
      throw new Error("receiptID and id are required")
    }
    
    const shopperID = event.shopperID
    const token = event.token
    const receiptID = event.receiptID
    const id = event.id
    const name = event.name
    const category = event.category
    const price = event.price !== undefined ? parseFloat(event.price) : null
    const quantity = event.quantity !== undefined ? parseInt(event.quantity) : null
    
    if (price !== null && isNaN(price)) {
      throw new Error("Price must be a valid number")
    }

    if (quantity !== null && isNaN(quantity)) {
      throw new Error("Quantity must be a valid number")
    }
    
    // Check if shopper is logged in
    const checkCredentials = () => {
      return new Promise((resolve, reject) => {
        const checkQuery = "SELECT * FROM Shoppers WHERE id = ? AND credentials = ?"
        pool.query(checkQuery, [shopperID, token], (error, rows) => {
          if (error) {
            reject(new Error("Database error: " + error.sqlMessage))
          } else {
            resolve(rows && rows.length > 0)
          }
        })
      })
    }

    //Check if receipt exists
    const checkReceipt = () => {
      return new Promise((resolve, reject) => {
        const checkQuery = "SELECT * FROM Receipts WHERE id = ?"
        pool.query(checkQuery, [receiptID], (error, rows) => {
          if (error) {
            reject(new Error("Database error: " + error.sqlMessage))
          } else {
            resolve(rows && rows.length > 0)
          }
        })
      })
    }

    //Check if item exists in receipt
    const checkItem = () => {
      return new Promise((resolve, reject) => {
        const checkQuery = "SELECT * FROM ReceiptItems WHERE id = ? AND receipt_id = ?"
        pool.query(checkQuery, [id, receiptID], (error, rows) => {
          if (error) {
            reject(new Error("Database error: " + error.sqlMessage))
          } else {
            resolve(rows && rows.length > 0)
          }
        })
      })
    }
    
    // Update item
    const updateItem = () => {
      return new Promise((resolve, reject) => {
        let updates = []
        let params = []
        
        if (name !== undefined && name !== null) {
          updates.push("name = ?")
          params.push(name)
        }
        
        if (category !== undefined && category !== null) {
          updates.push("category = ?")
          params.push(category)
        }
        
        if (quantity !== null) {
          updates.push("quantity = ?")
          params.push(quantity)
        }
        
        if (price !== null) {
          updates.push("price = ?")
          params.push(price)
        }
        
        if (updates.length === 0) {
          reject(new Error("No fields to update"))
          return
        }
        
        params.push(id, receiptID)
        
        const updateQuery = `UPDATE ReceiptItems SET ${updates.join(', ')} WHERE id = ? AND receipt_id = ?`
        pool.query(updateQuery, params, (error, updateResult) => {
          if (error) {
            reject(new Error("Database error: " + error.sqlMessage))
          } else {
            resolve(updateResult)
          }
        })
      })
    }
    
    // Check if shopper is logged in
    const loggedin = await checkCredentials()
    if (!loggedin) {
      throw new Error("Invalid credentials")
    }

    // Check if receipt exists
    const receiptExists = await checkReceipt()
    if (!receiptExists) {
        throw new Error("Receipt not found")
    }

    // Check if item exists
    const itemExists = await checkItem()
    if (!itemExists) {
        throw new Error("Item not found in receipt")
    }
    
    // Update the item
    await updateItem()
    
    result = { message: "Item with ID '" + id + "' was successfully updated in receipt " + receiptID}
    code = 200
    
  } catch (error) {
    result = { error: error.message }  
    code = 400
  }
  
  const response = {
    statusCode: code,
    body: JSON.stringify(result),
  }
  
  pool.end()     // close DB connections
  return response
}
