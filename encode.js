var earcut = require('earcut')
var features = require('./features.json')
var osmIsArea = require('osm-is-area')
var varint = require('varint')

module.exports = function (item, deps) {
  var type = 277
  if (Object.keys(item.tags).length !== 0){
    var tags = Object.entries(item.tags)
    tags.forEach(function (tagPair) {
      if (features[tagPair[0] + '.' + tagPair[1]]){
        type = features[tagPair[0] + '.' + tagPair[1]]
      }
    })
  }
  var id = item.id

  if (item.type === 'node') {
    var typeLen = varint.encodingLength(type)
    var idLen = varint.encodingLength(id)
    var labelLen = getLabelLen(item.tags)
    var buf = Buffer.alloc(9 + typeLen + idLen + labelLen)
    var offset = 0
    buf.writeUInt8(0x01, offset) 
    offset+=1
    varint.encode(type, buf, offset)
    offset+=varint.encode.bytes
    varint.encode(id, buf, offset)
    offset+=varint.encode.bytes
    buf.writeFloatLE(item.lon, offset)
    offset+=4
    buf.writeFloatLE(item.lat, offset)
    offset+=4
    writeLabelData(item.tags, buf, offset)
  }
  if (item.type === 'way') {
    if (osmIsArea(item)) {
      var n = item.refs.length
      var typeLen = varint.encodingLength(type)
      var idLen = varint.encodingLength(id)
      var pCount = varint.encodingLength(n)
      var coords = []
      item.refs.forEach(function (ref) {
        coords.push(deps[ref].lon)
        coords.push(deps[ref].lat)
      })
      var cells = earcut(coords)
      var coords = []
      item.refs.forEach(function (ref) {
        coords.push(deps[ref].lon)
        coords.push(deps[ref].lat)
      })
      var cells = earcut(coords)
      var cLen = varint.encodingLength(earcut.length/3)
      var labelLen = getLabelLen(item.tags)
      var buf = Buffer.alloc(1 + typeLen + idLen + pCount + cLen + n*4*2
        + (n-2)*3*2 + labelLen)
      var offset = 0
      buf.writeUInt8(0x03, 0)
      offset+=1
      varint.encode(type, buf, offset)
      offset+=varint.encode.bytes
      varint.encode(id, buf, offset)
      offset+=varint.encode.bytes
      varint.encode(item.refs.length, buf, offset)
      offset+=varint.encode.bytes
      item.refs.forEach(function (ref) {
        buf.writeFloatLE(deps[ref].lon, offset)
        offset+=4
        buf.writeFloatLE(deps[ref].lat, offset)
        offset+=4
      })
      varint.encode(cells.length/3, buf, offset)
      offset+=varint.encode.bytes
      cells.forEach(function (item) {
        varint.encode(item, buf, offset)
        offset+=varint.encode.bytes
      })
      writeLabelData(item.tags, buf, offset)
    }
    else if (item.refs.length > 1) {
      var n = item.refs.length
      var typeLen = varint.encodingLength(type)
      var idLen = varint.encodingLength(id)
      var pCount = varint.encodingLength(n)
      var labelLen = getLabelLen(item.tags)
      var buf = Buffer.alloc(1 + typeLen + idLen + pCount + n*8 + labelLen)
      var offset = 0
      buf.writeUInt8(0x02, 0)
      offset+=1
      varint.encode(type, buf, offset)
      offset+=varint.encode.bytes
      varint.encode(id, buf, offset)
      offset+=varint.encode.bytes
      varint.encode(item.refs.length, buf, offset)
      offset+=varint.encode.bytes
      item.refs.forEach(function (ref) {
        buf.writeFloatLE(deps[ref].lon, offset)
        offset+=4
        buf.writeFloatLE(deps[ref].lat, offset)
        offset+=4
      })
      writeLabelData(item.tags, buf, offset)
    }
    else {
      var buf = Buffer.alloc(0)
    }
  }
  return buf
}

function getLabelLen (tags) {
  var labelLen = 1
  Object.keys(tags).forEach(function (key) {
    if (!/^([^:]+_|)name($|:)/.test(key)) { return }
    var pre = key.replace(/^(|[^:]+_)name($|:)/,'')
    var dataLen = Buffer.byteLength(pre) + 1
      + Buffer.byteLength(tags[key]) 
    labelLen += varint.encodingLength(dataLen) + dataLen
  })
  return labelLen
}

function writeLabelData (tags, buf, offset) {
  Object.keys(tags).forEach(function (key) {
    if (!/^([^:]+_|)name($|:)/.test(key)) { return }
    var pre = key.replace(/^(|[^:]+_)name($|:)/,'')
    var dataLen = Buffer.byteLength(pre) + 1
      + Buffer.byteLength(tags[key])
    varint.encode(dataLen, buf, offset)
    offset+=varint.encode.bytes
    var data = pre + '=' + tags[key]
    buf.write(data, offset)
    offset+=Buffer.byteLength(data)
  })
  varint.encode(0, buf, offset)
  offset+=varint.encode.bytes
  return offset
}
