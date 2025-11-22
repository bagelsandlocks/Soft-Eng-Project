import mysql from 'mysql2'

export const handler = async (event) => {
    let result;
    let code;
    var pool = mysql.createPool({
        host:"shopcompdb.cqbii0agmq6k.us-east-1.rds.amazonaws.com",
        user:"ShopCompAdmin",
        password: "ShopComp:pass",
        database: "ShopComp"
    })

    try{
        if(!event.shopperID || !event.token){
            throw new Error("Both shopperID and token are required.");
        }
        const shopperID = event.shopperID;
        const token =  event.token;

        // Verify shopperID and token
        const verifyQuery = () => {
            return new Promise((resolve, reject) => {
                pool.query('SELECT * FROM Shoppers WHERE shopperID = ? AND credential = ?', [shopperID, token], (error, results) => {
                    if (error) {
                        return reject(new Error("Database error: " + error.sqlMessage));
                    }else{
                        resolve(results);
                    }    
                });
            })
        }

        const validUser = await verifyQuery();
        if(! validUser || validUser.length === 0){
            throw new Error("Invalid shopperID or token");
        }
        
        // Insert new receipt
        const insertQuery = () => {
            return new Promise((resolve, reject) => {
                const insertSQL = "INSERT INTO Receipts (shopperID) VALUES (?)";
                pool.query(insertSQL, [shopperID], (error, insertResult) => {
                    if (error) {
                        reject(new Error("Database error: " + error.sqlMessage));
                    } else {
                        resolve(insertResult);
                    }
                });
            })
        }

        const insertResult = await insertQuery();
        
        result = { message: "Receipt created successfully", receiptID: insertResult.insertId };
        code = 200;

    } catch (error) {
        result = { message: error.message };
        code = 400;
    } finally {
        pool.end(); // close DB connections
    }
    const response = {
        statusCode: code,
        body: JSON.stringify(result)
    };
    
    return response;
}