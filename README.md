# Bitcoin bot

This is a simple bot that attempts to exploit the volatility of bitcoin. To do this it places buy and sell orders on GDAX at 1% away from the bidding and asking prices every 30 seconds. Each order expires after one minute so 4 orders are always active.

## Usage

You'll need node and yarn.

Copy `keys.default.json` to `keys.json` and fill it in with your own keys.

```
yarn install
yarn start
```
