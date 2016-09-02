function getSyncEpic(routes) {
	return action$ =>
		action$.filter(action => action.type === 'LOCATION_CHANGE')
			.delay(1000)
			.mapTo({ type: 'PONG' });
}

export default getSyncEpic;

