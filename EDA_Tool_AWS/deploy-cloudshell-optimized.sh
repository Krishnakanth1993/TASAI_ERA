#!/bin/bash

# AWS CloudShell Optimized Deployment Script for EDA Tool
set -e

# Configuration
FUNCTION_NAME="eda-tool-lambda"
REGION="ap-south-1"
RUNTIME="python3.11"
HANDLER="lambda_handler.lambda_handler"
MEMORY_SIZE="1024"
TIMEOUT="300"
ROLE_NAME="eda-tool-lambda-role"
S3_BUCKET="eda-tool-lambda-deployments-$(date +%s)"

echo "🚀 Starting EDA Tool Lambda Deployment in CloudShell (Optimized)..."

# Check if we're in the right directory
if [ ! -f "lambda_handler.py" ]; then
    echo "❌ lambda_handler.py not found. Please run this script from the project root directory."
    exit 1
fi

echo "✅ Found lambda_handler.py"

# Create deployment package directory
echo "�� Creating optimized deployment package..."
rm -rf lambda-package
mkdir -p lambda-package

# Copy only essential application files
echo "📋 Copying essential application files..."
cp lambda_handler.py lambda-package/
cp -r services lambda-package/ 2>/dev/null || echo "⚠️  services directory not found"
cp -r templates lambda-package/ 2>/dev/null || echo "⚠️  templates directory not found"
cp -r static lambda-package/ 2>/dev/null || echo "⚠️  static directory not found"
cp config.py lambda-package/ 2>/dev/null || echo "⚠️  config.py not found"

# Create a minimal requirements file with only essential packages
echo "📚 Installing only essential Python dependencies..."
cat > lambda-package/requirements-minimal.txt << EOF
flask>=3.0.0
pandas>=2.1.0
numpy>=1.26.0
openpyxl>=3.1.0
xlrd>=2.0.0
plotly>=5.17.0
scipy>=1.11.0
scikit-learn>=1.3.0
jinja2>=3.1.0
werkzeug>=3.0.0
google-generativeai>=0.3.0
boto3>=1.34.0
mangum>=0.17.0
EOF

# Install only essential dependencies
pip3 install -r lambda-package/requirements-minimal.txt -t lambda-package/ --no-deps --quiet

# Remove unnecessary files to reduce size
echo "🗑️  Removing unnecessary files to reduce package size..."
find lambda-package -name "*.pyc" -delete
find lambda-package -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find lambda-package -name "*.dist-info" -type d -exec rm -rf {} + 2>/dev/null || true
find lambda-package -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true
find lambda-package -name "test_*" -delete 2>/dev/null || true
find lambda-package -name "*.so" -exec strip {} + 2>/dev/null || true

# Remove large unnecessary files
find lambda-package -name "*.txt" -not -name "requirements-minimal.txt" -delete 2>/dev/null || true
find lambda-package -name "*.md" -delete 2>/dev/null || true
find lambda-package -name "*.rst" -delete 2>/dev/null || true
find lambda-package -name "*.yml" -delete 2>/dev/null || true
find lambda-package -name "*.yaml" -delete 2>/dev/null || true

# Create deployment zip
echo "🗜️  Creating optimized deployment package..."
cd lambda-package
zip -r ../eda-tool-lambda-optimized.zip . -x "*.pyc" "__pycache__/*" "*.git*" "*.DS_Store" >/dev/null
cd ..

PACKAGE_SIZE=$(du -h eda-tool-lambda-optimized.zip | cut -f1)
echo "✅ Optimized package created: eda-tool-lambda-optimized.zip ($PACKAGE_SIZE)"

# Check if package is still too large
PACKAGE_SIZE_BYTES=$(stat -c%s eda-tool-lambda-optimized.zip)
if [ $PACKAGE_SIZE_BYTES -gt 52428800 ]; then  # 50MB in bytes
    echo "⚠️  Package is still large ($PACKAGE_SIZE), using S3 for deployment..."
    
    # Create S3 bucket for deployment
    echo "�� Creating S3 bucket for deployment..."
    aws s3 mb s3://$S3_BUCKET --region $REGION
    
    # Upload package to S3
    echo "📤 Uploading package to S3..."
    aws s3 cp eda-tool-lambda-optimized.zip s3://$S3_BUCKET/
    
    # Use S3 for Lambda deployment
    DEPLOYMENT_METHOD="s3"
    S3_KEY="eda-tool-lambda-optimized.zip"
else
    echo "✅ Package size is acceptable for direct upload"
    DEPLOYMENT_METHOD="direct"
fi

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

    # Add S3 permissions if using S3
    if [ "$DEPLOYMENT_METHOD" = "s3" ]; then
        aws iam attach-role-policy \
            --role-name $ROLE_NAME \
            --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
    fi

    echo "✅ IAM role created: $ROLE_NAME"
    rm trust-policy.json
else
    echo "✅ IAM role already exists: $ROLE_NAME"
fi

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
echo "🔑 Role ARN: $ROLE_ARN"

# Deploy Lambda function
if [ "$DEPLOYMENT_METHOD" = "s3" ]; then
    echo "🆕 Creating Lambda function from S3..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler $HANDLER \
        --code S3Bucket=$S3_BUCKET,S3Key=$S3_KEY \
        --memory-size $MEMORY_SIZE \
        --timeout $TIMEOUT \
        --region $REGION
else
    echo "🆕 Creating Lambda function from direct upload..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler $HANDLER \
        --zip-file fileb://eda-tool-lambda-optimized.zip \
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
echo " API Gateway URL: $API_URL"

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
echo " Cleaning up..."
rm -rf lambda-package
rm -f eda-tool-lambda-optimized.zip

# Clean up S3 bucket if used
if [ "$DEPLOYMENT_METHOD" = "s3" ]; then
    echo "🗑️  Cleaning up S3 bucket..."
    aws s3 rm s3://$S3_BUCKET/ --recursive
    aws s3 rb s3://$S3_BUCKET
fi

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
