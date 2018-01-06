const { writeFile, readFileSync } = require('fs');

const Gdax = require('gdax');
const {PASSPHRASE, API_KEY, API_SECRET} = require('./keys.json');

const createReplacementOrder = require('./src/createReplacementOrder');
const { getExecutedRecords, removeExpiredRecords, removeExecutedRecords, addRecord } = require('./src/orderReducers');

const ui = require('./src/ui');

const machine = (() => {
	try {
		let data = JSON.parse(readFileSync('./machine.config.json'));
		console.log(data);
		return data;
	} catch (e) {
		return {
			isDev: false
		};
	}
})();

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
	replacementPercent: 0.0045,
	amount: 0.0015
},{
	percent: 0.0035,
	replacementPercent: 0.0101,
	amount: 0.0025
},{
	percent: 0.0075,
	replacementPercent: 0.0225,
	amount: 0.005
}];
const amounts = [0.002, 0.004, 0.006];

var records = [];
var tick = 0;

try {
	let stateString = readFileSync('./state.json');
	let state = JSON.parse(stateString);
	console.log(`Starting on tick ${tick}`);

	state.records = state.records.map(r => {
		if (r.config) {
			return r;
		}
		return {
			...r,
			config: orderConfigs[0]
		};
	})


	ui.printState(state);
	records = state.records;
	tick = state.tick;
} catch (e) {
	console.log('No state file found');
}



function saveState () {
	ui.printState({
		records,
		tick
	});
	let stateString = JSON.stringify({
		records,
		tick
	}, null, 4);

	writeFile('./state.json', stateString, (err) => {
		if (err) {
			ui.printError('saving state', err);
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

var devOrderId = 0;
async function placeOrder (order, ticker, config, original=null) {
	let gdaxOrder
	if (machine.isDev) {
		gdaxOrder = {
			id: devOrderId++,
			"created_at": "2018-01-05T04:35:57.562788Z",
			"fill_fees": "0.0000000000000000",
			"filled_size": "0.00000000",
			"executed_value": "0.0000000000000000",
			"status": "pending",
			"settled": false,
			...order
		};
	} else {
		try {
			gdaxOrder = await authedClient.placeOrder(order);
		} catch (e) {
			gdaxOrder = await authedClient.placeOrder(order);
		}
	}
	let record = {
		order: gdaxOrder,
		ticker,
		config,
		original
	};

	records = addRecord(records, record);
	ui.printOrder(record);

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
			placeOrder(buyOrder, ticker, orderConfig),
			placeOrder(sellOrder, ticker, orderConfig)
		];

		return acc.concat(records);
	}, []));
}

async function placeOrders () {
	tick++;
	console.log(`Tick ${tick}. ${new Date().toISOString()}`);
	try {
		await lookupPriceAndPlaceOrders();
		saveState();
	} catch (e) {
		ui.printError('placing orders', e);
	}
}

async function updateOrders () {
	const oldRecords = records;
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
				placeOrder(order, record.ticker, record.config, record.order);
			});
		}
		records = removeExecutedRecords(records, userFills);
		records = removeExpiredRecords(records, userOrders);
		if (records.length !== oldRecords.length) {
			saveState();

			let filledReplacementOrders = executedRecords.filter(r => r.original !== null);
			filledReplacementOrders.forEach(ui.printReplacmentFilled);
		}

		if (records.find(r => r.original === null) === undefined) {
			console.log('placing orders');
			await placeOrders();
		}

	} catch (e) {
		ui.printError('checking for records. Will try again in two seconds.', e)
	}

	setTimeout(updateOrders, 2000);
}

updateOrders();
