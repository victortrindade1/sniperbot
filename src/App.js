import React, { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import axios from "axios";

import "./App.css";

function App() {
  // States
  const [ticker, setTicker] = useState({});
  const [tradingView, setTradingView] = useState({});
  const [config, setConfig] = useState({
    buy: 0,
    sell: 0,
    side: "BUY",
    symbol: "BTCUSDT",
  });
  const [profit, setProfit] = useState({
    value: 0,
    perc: 0,
    lastBuy: 0,
  });

  // Stream da Binance
  /**
   * Valor da moeda em tempo real
   */
  const { lastJsonMessage } = useWebSocket(
    "wss://stream.binance.com:9443/stream?streams=" +
      config.symbol.toLowerCase() +
      "@ticker",
    {
      onMessage: () => {
        if (lastJsonMessage && lastJsonMessage.data) {
          if (
            lastJsonMessage.stream ===
            config.symbol.toLowerCase() + "@ticker"
          ) {
            setTicker(lastJsonMessage.data);
            processData(lastJsonMessage.data);
          }
        }
      },
      onError: (event) => {
        alert("Erro: " + event);
      },
    }
  );

  // Trading View
  /**
   * Chart candles 1min
   */
  useEffect(() => {
    const tv = new window.TradingView.widget({
      autosize: true,
      symbol: "BINANCE:" + config.symbol,
      interval: "60",
      timezone: "America/Sao_Paulo",
      theme: "dark",
      style: "1",
      locale: "br",
      toolbar_bg: "#f1f3f6",
      enable_publishing: false,
      allow_symbol_change: true,
      details: true,
      container_id: "tradingview_696b0",
    });

    setTradingView(tv);
  }, [config.symbol]);

  // Change criptos
  function onSymbolChange(event) {
    setConfig((prevState) => ({ ...prevState, symbol: event.target.value }));
  }

  // Change inputs
  function onValueChange(event) {
    setConfig((prevState) => ({
      ...prevState,
      [event.target.id]: parseFloat(event.target.value),
    }));
  }

  // Verifica se compra ou vende
  function processData(ticker) {
    const lastPrice = parseFloat(ticker.c);

    // Hora de comprar
    if (config.side === "BUY" && config.buy > 0 && lastPrice <= config.buy) {
      setProfit({
        value: profit.value,
        perc: profit.perc,
        lastBuy: lastPrice,
      });

      buyNow();
      console.log("BUY: " + lastPrice);
      config.side = "SELL";

      // Hora de vender
    } else if (
      config.side === "SELL" &&
      config.sell > profit.lastBuy &&
      lastPrice >= config.sell
    ) {
      const lastProfit = lastPrice - profit.lastBuy;

      setProfit({
        value: profit.value + lastProfit,
        perc: profit.perc + ((lastPrice * 100) / profit.lastBuy - 100),
        lastBuy: 0,
      });

      sellNow();
      console.log("SELL: " + lastPrice);
      config.side = "BUY";
    }
  }

  function buyNow() {
    // Quantidade = 0,01 * valor
    axios
      .post("http://localhost:3001/BUY/" + config.symbol + "/0.01")
      .then((result) => console.log(result.data))
      .catch((err) => console.error(err));
  }

  function sellNow() {
    axios
      .post("http://localhost:3001/SELL/" + config.symbol + "/0.01")
      .then((result) => console.log(result.data))
      .catch((err) => console.error(err));
  }

  return (
    <div>
      <h1>Sniper Bot</h1>
      <div className='tradingview-widget-container'>
        <div id='tradingview_696b0'></div>
      </div>
      <div className='dashboard'>
        <div>
          <b>Snipe:</b>
          <br />
          Symbol:{" "}
          <select
            id='symbol'
            defaultValue={config.symbol}
            onChange={onSymbolChange}
          >
            <option>BTCUSDT</option>
            <option>ETHUSDT</option>
          </select>
          <br />
          Buy at:{" "}
          <input
            type='number'
            id='buy'
            defaultValue={config.buy}
            onChange={onValueChange}
          />
          <br />
          Sell at:{" "}
          <input
            type='number'
            id='sell'
            defaultValue={config.sell}
            onChange={onValueChange}
          />
          <br />
        </div>
        <div>
          <b>Profit:</b>
          <br />
          Profit: {profit && profit.value.toFixed(8)}
          <br />
          Profit %: {profit && profit.perc.toFixed(2)}
          <br />
        </div>
        <div>
          <b>Ticker 24h:</b>
          <br />
          Open: {ticker && ticker.o}
          <br />
          High: {ticker && ticker.h}
          <br />
          Low: {ticker && ticker.l}
          <br />
          Last: {ticker && ticker.c}
          <br />
          Change %: {ticker && ticker.P}
        </div>
      </div>
    </div>
  );
}

export default App;
