import mysql from 'mysql2/promise';
import crypto from 'crypto';
export const handler = async (event) => {
    let result;
    let code;
    var pool = mysql.createPool({
        host:"shopcompdb.cqbii0agmq6k.us-east-1.rds.amazonaws.com",
        user:"ShopCompAdmin",
        password: "ShopComp:pass",
        database: "ShopComp"
    })
    try {
        if(!event.name|| !event.value){
            throw new Error("Both name and value are required");
        }
        const name = event.name;
        const value = event.value;

        if(value === null || name === null){
            throw new Error("value or name cannot be null");
        }

        //check if the name and password exists in the shoppers table
        const checkQuery = () => {
            return new Promise((resolve, reject) => {
                pool.query('SELECT * FROM Shoppers WHERE username = ? AND password = ?', [name, value], (error, results) => {
                    if (error) {
                        return reject(new Error("Database error: " + error.sqlMessage));
                    }else{
                        resolve(results && results.length > 0);
                    }    
                });
            })
        }
        // if no results can be found, throw error
        const userExists = await checkQuery();
        if(!userExists){
            throw new Error("Invalid username or password");
        }

        //Insert login record
        const credentials = crypto.randomUUID();
        const insertQuery = () => {
            return new Promise((resolve, reject) => {
                pool.query("UPDATE Shoppers SET credentials = ? WHERE username = ? ", 
                    [credentials, name], (error, results) => {
                    if (error) {
                        return reject(new Error("Database error: " + error.sqlMessage));
                    }else{
                        resolve(results);
                    }    
                });
            })
        }

        await insertQuery();
        
        result = { message: "Login successful", credentials: credentials };
        code = 200;
        

    } catch (error) {
        result = { error: error.message };
        code = 400;
    }

    const response = {
        statusCode: code,
        body: JSON.stringify(result),
    };
    pool.end();
    return response;
    
}
