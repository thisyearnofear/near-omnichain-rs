import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OmnibridgeService } from "./services/omnibridgeService.js";
import { ChainlinkCCIPService } from "./services/chainlinkCCIP.js";
import { TransactionMonitor } from "./services/transactionMonitor.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Services
const omnibridge = new OmnibridgeService();
const chainlinkCCIP = new ChainlinkCCIPService();
const txMonitor = new TransactionMonitor();

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Bridge status
app.get("/api/bridge/status", async (req, res) => {
  try {
    const omnibridgeStatus = await omnibridge.getStatus();
    const ccipStatus = await chainlinkCCIP.getStatus();

    res.json({
      omnibridge: omnibridgeStatus,
      ccip: ccipStatus,
      ready: omnibridgeStatus.ready && ccipStatus.ready,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stage 1: NEAR → Ethereum via Omnibridge
app.post("/api/bridge/near-to-ethereum", async (req, res) => {
  try {
    const { amount, recipient, nearAccountId, nearSignature } = req.body;

    if (!amount || !recipient || !nearAccountId || !nearSignature) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const result = await omnibridge.transferToChain({
      amount,
      destinationChain: "ethereum",
      recipient,
      nearAccountId,
      nearSignature,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Direct: NEAR → Base via Omnibridge (recommended)
app.post("/api/bridge/near-to-base", async (req, res) => {
  try {
    const { amount, recipient, nearAccountId, nearSignature } = req.body;

    if (!amount || !recipient || !nearAccountId || !nearSignature) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const result = await omnibridge.transferToChain({
      amount,
      destinationChain: "base",
      recipient,
      nearAccountId,
      nearSignature,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stage 2: Ethereum → Base via Chainlink CCIP
app.post("/api/bridge/ethereum-to-base", async (req, res) => {
  try {
    const { amount, recipient, ethereumTxHash } = req.body;

    if (!amount || !recipient || !ethereumTxHash) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const result = await chainlinkCCIP.transferToBase({
      amount,
      recipient,
      ethereumTxHash,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transaction status
app.get("/api/transaction/:txHash", async (req, res) => {
  try {
    const { txHash } = req.params;
    const status = await txMonitor.getTransactionStatus(txHash);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Legacy two-stage bridge (NEAR → Ethereum → Base)
// NOTE: Direct NEAR → Base via Omnibridge is now recommended
app.post("/api/bridge/two-stage-legacy", async (req, res) => {
  try {
    const { amount, recipient, nearAccountId, nearSignature } = req.body;

    if (!amount || !recipient || !nearAccountId || !nearSignature) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Stage 1: NEAR → Ethereum via Omnibridge
    const stage1Result = await omnibridge.transferToChain({
      amount,
      destinationChain: "ethereum",
      recipient: process.env.ETHEREUM_BRIDGE_ADDRESS, // Intermediate address
      nearAccountId,
      nearSignature,
    });

    if (!stage1Result.success) {
      return res
        .status(500)
        .json({ error: "Stage 1 failed", details: stage1Result });
    }

    // Wait for confirmation
    await txMonitor.waitForConfirmation(stage1Result.txHash, "ethereum");

    // Stage 2: Ethereum → Base via Chainlink CCIP
    const stage2Result = await chainlinkCCIP.transferToBase({
      amount,
      recipient,
      ethereumTxHash: stage1Result.txHash,
    });

    res.json({
      success: stage2Result.success,
      stage1: stage1Result,
      stage2: stage2Result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Modern single-stage bridge (NEAR → Base direct via Omnibridge)
app.post("/api/bridge/omnibridge", async (req, res) => {
  try {
    const {
      amount,
      destinationChain,
      recipient,
      nearAccountId,
      nearSignature,
    } = req.body;

    if (
      !amount ||
      !destinationChain ||
      !recipient ||
      !nearAccountId ||
      !nearSignature
    ) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const result = await omnibridge.transferToChain({
      amount,
      destinationChain,
      recipient,
      nearAccountId,
      nearSignature,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Omni Transaction Backend running on port ${PORT}`);
  console.log(`🌉 NEAR Omnibridge: ${process.env.NEAR_NETWORK}`);
  console.log(`⛓️  Chainlink CCIP: Ready`);
});
