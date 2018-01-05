const { writeFile, readFileSync } = require('fs');

const Gdax = require('gdax');
const {PASSPHRASE, API_KEY, API_SECRET} = require('./keys.json');

const createReplacementOrder = require('./src/createReplacementOrder');
const { getExecutedRecords, removeExpiredRecords, removeExecutedRecords, addRecord } = require('./src/orderReducers');

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
	percent: 0.0015,
	amount: 0.0015
},{
	percent: 0.0035,
	amount: 0.0025
},{
	percent: 0.0075,
	amount: 0.005
}];
const amounts = [0.002, 0.004, 0.006];

var records = [];
var tick = 0;

try {
	let stateString = readFileSync('./state.json');
	let state = JSON.parse(stateString);
	records = state.records;
	tick = state.tick;
} catch (e) {
	console.log('No state file found');
}

console.log(`Starting on tick ${tick} with ${records.length} records`);


function saveState () {
	let stateString = JSON.stringify({
		records,
		tick
	}, null, 4);

	writeFile('./state.json', stateString, (err) => {
		if (err) {
			console.log('error saving state');
			console.error(err);
		}
	});
}

let API_TO_USE = API_URI;
// API_TO_USE = SANDBOX_URL;

const publicClient = new Gdax.PublicClient(API_TO_USE);
const authedClient = new Gdax.AuthenticatedClient(API_KEY, API_SECRET, PASSPHRASE, API_TO_USE);

function sleep (ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function placeOrder (order, ticker, original=null) {
	let gdaxOrder
	try {
		gdaxOrder = await authedClient.placeOrder(order);
	} catch (e) {
		gdaxOrder = await authedClient.placeOrder(order);
	}

	let record = {
		order: gdaxOrder,
		ticker,
		original
	};

	records = addRecord(records, record);
	if (!record.order.side) {
		console.log('Error placing order.');
		console.log(record.order);
	} else if (original) {
		console.log(`Placed ${record.order.side.toUpperCase().padEnd(4, ' ')} ${record.order.size} @ ${record.order.price} -- ${record.order.id} -- replaces ${original.id}`);
	} else {
		console.log(`Placed ${record.order.side.toUpperCase().padEnd(4, ' ')} ${record.order.size} @ ${record.order.price} -- ${record.order.id}`);
	}

	return record;
}

async function getTicker () {
	try {
		return await publicClient.getProductTicker('BTC-USD');
	} catch (e) {
		return await publicClient.getProductTicker('BTC-USD');
	}
}

async function lookupPriceAndPlaceOrders () {
	const ticker = await getTicker();
	const ask = parseFloat(ticker.ask);
	const bid = parseFloat(ticker.bid);


	return Promise.all(orderConfigs.reduce((acc, orderConfig) => {
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

		let records = [
			placeOrder(buyOrder, ticker),
			placeOrder(sellOrder, ticker)
		];

		return acc.concat(records);
	}, []));
}

async function placeOrders () {
	console.log(`Tick ${tick}. ${new Date().toISOString()}`);
	try {
		await lookupPriceAndPlaceOrders();
		saveState();
	} catch (e) {
		console.log('error placing orders');
		console.error(e);
	}
	if (tick === 0) {
		setTimeout(updateOrders, 2000);
	}
	tick++;
}

async function updateOrders () {
	try {
		const userOrders = await authedClient.getOrders();
		if (userOrders.message) {
			throw userOrders;
		}

		const userFills = await authedClient.getFills();
		if (userFills.message) {
			throw userFills;
		}

		let executedRecords = getExecutedRecords(records, userFills);

		let recordsToReplace = executedRecords.filter(r => r.original === null);

		if (recordsToReplace.length) {
			let currentTicker = await getTicker();
			recordsToReplace.forEach(async record => {
				let order = createReplacementOrder(record, currentTicker);
				placeOrder(order, record.ticker, record.order);
			});
		}

		records = removeExecutedRecords(records, userFills);
		records = removeExpiredRecords(records, userOrders);
		saveState();

		if (records.find(r => r.original === null) === undefined) {
			placeOrders();
		}

		let filledReplacementOrders = executedRecords.filter(r => r.original !== null);
		filledReplacementOrders.forEach(record => {
			let btcNet = record.order.size - record.original.size
			let cashNet = (record.original.size * record.original.price) - (record.order.size * record.order.price);
			if (record.order.side === 'sell') {
				btcNet = btcNet * -1;
				cashNet = cashNet * -1;
			}
			console.log(`Filled replacement ${record.order.side.toUpperCase().padEnd(4, ' ')} ${record.order.size} @ ${record.order.price} -- ${record.order.id} -- Net ${btcNet.toFixed(8)}BTC, $${cashNet.toFixed(2)}.`);
		});

	} catch (e) {
		console.log('Unable to check for records. Will try again in two seconds.')
		console.error(e)
	}

	setTimeout(updateOrders, 2000);
}

updateOrders();
