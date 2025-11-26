import mysql from 'mysql2';
import crypto from 'crypto';
export const handler = async (event) => {
    let result;
    let code;
    const pool = mysql.createPool({
        host: process.env.RDS_HOST, 
        user: process.env.RDS_USER, 
        password: process.env.RDS_PASSWORD, 
        database: process.env.RDS_DATABASE
    });
    try {
        if (!event.username || !event.password) {
            throw new Error("Both username and password are required.");
        }
        const name = event.username;
        const value = event.password;

        if(value === null || name === null){
            throw new Error("value or name cannot be null");
        }

        //check if the name and password exists in the shoppers table
        const checkQuery = () => {
            return new Promise((resolve, reject) => {
                pool.query('SELECT id FROM Shoppers WHERE username = ? AND password = ?', [name, value], (error, results) => {
                    if (error) {
                        return reject(new Error("Database error: " + error.sqlMessage));
                    }else{
                        resolve(results);
                    }    
                });
            })
        }
        // if no results can be found, throw error
        const userExists = await checkQuery();
        if(! userExists|| userExists.length === 0){
            throw new Error("Invalid username or password");
        }

        //Insert login record
        const shopperID = userExists[0].id;
        const token = crypto.randomUUID();
        const insertQuery = () => {
            return new Promise((resolve, reject) => {
                pool.query("UPDATE Shoppers SET credentials = ? WHERE id = ? ", 
                    [token, shopperID], (error, results) => {
                    if (error) {
                        return reject(new Error("Database error: " + error.sqlMessage));
                    }else{
                        resolve(results);
                    }    
                });
            })
        }

        await insertQuery();
        
        result = {   message: "Login successful", 
                    shopperID: shopperID,
                    token: token  };
        code = 200;
        

    } catch (error) {
        result = { error: error.message };
        code = 400;
    }finally {
        pool.end(); // close DB connections
    }

    const response = {
        statusCode: code,
        body: JSON.stringify(result),
    };
    return response;
    
}
