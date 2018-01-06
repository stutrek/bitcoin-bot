
const genericReplacementOrder = Object.freeze({
	product_id: 'BTC-USD',
	type: 'limit',
	time_in_force: 'GTC',
	post_only: true
});

module.exports = function (record, currentTicker) {
	let priceDifference = record.order.price * record.config.replacementPercent;
	//let halfPriceDifference = priceDifference / 2;

	let cryptoDifference = record.order.size * record.config.replacementPercent;
	let fractionalCryptoDifference = cryptoDifference / 3;

	let newPrice;
	let newSize;
	if (record.order.side === 'buy') { // the replacement will be a sell
		newPrice = Number(record.order.price) + priceDifference;
		newSize = Number(record.order.size) - fractionalCryptoDifference;
		// if the price has gone up it would be silly to sell for less than the current ask.
		if (newPrice < Number(record.ticker.bid)) {
			newPrice = Number(record.ticker.bid);
		}
	} else {
		newPrice = Number(record.order.price) - priceDifference;
		newSize = Number(record.order.size) + fractionalCryptoDifference;
		if (newPrice > Number(record.ticker.bid)) {
			newPrice = Number(record.ticker.bid);
		}
	}

	const replacementOrder = {
		...genericReplacementOrder,
		side: record.order.side === 'buy' ? 'sell' : 'buy',
		price: newPrice.toFixed(2),
		size: newSize.toFixed(8)
	}
	return replacementOrder;
}
