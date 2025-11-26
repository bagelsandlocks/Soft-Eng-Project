import * as cdk from 'aws-cdk-lib/core'
import { Construct } from 'constructs'
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as path from 'node:path'
import { Duration } from 'aws-cdk-lib'


export class SoftEngProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
      timeout: Duration.seconds(10),
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

    //Receipt Use Cases
    const createReceiptResource = shopcompResource.addResource('create_receipt')
    const addItemResource = shopcompResource.addResource('add_item')
    const removeItemResource = shopcompResource.addResource('remove_item')
    const editItemResource = shopcompResource.addResource('edit_item')
    const submitReceiptResource = shopcompResource.addResource('submit_receipt')
    const analyzeReceiptResource = shopcompResource.addResource('analyze_receipt')

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

    // Add POST methods to resources - CORE 8 FUNCTIONS ONLY

    const register_shopper_fn = new lambdaNodejs.NodejsFunction(this, 'RegisterShopperFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'register_shopper.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'register_shopper')),
      environment: {
          RDS_USER: rdsUser,
          RDS_PASSWORD: rdsPassword,
          RDS_DATABASE: rdsDatabase,
          RDS_HOST: rdsHost
        },
      timeout: Duration.seconds(10),
    })

    registerShopperResource.addMethod('POST', new apigw.LambdaIntegration(register_shopper_fn, integration_parameters), response_parameters)

    const login_shopper_fn = new lambdaNodejs.NodejsFunction(this, 'LoginShopperFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'login_shopper.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'login_shopper')),
      environment: {
          RDS_USER: rdsUser,
          RDS_PASSWORD: rdsPassword,
          RDS_DATABASE: rdsDatabase,
          RDS_HOST: rdsHost
        },
      timeout: Duration.seconds(10),
    })

    loginShopperResource.addMethod('POST', new apigw.LambdaIntegration(login_shopper_fn, integration_parameters), response_parameters)

    const create_receipt_fn = new lambdaNodejs.NodejsFunction(this, 'CreateReceiptFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'create_receipt.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'create_receipt')),
      environment: {
          RDS_USER: rdsUser,
          RDS_PASSWORD: rdsPassword,
          RDS_DATABASE: rdsDatabase,
          RDS_HOST: rdsHost
        },
      timeout: Duration.seconds(10),
    })

    createReceiptResource.addMethod('POST', new apigw.LambdaIntegration(create_receipt_fn, integration_parameters), response_parameters)

    const add_item_fn = new lambdaNodejs.NodejsFunction(this, 'AddItemFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'add_item.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'add_item')),
      environment: {
          RDS_USER: rdsUser,
          RDS_PASSWORD: rdsPassword,
          RDS_DATABASE: rdsDatabase,
          RDS_HOST: rdsHost
        },
      timeout: Duration.seconds(10),
    })

    addItemResource.addMethod('POST', new apigw.LambdaIntegration(add_item_fn, integration_parameters), response_parameters)

    const edit_item_fn = new lambdaNodejs.NodejsFunction(this, 'EditItemFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'edit_item.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'edit_item')),
      environment: {
          RDS_USER: rdsUser,
          RDS_PASSWORD: rdsPassword,
          RDS_DATABASE: rdsDatabase,
          RDS_HOST: rdsHost
        },
      timeout: Duration.seconds(10),
    })

    editItemResource.addMethod('POST', new apigw.LambdaIntegration(edit_item_fn, integration_parameters), response_parameters)

    const remove_item_fn = new lambdaNodejs.NodejsFunction(this, 'RemoveItemFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'remove_item.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'remove_item')),
      environment: {
          RDS_USER: rdsUser,
          RDS_PASSWORD: rdsPassword,
          RDS_DATABASE: rdsDatabase,
          RDS_HOST: rdsHost
        },
      timeout: Duration.seconds(10),
    })

    removeItemResource.addMethod('POST', new apigw.LambdaIntegration(remove_item_fn, integration_parameters), response_parameters)

    const submit_receipt_fn = new lambdaNodejs.NodejsFunction(this, 'SubmitReceiptFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'submit_receipt.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'submit_receipt')),
      environment: {
          RDS_USER: rdsUser,
          RDS_PASSWORD: rdsPassword,
          RDS_DATABASE: rdsDatabase,
          RDS_HOST: rdsHost
        },
      timeout: Duration.seconds(10),
    })

    submitReceiptResource.addMethod('POST', new apigw.LambdaIntegration(submit_receipt_fn, integration_parameters), response_parameters)

    const analyze_receipt_fn = new lambdaNodejs.NodejsFunction(this, 'AnalyzeReceiptFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'analyze_receipt.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'analyze_receipt')),
      environment: {
          RDS_USER: rdsUser,
          RDS_PASSWORD: rdsPassword,
          RDS_DATABASE: rdsDatabase,
          RDS_HOST: rdsHost,
          OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'not-set'
        },
      timeout: Duration.seconds(30), // Longer timeout for OpenAI API calls
    })

    analyzeReceiptResource.addMethod('POST', new apigw.LambdaIntegration(analyze_receipt_fn, integration_parameters), response_parameters)

  }
}