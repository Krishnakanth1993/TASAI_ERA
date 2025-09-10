#!/bin/bash

# AWS Lambda Deployment Script for EDA Tool
# This script packages and deploys the EDA tool as a Lambda function

set -e

# Configuration
FUNCTION_NAME="eda-tool-lambda"
REGION="us-east-1"
RUNTIME="python3.11"
HANDLER="lambda_handler.lambda_handler"
MEMORY_SIZE="1024"
TIMEOUT="300"
ROLE_NAME="eda-tool-lambda-role"

echo "🚀 Starting EDA Tool Lambda Deployment..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI and credentials configured"

# Create deployment package directory
echo "📦 Creating deployment package..."
rm -rf lambda-package
mkdir -p lambda-package

# Copy application files
echo "📋 Copying application files..."
cp lambda_handler.py lambda-package/
cp -r services lambda-package/
cp -r templates lambda-package/
cp -r static lambda-package/
cp config.py lambda-package/

# Install dependencies
echo "📚 Installing Python dependencies..."
pip install -r requirements-lambda.txt -t lambda-package/ --no-deps

# Install additional dependencies that might be missing
pip install mangum -t lambda-package/

# Create deployment zip
echo "🗜️  Creating deployment package..."
cd lambda-package
zip -r ../eda-tool-lambda.zip . -x "*.pyc" "__pycache__/*" "*.git*" "*.DS_Store"
cd ..

echo "✅ Deployment package created: eda-tool-lambda.zip"

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

    # Attach basic execution policy
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

    # Attach Secrets Manager policy
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

# Create API Gateway (optional)
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
        "GEMINI_SECRET_NAME":"eda-tool/gemini-api-key"
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
echo "   aws secretsmanager create-secret --name 'eda-tool/gemini-api-key' --secret-string '{\"api_key\":\"YOUR_GEMINI_API_KEY\"}'"
echo ""
echo "2. Your EDA Tool is available at: $API_URL"
echo ""
echo "3. Test the deployment:"
echo "   curl $API_URL"
echo ""
echo "4. Monitor logs:"
echo "   aws logs tail /aws/lambda/$FUNCTION_NAME --follow --region $REGION"
