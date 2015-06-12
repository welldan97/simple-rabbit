var ENCODING, Q, SimpleRabbit, defaultAddress,
  slice = [].slice;

Q = require('q');

defaultAddress = __filename.toLowerCase().replace(/[.\/_0-9 ]/g, '');

ENCODING = 'utf8';

SimpleRabbit = (function() {
  function SimpleRabbit(arg) {
    var pubDeferred, subDeferred;
    this.address = (arg != null ? arg : {
      address: defaultAddress
    }).address;
    subDeferred = Q.defer();
    pubDeferred = Q.defer();
    this.subPromise = subDeferred.promise;
    this.pubPromise = pubDeferred.promise;
    this.context = require('rabbit.js').createContext();
    this.context.on('ready', (function(_this) {
      return function() {
        var pub, sub;
        sub = _this.context.socket('SUB');
        sub.connect(_this.address, function() {
          return subDeferred.resolve(sub);
        });
        pub = _this.context.socket('PUB');
        return pub.connect(_this.address, function() {
          return pubDeferred.resolve(pub);
        });
      };
    })(this));
  }

  SimpleRabbit.prototype.read = function(cb) {
    return this.subPromise.then(function(sub) {
      return sub.on('data', function(data) {
        return cb(JSON.parse(data.toString(ENCODING)));
      });
    });
  };

  SimpleRabbit.prototype.write = function(data) {
    return this.pubPromise.then((function(_this) {
      return function(pub) {
        pub.write(JSON.stringify(data), ENCODING);
        return _this.subPromise.then(function() {
          return _this.context.close();
        });
      };
    })(this));
  };

  SimpleRabbit.prototype.reader = function(object) {
    return this.read(function(data) {
      return object[data.method].apply(object, data.args);
    });
  };

  SimpleRabbit.prototype.invoke = function() {
    var args, method;
    method = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    return this.write({
      method: method,
      args: args
    });
  };

  return SimpleRabbit;

})();

module.exports = SimpleRabbit;
