import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DATA_FILE_PATH = path.join(process.cwd(), "data_store.json");

app.use(express.json());

// Load Initial Seeds
const DEFAULT_USERS = {
  "19122007": {
    name: "Dhawal (Supreme Power)",
    weplayId: "19122007",
    pass: "dhawal19122007",
    role: "supreme",
  },
  "1001": {
    name: "Aravind R.",
    weplayId: "1001",
    pass: "manager123",
    role: "manager",
  },
  "1002": {
    name: "Siddharth Roy",
    weplayId: "1002",
    pass: "super123",
    role: "super_manager",
  },
  "1003": {
    name: "Gaurav K.",
    weplayId: "1003",
    pass: "guest123",
    role: "guest",
  },
};

const DEFAULT_SPONSORS = [
  {
    id: "s1",
    name: "Red Bull Esports India",
    sponsorId: "WP-1201",
    idReported: 45,
    totalInviteGiven: 120,
    coinsValue: 120000,
    totalRedPacket: 200,
    redPacketGiven: 145,
    redPacketToBeGiven: 55,
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedBy: "1001",
  },
  {
    id: "s2",
    name: "ROG Asus South Asia",
    sponsorId: "WP-1502",
    idReported: 25,
    totalInviteGiven: 85,
    coinsValue: 50000,
    totalRedPacket: 83,
    redPacketGiven: 60,
    redPacketToBeGiven: 23,
    updatedAt: new Date().toISOString(),
    updatedBy: "19122007",
  },
  {
    id: "s3",
    name: "OnePlus Community India",
    sponsorId: "WP-1804",
    idReported: 15,
    totalInviteGiven: 42,
    coinsValue: 10000,
    totalRedPacket: 17,
    redPacketGiven: 12,
    redPacketToBeGiven: 5,
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedBy: "1002",
  },
  {
    id: "s4",
    name: "Mortal Gaming Guild",
    sponsorId: "WP-1991",
    idReported: 80,
    totalInviteGiven: 200,
    coinsValue: 250000,
    totalRedPacket: 417,
    redPacketGiven: 390,
    redPacketToBeGiven: 27,
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedBy: "1001",
  },
  {
    id: "s5",
    name: "Cosmic Bytes India",
    sponsorId: "WP-1102",
    idReported: 10,
    totalInviteGiven: 30,
    coinsValue: 8000,
    totalRedPacket: 13,
    redPacketGiven: 5,
    redPacketToBeGiven: 8,
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedBy: "19122007",
  },
];

// Read state safely from local json store
function readDataState(): { users: any; sponsors: any } {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const content = fs.readFileSync(DATA_FILE_PATH, "utf-8");
      const parsed = JSON.parse(content);
      // Ensure supreme is always present and correct
      if (parsed.users && !parsed.users["19122007"]) {
        parsed.users["19122007"] = DEFAULT_USERS["19122007"];
      }
      return {
        users: parsed.users || DEFAULT_USERS,
        sponsors: parsed.sponsors || DEFAULT_SPONSORS,
      };
    }
  } catch (e) {
    console.error("Failed to read JSON storage, using seed instead.", e);
  }
  return { users: { ...DEFAULT_USERS }, sponsors: [...DEFAULT_SPONSORS] };
}

// Write state safely to local json store
function writeDataState(users: any, sponsors: any) {
  try {
    const data = { users, sponsors };
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write to JSON storage.", e);
  }
}

// Load current records on boot
let { users: userStoreValue, sponsors: sponsorStoreValue } = readDataState();
writeDataState(userStoreValue, sponsorStoreValue); // Make sure file exists on startup

/* ================== API ENDPOINTS ================== */

// Fetch sponsors catalog
app.get("/api/sponsors", (req, res) => {
  const state = readDataState();
  res.json(state.sponsors);
});

// Update/Save complete sponsors rows
app.post("/api/sponsors", (req, res) => {
  const { sponsors } = req.body;
  if (!Array.isArray(sponsors)) {
    return res.status(400).json({ error: "Invalid sponsors payload structure" });
  }
  const state = readDataState();
  state.sponsors = sponsors;
  writeDataState(state.users, state.sponsors);
  res.json({ success: true, count: sponsors.length });
});

// Fetch all registered users
app.get("/api/users", (req, res) => {
  const state = readDataState();
  res.json(state.users);
});

// Create/Update complete users directory
app.post("/api/users", (req, res) => {
  const { users } = req.body;
  if (!users || typeof users !== "object") {
    return res.status(400).json({ error: "Invalid users registry payload" });
  }

  // Immutable supreme check enforce
  if (!users["19122007"]) {
    users["19122007"] = DEFAULT_USERS["19122007"];
  } else {
    users["19122007"].role = "supreme";
    users["19122007"].weplayId = "19122007";
    users["19122007"].pass = "dhawal19122007";
  }

  const state = readDataState();
  state.users = users;
  writeDataState(state.users, state.sponsors);
  res.json({ success: true, count: Object.keys(users).length });
});

// Clean status monitor endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "alive", users: Object.keys(readDataState().users).length });
});

/* ================== VITE MIDDLEWARE CONFIGS ================== */
async function bootServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[WePlay Backend Server] Running on http://0.0.0.0:${PORT}`);
  });
}

bootServer();
