/*
 * Generic formatting for Datadog logging.
 *
*/

const METRIC = {
  COUNT: 'count',
  GAUGE: 'gauge',
  SET: 'set',
  TIMING: 'timing',
};

const invalidCharacters = /[^a-zA-Z0-9._]+/g;

const cleanKey = key => {
  const noInvalidChars = key.replace(invalidCharacters, '.');
  const noExtraPeriods = noInvalidChars.replace(/\\.+/g, '.');

  const noPeriodLeft = noExtraPeriods.replace(/^\\.+/, '');
  const noPeriodRight = noPeriodLeft.replace(/\\.+$/g, '');
  return noPeriodRight;
};

const metricFormatter = (metric, key, value) => {
  // in order for log entries to make it to datadog they must
  // be logged with a key value format of
  // { @timestamp: value, message: value }
  console.log(JSON.stringify({
    "@timestamp": `${new Date().toString()}`,
    "message": `metric.${metric}.${cleanKey(key)}=${value}`
  }));
};

class MetricLogging {
  constructor(serviceKey) {
    this.serviceKey = serviceKey;
  }
  makeKey(key) {
    return `${this.serviceKey}.${key}`;
  }
  inc(key, value) {
    metricFormatter(METRIC.COUNT, this.makeKey(key), value + 1);
  }
  dec(key, value) {
    metricFormatter(METRIC.COUNT, this.makeKey(key), value - 1);
  }
  gauge(key, value) {
    metricFormatter(METRIC.GAUGE, this.makeKey(key), value);
  }
  set(key, value) {
    metricFormatter(METRIC.SET, this.makeKey(key), value);
  }
  timing(key, value) {
    metricFormatter(METRIC.TIMING, this.makeKey(key), value);
  }
}

module.exports = MetricLogging;
