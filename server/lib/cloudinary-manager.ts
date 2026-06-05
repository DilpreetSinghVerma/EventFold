/**
 * ============================================================
 * CLOUDINARY ACCOUNT ROTATION MANAGER
 * ============================================================
 * Automatically rotates between multiple free Cloudinary
 * accounts so you NEVER hit the quota limit again.
 *
 * Each account gives 25 GB/month bandwidth.
 * With 4 accounts = 100 GB/month FREE forever.
 *
 * HOW IT WORKS:
 *  1. Before every upload, checks current account usage
 *  2. If usage > 80%, silently switches to next account
 *  3. Continues uploading on the new account
 *  4. Old account resets next month and becomes available again
 *  5. Completely invisible to photographers and their clients
 *
 * HOW TO SET UP:
 *  Create up to 5 Cloudinary accounts using Gmail + trick:
 *    dilpreetsinghverma+cloud1@gmail.com
 *    dilpreetsinghverma+cloud2@gmail.com
 *    dilpreetsinghverma+cloud3@gmail.com
 *    dilpreetsinghverma+cloud4@gmail.com
 *    dilpreetsinghverma+cloud5@gmail.com
 *  All emails arrive in your ONE Gmail inbox!
 *
 *  Then add to .env:
 *    CLOUDINARY_CLOUD_NAME_1=...
 *    CLOUDINARY_API_KEY_1=...
 *    CLOUDINARY_API_SECRET_1=...
 *    CLOUDINARY_CLOUD_NAME_2=...
 *    (etc. up to 5)
 * ============================================================
 */

import { v2 as cloudinary } from "cloudinary";

// ─── Types ────────────────────────────────────────────────

interface CloudinaryAccount {
  index: number;
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

interface AccountUsage {
  credits_used: number;
  credits_usage_percent: number;
  bandwidth_used_gb: number;
  storage_used_gb: number;
  last_checked: Date;
}

// ─── CloudinaryManager Class ──────────────────────────────

class CloudinaryManager {
  private accounts: CloudinaryAccount[] = [];
  private activeIndex: number = 0;
  private usageCache: Map<number, AccountUsage> = new Map();
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // Cache usage for 10 minutes
  private readonly SWITCH_THRESHOLD = 80; // Switch when usage > 80%

  constructor() {
    this.loadAccounts();
  }

  /** Load all configured accounts from environment variables */
  private loadAccounts() {
    // Always load the primary account (CLOUDINARY_CLOUD_NAME without suffix)
    const primary = {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
      apiKey: process.env.CLOUDINARY_API_KEY || "",
      apiSecret: process.env.CLOUDINARY_API_SECRET || "",
    };

    if (primary.cloudName && primary.apiKey && primary.apiSecret) {
      this.accounts.push({ index: 0, ...primary });
    }

    // Load additional accounts (CLOUDINARY_CLOUD_NAME_2, _3, etc.)
    for (let i = 2; i <= 5; i++) {
      const cloudName = process.env[`CLOUDINARY_CLOUD_NAME_${i}`];
      const apiKey = process.env[`CLOUDINARY_API_KEY_${i}`];
      const apiSecret = process.env[`CLOUDINARY_API_SECRET_${i}`];

      if (cloudName && apiKey && apiSecret) {
        this.accounts.push({
          index: i - 1,
          cloudName,
          apiKey,
          apiSecret,
        });
      }
    }

    if (this.accounts.length === 0) {
      throw new Error("No Cloudinary accounts configured! Check your .env file.");
    }

    console.log(`☁️  CloudinaryManager: Loaded ${this.accounts.length} account(s)`);
    this.accounts.forEach((acc, i) => {
      console.log(`   Account ${i + 1}: ${acc.cloudName}`);
    });
  }

  /** Get current active account */
  private getActiveAccount(): CloudinaryAccount {
    return this.accounts[this.activeIndex];
  }

  /** Configure cloudinary SDK with a specific account */
  private configureWith(account: CloudinaryAccount) {
    cloudinary.config({
      cloud_name: account.cloudName,
      api_key: account.apiKey,
      api_secret: account.apiSecret,
    });
  }

  /** Fetch usage for an account from Cloudinary API */
  private async fetchUsage(account: CloudinaryAccount): Promise<AccountUsage | null> {
    try {
      // Temporarily configure cloudinary with this account
      cloudinary.config({
        cloud_name: account.cloudName,
        api_key: account.apiKey,
        api_secret: account.apiSecret,
      });

      const usage = await cloudinary.api.usage();

      const creditsUsed = usage.credits?.usage || 0;
      const creditsLimit = usage.credits?.limit || 25;
      const usagePercent = (creditsUsed / creditsLimit) * 100;

      const result: AccountUsage = {
        credits_used: creditsUsed,
        credits_usage_percent: usagePercent,
        bandwidth_used_gb: (usage.bandwidth?.usage || 0) / (1024 * 1024 * 1024),
        storage_used_gb: (usage.storage?.usage || 0) / (1024 * 1024 * 1024),
        last_checked: new Date(),
      };

      this.usageCache.set(account.index, result);
      return result;
    } catch (err: any) {
      console.error(`CloudinaryManager: Failed to fetch usage for account ${account.index + 1}:`, err.message);
      return null;
    }
  }

