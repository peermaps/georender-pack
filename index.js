/*
1 denormalized record is input
output is buffer for 1 record
*/

var buf = Buffer.alloc(10, 1)

module.exports = function (denormalizedRecord) {
  return denormalizedRecord
}
