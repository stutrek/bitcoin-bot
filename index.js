const Gdax = require('gdax');
const {PASSPHRASE, API_KEY, API_SECRET} = require('./keys.json');

const createReplacementOrders = require('./src/createReplacementOrders');

const API_URI = 'https://api.gdax.com';
const SANDBOX_URI = 'https://api-public.sandbox.gdax.com';

const genericInitialOrder = Object.freeze({
	product_id: 'BTC-USD',
	type: 'limit',
	time_in_force: 'GTT',
	cancel_after: 'min',
	post_only: true
});

const RUN_ID = new Date().toISOString().replace(/\W/g, '-');

const orderConfigs = [{
	percent: 0.001, //0.0025,
	amount: 0.002
},{
	percent: 0.005,
	amount: 0.004
},{
	percent: 0.01,
	amount: 0.006
}];
const amounts = [0.002, 0.004, 0.006];

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

async function placeOrder (order) {
	try {
		return await authedClient.placeOrder(order);
	} catch (e) {
		return await authedClient.placeOrder(order);
	}
}

async function getOrder (order) {
	try {
		return await authedClient.getOrder(order.id);
	} catch (e) {
		return await authedClient.getOrder(order.id);
	}
}

async function lookupPriceAndPlaceOrders (walletId, tick, orderConfig) {
	const ticker = await publicClient.getProductTicker('BTC-USD');
	const ask = parseFloat(ticker.ask);
	const bid = parseFloat(ticker.bid);

	let { percent, amount } = orderConfig;

	let sellPrice = (ask + (ask * percent)).toFixed(2);
	let buyPrice = (bid - (bid * percent)).toFixed(2);

	let buyOrder = {
		...genericInitialOrder,
		side: 'buy',
		price: buyPrice,
		size: amount
	};

	let sellOrder = {
		...genericInitialOrder,
		side: 'sell',
		price: sellPrice,
		size: amount
	};


	let orders = await Promise.all([
		placeOrder(buyOrder),
		placeOrder(sellOrder)
	]);

	return {
		tick,
		ticker,
		orders
	}
}

async function checkForExecutedOrderAndCreateReplacement (state) {
	let orders = await Promise.all(state.orders.map(o => getOrder(o)));
	let executedOrders = orders.filter(o => o.status === 'done' && o.done_reason === 'filled');
	let openOrders = orders.filter(o => o.status === 'open');

	if (executedOrders.length === 0) {
		if (openOrders.length) {
			console.log(`Tick ${state.tick} no executions, trying again in 15 seconds.`);
			setTimeout(() => checkForExecutedOrderAndCreateReplacement(state), 15 * 1000);
		} else {
			console.log(`Tick ${state.tick} no executions`);
		}
		return
	}

	if (executedOrders.length === 2) {
		console.log(`Tick ${state.tick}. Both orders were filled. Not creating replacements.`);
		return;
	}

	let replacementOrders = createReplacementOrders(state, executedOrders);

	let orderInfos = await Promise.all(replacementOrders.map(placeOrder));
	console.log(`Tick ${state.tick}. Placed replacement order(s): ${orderInfos.map(o => `${o.id} @ ${o.price}`).join(' and ')}`);
}

async function placeOrdersAndRepeat (id, tick) {
	let orderConfig = orderConfigs[tick % orderConfigs.length];
	console.log('starting process', new Date().toISOString());
	try {
		let state = await lookupPriceAndPlaceOrders(id, tick, orderConfig);
		console.log(`Tick ${tick}. Orders: `, state.orders.map(o => `${o.id} @ ${o.price}`).join(' and '));
		setTimeout(() => checkForExecutedOrderAndCreateReplacement(state), 15 * 1000);
	} catch (e) {
		console.log('error placing orders');
		console.error(e);
	}
	console.log('complete', new Date().toISOString());
	setTimeout(() => placeOrdersAndRepeat(id, tick+1), (60 / orderConfigs.length) * 1000);
}

btcIdPromise.then(id => placeOrdersAndRepeat(id, 0));
