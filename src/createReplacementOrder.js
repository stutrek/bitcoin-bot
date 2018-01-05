
const genericReplacementOrder = Object.freeze({
	product_id: 'BTC-USD',
	type: 'limit',
	time_in_force: 'GTC',
	post_only: true
});

module.exports = function (record, currentTicker) {
	let originalOrder = record.order;
	let ticker;

	if (record.order.side === 'buy') { // the replacement will be a sell
		// if the price has gone up it would be silly to sell for less than the current ask.
		ticker = record.ticker.bid < currentTicker.bid ? currentTicker : record.ticker;
	} else {
		ticker = record.ticker.ask > currentTicker.ask ? currentTicker : record.ticker;
	}

	let replacementOrder;

	if (originalOrder.side === 'buy') {
		// if the price is going down we want to extract cash and leave crypto
		// so we make a transaction of the same size (minus one satoshi to identify it in logs)
		let desiredSize = (Number(originalOrder.size)- 0.00000001).toFixed(8);
		replacementOrder = {
			...genericReplacementOrder,
			side: 'sell',
			price: ticker.ask,
			size: desiredSize
		}
	} else {
		// if the price is going up we want to extract crypto and leave cash
		// so we make a transaction of the same value
		let valueOfThisTrade = originalOrder.size * originalOrder.price;
		let desiredSize = (valueOfThisTrade / ticker.bid).toFixed(8);
		replacementOrder = {
			...genericReplacementOrder,
			side: 'buy',
			price: ticker.bid,
			size: desiredSize
		}
	}
	return replacementOrder;
}
