const Gdax = require('gdax');
const {PASSPHRASE, API_KEY, API_SECRET} = require('./keys.json');

const createReplacementOrder = require('./src/createReplacementOrder');
const { getExecutedRecords, removeExpiredRecords, removeExecutedRecords, addRecord } = require('./src/orderReducers');

const API_URI = 'https://api.gdax.com';
const SANDBOX_URI = 'https://api-public.sandbox.gdax.com';

let API_TO_USE = API_URI;
// API_TO_USE = SANDBOX_URL;

const publicClient = new Gdax.PublicClient(API_TO_USE);
const authedClient = new Gdax.AuthenticatedClient(API_KEY, API_SECRET, PASSPHRASE, API_TO_USE);

async function doStuff () {

console.log(await authedClient.getOrders());

console.log(JSON.stringify(await publicClient.getProductTicker('BTC-USD'), null, 4));
debugger;
}

doStuff();
