const socket = require("socket.io-client")("http://localhost:3001");
const crypto = require("crypto");
const data = require("./data.json");

// Function to generate a random AES encryption key (for demonstration purposes only)
const generateRandomAesKey = () => crypto.randomBytes(32).toString("hex");

function generateEncryptedMessage() {
  const randomIndex = Math.floor(Math.random() * data.names.length);
  const name = data.names[randomIndex];
  const origin = getRandomCity();
  const destination = getRandomCity();

  const originalMessage = { name, origin, destination };
  const secret_key = crypto
    .createHash("sha256")
    .update(JSON.stringify(originalMessage))
    .digest("hex");
  const payload = { ...originalMessage, secret_key };
  const passkey = "your_aes_passkey";

  const cipher = crypto.createCipher("aes-256-ctr", passkey);
  let encryptedMessage =
    cipher.update(JSON.stringify(payload), "utf8", "hex") + cipher.final("hex");
  return encryptedMessage;
}

function getRandomCity() {
  const randomIndex = Math.floor(Math.random() * data.cities.length);
  return data.cities[randomIndex];
}

// Function to emit a data stream every 10 seconds
function emitDataStream() {
  const messageStream = [];
  const messageCount = Math.floor(Math.random() * 451) + 49;

  for (let i = 0; i < messageCount; i++) {
    messageStream.push(generateEncryptedMessage());
  }

  socket.emit("dataStream", messageStream.join("|"));
}

// Error handling for the socket connection
socket.on("connect", () => {
  console.log("Connected to the server");
  setInterval(emitDataStream, 10000); // Emit data stream every 10 seconds
});

socket.on("disconnect", () => {
  console.log("Disconnected from the server");
});

socket.on("error", (error) => {
  console.error("Socket error:", error);
});

// Handle Ctrl+C to gracefully close the socket connection
process.on("SIGINT", () => {
  socket.disconnect();
  process.exit(0);
});
