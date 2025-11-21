import * as cdk from 'aws-cdk-lib/core'
import { Construct } from 'constructs'
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as path from 'node:path'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { Duration } from 'aws-cdk-lib'


export class SoftEngProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromVpcAttributes(this, 'VPC', {
          vpcId: 'vpc-00303b6507444651e',           // Replace with your VPC ID
          availabilityZones: ['us-east-1a'],        // Replace with your AZs
          privateSubnetIds: ['subnet-0c78a1da329ed1c5a',
                             'subnet-0e6c5ea5032cb6a02',
                             'subnet-0c90e43352c0f23a6',
                             'subnet-0de1967880f611ad9',
                             'subnet-0ad0a960b349b226e',
                             'subnet-015a40744234752fd'], // Replace with your private subnet IDs
    })

    const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'SG', 'sg-0b4f1dbd2c47e9c74', {             // Find your security group
        mutable: false
    })

    // NOTE: You First have to add RDS_USER and RDS_PASSWORD to 
    // your environment variables for your account. Same with RDS_DATABASE and RDS_HOST
    const rdsUser     = process.env.RDS_USER!
    const rdsPassword = process.env.RDS_PASSWORD!
    const rdsDatabase = process.env.RDS_DATABASE!
    const rdsHost     = process.env.RDS_HOST!

    // generic default handler for any API function that doesn't get its own Lambda method
    const default_fn = new lambdaNodejs.NodejsFunction(this, 'LambdaDefaultFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'default.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'default')),
      vpc: vpc,                                                             // Reference the VPC defined above
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    const api_endpoint = new apigw.LambdaRestApi(this, `shopcompapi`, {
      handler: default_fn,
      restApiName: `ShopCompAPI`, 
      proxy: false,
      defaultCorsPreflightOptions: {            // Optional BUT very helpful: Add CORS configuration 
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: apigw.Cors.DEFAULT_HEADERS,
      },
    })

    //Create Resources

    //Shopper Use Cases
    const shopcompResource = api_endpoint.root.addResource('shopcomp')
    const registerShopperResource = shopcompResource.addResource('register_shopper')
    const loginShopperResource = shopcompResource.addResource('login_shopper')
    const reviewHistoryResource = shopcompResource.addResource('review_history')
    const reviewActivityResource = shopcompResource.addResource('review_activity')
    const searchRecentPurchasesResource = shopcompResource.addResource('search_recent_purchases')

    //Receipt Use Cases
    const createReceiptResource = shopcompResource.addResource('create_receipt')
    const addItemResource = shopcompResource.addResource('add_item')
    const removeItemResource = shopcompResource.addResource('remove_item')
    const editItemResource = shopcompResource.addResource('edit_item')
    const submitReceiptResource = shopcompResource.addResource('submit_receipt')
    const analyzeReceiptResource = shopcompResource.addResource('analyze_receipt')

    //Shopping List Use Cases
    const createShoppingListResource = shopcompResource.addResource('create_shopping_list')
    const addToListResource = shopcompResource.addResource('add_to_list')
    const removeFromListResource = shopcompResource.addResource('remove_from_list')
    const reportOptionsResource = shopcompResource.addResource('report_options')

    //Store Use Cases
    const listStoreChainsResource = shopcompResource.addResource('list_store_chains')
    const addStoreChainResource = shopcompResource.addResource('add_store_chain')
    const addStoreResource = shopcompResource.addResource('add_store')

    //Admin Use Cases
    const loginAdminResource = shopcompResource.addResource('login_admin')
    const removeStoreChainResource = shopcompResource.addResource('remove_store_chain')
    const removeStoreResource = shopcompResource.addResource('remove_store')


    // https://github.com/aws/aws-cdk/blob/main/packages/aws-cdk-lib/aws-apigateway/README.md
    const integration_parameters = { 
       proxy: false,
       passthroughBehavior: apigw.PassthroughBehavior.WHEN_NO_MATCH,
       
       integrationResponses: [
          {
            // Successful response from the Lambda function, no filter defined
            statusCode: '200',
            responseTemplates: {
              'application/json': '$input.json(\'$\')',       // should just pass JSON through untouched
            },
            responseParameters: {
                'method.response.header.Content-Type':                      "'application/json'",
                'method.response.header.Access-Control-Allow-Origin':       "'*'",
                'method.response.header.Access-Control-Allow-Credentials':  "'true'"
            },
          },
          {
            // For errors, we check if the error message is not empty, get the error data
            selectionPattern: '(\n|.)+',
            statusCode: "400",
            responseTemplates: {
              'application/json': JSON.stringify({ state: 'error', message: "$util.escapeJavaScript($input.path('$.errorMessage'))" })
          },
            responseParameters: {
                'method.response.header.Content-Type':                      "'application/json'",
                'method.response.header.Access-Control-Allow-Origin':       "'*'",
                'method.response.header.Access-Control-Allow-Credentials':  "'true'"
            },
          }
        ]
      }


    const response_parameters = {
   methodResponses: [
    {
      // Successful response from the integration
      statusCode: '200',
      // Define what parameters 
      responseParameters: {
        'method.response.header.Content-Type': true,
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Allow-Credentials': true
      },

    },
    {
      // Same thing for the error responses
      statusCode: '400',
      responseParameters: {
        'method.response.header.Content-Type': true,
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Allow-Credentials': true
      },
 
    }
  ]
    }

    // Path parameter specific configurations - use proxy integration for path parameters
    const path_parameter_integration = {
      proxy: true
    }

    const path_response_parameters = {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Content-Type': true,
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Credentials': true
          }
        },
        {
          statusCode: '400',
          responseParameters: {
            'method.response.header.Content-Type': true,
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Credentials': true
          }
        }
      ]
    }

    // Add POST methods to resources

    const register_shopper_fn = new lambdaNodejs.NodejsFunction(this, 'RegisterShopperFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'register_shopper.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'register_shopper')),
      vpc: vpc,             // Reference the VPC defined above
      environment: {
          // Define your environment variables here
          RDS_USER: process.env.RDS_USER!,
          RDS_PASSWORD: process.env.RDS_PASSWORD!,
          RDS_DATABASE: process.env.RDS_DATABASE!,
          RDS_HOST: process.env.RDS_HOST!
        },
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    registerShopperResource.addMethod('POST', new apigw.LambdaIntegration(register_shopper_fn, integration_parameters), response_parameters)

    const login_shopper_fn = new lambdaNodejs.NodejsFunction(this, 'LoginShopperFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'login_shopper.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'login_shopper')),
      vpc: vpc,             // Reference the VPC defined above
      environment: {
          // Define your environment variables here
          RDS_USER: process.env.RDS_USER!,
          RDS_PASSWORD: process.env.RDS_PASSWORD!,
          RDS_DATABASE: process.env.RDS_DATABASE!,
          RDS_HOST: process.env.RDS_HOST!
        },
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    loginShopperResource.addMethod('POST', new apigw.LambdaIntegration(login_shopper_fn, integration_parameters), response_parameters)

    const review_history_fn = new lambdaNodejs.NodejsFunction(this, 'ReviewHistoryFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'review_history.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'review_history')),
      vpc: vpc,             // Reference the VPC defined above
      environment: {
          // Define your environment variables here
          RDS_USER: process.env.RDS_USER!,
          RDS_PASSWORD: process.env.RDS_PASSWORD!,
          RDS_DATABASE: process.env.RDS_DATABASE!,
          RDS_HOST: process.env.RDS_HOST!
        },
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    reviewHistoryResource.addMethod('POST', new apigw.LambdaIntegration(review_history_fn, integration_parameters), response_parameters)

    const review_activity_fn = new lambdaNodejs.NodejsFunction(this, 'ReviewActivityFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'review_activity.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'review_activity')),
      vpc: vpc,             // Reference the VPC defined above
      environment: {
          // Define your environment variables here
          RDS_USER: process.env.RDS_USER!,
          RDS_PASSWORD: process.env.RDS_PASSWORD!,
          RDS_DATABASE: process.env.RDS_DATABASE!,
          RDS_HOST: process.env.RDS_HOST!
        },
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    reviewActivityResource.addMethod('POST', new apigw.LambdaIntegration(review_activity_fn, integration_parameters), response_parameters)

    const search_recent_purchases_fn = new lambdaNodejs.NodejsFunction(this, 'SearchRecentPurchasesFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'search_recent_purchases.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'search_recent_purchases')),
      vpc: vpc,             // Reference the VPC defined above
      environment: {
          // Define your environment variables here
          RDS_USER: process.env.RDS_USER!,
          RDS_PASSWORD: process.env.RDS_PASSWORD!,
          RDS_DATABASE: process.env.RDS_DATABASE!,
          RDS_HOST: process.env.RDS_HOST!
        },
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    searchRecentPurchasesResource.addMethod('POST', new apigw.LambdaIntegration(search_recent_purchases_fn, integration_parameters), response_parameters)

    const create_receipt_fn = new lambdaNodejs.NodejsFunction(this, 'CreateReceiptFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'create_receipt.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'create_receipt')),
      vpc: vpc,             // Reference the VPC defined above
      environment: {
          // Define your environment variables here
          RDS_USER: process.env.RDS_USER!,
          RDS_PASSWORD: process.env.RDS_PASSWORD!,
          RDS_DATABASE: process.env.RDS_DATABASE!,
          RDS_HOST: process.env.RDS_HOST!
        },
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    createReceiptResource.addMethod('POST', new apigw.LambdaIntegration(create_receipt_fn, integration_parameters), response_parameters)

    const add_item_fn = new lambdaNodejs.NodejsFunction(this, 'AddItemFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'add_item.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'add_item')),
      vpc: vpc,             // Reference the VPC defined above
      environment: {
          // Define your environment variables here
          RDS_USER: process.env.RDS_USER!,
          RDS_PASSWORD: process.env.RDS_PASSWORD!,
          RDS_DATABASE: process.env.RDS_DATABASE!,
          RDS_HOST: process.env.RDS_HOST!
        },
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    addItemResource.addMethod('POST', new apigw.LambdaIntegration(add_item_fn, integration_parameters), response_parameters)

    const edit_item_fn = new lambdaNodejs.NodejsFunction(this, 'EditItemFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'edit_item.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'edit_item')),
      vpc: vpc,             // Reference the VPC defined above
      environment: {
          // Define your environment variables here
          RDS_USER: process.env.RDS_USER!,
          RDS_PASSWORD: process.env.RDS_PASSWORD!,
          RDS_DATABASE: process.env.RDS_DATABASE!,
          RDS_HOST: process.env.RDS_HOST!
        },
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    editItemResource.addMethod('POST', new apigw.LambdaIntegration(edit_item_fn, integration_parameters), response_parameters)

    const remove_item_fn = new lambdaNodejs.NodejsFunction(this, 'RemoveItemFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'remove_item.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'remove_item')),
      vpc: vpc,             // Reference the VPC defined above
      environment: {
          // Define your environment variables here
          RDS_USER: process.env.RDS_USER!,
          RDS_PASSWORD: process.env.RDS_PASSWORD!,
          RDS_DATABASE: process.env.RDS_DATABASE!,
          RDS_HOST: process.env.RDS_HOST!
        },
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    removeItemResource.addMethod('POST', new apigw.LambdaIntegration(remove_item_fn, integration_parameters), response_parameters)

    const submit_receipt_fn = new lambdaNodejs.NodejsFunction(this, 'SubmitReceiptFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'submit_receipt.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'submit_receipt')),
      vpc: vpc,             // Reference the VPC defined above
      environment: {
          // Define your environment variables here
          RDS_USER: process.env.RDS_USER!,
          RDS_PASSWORD: process.env.RDS_PASSWORD!,
          RDS_DATABASE: process.env.RDS_DATABASE!,
          RDS_HOST: process.env.RDS_HOST!
        },
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    submitReceiptResource.addMethod('POST', new apigw.LambdaIntegration(submit_receipt_fn, integration_parameters), response_parameters)

    const analyze_receipt_fn = new lambdaNodejs.NodejsFunction(this, 'AnalyzeReceiptFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'analyze_receipt.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'analyze_receipt')),
      vpc: vpc,             // Reference the VPC defined above
      environment: {
          // Define your environment variables here
          RDS_USER: process.env.RDS_USER!,
          RDS_PASSWORD: process.env.RDS_PASSWORD!,
          RDS_DATABASE: process.env.RDS_DATABASE!,
          RDS_HOST: process.env.RDS_HOST!
        },
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    analyzeReceiptResource.addMethod('POST', new apigw.LambdaIntegration(analyze_receipt_fn, integration_parameters), response_parameters)

    const create_shopping_list_fn = new lambdaNodejs.NodejsFunction(this, 'CreateShoppingListFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'create_shopping_list.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'create_shopping_list')),
      vpc: vpc,             // Reference the VPC defined above
      environment: {
          // Define your environment variables here
          RDS_USER: process.env.RDS_USER!,
          RDS_PASSWORD: process.env.RDS_PASSWORD!,
          RDS_DATABASE: process.env.RDS_DATABASE!,
          RDS_HOST: process.env.RDS_HOST!
        },
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    createShoppingListResource.addMethod('POST', new apigw.LambdaIntegration(create_shopping_list_fn, integration_parameters), response_parameters)

    const add_to_list_fn = new lambdaNodejs.NodejsFunction(this, 'AddToListFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'add_to_list.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'add_to_list')),
      vpc: vpc,             // Reference the VPC defined above
      environment: {
          // Define your environment variables here
          RDS_USER: process.env.RDS_USER!,
          RDS_PASSWORD: process.env.RDS_PASSWORD!,
          RDS_DATABASE: process.env.RDS_DATABASE!,
          RDS_HOST: process.env.RDS_HOST!
        },
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    addToListResource.addMethod('POST', new apigw.LambdaIntegration(add_to_list_fn, integration_parameters), response_parameters)

    const remove_from_list_fn = new lambdaNodejs.NodejsFunction(this, 'RemoveFromListFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'remove_from_list.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'remove_from_list')),
      vpc: vpc,             // Reference the VPC defined above
      environment: {
          // Define your environment variables here
          RDS_USER: process.env.RDS_USER!,
          RDS_PASSWORD: process.env.RDS_PASSWORD!,
          RDS_DATABASE: process.env.RDS_DATABASE!,
          RDS_HOST: process.env.RDS_HOST!
        },
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    removeFromListResource.addMethod('POST', new apigw.LambdaIntegration(remove_from_list_fn, integration_parameters), response_parameters)

    const report_options_fn = new lambdaNodejs.NodejsFunction(this, 'ReportOptionsFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'report_options.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'report_options')),
      vpc: vpc,             // Reference the VPC defined above
      environment: {
          // Define your environment variables here
          RDS_USER: process.env.RDS_USER!,
          RDS_PASSWORD: process.env.RDS_PASSWORD!,
          RDS_DATABASE: process.env.RDS_DATABASE!,
          RDS_HOST: process.env.RDS_HOST!
        },
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    reportOptionsResource.addMethod('POST', new apigw.LambdaIntegration(report_options_fn, integration_parameters), response_parameters)

    const list_store_chains_fn = new lambdaNodejs.NodejsFunction(this, 'ListStoreChainsFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'list_store_chains.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'list_store_chains')),
      vpc: vpc,             // Reference the VPC defined above
      environment: {
          // Define your environment variables here
          RDS_USER: process.env.RDS_USER!,
          RDS_PASSWORD: process.env.RDS_PASSWORD!,
          RDS_DATABASE: process.env.RDS_DATABASE!,
          RDS_HOST: process.env.RDS_HOST!
        },
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    listStoreChainsResource.addMethod('POST', new apigw.LambdaIntegration(list_store_chains_fn, integration_parameters), response_parameters)

    const add_store_chain_fn = new lambdaNodejs.NodejsFunction(this, 'AddStoreChainFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'add_store_chain.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'add_store_chain')),
      vpc: vpc,             // Reference the VPC defined above
      environment: {
          // Define your environment variables here
          RDS_USER: process.env.RDS_USER!,
          RDS_PASSWORD: process.env.RDS_PASSWORD!,
          RDS_DATABASE: process.env.RDS_DATABASE!,
          RDS_HOST: process.env.RDS_HOST!
        },
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    addStoreChainResource.addMethod('POST', new apigw.LambdaIntegration(add_store_chain_fn, integration_parameters), response_parameters)

    const add_store_fn = new lambdaNodejs.NodejsFunction(this, 'AddStoreFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'add_store.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'add_store')),
      vpc: vpc,             // Reference the VPC defined above
      environment: {
          // Define your environment variables here
          RDS_USER: process.env.RDS_USER!,
          RDS_PASSWORD: process.env.RDS_PASSWORD!,
          RDS_DATABASE: process.env.RDS_DATABASE!,
          RDS_HOST: process.env.RDS_HOST!
        },
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    addStoreResource.addMethod('POST', new apigw.LambdaIntegration(add_store_fn, integration_parameters), response_parameters)

    const login_admin_fn = new lambdaNodejs.NodejsFunction(this, 'LoginAdminFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'login_admin.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'login_admin')),
      vpc: vpc,             // Reference the VPC defined above
      environment: {
          // Define your environment variables here
          RDS_USER: process.env.RDS_USER!,
          RDS_PASSWORD: process.env.RDS_PASSWORD!,
          RDS_DATABASE: process.env.RDS_DATABASE!,
          RDS_HOST: process.env.RDS_HOST!
        },
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    loginAdminResource.addMethod('POST', new apigw.LambdaIntegration(login_admin_fn, integration_parameters), response_parameters)

    const remove_store_chain_fn = new lambdaNodejs.NodejsFunction(this, 'RemoveStoreChainFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'remove_store_chain.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'remove_store_chain')),
      vpc: vpc,             // Reference the VPC defined above
      environment: {
          // Define your environment variables here
          RDS_USER: process.env.RDS_USER!,
          RDS_PASSWORD: process.env.RDS_PASSWORD!,
          RDS_DATABASE: process.env.RDS_DATABASE!,
          RDS_HOST: process.env.RDS_HOST!
        },
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    removeStoreChainResource.addMethod('POST', new apigw.LambdaIntegration(remove_store_chain_fn, integration_parameters), response_parameters)

    const remove_store_fn = new lambdaNodejs.NodejsFunction(this, 'RemoveStoreFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'remove_store.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'remove_store')),
      vpc: vpc,             // Reference the VPC defined above
      environment: {
          // Define your environment variables here
          RDS_USER: process.env.RDS_USER!,
          RDS_PASSWORD: process.env.RDS_PASSWORD!,
          RDS_DATABASE: process.env.RDS_DATABASE!,
          RDS_HOST: process.env.RDS_HOST!
        },
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    removeStoreResource.addMethod('POST', new apigw.LambdaIntegration(remove_store_fn, integration_parameters), response_parameters)


  }
}