  /** Get usage from cache or fetch fresh */
  private async getUsage(account: CloudinaryAccount): Promise<AccountUsage | null> {
    const cached = this.usageCache.get(account.index);
    if (cached) {
      const age = Date.now() - cached.last_checked.getTime();
      if (age < this.CACHE_TTL_MS) {
        return cached; // Return cached value
      }
    }
    return await this.fetchUsage(account);
  }

  /** Find the best available account (lowest usage) */
  private async findBestAccount(): Promise<number> {
    if (this.accounts.length === 1) return 0;

    let bestIndex = this.activeIndex;
    let lowestUsage = Infinity;

    for (let i = 0; i < this.accounts.length; i++) {
      const usage = await this.getUsage(this.accounts[i]);
      if (usage && usage.credits_usage_percent < lowestUsage) {
        lowestUsage = usage.credits_usage_percent;
        bestIndex = i;
      }
    }

    return bestIndex;
  }

  /**
   * Smart switch: Check current account and switch if needed.
   * Called before every upload.
   */
  private async ensureBestAccount(): Promise<CloudinaryAccount> {
    if (this.accounts.length === 1) {
      this.configureWith(this.accounts[0]);
      return this.accounts[0];
    }

    const currentUsage = await this.getUsage(this.getActiveAccount());

    if (currentUsage && currentUsage.credits_usage_percent >= this.SWITCH_THRESHOLD) {
      const oldAccount = this.accounts[this.activeIndex];
      const bestIndex = await this.findBestAccount();

      if (bestIndex !== this.activeIndex) {
        this.activeIndex = bestIndex;
        const newAccount = this.getActiveAccount();
        const newUsage = this.usageCache.get(newAccount.index);

        console.log(`\n☁️  CloudinaryManager: AUTO-SWITCH triggered!`);
        console.log(`   From: ${oldAccount.cloudName} (${currentUsage.credits_usage_percent.toFixed(1)}% used)`);
        console.log(`   To:   ${newAccount.cloudName} (${newUsage?.credits_usage_percent.toFixed(1) || "?"}% used)`);
        console.log(`   Reason: Account exceeded ${this.SWITCH_THRESHOLD}% usage threshold\n`);
      }
    }

    const active = this.getActiveAccount();
    this.configureWith(active);
    return active;
  }

  /**
   * Upload a buffer to the best available Cloudinary account.
   * This is the main method to use instead of cloudinary.uploader.upload_stream
   */
  async uploadBuffer(
    buffer: Buffer,
    options: {
      folder?: string;
      resource_type?: "image" | "video" | "raw" | "auto";
      quality?: string;
      fetch_format?: string;
      eager?: string;
      [key: string]: any;
    } = {}
  ): Promise<any> {
    const account = await this.ensureBestAccount();

    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: options.folder || "flipbook_albums",
        resource_type: options.resource_type || "auto",
        ...options,
      };

      const stream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (result) {
            // Tag result with which account was used (for debugging)
            resolve({ ...result, _cloudAccount: account.cloudName });
          } else {
            reject(error);
          }
        }
      );
      stream.end(buffer);
    });
  }

  /**
   * Generate a signed URL for client-side uploads.
   * Automatically uses the best available account.
   */
  async getSignature(params: { timestamp: number; folder: string; eager?: string }) {
    const account = await this.ensureBestAccount();

    const signature = cloudinary.utils.api_sign_request(
      params,
      account.apiSecret
    );

    return {
      signature,
      timestamp: params.timestamp,
      cloud_name: account.cloudName,
      api_key: account.apiKey,
      folder: params.folder,
    };
  }

  /** Get a status report of all accounts */
  async getStatusReport(): Promise<object> {
    const report = [];
    for (const account of this.accounts) {
      const usage = await this.fetchUsage(account);
      report.push({
        account: account.index + 1,
        cloudName: account.cloudName,
        isActive: account.index === this.activeIndex,
        usage: usage
          ? {
              creditsUsed: usage.credits_used.toFixed(2),
              usagePercent: usage.credits_usage_percent.toFixed(1) + "%",
              bandwidthGB: usage.bandwidth_used_gb.toFixed(2) + " GB",
              storageGB: usage.storage_used_gb.toFixed(2) + " GB",
              status:
                usage.credits_usage_percent >= 100
                  ? "❌ FULL"
                  : usage.credits_usage_percent >= this.SWITCH_THRESHOLD
                  ? "⚠️  HIGH"
                  : "✅ OK",
            }
          : { error: "Could not fetch usage" },
      });
    }
    return {
      totalAccounts: this.accounts.length,
      activeAccount: this.activeIndex + 1,
      accounts: report,
    };
  }
}

// ─── Singleton Export ─────────────────────────────────────

let _manager: CloudinaryManager | null = null;

export function getCloudinaryManager(): CloudinaryManager {
  if (!_manager) {
    _manager = new CloudinaryManager();
  }
  return _manager;
}

export const cloudinaryManager = new Proxy({} as CloudinaryManager, {
  get: (_target, prop) => {
    return (getCloudinaryManager() as any)[prop];
  },
});
