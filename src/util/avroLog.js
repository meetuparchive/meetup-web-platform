const avro = require('avsc');

const avroLog = (schema, data) => {
	const record = avro.parse(schema).toBuffer(data);
	const eventDate = new Date(parseInt(data.timestamp, 10));
	const analytics = {
		record: record.toString('base64'),
		schema: `gs://meetup-logs/avro_schemas/${schema.name}_${schema.doc}.avsc`,
		date: eventDate.toISOString().substr(0, 10),  // YYYY-MM-DD
	};
	return JSON.stringify(analytics);
};

module.exports = avroLog;

