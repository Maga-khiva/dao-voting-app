#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 DAO Voting DApp - Sepolia Deployment Script${NC}"
echo "=================================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found!${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}Please edit .env with your Sepolia RPC URL and private key${NC}"
    exit 1
fi

# Check if required environment variables are set
if [ -z "$SEPOLIA_RPC_URL" ] || [ -z "$SEPOLIA_PRIVATE_KEY" ]; then
    echo -e "${YELLOW}⚠️  Missing environment variables!${NC}"
    echo "Please set SEPOLIA_RPC_URL and SEPOLIA_PRIVATE_KEY in .env"
    exit 1
fi

echo -e "${GREEN}✓ Environment variables loaded${NC}"

# Compile contracts
echo -e "${BLUE}📦 Compiling smart contracts...${NC}"
npm run compile

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Compilation failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Contracts compiled${NC}"

# Run tests
echo -e "${BLUE}🧪 Running tests...${NC}"
npm run test

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Some tests failed. Continue? (y/n)${NC}"
    read -r response
    if [ "$response" != "y" ]; then
        exit 1
    fi
fi

echo -e "${GREEN}✓ Tests completed${NC}"

# Deploy to Sepolia
echo -e "${BLUE}🌐 Deploying to Sepolia testnet...${NC}"
echo "This may take a minute..."

npx hardhat run scripts/deploy.ts --network sepolia

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Deployment successful!${NC}"
    echo ""
    echo "📝 Next steps:"
    echo "1. Update frontend/src/config/contract.json with new addresses"
    echo "2. Set VITE_SEPOLIA_RPC_URL in frontend/.env"
    echo "3. Run: npm run build"
    echo "4. Deploy to Netlify"
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Sepolia deployment complete!${NC}"
