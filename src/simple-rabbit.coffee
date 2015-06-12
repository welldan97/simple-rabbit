Q = require 'q'

defaultAddress = __filename.toLowerCase().replace(/[./_0-9 ]/g, '')
ENCODING = 'utf8'


class SimpleRabbit
  constructor: ({ @address } = { address: defaultAddress }) ->
    subDeferred = Q.defer()
    pubDeferred = Q.defer()
    @subPromise = subDeferred.promise
    @pubPromise = pubDeferred.promise
    @context = require('rabbit.js').createContext()

    @context.on 'ready', =>
      sub = @context.socket 'SUB'
      sub.connect @address, ->
        subDeferred.resolve(sub)

      pub = @context.socket 'PUB'
      pub.connect @address, ->
        pubDeferred.resolve(pub)

  read: (cb) ->
    @subPromise.then (sub) ->
      sub.on 'data', (data) ->
        cb JSON.parse(data.toString(ENCODING))

  write: (data) ->
    @pubPromise.then (pub) =>
      pub.write(JSON.stringify(data), ENCODING)
      @subPromise.then =>
        @context.close()

  reader: (object) ->
    @read (data) -> object[data.method](data.args...)

  invoke: (method, args...) ->
    @write(method: method, args: args)

module.exports = SimpleRabbit
