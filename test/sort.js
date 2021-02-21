var fs = require('fs')
var sortMembers = require('../lib/sort.js')
var members = require('./data/members.json')
var expected = require('./data/expected.json')
var deps = require('./data/deps.json')
var test = require('tape')

test('sort', function (t) {
  t.plan(1)
  t.deepEquals(sortMembers(members, deps), expected)
})
