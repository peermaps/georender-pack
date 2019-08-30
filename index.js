/*
1 denormalized record is input
output is buffer for 1 record
*/
var features = require('./features.json')

module.exports = function (denormalizedRecord) {
  var buf = Buffer.alloc(20)
  var type
  if (Object.keys(denormalizedRecord.tags).length !== 0){
    var tags = Object.entries(denormalizedRecord.tags)
    tags.forEach(function (tagPair) {
      if (features[tagPair[0] + '.' + tagPair[1]]){
        type = features[tagPair[0] + '.' + tagPair[1]]
      }
      else type = 277 //place.other
    })
  }
  else type = 277 //place.other
  if (denormalizedRecord.type === 'node') {
    buf.writeUInt8(0x01, 0) 
    buf.writeUInt32LE(type, 1) //type
    buf.writeDoubleLE(denormalizedRecord.id, 5)
  }
  return buf
}
