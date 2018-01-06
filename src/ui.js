exports.printOrder = function (record) {
	if (!record.order.side) {
		exports.printError('placing order.', record.order);
	} else if (record.original) {
		console.log(`Placed ${record.order.side.toUpperCase().padEnd(4, ' ')} ${record.order.size} @ $${Number(record.order.price).toFixed(2)}. Ticker is $${Number(record.ticker.ask).toFixed(2)}/${Number(record.ticker.bid).toFixed(2)} -- ${record.order.id} -- replaces ${record.original.id}`);
	} else {
		console.log(`Placed ${record.order.side.toUpperCase().padEnd(4, ' ')} ${record.order.size} @ $${Number(record.order.price).toFixed(2)}. Ticker is $${Number(record.ticker.ask).toFixed(2)}/${Number(record.ticker.bid).toFixed(2)} -- ${record.order.id}`);
	}
};

exports.printReplacmentFilled = function (record) {
	let btcNet = record.order.size - record.original.size
	let cashNet = (record.original.size * record.original.price) - (record.order.size * record.order.price);
	if (record.order.side === 'sell') {
		btcNet = btcNet * -1;
		cashNet = cashNet * -1;
	}
	console.log(`Filled replacement ${record.order.side.toUpperCase().padEnd(4, ' ')} ${record.order.size} @ $${Number(record.order.price).toFixed(2)} -- ${record.order.id} -- Net ${btcNet.toFixed(8)}BTC, $${cashNet.toFixed(2)}.`);
};

exports.printState = function (state) {
	const { records } = state;

	const btcFloat = records.reduce((value, record) => {
		if (record.order.side === 'sell') {
			return value + Number(record.order.size);
		}
		return value;
	}, 0);

	const cashFloat = records.reduce((value, record) => {
		if (record.order.side === 'buy') {
			return value + (Number(record.order.size) * Number(record.order.price));
		}
		return value;
	}, 0);

	let originalOrders = records.reduce((count, record) => {
		if (record.original === null) {
			return count + 1;
		}
		return count;
	}, 0);

	if (originalOrders) {
		console.log(`Currently ${records.length - originalOrders} open orders, ${originalOrders} are originals.`)
	} else {
		console.log(`${records.length - originalOrders} open orders.`)
	}
	console.log(`Current float: ${btcFloat.toFixed(8)}BTC and $${cashFloat.toFixed(2)}`);

};

exports.printError = function (whatYouTriedToDo, err) {
	console.log('Error ' + whatYouTriedToDo);
	console.error(err);
};
