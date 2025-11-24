import mysql from 'mysql2'
import crypto from 'crypto'

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
    if (!event.username || !event.store_id) {
      throw new Error("Username and store_id are required")
    }
    
    const username = event.username
    const store_id = event.store_id
    const credentials = event.credentials
    
    // Verify user credentials
    const verifyUser = () => {
      return new Promise((resolve, reject) => {
        const query = "SELECT username FROM Shoppers WHERE username = ? AND credentials = ?"
        pool.query(query, [username, credentials], (error, rows) => {
          if (error) {
            reject(new Error("Database error: " + error.sqlMessage))
          } else if (!rows || rows.length === 0) {
            reject(new Error("Invalid credentials"))
          } else {
            resolve(true)
          }
        })
      })
    }
    
    await verifyUser()
    
    // Create new receipt with UUID
    const receipt_id = crypto.randomUUID()
    
    const createReceipt = () => {
      return new Promise((resolve, reject) => {
        const query = `
          INSERT INTO Receipts (receipt_id, username, store_id, status) 
          VALUES (?, ?, ?, 'draft')
        `
        pool.query(query, [receipt_id, username, store_id], (error, insertResult) => {
          if (error) {
            reject(new Error("Database error: " + error.sqlMessage))
          } else {
            resolve(insertResult)
          }
        })
      })
    }
    
    await createReceipt()
    
    result = {
      statusCode: 200,
      message: "Receipt created successfully",
      receipt_id: receipt_id,
      username: username,
      store_id: store_id,
      status: "draft"
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
