const Gdax = require('gdax');
const {PASSPHRASE, API_KEY, API_SECRET} = require('./keys.json');

const createReplacementOrder = require('./src/createReplacementOrder');
const { getExecutedRecords, removeExpiredRecords, removeExecutedRecords, addRecord } = require('./src/orderReducers');

const ui = require('./src/ui');

const API_URI = 'https://api.gdax.com';
const SANDBOX_URI = 'https://api-public.sandbox.gdax.com';

let API_TO_USE = API_URI;
// API_TO_USE = SANDBOX_URL;

const publicClient = new Gdax.PublicClient(API_TO_USE);
const authedClient = new Gdax.AuthenticatedClient(API_KEY, API_SECRET, PASSPHRASE, API_TO_USE);
async function doStuff () {

	let orders = await authedClient.getOrders({limit: 100});

	if (orders.length === 100) {
		let nextPage;
		do {
			try {
				nextPage = await authedClient.getOrders({after: orders[orders.length-1].created_at});
			} catch (e) {
				nextPage = await authedClient.getOrders({after: orders[orders.length-1].created_at});
			}
			orders = [...orders, ...nextPage];
		} while (nextPage.length !== 0);
	}
	console.log(orders);
	// let serverOrders = await new Promise((resolve, reject) => {
	// 	let orders = [];
	// 	function getOrdersAndMaybeResolve () {
	// 		authedClient.getOrders((err, response, data) => {
	// 			if (data.length === 100) {

	// 			}
	// 			console.log(response);
	// 			console.log(data);
	// 			resolve(data);
	// 		});
	// 	}
	// 	getOrdersAndMaybeResolve();
	// });
	// console.log(JSON.stringify(await publicClient.getProductTicker('BTC-USD'), null, 4));
	debugger;
}

doStuff();
