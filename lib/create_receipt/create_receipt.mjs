import mysql from 'mysql2'

export const handler = async (event) => {
    let result;
    let code;

    const pool = mysql.createPool({
        host:"shopcompdb.cqbii0agmq6k.us-east-1.rds.amazonaws.com",
        user:"ShopCompAdmin",
        password: "ShopComp:pass",
        database: "ShopComp"
    });

    try {
        if (!event.shopperID || !event.token) {
            throw new Error("Both shopperID and token are required.");
        }
        if (!event.date || !event.storeChain || !event.store) {
            throw new Error("date, storeChain, and store are required.");
        }
        if( !event.receiptName ) {
            throw new Error("receiptName is required.");
        }

        const shopperID = event.shopperID;
        const token = event.token;
        const date = event.date;
        const storeChain = event.storeChain;
        const store = event.store;
        const receiptName = event.receiptName
        const receiptID = Date.now().toString() + "-" + Math.random().toString(36).substring(2, 8);

        // Validate date format (YYYY-MM-DD)

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new Error("Invalid date format. Expected YYYY-MM-DD.");
        }

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

        const chainRows = await new Promise((resolve, reject) => {
            pool.query(
                "SELECT * FROM StoreChains WHERE name = ?",
                [storeChain],
                (err, rows) => err ? reject(err) : resolve(rows)
            );
        });
        if (!chainRows || chainRows.length === 0) {
            throw new Error("Storechain does not exist.");
        }

        const storeRows = await new Promise((resolve, reject) => {
            pool.query(
                "SELECT * FROM Stores WHERE name = ? AND store_chain_name = ?",
                [store, storeChain],
                (err, rows) => err ? reject(err) : resolve(rows)
            );
        });
        if (!storeRows || storeRows.length === 0) {
            throw new Error("Store does not exist for this chain.");
        }



        const insertResult = await new Promise((resolve, reject) => {
            pool.query(
                `
                INSERT INTO Receipts (id, name, shopper_id, date, store_chain_name, store_name)
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [receiptID, receiptName, shopperID, date, storeChain, store],
                (err, rows) => err ? reject(err) : resolve(rows)
            );
        });

        result = {
            message: "Receipt created successfully",
            receiptID: insertResult.insertId,
        };
        code = 200;

    } catch (err) {
        result = { error: err.message };
        code = 400;
    } finally {
        pool.end();
    }

    return {
        statusCode: code,
        body: JSON.stringify(result),
    };
};
