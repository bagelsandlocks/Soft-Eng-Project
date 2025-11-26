# Database Schema Documentation

## Tables Required for ShopComp Application

Based on the Lambda functions and database screenshots, here are the required tables:

### 1. Shoppers Table
```sql
CREATE TABLE `Shoppers` (
  `id` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `credentials` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username_UNIQUE` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### 2. Administrators Table
```sql
CREATE TABLE `Administrators` (
  `id` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `credentials` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username_UNIQUE` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### 3. StoreChains Table
```sql
CREATE TABLE `StoreChains` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### 4. Stores Table
```sql
CREATE TABLE `Stores` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `store_chain_id` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_store_chain_idx` (`store_chain_id`),
  CONSTRAINT `fk_store_chain` FOREIGN KEY (`store_chain_id`) REFERENCES `StoreChains` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### 5. Receipts Table
```sql
CREATE TABLE `Receipts` (
  `id` varchar(255) NOT NULL,
  `shopperID` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `store_chain_id` varchar(255) NOT NULL,
  `store_id` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_receipt_shopper_idx` (`shopperID`),
  KEY `fk_receipt_store_chain_idx` (`store_chain_id`),
  KEY `fk_receipt_store_idx` (`store_id`),
  CONSTRAINT `fk_receipt_shopper` FOREIGN KEY (`shopperID`) REFERENCES `Shoppers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_receipt_store_chain` FOREIGN KEY (`store_chain_id`) REFERENCES `StoreChains` (`id`),
  CONSTRAINT `fk_receipt_store` FOREIGN KEY (`store_id`) REFERENCES `Stores` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### 6. ReceiptItems Table
```sql
CREATE TABLE `ReceiptItems` (
  `id` varchar(255) NOT NULL,
  `receipt_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `quantity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_receipt_item_receipt_idx` (`receipt_id`),
  CONSTRAINT `fk_receipt_item_receipt` FOREIGN KEY (`receipt_id`) REFERENCES `Receipts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### 7. ShoppingLists Table
```sql
CREATE TABLE `ShoppingLists` (
  `id` varchar(255) NOT NULL,
  `shopperID` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_shopping_list_shopper_idx` (`shopperID`),
  CONSTRAINT `fk_shopping_list_shopper` FOREIGN KEY (`shopperID`) REFERENCES `Shoppers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### 8. ShoppingListItems Table
```sql
CREATE TABLE `ShoppingListItems` (
  `id` varchar(255) NOT NULL,
  `shopping_list_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(255) NOT NULL,
  `quantity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_shopping_list_item_list_idx` (`shopping_list_id`),
  CONSTRAINT `fk_shopping_list_item_list` FOREIGN KEY (`shopping_list_id`) REFERENCES `ShoppingLists` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

## Environment Variables Required

To deploy this application, you need to set these environment variables:

```bash
# Database Connection Details (from your AWS RDS)
export RDS_HOST="your-rds-endpoint"
export RDS_USER="your-db-username"  
export RDS_PASSWORD="your-db-password"
export RDS_DATABASE="your-database-name"

# For analyze_receipt function (if using OpenAI)
export OPENAI_API_KEY="your-openai-api-key"
```

## Deployment Steps

1. Set environment variables in your terminal/AWS account
2. Ensure all database tables are created
3. Deploy with CDK: `npm run deploy`
4. Test endpoints through API Gateway

## API Endpoints

After deployment, your API will have these endpoints:
- POST /shopcomp/register_shopper
- POST /shopcomp/login_shopper  
- POST /shopcomp/create_receipt
- POST /shopcomp/add_item
- POST /shopcomp/edit_item
- POST /shopcomp/remove_item
- POST /shopcomp/submit_receipt
- POST /shopcomp/analyze_receipt