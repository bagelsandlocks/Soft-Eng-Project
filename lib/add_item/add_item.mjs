import mysql from 'mysql2'

export const handler = async (event) => {
  let result
  let code
  
 // specify credentials 
  var pool = mysql.createPool({
      host: 	process.env.RDS_HOST,
      user: 	process.env.RDS_USER,
      password: process.env.RDS_PASSWORD,
      database: process.env.RDS_DATABASE
  })

  try {
    // Validate input
    if (!event.name || !event.id || !event.category || !event.price || !event.quantity) {
      throw new Error("All fields are required")
    }
    
    const shopperID = event.shopperID
    const token = event.token
    const receiptID = event.receiptID
    const id = event.id
    const name = event.name
    const category = event.category
    const price = parseFloat(event.price)
    const quantity = parseInt(event.quantity)
    
    if (isNaN(price)) {
      throw new Error("Price must be a valid number")
    }

    if (isNaN(quantity)) {
      throw new Error("Quantity must be a valid number")
    }
    
    // Check if shopper is logged in
    const checkCredentials = () => {
      return new Promise((resolve, reject) => {
        const checkQuery = "SELECT * FROM Shoppers WHERE id = ? AND credentials = ?"
        pool.query(checkQuery, [shopperID,token], (error, rows) => {
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

    //Check if item already exists in receipt
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
    
    // Insert new item
    const insertItem = () => {
      return new Promise((resolve, reject) => {
        const insertQuery = "INSERT INTO ReceiptItems (id, name, category, quantity, price, receipt_id) VALUES (?, ?, ?, ?, ?, ?)"
        pool.query(insertQuery, [crypto.randomUUID(), name, category, quantity, price, receiptID], (error, insertResult) => {
          if (error) {
            reject(new Error("Database error: " + error.sqlMessage))
          } else {
            resolve(insertResult)
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

    // Check if item already exists
    const itemExists = await checkItem()
    if (itemExists) {
        throw new Error("Item already exists in receipt")
    }
    
    // Insert the new item
    await insertItem()
    
    result = { message: "Item '" + name + "' was successfully added to receipt " + receiptID}
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