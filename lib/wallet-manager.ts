import { Keypair, PublicKey, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js"
import * as bip39 from "bip39"
import { derivePath } from "ed25519-hd-key"
import bs58 from "bs58"
import { WalletData } from "./firebase-service" // Import the interface

// Fixed deposit address (should be moved to environment variables)
export const DEPOSIT_ADDRESS = "HLwukYoGmSEvXzE16tfM72BzRQMaNUAK8w1rHeGS11wj"

export class WalletManager {
  private connection: Connection

  constructor() {
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
      "confirmed"
    )
  }

  // ======================
  // WALLET CREATION
  // ======================
  async createWallet(userId: number): Promise<WalletData> {
    try {
      console.log(`[WALLET] Creating new wallet for user ${userId}`)

      // Generate new mnemonic
      const mnemonic = bip39.generateMnemonic()
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error("Generated invalid mnemonic")
      }

      // Derive keypair from mnemonic
      const seed = await bip39.mnemonicToSeed(mnemonic)
      const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString("hex")).key
      const keypair = Keypair.fromSeed(derivedSeed)

      // Convert to importable formats
      const privateKeyBase58 = bs58.encode(keypair.secretKey)
      const publicKey = keypair.publicKey.toString()

      // Debug logs (truncated for security)
      console.log(`[WALLET] Created wallet for user ${userId}`)
      console.log(`[WALLET] Public Key: ${publicKey}`)
      console.log(`[WALLET] Private Key (truncated): ${privateKeyBase58.substring(0, 5)}...`)
      console.log(`[WALLET] Seed Phrase (truncated): ${mnemonic.split(' ').slice(0, 2).join(' ')}...`)

      return {
        publicKey,
        privateKey: privateKeyBase58,
        seedPhrase: mnemonic,
        userId: userId.toString(),
        createdAt: new Date(),
        lastUsed: new Date()
      }
    } catch (error) {
      console.error("[WALLET] Error creating wallet:", error)
      throw new Error("Failed to create wallet")
    }
  }

  // ======================
  // SEED PHRASE IMPORT
  // ======================
  async importFromSeedPhrase(seedPhrase: string, userId: number): Promise<WalletData> {
    try {
      console.log(`[WALLET] Importing from seed phrase for user ${userId}`)

      // Clean and validate seed phrase
      const cleanSeedPhrase = seedPhrase.trim().toLowerCase().replace(/\s+/g, ' ')
      
      if (!bip39.validateMnemonic(cleanSeedPhrase)) {
        throw new Error("Invalid seed phrase - must be 12-24 valid bip39 words")
      }

      // Derive keypair
      const seed = await bip39.mnemonicToSeed(cleanSeedPhrase)
      const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString("hex")).key
      const keypair = Keypair.fromSeed(derivedSeed)

      // Convert to importable formats
      const privateKeyBase58 = bs58.encode(keypair.secretKey)
      const publicKey = keypair.publicKey.toString()

      // Debug logs
      console.log(`[WALLET] Successfully imported wallet: ${publicKey}`)
      console.log(`[WALLET] Private Key (truncated): ${privateKeyBase58.substring(0, 5)}...`)
      console.log(`[WALLET] Seed Phrase (truncated): ${cleanSeedPhrase.split(' ').slice(0, 2).join(' ')}...`)

      return {
        publicKey,
        privateKey: privateKeyBase58,
        seedPhrase: cleanSeedPhrase,
        userId: userId.toString(),
        createdAt: new Date(),
        lastUsed: new Date()
      }
    } catch (error) {
      console.error("[WALLET] Error importing from seed phrase:", error)
      throw new Error(`Seed phrase import failed: ${error.message}`)
    }
  }

  // ======================
  // PRIVATE KEY IMPORT
  // ======================
  async importFromPrivateKey(privateKeyString: string, userId: number): Promise<WalletData> {
    try {
      console.log(`[WALLET] Importing from private key for user ${userId}`)

      // Clean input
      const cleanPrivateKey = privateKeyString.trim()

      // Try different import methods
      const keypair = this.parsePrivateKey(cleanPrivateKey)
      const privateKeyBase58 = bs58.encode(keypair.secretKey)
      const publicKey = keypair.publicKey.toString()

      // Debug logs
      console.log(`[WALLET] Successfully imported wallet: ${publicKey}`)
      console.log(`[WALLET] Private Key (truncated): ${privateKeyBase58.substring(0, 5)}...`)

      return {
        publicKey,
        privateKey: privateKeyBase58,
        seedPhrase: null, // Explicitly null for private key imports
        userId: userId.toString(),
        createdAt: new Date(),
        lastUsed: new Date()
      }
    } catch (error) {
      console.error("[WALLET] Error importing from private key:", error)
      throw new Error(`Private key import failed: ${error.message}`)
    }
  }

  // ======================
  // PRIVATE KEY PARSING
  // ======================
  private parsePrivateKey(input: string): Keypair {
    try {
      // Method 1: Base58 format
      try {
        const privateKeyBytes = bs58.decode(input)
        if (privateKeyBytes.length === 64) {
          return Keypair.fromSecretKey(privateKeyBytes)
        }
      } catch {}

      // Method 2: JSON array format
      try {
        const parsed = JSON.parse(input)
        if (Array.isArray(parsed) && parsed.length === 64) {
          return Keypair.fromSecretKey(new Uint8Array(parsed))
        }
      } catch {}

      // Method 3: Comma-separated values
      try {
        const values = input.split(',').map(v => parseInt(v.trim()))
        if (values.length === 64 && values.every(v => !isNaN(v))) {
          return Keypair.fromSecretKey(new Uint8Array(values))
        }
      } catch {}

      throw new Error("Unrecognized private key format")
    } catch (error) {
      console.error("[WALLET] Private key parsing failed:", error)
      throw new Error("Invalid private key format. Must be base58, JSON array, or comma-separated values")
    }
  }

  // ======================
  // BALANCE CHECKING
  // ======================
  async getBalance(publicKey: string): Promise<number> {
    const endpoints = [
      "https://api.mainnet-beta.solana.com",
      "https://solana-api.projectserum.com",
      "https://rpc.ankr.com/solana"
    ]

    for (const endpoint of endpoints) {
      try {
        const connection = new Connection(endpoint, "confirmed")
        const balance = await connection.getBalance(new PublicKey(publicKey))
        const solBalance = balance / LAMPORTS_PER_SOL
        console.log(`[WALLET] Balance for ${publicKey}: ${solBalance} SOL (via ${endpoint})`)
        return solBalance
      } catch (error) {
        console.warn(`[WALLET] Failed to get balance from ${endpoint}:`, error.message)
      }
    }

    throw new Error("All RPC endpoints failed")
  }

  // ======================
  // TRANSACTION METHODS
  // ======================
  async sendTransaction(from: string, to: string, amount: number, userId: number) {
    // Implementation note:
    // In production, you would:
    // 1. Retrieve private key from secure storage
    // 2. Create and sign transaction
    // 3. Send to network
    // This is just a placeholder implementation

    console.log(`[WALLET] Simulating transaction: ${amount} SOL from ${from} to ${to}`)
    return {
      signature: "simulated-tx-" + Date.now(),
      success: true
    }
  }

  getDepositAddress(): string {
    return DEPOSIT_ADDRESS
  }
}