const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3000;
const mainRouter = require("./routes/index");

app.use(cors());
app.use(express.json());
app.use("/api/v1", mainRouter);
app.listen(PORT, () => {
  console.log("Server listening on Port", PORT);
});
