@echo off
REM Script to package and deploy diagnosis Lambda function

echo Packaging Lambda function...

REM Install dependencies
call npm install

REM Create deployment package
powershell Compress-Archive -Path diagnostic-handler.js,node_modules -DestinationPath diagnosis-lambda.zip -Force

echo Package created: diagnosis-lambda.zip
echo.
echo To deploy to AWS Lambda:
echo 1. Go to AWS Lambda Console
echo 2. Open 'machinery-diagnosis-handler' function
echo 3. Click 'Upload from' - '.zip file'
echo 4. Upload diagnosis-lambda.zip
echo 5. Add environment variables:
echo    - KNOWLEDGE_BASE_ID = MHY2TV9EZO
echo    - USE_KNOWLEDGE_BASE = true
echo    - AWS_REGION = ap-south-1
echo.
echo Or use AWS CLI:
echo aws lambda update-function-code --function-name machinery-diagnosis-handler --zip-file fileb://diagnosis-lambda.zip
