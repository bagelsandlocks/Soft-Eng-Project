import mysql from 'mysql2';
export const handler = async (event) => {
    let result;
    let code;
    
    const pool = mysql.createPool({
        host:"shopcompdb.cqbii0agmq6k.us-east-1.rds.amazonaws.com",
        user:"ShopCompAdmin",
        password: "ShopComp:pass",
        database: "ShopComp"
    });

    //receiptID, receiptName, shopperID, token
    try {
        if( ! event.receiptID || !event.shopperID || !event.token || !event.receiptName ) {
            throw new Error("Both shopperID and token are required.");
        }
        const shopperID = event.shopperID;
        const token = event.token;
        const receiptID = event.receiptID;
        const receiptName = event.receiptName;
        const date = new Date().toISOString();
        const store = event.store || null;
        const storeChain = event.storeChain || null;

        const validUser = await new Promise((resolve, reject) => {
            pool.query(
                "SELECT * FROM Shoppers WHERE id = ? AND credential = ?",
                [shopperID, token],
                (err, rows) => err ? reject(err) : resolve(rows)
            );
        });

        if (!validUser || validUser.length === 0) {
            throw new Error("Invalid shopperID or token");
        }

        const receiptRows = await new Promise((resolve, reject) => {
            pool.query(
                "SELECT * FROM Receipts WHERE id = ? AND shopper_id = ?",
                [receiptID, shopperID],
                (err, rows) => err ? reject(err) : resolve(rows)
            );
        });
        
        if (!receiptRows || receiptRows.length === 0) {
            throw new Error("Receipt does not exist for this shopper.");
        }

        const updateResult = await new Promise((resolve, reject) => {
            pool.query(
                `UPDATE Receipts 
                SET name = ? ,
                date = ?,
                store = ?,
                store_chain = ?
                WHERE id = ? AND shopper_id = ?  `,
                [receiptName, date, store, storeChain, receiptID, shopperID],
                (err, res) => err ? reject(err) : resolve(res)
            );
        });
        
        result = { message: "Receipt submitted successfully." };
        code = 200;
    } catch (err) {
        result = { error: err.message || "Unknown error occurred." };
        code = 400;
    }
    
    pool.end();
    return {
        statusCode: code,
        body: JSON.stringify(result),
    };
}