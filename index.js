const Gdax = require('gdax');
const {PASSPHRASE, API_KEY, API_SECRET} = require('./keys.json');

const API_URI = 'https://api.gdax.com';
const SANDBOX_URI = 'https://api-public.sandbox.gdax.com';

const genericOrder = Object.freeze({
	size: 0.0001,
	product_id: 'BTC-USD',
	type: 'limit',
	time_in_force: 'GTT',
	cancel_after: 'min',
	post_only: true
})

let API_TO_USE = API_URI;
// API_TO_USE = SANDBOX_URL;

const publicClient = new Gdax.PublicClient(API_TO_USE);
const authedClient = new Gdax.AuthenticatedClient(API_KEY, API_SECRET, PASSPHRASE, API_TO_USE);

const btcIdPromise = authedClient
.getAccounts()
.then(data => {
	return data.find(a => a.currency === 'BTC').id;
})
.then(id => authedClient.getAccount(id));

async function lookupPriceAndPlaceOrders (walletId) {
	const currentTicker = await publicClient.getProductTicker('BTC-USD');

	console.log(JSON.stringify(currentTicker, null, 4));
	const ask = parseFloat(currentTicker.ask);
	const bid = parseFloat(currentTicker.bid);

	let onePercentUp = (ask + (ask * 0.01)).toFixed(2);
	let onePercentDown = (bid - (bid * 0.01)).toFixed(2);

	let buyOrder = {
		...genericOrder,
		side: 'buy',
		price: onePercentDown,
	};

	let sellOrder = {
		...genericOrder,
		side: 'sell',
		price: onePercentUp
	};

	console.log('placing orders', buyOrder, sellOrder);

	return Promise.all([
		authedClient.placeOrder(buyOrder),
		authedClient.placeOrder(sellOrder)
	])
}

async function placeOrdersAndRepeat (id) {
	console.log('starting process', new Date().toISOString());
	try {
		let orders = await lookupPriceAndPlaceOrders(id);
		console.log('orders', orders);
	} catch (e) {
		console.log('error placing orders');
		console.error(e);
	}
	console.log('complete', new Date().toISOString());
	setTimeout(() => placeOrdersAndRepeat(id), 30 * 1000);
}

btcIdPromise.then(placeOrdersAndRepeat)