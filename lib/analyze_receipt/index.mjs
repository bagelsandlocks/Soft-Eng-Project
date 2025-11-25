import mysql from "mysql2";
import OpenAI from "openai";

export const handler = async (event) => {
    let result;
    let code;

    const pool = mysql.createPool({
        host: "shopcompdb.cqbii0agmq6k.us-east-1.rds.amazonaws.com",
        user: "ShopCompAdmin",
        password: "ShopComp:pass",
        database: "ShopComp"
    });

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY   // <-- set in Lambda console
    });

    try {
        // --------------------------- VALIDATION -----------------------------

        if (!event.shopperID || !event.token)
            throw new Error("shopperID and token are required.");

        if (!event.receiptID)
            throw new Error("receiptID is required.");

        const shopperID = event.shopperID;
        const token = event.token;
        const receiptID = event.receiptID;

        // -------------------------- AUTH CHECK -----------------------------

        const validUser = await new Promise((resolve, reject) => {
            pool.query(
                "SELECT * FROM Shoppers WHERE id = ? AND credential = ?",
                [shopperID, token],
                (err, rows) => err ? reject(err) : resolve(rows)
            );
        });

        if (!validUser || validUser.length === 0)
            throw new Error("Invalid shopperID or token");

        // ------------------------ FETCH RECEIPT IMAGE -----------------------

        const receiptRows = await new Promise((resolve, reject) => {
            pool.query(
                "SELECT image FROM Receipts WHERE id = ? AND shopper_id = ?",
                [receiptID, shopperID],
                (err, rows) => err ? reject(err) : resolve(rows)
            );
        });

        if (!receiptRows || receiptRows.length === 0)
            throw new Error("Receipt not found.");

        const receiptImage = receiptRows[0].image; 
        if (!receiptImage)
            throw new Error("Receipt image is missing.");

        // --------------------------- CALL OPENAI ---------------------------

        const response = await openai.responses.create({
            model: "gpt-4.1",
            input: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text:
                                "Extract all items from this receipt. " +
                                "Return ONLY a JSON array of objects with fields: " +
                                "{ name, price, quantity, category }. " +
                                "If no quantity is listed assume quantity = 1. " +
                                "Do not include total lines, headers, dates, or store metadata."
                        },
                        {
                            type: "input_image",
                            image_url: receiptImage    // <-- must be a base64 data URL OR S3 URL
                        }
                    ]
                }
            ]
        });

        // Clean response → JSON
        let aiText = response.output[0].content[0].text;
        let items;
        try {
            items = JSON.parse(aiText);
        } catch (e) {
            throw new Error("Failed to parse OpenAI response: " + aiText);
        }

        // ------------------------- SAVE ITEMS INTO DB -----------------------

        for (const item of items) {
            const id = Date.now().toString() + "-" + Math.random().toString(36).substring(2, 8);

            await new Promise((resolve, reject) => {
                pool.query(
                    `
                    INSERT INTO Items (id, name, price, quantity, category, receipt_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                    `,
                    [
                        id,
                        item.name,
                        item.price,
                        item.quantity,
                        item.category ?? null,
                        receiptID
                    ],
                    (err) => err ? reject(err) : resolve()
                );
            });
        }

        result = {
            message: "Receipt analyzed successfully.",
            extractedItems: items
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
