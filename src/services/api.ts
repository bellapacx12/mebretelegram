import axios from "axios";
import WebSocket from "ws"; // Node WebSocket library
const telebirr = require("telebirr-receipt");

const API_BASE =
  process.env.BACKEND_URL || "https://mebrebackend.onrender.com/api";
const WS_BASE = process.env.BACKEND_WS || "wss://mebrebackend.onrender.com/ws";
const verify_BASE =
  process.env.VERIFY_URL ||
  "https://smsverifierapi.onrender.com/api/verify-deposit";
export const api = {
  // ----------------------
  // User APIs
  // ----------------------
  async checkUser(telegramId: number) {
    try {
      const res = await axios.get(`${API_BASE}/users/${telegramId}`);
      return res.status === 200;
    } catch (err: any) {
      if (err.response?.status === 404) return false;
      throw err;
    }
  },

  async registerUser(user: {
    telegram_id: number;
    username: string;
    phone: string;
  }) {
    const res = await axios.post(`${API_BASE}/users`, user);
    return res.data;
  },

  async updatePhone(telegramId: number, phone: string) {
    const res = await axios.put(`${API_BASE}/users/${telegramId}/phone`, {
      phone,
    });
    return res.data;
  },

  async getUser(telegramId: number) {
    try {
      const res = await axios.get(`${API_BASE}/users/${telegramId}`);
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  },
  async verifyDeposit(data: {
    userId: number;
    sms: string;
    expectedAmount: number;
    reference: string;
  }) {
    try {
      // Step 1: Call the SMS verifier API
      const verifyRes = await axios.post(
        verify_BASE,
        { body: data.sms },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (verifyRes.data.status !== "success") {
        // Verification failed
        return {
          success: false,
          message: verifyRes.data.message || "Verification failed",
        };
      }

      console.log("✅ SMS verification passed");

      // Step 2: Update balance in your backend
      const updateRes = await axios.post(
        `${API_BASE}/deposit/verify`,
        {
          userId: data.userId,
          expectedAmount: data.expectedAmount,
          reference: data.reference,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      return {
        success: true,
        amount: data.expectedAmount,
        data: updateRes.data,
      };
    } catch (err: any) {
      console.error("❌ verifyDeposit error:", err.message);
      return { success: false, message: err.message || "Unknown error" };
    }
  },
  async verifyTelebirrReceipt(data: {
    userId: number;
    receiptNo: string;
    expectedAmount: number;
    expectedTo: string;
  }) {
    try {
      const telebirr = require("telebirr-receipt");

      process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

      // 1. Load receipt
      const html = await telebirr.utils.loadReceipt({
        receiptNo: data.receiptNo,
      });

      // 2. Parse
      const parsed = telebirr.utils.parseFromHTML(html);

      console.log("📄 Parsed receipt:", parsed);

      // 3. Validate (robust version)
      const isValid =
        Number(parsed.settled_amount) === data.expectedAmount &&
        parsed.to?.toLowerCase().includes(data.expectedTo.toLowerCase());

      if (!isValid) {
        return {
          success: false,
          message: "Receipt verification failed",
        };
      }

      console.log("✅ Receipt verification passed");

      // 4. Update backend
      const updateRes = await axios.post(`${API_BASE}/deposit/verify`, {
        userId: data.userId,
        expectedAmount: data.expectedAmount,
        reference: data.receiptNo,
      });

      return {
        success: true,
        amount: data.expectedAmount,
        data: updateRes.data,
      };
    } catch (err: any) {
      console.error("❌ verifyTelebirrReceipt error:", err.message);
      return { success: false, message: err.message || "Unknown error" };
    }
  },
  deposit: async (data: any) => axios.post(`${API_BASE}/deposit`, data),
  withdraw: async (data: any) => axios.post(`${API_BASE}/withdraw`, data),
  buyTicket: async (data: any) => axios.post(`${API_BASE}/tickets`, data),

  // ----------------------
  // WebSocket lobby
  // ----------------------
  connectLobby: (stake: number, telegramId: number) => {
    const wsUrl = `${WS_BASE}/${stake}?user=${telegramId}`;
    const ws = new WebSocket(wsUrl);

    ws.on("open", () => {
      console.log(
        `[WS] Connected to lobby for stake ${stake}, user ${telegramId}`,
      );
    });

    ws.on("message", (msg: { toString: () => any }) => {
      console.log(
        `[WS] Lobby message for user ${telegramId}: ${msg.toString()}`,
      );
    });

    ws.on("close", () => {
      console.log(`[WS] Connection closed for user ${telegramId}`);
    });

    ws.on("error", (err: any) => {
      console.error(`[WS] Error for user ${telegramId}:`, err);
    });

    return ws;
  },
};
