/*
1 denormalized record is input
output is buffer for 1 record
*/
var features = require('./features.json')
var isArea = require('../osm-is-area/main.js')

module.exports = function (item, itemRefsObject) {
  var buf = Buffer.alloc(25)
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
    buf.writeUInt8(0x01, 0) 
    buf.writeUInt32LE(type, 1) //type
    buf.writeDoubleLE(item.id, 5)
    buf.writeFloatLE(item.lon, 13)
    buf.writeFloatLE(item.lat, 17)
  }
  if (item.type === 'way') {
    buf.writeUInt8(0x02, 0)
    buf.writeUInt32LE(type, 1) //type
    buf.writeDoubleLE(item.id, 5)
    buf.writeUInt16LE(item.refs.length, 13)
    //buf.writeFloatLE(item.lon, 15)
    //buf.writeFloatLE(item.lat, 17)
  }
  return buf
}
