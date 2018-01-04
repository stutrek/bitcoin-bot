
const genericReplacementOrder = Object.freeze({
	product_id: 'BTC-USD',
	type: 'limit',
	time_in_force: 'GTC',
	post_only: true
});

module.exports = function (record) {
	let originalOrder = record.order;
	let ticker = record.ticker;
	let replacementOrder;
	let valueOfThisTrade = originalOrder.size * originalOrder.price;
	let tickerPrice = originalOrder.side === 'buy' ? ticker.ask : ticker.bid;
	let potentialValueOfReplacement = originalOrder.size * tickerPrice;

	let desiredDollars = valueOfThisTrade - (valueOfThisTrade - potentialValueOfReplacement) / 2;
	let newSize = (desiredDollars / tickerPrice).toFixed(6);

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
