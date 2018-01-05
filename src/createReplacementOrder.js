
const genericReplacementOrder = Object.freeze({
	product_id: 'BTC-USD',
	type: 'limit',
	time_in_force: 'GTC',
	post_only: true
});

module.exports = function (record, currentTicker) {
	let originalOrder = record.order;
	let ticker;

	if (record.side === 'buy') { // the replacement will be a sell
		// if the price has gone up it would be silly to sell for less than the current ask.
		ticker = record.ticker.ask < currentTicker.ask ? currentTicker : record.ticker;
	} else {
		ticker = record.ticker.bid > currentTicker.bid ? currentTicker : record.ticker;
	}

	let replacementOrder;
	let valueOfThisTrade = originalOrder.size * originalOrder.price;
	let tickerPrice = originalOrder.side === 'buy' ? ticker.ask : ticker.bid;
	let potentialValueOfReplacement = originalOrder.size * tickerPrice;

	let desiredDollars = valueOfThisTrade - (valueOfThisTrade - potentialValueOfReplacement) / 2;
	let newSize = (desiredDollars / tickerPrice).toFixed(8);

	if (originalOrder.side === 'buy') {
		replacementOrder = {
			...genericReplacementOrder,
			side: 'sell',
			price: ticker.ask,
			size: newSize
		}
	} else {
		replacementOrder = {
			...genericReplacementOrder,
			side: 'buy',
			price: ticker.bid,
			size: newSize
		}
	}
	return replacementOrder;
}
