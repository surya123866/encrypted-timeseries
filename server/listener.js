const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const crypto = require("crypto");

const mongoose = require("mongoose");
mongoose
  .connect("mongodb://127.0.0.1:27017/myDatabase", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

const TimerSeriesDb = new mongoose.Schema({
  name: String,
  origin: String,
  destination: String,
  secret_key: String,
  timestamp: Date,
});

const DataModel = mongoose.model("Data", TimerSeriesDb);

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

io.on("connection", (socket) => {
  socket.on("dataStream", (encryptedStream) => {
    const passkey = "secretEncrypt@2023";

    const messages = encryptedStream.split("|");
    for (const encryptedMessage of messages) {
      const decipher = crypto.createDecipher("aes-256-ctr", passkey);
      let decryptedMessage;
      try {
        decryptedMessage =
          decipher.update(encryptedMessage, "hex", "utf8") +
          decipher.final("utf8");
      } catch (error) {
        console.error("Decryption error:", error);
        continue; // Skip this message if decryption fails
      }

      const payload = JSON.parse(decryptedMessage);
      console.log(payload);
      // Validate data integrity using the secret_key

      const calculatedSecretKey = crypto
        .createHash("sha256")
        .update(JSON.stringify(payload))
        .digest("hex");
      if (calculatedSecretKey === payload.secret_key) {
        // Data is valid, add a timestamp and save to MongoDB
        payload.timestamp = new Date();
        const newData = new DataModel(payload);
        newData
          .save()
          .then(() => {
            console.log("Data saved:", payload);
          })
          .catch((err) => {
            console.error("Error saving data:", err);
          });
      } else {
        console.warn("Data integrity compromised, skipping:", payload);
      }
    }
  });
});

server.listen(3001, () => {
  console.log("Listener Service listening on port 3001");
});
