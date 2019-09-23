/*
1 denormalized record is input
output is buffer for 1 record
*/
var earcut = require('earcut')
var features = require('./features.json')
var isArea = require('../osm-is-area/main.js')

module.exports = function (item, deps) {
  var type
  if (Object.keys(item.tags).length !== 0){
    var tags = Object.entries(item.tags)
    tags.forEach(function (tagPair) {
      if (features[tagPair[0] + '.' + tagPair[1]]){
        type = features[tagPair[0] + '.' + tagPair[1]]
      }
      else type = 277 //place.other
    })
  }
  else type = 277 //place.other
  if (item.type === 'node') {
    var buf = Buffer.alloc(21)
    buf.writeUInt8(0x01, 0) 
    buf.writeUInt32LE(type, 1) //type
    buf.writeDoubleLE(item.id, 5)
    buf.writeFloatLE(item.lon, 13)
    buf.writeFloatLE(item.lat, 17)
  }
  if (item.type === 'way') {
    if (isArea(item)) {
      var n = item.refs.length
      var buf = Buffer.alloc(17 + n*4*2 + (n-2)*3*2)
      buf.writeUInt8(0x03, 0)
      buf.writeUInt32LE(type, 1) //type
      buf.writeDoubleLE(item.id, 5)
      buf.writeUInt16LE(item.refs.length, 13)
      var offset = 15
      item.refs.forEach(function (ref) {
        buf.writeFloatLE(deps[ref].lon, offset)
        buf.writeFloatLE(deps[ref].lat, offset+4)
        offset+=8
      })
      var coords = []
      item.refs.forEach(function (ref) {
        coords.push(deps[ref].lon)
        coords.push(deps[ref].lat)
      })
      var cells = earcut(coords)
      buf.writeUInt16LE(cells.length/3, offset) //2 bytes
      offset+=2
      cells.forEach(function (item) {
        buf.writeUInt16LE(item, offset)
        offset+=2
      })
    }
    else {
      var buf = Buffer.alloc(15 + item.refs.length*8)
      buf.writeUInt8(0x02, 0)
      buf.writeUInt32LE(type, 1) //type
      buf.writeDoubleLE(item.id, 5)
      buf.writeUInt16LE(item.refs.length, 13)
      var offset = 15
      item.refs.forEach(function (ref) {
        buf.writeFloatLE(deps[ref].lon, offset)
        buf.writeFloatLE(deps[ref].lat, offset+4)
        offset+=8
      })
    }
  }
  return buf
}
