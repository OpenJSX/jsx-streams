module.exports = Stream;

function Stream(value, type) {
  var _this = this;
  var valueType = '';

  _this.value = null
  _this.listeners = [];
  _this.closeListeners = [];

  _this.get = function() {
    if (valueType === 'getter') {
      return _this.value();
    }

    return _this.value;
  };

  _this.put = function(value, type) {
    if (type === 'getter' && typeof value === 'function') {
      valueType = type;
    } else if (valueType === 'getter') {
      valueType = '';
    }

    _this.value = value;
  };

  _this.listen = function(listener) {
    _this.listeners.push(listener);
  };

  _this.notify = function() {
    _this.listeners.forEach(call);
  };

  _this.close = function() {
    ['get', 'put', 'listener', 'notify', 'close', 'onClose']
      .forEach(function(fn) {
        _this[fn] = function() {
          throw new Error('Stream is closed');
        };
      });

    var closeListeners = this.closeListeners;

    this.listeners = null;
    this.closeListeners = null;

    closeListeners.forEach(call);
  };

  _this.onClose = function(fn) {
    this.closeListeners.push(fn);
  };

  _this.put(value, type);
}

Stream.getter = function(fn) {
  var stream = new Stream();
  stream.put(fn, 'getter');

  return stream;
};

function call(fn) {
  fn();
}