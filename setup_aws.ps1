# AWS Setup Helper Script
Write-Host "========================================" -ForegroundColor Green
Write-Host "AWS Configuration Helper" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "STEP 1: Check if AWS CLI is available in new session" -ForegroundColor Yellow
if (Get-Command aws -ErrorAction SilentlyContinue) {
    Write-Host "✓ AWS CLI is installed and available" -ForegroundColor Green
    aws --version
} else {
    Write-Host "✗ AWS CLI not found in PATH. Please:" -ForegroundColor Red
    Write-Host "  1. Close this PowerShell window" -ForegroundColor White
    Write-Host "  2. Open a NEW PowerShell window" -ForegroundColor White
    Write-Host "  3. Navigate back to this directory" -ForegroundColor White
    Write-Host "  4. Run this script again" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "STEP 2: Get AWS Credentials" -ForegroundColor Yellow
Write-Host "Go to: https://console.aws.amazon.com" -ForegroundColor Cyan
Write-Host "1. Click your username (top right) → Security credentials" -ForegroundColor White
Write-Host "2. Scroll to 'Access keys' section" -ForegroundColor White  
Write-Host "3. Click 'Create access key'" -ForegroundColor White
Write-Host "4. Copy the Access Key ID and Secret Access Key" -ForegroundColor White

Write-Host ""
Write-Host "STEP 3: Configure AWS CLI" -ForegroundColor Yellow
Write-Host "Run: aws configure" -ForegroundColor Cyan
Write-Host "Enter your:" -ForegroundColor White
Write-Host "  - AWS Access Key ID" -ForegroundColor White
Write-Host "  - AWS Secret Access Key" -ForegroundColor White
Write-Host "  - Default region: us-east-1" -ForegroundColor White
Write-Host "  - Output format: json" -ForegroundColor White

Write-Host ""
Write-Host "STEP 4: Deploy your project" -ForegroundColor Yellow
Write-Host "npx cdk bootstrap" -ForegroundColor Cyan
Write-Host "npx cdk deploy" -ForegroundColor Cyan

Write-Host ""
Write-Host "Press Enter to continue with configuration..." -ForegroundColor Green
Read-Host

Write-Host "Running AWS configure now..." -ForegroundColor Yellow
aws configure