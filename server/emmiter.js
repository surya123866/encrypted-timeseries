const socket = require("socket.io-client")("http://localhost:3001");
const crypto = require("crypto");
const data = require("./data.json");

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

  // Use a secure key management system to generate and manage keys in production.
  //const passkey = crypto.randomBytes(32); // Generate a 256-bit (32-byte) random key
  const passkey = "secretEncrypt@2023";

  const iv = crypto.randomBytes(16); // Generate a random initialization vector
  const cipher = crypto.createCipheriv("aes-256-ctr", passkey, iv);
  const encryptedPayload = Buffer.concat([
    iv,
    cipher.update(JSON.stringify(payload)),
    cipher.final(),
  ]);
  return encryptedPayload.toString("hex");
}

function getRandomCity() {
  const randomIndex = Math.floor(Math.random() * data.cities.length);
  return data.cities[randomIndex];
}

function emitDataStream() {
  const messageStream = [];
  const messageCount = Math.floor(Math.random() * 451) + 49;

  for (let i = 0; i < messageCount; i++) {
    messageStream.push(generateEncryptedMessage());
  }

  socket.emit("dataStream", messageStream.join("|"));
}

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

process.on("SIGINT", () => {
  socket.disconnect();
  process.exit(0);
});
