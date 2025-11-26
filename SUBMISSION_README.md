# ShopComp Project - Assignment Submission

## Part A: Database Schema [35 points]

All required database tables have been documented in `DATABASE_SCHEMA.md`. The tables support all use cases for the entire project:

### Core Tables:
1. **Shoppers** - User authentication and management
2. **Administrators** - Admin user management  
3. **StoreChains** - Store chain information
4. **Stores** - Individual store locations
5. **Receipts** - Receipt metadata and shopping trips
6. **ReceiptItems** - Individual items on receipts
7. **ShoppingLists** - User-created shopping lists
8. **ShoppingListItems** - Items in shopping lists

## Part B: Working Iteration #1 [65 points]

### Implemented Use Cases (8 total):

1. **Register Shopper** (`/shopcomp/register_shopper`)
   - Allows new users to create accounts
   - Validates unique usernames
   - Generates user credentials

2. **Login Shopper** (`/shopcomp/login_shopper`)
   - Authenticates existing users
   - Returns session tokens
   - Validates credentials against database

3. **Create Receipt** (`/shopcomp/create_receipt`)
   - Creates new receipt records
   - Validates store chains and stores exist
   - Links receipts to shoppers

4. **Add Item** (`/shopcomp/add_item`)
   - Adds items to existing receipts
   - Validates shopper authentication
   - Supports name, category, price, quantity

5. **Edit Item** (`/shopcomp/edit_item`)
   - Modifies existing receipt items
   - Validates ownership and authentication
   - Updates item details

6. **Remove Item** (`/shopcomp/remove_item`)
   - Removes items from receipts
   - Validates shopper permissions
   - Maintains data integrity

7. **Submit Receipt** (`/shopcomp/submit_receipt`)
   - Finalizes receipt processing
   - Marks receipts as complete
   - Validates all required data

8. **Analyze Receipt** (`/shopcomp/analyze_receipt`)
   - Uses OpenAI to process receipt images
   - Extracts item details automatically
   - Creates structured receipt data

### Technology Stack:
- **Backend**: AWS Lambda functions (Node.js)
- **Database**: MySQL on AWS RDS
- **API**: AWS API Gateway
- **Infrastructure**: AWS CDK (Infrastructure as Code)
- **AI**: OpenAI GPT for receipt analysis

### Deployment Instructions:
1. Set environment variables (documented in DATABASE_SCHEMA.md)
2. Run `npm install` to install dependencies
3. Run `npx cdk deploy` to deploy to AWS
4. Test endpoints via API Gateway console

### API Endpoints:
All endpoints are POST methods under `/shopcomp/`:
- `register_shopper`
- `login_shopper`
- `create_receipt`
- `add_item`
- `edit_item`
- `remove_item`
- `submit_receipt`
- `analyze_receipt`

## Status: Ready for Assessment

✅ Database schema documented  
✅ 8 Lambda functions implemented  
✅ Dependencies installed  
✅ Environment variables configured  
✅ Git report generated  
✅ Ready for deployment  

## Files Included:
- `DATABASE_SCHEMA.md` - Complete database documentation
- `git.report.txt` - Git activity report
- All Lambda function source code in `lib/` directory
- AWS CDK infrastructure code
- Package.json files with dependencies