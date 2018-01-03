
const genericReplacementOrder = Object.freeze({
	product_id: 'BTC-USD',
	type: 'limit',
	time_in_force: 'GTC',
	post_only: true
});

module.exports = function (state, executedOrders) {
	return executedOrders.map(o => {
		let replacementOrder;
		let valueOfThisTrade = o.size * o.price;
		let tickerPrice = o.side === 'buy' ? state.ticker.ask : state.ticker.bid;
		let potentialValueOfReplacement = o.size * tickerPrice;

		let desiredDollars = valueOfThisTrade - (valueOfThisTrade - potentialValueOfReplacement) / 2;
		let newSize = (desiredDollars / tickerPrice).toPrecision(6);

		if (o.side === 'buy') {
			replacementOrder = {
				...genericReplacementOrder,
				side: 'sell',
				price: state.ticker.ask,
				size: newSize
			}
		} else {
			replacementOrder = {
				...genericReplacementOrder,
				side: 'buy',
				price: state.ticker.bid,
				size: newSize
			}
		}
		return replacementOrder;
	});
}
