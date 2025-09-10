#!/bin/bash

# AWS CloudShell Deployment Script for EDA Tool
set -e

# Configuration
FUNCTION_NAME="eda-tool-lambda"
REGION="ap-south-1"
RUNTIME="python3.11"
HANDLER="lambda_handler.lambda_handler"
MEMORY_SIZE="1024"
TIMEOUT="300"
ROLE_NAME="eda-tool-lambda-role"

echo "🚀 Starting EDA Tool Lambda Deployment in CloudShell..."

# Check if we're in the right directory
if [ ! -f "lambda_handler.py" ]; then
    echo "❌ lambda_handler.py not found. Please run this script from the project root directory."
    exit 1
fi

echo "✅ Found lambda_handler.py"

# Create deployment package directory
echo "📦 Creating deployment package..."
rm -rf lambda-package
mkdir -p lambda-package

# Copy application files
echo "📋 Copying application files..."
cp lambda_handler.py lambda-package/
cp -r services lambda-package/ 2>/dev/null || echo "⚠️  services directory not found"
cp -r templates lambda-package/ 2>/dev/null || echo "⚠️  templates directory not found"
cp -r static lambda-package/ 2>/dev/null || echo "⚠️  static directory not found"
cp config.py lambda-package/ 2>/dev/null || echo "⚠️  config.py not found"

# Install dependencies
echo "📚 Installing Python dependencies..."
pip3 install -r requirements-lambda.txt -t lambda-package/ --no-deps --quiet

# Install additional dependencies
pip3 install mangum -t lambda-package/ --quiet

# Create deployment zip
echo "🗜️  Creating deployment package..."
cd lambda-package
zip -r ../eda-tool-lambda.zip . -x "*.pyc" "__pycache__/*" "*.git*" "*.DS_Store" >/dev/null
cd ..

echo "✅ Deployment package created: eda-tool-lambda.zip ($(du -h eda-tool-lambda.zip | cut -f1))"

# Check if IAM role exists, create if not
echo "🔐 Checking IAM role..."
if ! aws iam get-role --role-name $ROLE_NAME &> /dev/null; then
    echo "📝 Creating IAM role..."
    
    # Create trust policy
    cat > trust-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF

    # Create the role
    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document file://trust-policy.json

    # Wait for role to be available
    echo "⏳ Waiting for IAM role to be available..."
    aws iam wait role-exists --role-name $ROLE_NAME

    # Attach policies
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite

    echo "✅ IAM role created: $ROLE_NAME"
    rm trust-policy.json
else
    echo "✅ IAM role already exists: $ROLE_NAME"
fi

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
echo "🔑 Role ARN: $ROLE_ARN"

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION &> /dev/null; then
    echo "🔄 Function exists, updating..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://eda-tool-lambda.zip \
        --region $REGION
    
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --memory-size $MEMORY_SIZE \
        --timeout $TIMEOUT \
        --region $REGION
else
    echo "🆕 Creating new Lambda function..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler $HANDLER \
        --zip-file fileb://eda-tool-lambda.zip \
        --memory-size $MEMORY_SIZE \
        --timeout $TIMEOUT \
        --region $REGION
fi

echo "✅ Lambda function deployed successfully!"

# Create API Gateway
echo "🌐 Setting up API Gateway..."
API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='$FUNCTION_NAME'].ApiId" --output text --region $REGION 2>/dev/null || echo "")

if [ -z "$API_ID" ]; then
    echo "📡 Creating API Gateway..."
    API_ID=$(aws apigatewayv2 create-api \
        --name $FUNCTION_NAME \
        --protocol-type HTTP \
        --target arn:aws:lambda:$REGION:$(aws sts get-caller-identity --query Account --output text):function:$FUNCTION_NAME \
        --region $REGION \
        --query 'ApiId' --output text)
    
    echo "✅ API Gateway created with ID: $API_ID"
else
    echo "✅ API Gateway already exists with ID: $API_ID"
fi

# Get the API Gateway URL
API_URL=$(aws apigatewayv2 get-api --api-id $API_ID --region $REGION --query 'ApiEndpoint' --output text)
echo "�� API Gateway URL: $API_URL"

# Set up environment variables
echo "⚙️  Setting up environment variables..."
aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --environment Variables='{
        "SECRET_KEY":"eda_tool_secret_key_2024",
        "GEMINI_SECRET_NAME":"prod/gemini/api_key"
    }' \
    --region $REGION

echo "✅ Environment variables configured"

# Clean up
echo "�� Cleaning up..."
rm -rf lambda-package

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Store your Gemini API key in AWS Secrets Manager:"
echo "   aws secretsmanager create-secret --name 'prod/gemini/api_key' --secret-string '{\"api_key\":\"YOUR_GEMINI_API_KEY\"}'"
echo ""
echo "2. Your EDA Tool is available at: $API_URL"
echo ""
echo "3. Test the deployment:"
echo "   curl $API_URL"
echo ""
echo "4. Monitor logs:"
echo "   aws logs tail /aws/lambda/$FUNCTION_NAME --follow --region $REGION"
