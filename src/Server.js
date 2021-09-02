const axios = require("axios");
// const querystring = require("querystring");
const crypto = require("crypto");

// Credenciais de teste
/**
 * Ao criar a carteira pra produção, o procedimento é o mesmo. Somente trocar as
 * credenciais
 */
const API_KEY =
  "CIwBZdrtq3YBBIMcFvkWqOt2pdroSSQNOwY4dndz2VHTQD66eNaji06galAuMdHL";
const API_SECRET =
  "4ADs1ZJc2E02RFm9AWdgo20T05ChfZI5fDNNslNDHaO4sW9bnp3blnPb33uMBsSu";

const app = require("express")();

app.use(require("cors")());

// localhost:3001/BUY/BTCUSDT/0.01
app.post("/:side/:symbol/:quantity", (req, res) => {
  const { side, symbol, quantity } = req.params;

  const data = {
    symbol,
    side,
    quantity,
    type: "MARKET",
    timestamp: Date.now(),
    recvWindow: 60000,
  };

  const signature = crypto
    .createHmac("sha256", API_SECRET)
    .update(new URLSearchParams(data).toString())
    .digest("hex");

  const newData = { ...data, signature };

  // Em produção: api.binance.com/api/v3/order?
  const url =
    "https://testnet.binance.vision/api/v3/order?" +
    new URLSearchParams(newData).toString();

  axios
    .post(url, null, { headers: { "X-MBX-APIKEY": API_KEY } })
    .then((result) => {
      console.log(result.data);
      res.json(result.data);
    })
    .catch((err) => {
      console.error(err.response.data);
      res.sendStatus(500);
    });
});

app.listen(3001, () => {
  console.log("Server is running");
});
