const ethers = require("ethers");
const fs = require("fs");

async function deploy() {
  // Connect to hardhat
  const provider = new ethers.JsonRpcProvider("http://localhost:8545");
  
  // Get accounts
  const accounts = await provider.listAccounts();
  const signer = provider.getSigner ? provider.getSigner() : accounts[0];

  console.log("📝 Reading contract ABI...");
  const artifact = JSON.parse(
    fs.readFileSync(
      "/Users/macbookpro/Desktop/web3/artifacts/contracts/Counter.sol/ProposalVoting.json",
      "utf8"
    )
  );

  console.log("🚀 Deploying ProposalVoting...");
  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    signer
  );

  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ Deployed to:", address);

  // Test the contract
  console.log("🧪 Testing owner() call...");
  const owner = await contract.owner();
  console.log("✅ Owner:", owner);

  // Save contract info
  const network = await provider.getNetwork();
  const contractInfo = {
    address: address,
    network: network.name,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    "/Users/macbookpro/Desktop/web3/frontend/src/config/contract.json",
    JSON.stringify(contractInfo, null, 2)
  );

  console.log("📁 Contract info saved");
  process.exit(0);
}

deploy().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
