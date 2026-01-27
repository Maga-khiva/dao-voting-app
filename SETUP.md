# Setup Instructions

## Prerequisites Installation

Your web3 project structure is ready, but you need to install Node.js first.

### Install Node.js

1. **Using nvm (Recommended)**:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.zshrc
nvm install node
nvm use node
```

2. **Or download from**: https://nodejs.org/

### After Node.js is installed:

```bash
cd /Users/macbookpro/Desktop/web3
npm install
npm run compile
npm run test
```

## Project Ready

Your web3 project has been scaffolded with:

- ✅ Hardhat configuration for smart contract development
- ✅ Counter.sol - Example smart contract
- ✅ Test suite for Counter contract
- ✅ Deploy script for smart contracts
- ✅ TypeScript support
- ✅ Environment configuration template

## Next Steps

1. Install Node.js using one of the methods above
2. Run `npm install` in the project directory
3. Run `npm run compile` to compile contracts
4. Run `npm run test` to run tests
5. Customize the Counter contract or add your own contracts to `contracts/`

## Available Commands

Once Node.js is installed:
- `npm run compile` - Compile Solidity contracts
- `npm run test` - Run contract tests  
- `npm run deploy` - Deploy to local network
- `npm run dev` - Start local blockchain and monitor
