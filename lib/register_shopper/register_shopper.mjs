import mysql from 'mysql2'

export const handler = async (event) => {
  let result
  let code
  

    // Parse JSON body from API Gateway
  let body = {};
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }
  
 // specify credentials 
  var pool = mysql.createPool({
      host: 	process.env.RDS_HOST,
      user: 	process.env.RDS_USER,
      password: process.env.RDS_PASSWORD,
      database: process.env.RDS_DATABASE
  })

  try {

    const username = event.username
    const password = event.password

    if (!username || !password) {
      throw new Error("Both username and password are required");
    }
    

    
    // Check if shopper already exists
    const checkExists = () => {
      return new Promise((resolve, reject) => {
        const checkQuery = "SELECT * FROM Shoppers WHERE username = ?"

        pool.query(checkQuery, [username], (error, rows) => {
          if (error) {
            reject(new Error("Database error: " + error.sqlMessage))
          } else {
            resolve(rows && rows.length > 0)
          }
        })
      })
    }
    
    // Insert new shopper
    const insertConstant = () => {
      return new Promise((resolve, reject) => {
        const insertQuery = "INSERT INTO Shoppers (username, password) VALUES (?, ?)"
        pool.query(insertQuery, [username, password], (error, insertResult) => {
          if (error) {
            reject(new Error("Database error: " + error.sqlMessage))
          } else {
            resolve(insertResult)
          }
        })
      })
    }
    
    // Check if shopper exists first
    const exists = await checkExists()
    if (exists) {
      pool.end()     // close DB connections
      throw new Error("Shopper with username '" + username + "' already exists")
    }
    
    // Insert the new shopper
    await insertConstant()
    
    result = { message: "Shopper '" + username + "' created successfully"}
    code = 200
    
  } catch (error) {
    result = { error: error.message}
    code = 400
  }
  
  const response = {
    statusCode: code,
    body: JSON.stringify(result),
  }
  
  pool.end()     // close DB connections
  return response
}