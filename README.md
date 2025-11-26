This project constitutes the frontend component of ShopComp. The frontend is built using Next.js and interacts with the backend infrastructure comprising AWS Lambda, API Gateway, and RDS.

1. Switch to the main branch

Ensure you are currently on the main branch of this project:

git checkout main

2. Install dependencies

Execute in the project root directory:

npm install

This command will automatically install all project dependencies, including Next.js and React.

3. Start the development server
npm run dev

Upon successful execution, the terminal will display:

> Local:   http://localhost:3000

4. Access the website

Open your browser and visit:

http://localhost:3000


User Guide (Use Case Related)

The current system implements 8 Use Cases. Among them, two fields in CreateReceipt (Create Shopping Receipt) are fixed mandatory fields, as the database and backend logic currently only support these values.

When using the Create Receipt page, please fill in the fields using the following format:
Field Name    Mandatory Fixed Content
Store Chain    Walmart
Store    Walmart Supercenter #102

Note: Entering other values is not permitted, as it may cause backend errors or processing failures.
