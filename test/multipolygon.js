var decode = require('../decode')
var encode = require('../encode')
var test = require('tape')

// this multipolygon includes two non-overlapping polygon
// geometries and its dependencies. the test ensures that the
// two polygons are represented by the appropriate number of
// cells in the decoded form. 6 cell entries for the 2 polygons

var itemTwoClosedPoly = {
  id: 0,
  type: 'relation',
  tags: {
    type: 'multipolygon',
  },
  members: [{
    type: 'way',
    id: 100,
    role: 'outer'
  }, {
    type: 'way',
    id: 101,
    role: 'outer'
  }, {
    type: 'way',
    id: 102,
    role: 'outer'
  }, {
    type: 'way',
    id: 103,
    role: 'outer'
  }]
}

var itemOneClosedPoly = {
  id: 1,
  type: 'relation',
  tags: {
    type: 'multipolygon',
  },
  members: [{
    type: 'way',
    id: 100,
    role: 'outer'
  }, {
    type: 'way',
    id: 101,
    role: 'outer'
  }]
}

var deps = {
  100: {
    id: 100,
    type: 'way',
    refs: [200, 201, 202],
  },
  101: {
    id: 2,
    type: 'way',
    refs: [202, 203, 200],
  },
  102: {
    id: 3,
    type: 'way',
    refs: [210, 211, 212],
  },
  103: {
    id: 4,
    type: 'way',
    refs: [212, 213, 210],
  },
  200: {
    type: 'node',
    lon: 10,
    lat: 10,
  },
  201: {
    type: 'node',
    lon: 20,
    lat: 20,
  },
  202: {
    type: 'node',
    lon: 10,
    lat: 20,
  },
  203: {
    type: 'node',
    lon: 0,
    lat: 20,
  },
  210: {
    type: 'node',
    lon: -10,
    lat: -10,
  },
  211: {
    type: 'node',
    lon: -20,
    lat: -20,
  },
  212: {
    type: 'node',
    lon: -10,
    lat: -20,
  },
  213: {
    type: 'node',
    lon: 0,
    lat: -20,
  }
}

test('multipolygon', function (t) {
  t.plan(2)

  var decodedTwoPoly = decode([encode(itemTwoClosedPoly, deps)])
  t.assert(Object.keys(decodedTwoPoly.area.cells).length === 6)
  var decodedOnePoly = decode([encode(itemOneClosedPoly, deps)])
  t.assert(Object.keys(decodedOnePoly.area.cells).length === 3)
})
