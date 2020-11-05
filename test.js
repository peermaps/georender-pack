var encode = require('./encode')
var decode = require('./decode')
var tape = require('tape')

tape('encode a line', (t) => {
  var item = {
    type: 'way',
    id: 234941233,
    tags: { highway: 'residential', source: 'bing' },
    refs: [ 2430595988, 4323950709, 2430596003 ]
  }

  var deps = {
    "2430595988": {
      type: 'node',
      id: 2430595988,
      lat: 31.184799400000003,
      lon: 29.897739500000004,
      tags: {},
      info: {
        version: 1,
        timestamp: 1377386845000,
        changeset: 17491859,
        uid: 39688,
        user: 'Math1985'
      }
    },
    "2430596003": {
      type: 'node',
      id: 2430596003,
      lat: 31.184888100000002,
      lon: 29.898801400000004,
      tags: {},
      info: {
        version: 1,
        timestamp: 1377386845000,
        changeset: 17491859,
        uid: 39688,
        user: 'Math1985'
      }
    },
    "4323950709": {
      type: 'node',
      id: 4323950709,
      lat: 31.184858400000003,
      lon: 29.8983899,
      tags: {},
      info: {
        version: 1,
        timestamp: 1469647444000,
        changeset: 41070303,
        uid: 3502717,
        user: 'Mohawow'
      }
    }
  }

  var encoded = encode(item, deps)
  var decoded = decode([encoded])
  t.same(decoded.line.labels[item.id], item.tags)
  t.end()
})
