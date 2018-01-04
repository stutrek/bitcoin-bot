exports.getExecutedRecords = (botRecords, fills) => {
	return botRecords.filter(record => {
		let fill = fills.find(fill => fill.order_id === record.order.id);
		if (fill === undefined) {
			return false;
		}
		return fill.settled;
	});
};

exports.removeExpiredRecords = (botRecords, userOrders) => {
	return botRecords.filter(record => {
		let userOrder = userOrders.find(uo => record.order.id === uo.id);
		if (userOrder === undefined) {
			return false;
		}
		return true;
	});
}

exports.removeExecutedRecords= (botRecords, fills) => {
	return botRecords.filter(record => {
		let fill = fills.find(fill => fill.order_id === record.order.id);
		if (fill === undefined) {
			return true;
		}
		return !fill.settled;
	});
}

exports.addRecord = (botRecords, newRecord) => [...botRecords, newRecord];
