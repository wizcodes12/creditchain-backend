const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  console.log("Starting CreditChain smart contract deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Check deployer balance
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");

  if (balance.lt(ethers.utils.parseEther("0.01"))) {
    throw new Error("Insufficient balance for deployment. Need at least 0.01 ETH");
  }

  try {
    // Deploy CreditScoreRegistry contract
    console.log("\n1. Deploying CreditScoreRegistry...");
    const CreditScoreRegistry = await ethers.getContractFactory("CreditScoreRegistry");
    const creditScoreRegistry = await CreditScoreRegistry.deploy();
    await creditScoreRegistry.deployed();

    console.log("✅ CreditScoreRegistry deployed to:", creditScoreRegistry.address);
    console.log("   Transaction hash:", creditScoreRegistry.deployTransaction.hash);

    // Deploy UserIdentityRegistry contract
    console.log("\n2. Deploying UserIdentityRegistry...");
    const UserIdentityRegistry = await ethers.getContractFactory("UserIdentityRegistry");
    const userIdentityRegistry = await UserIdentityRegistry.deploy();
    await userIdentityRegistry.deployed();

    console.log("✅ UserIdentityRegistry deployed to:", userIdentityRegistry.address);
    console.log("   Transaction hash:", userIdentityRegistry.deployTransaction.hash);

    // Wait for confirmations
    console.log("\n3. Waiting for block confirmations...");
    await creditScoreRegistry.deployTransaction.wait(2);
    await userIdentityRegistry.deployTransaction.wait(2);

    // Get network information
    const network = await ethers.provider.getNetwork();
    const networkName = network.name === "unknown" ? "sepolia" : network.name;

    // Add backend wallet as authorized updater/registrar
    const backendWallet = process.env.PRIVATE_KEY
      ? new ethers.Wallet(process.env.PRIVATE_KEY).address
      : deployer.address;

    console.log("\n4. Setting up permissions...");
    console.log("Backend wallet address:", backendWallet);

    if (backendWallet !== deployer.address) {
      // Add backend wallet as authorized updater for CreditScoreRegistry
      console.log("Adding backend wallet as authorized updater...");
      const addUpdaterTx = await creditScoreRegistry.addAuthorizedUpdater(backendWallet);
      await addUpdaterTx.wait();
      console.log("✅ Backend wallet added as authorized updater");

      // Add backend wallet as authorized registrar for UserIdentityRegistry
      console.log("Adding backend wallet as authorized registrar...");
      const addRegistrarTx = await userIdentityRegistry.addAuthorizedRegistrar(backendWallet);
      await addRegistrarTx.wait();
      console.log("✅ Backend wallet added as authorized registrar");
    }

    // Verify contract deployment
    console.log("\n5. Verifying deployments...");

    const creditStats = await creditScoreRegistry.getContractStats();
    const identityStats = await userIdentityRegistry.getContractStats();

    console.log("CreditScoreRegistry stats - Total records:", creditStats.toString());
    console.log("UserIdentityRegistry stats - Total users:", identityStats.toString());

    // Generate deployment summary
    const deploymentInfo = {
      network: networkName,
      chainId: network.chainId,
      deployer: deployer.address,
      backendWallet: backendWallet,
      contracts: {
        CreditScoreRegistry: {
          address: creditScoreRegistry.address,
          transactionHash: creditScoreRegistry.deployTransaction.hash,
          blockNumber: creditScoreRegistry.deployTransaction.blockNumber,
        },
        UserIdentityRegistry: {
          address: userIdentityRegistry.address,
          transactionHash: userIdentityRegistry.deployTransaction.hash,
          blockNumber: userIdentityRegistry.deployTransaction.blockNumber,
        },
      },
      etherscanUrls: {
        CreditScoreRegistry: `https://${networkName}.etherscan.io/address/${creditScoreRegistry.address}`,
        UserIdentityRegistry: `https://${networkName}.etherscan.io/address/${userIdentityRegistry.address}`,
      },
      deploymentTime: new Date().toISOString(),
    };

    console.log("\n🎉 Deployment completed successfully!");
    console.log("\n📋 Deployment Summary:");
    console.log("=".repeat(50));
    console.log(JSON.stringify(deploymentInfo, null, 2));

    console.log("\n📝 Environment Variables to Update:");
    console.log("=".repeat(50));
    console.log(`CONTRACT_ADDRESS_CREDIT=${creditScoreRegistry.address}`);
    console.log(`CONTRACT_ADDRESS_IDENTITY=${userIdentityRegistry.address}`);

    console.log("\n🔗 Etherscan Links:");
    console.log("=".repeat(50));
    console.log("CreditScoreRegistry:", deploymentInfo.etherscanUrls.CreditScoreRegistry);
    console.log("UserIdentityRegistry:", deploymentInfo.etherscanUrls.UserIdentityRegistry);

    // Save deployment info to file
    const deploymentPath = path.join(__dirname, "..", "deployments", `${networkName}-deployment.json`);
    const deploymentDir = path.dirname(deploymentPath);

    // Create deployments directory if it doesn't exist
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to: ${deploymentPath}`);

    return deploymentInfo;
  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;