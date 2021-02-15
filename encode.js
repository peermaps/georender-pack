var earcut = require('earcut')
var features = require('./features.json')
var osmIsArea = require('osm-is-area')
var varint = require('varint')

module.exports = function (item, deps) {
  var type = features['place.other']
  if (Object.keys(item.tags).length !== 0){
    var tags = Object.entries(item.tags)
    tags.forEach(function (tagPair) {
      if (features[tagPair[0] + '.' + tagPair[1]] !== undefined) {
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
      var typeLen = varint.encodingLength(type)
      var idLen = varint.encodingLength(id)
      var coords = []
      for (var i=0; i<item.refs.length; i++) {
        coords.push(deps[item.refs[i]].lon)
        coords.push(deps[item.refs[i]].lat) 
      }
      var pCount = coords.length/2
      var pCountLen = varint.encodingLength(pCount)
      var cells = earcut(coords)
      var cLen = varint.encodingLength(cells.length/3)
      var cSize = 0
      for (var i=0; i<cells.length; i++) {
        cSize+=varint.encodingLength(cells[i])
      }
      var labelLen = getLabelLen(item.tags)
      var buf = Buffer.alloc(1 + typeLen + idLen + pCountLen + pCount*4*2 + cLen + cSize + labelLen)
      var offset = 0
      buf.writeUInt8(0x03, 0)
      offset+=1
      varint.encode(type, buf, offset)
      offset+=varint.encode.bytes
      varint.encode(id, buf, offset)
      offset+=varint.encode.bytes
      varint.encode(pCount, buf, offset)
      offset+=varint.encode.bytes
      for (var i=0; i<coords.length; i++) {
        buf.writeFloatLE(coords[i], offset)
        offset+=4
      }
      varint.encode(cells.length/3, buf, offset)
      offset+=varint.encode.bytes
      for (var i=0; i<cells.length; i++){
        varint.encode(cells[i], buf, offset)
        offset+=varint.encode.bytes
      }
      writeLabelData(item.tags, buf, offset)
    }
    else if (item.refs.length > 1) {
      var typeLen = varint.encodingLength(type)
      var idLen = varint.encodingLength(id)
      var coords = []
      for (var i=0; i<item.refs.length; i++) {
        coords.push(deps[item.refs[i]].lon)
        coords.push(deps[item.refs[i]].lat) 
      }
      var pCount = coords.length/2
      var pCountLen = varint.encodingLength(pCount)
      var labelLen = getLabelLen(item.tags)
      var buf = Buffer.alloc(1 + typeLen + idLen + pCount*4*2 + pCountLen + labelLen)
      var offset = 0
      buf.writeUInt8(0x02, 0)
      offset+=1
      varint.encode(type, buf, offset)
      offset+=varint.encode.bytes
      varint.encode(id, buf, offset)
      offset+=varint.encode.bytes
      varint.encode(pCount, buf, offset)
      offset+=varint.encode.bytes
      for (var i=0; i<coords.length; i++) {
        buf.writeFloatLE(coords[i], offset)
        offset+=4
      }
      writeLabelData(item.tags, buf, offset)
    }
    else {
      var buf = Buffer.alloc(0)
    }
  }
  if (item.type === 'relation') {
    if (osmIsArea(item)) {
      var typeLen = varint.encodingLength(type)
      var idLen = varint.encodingLength(id)
      var coords = []
      var cells = []
      var holes = []
      var ppositions = []
      var closed = false
      var ref0 = -1
      for (var i=0; i<item.members.length; i++){
        var role = item.members[i].role
        if (role === "outer") {
          if (closed) {
            holes.splice(-1,1)
            var pcells = earcut(ppositions, holes)
            for (var j=0; j<pcells.length; j++) {
              cells.push(pcells[j] + coords.length/2 - ppositions.length/2)
            }
            ppositions = []
            holes = []
            ref0 = -1
          }
          if (!deps[item.members[i].id]) continue
          var member = deps[item.members[i].id]
          if (!member.refs) continue
          for (var j=0; j<member.refs.length; j++) {
            if (ref0 === member.refs[j]) {
              closed = true
              ref0 = -1
              continue
            }
            if (ref0 < 0) { ref0 = member.refs[j] }
            var ref = deps[member.refs[j]]
            ppositions.push(ref.lon, ref.lat)
            coords.push(ref.lon, ref.lat)
          }
        }
        else if (item.members[i].role === "inner") {
          if (!deps[item.members[i].id]) continue
          var member = deps[item.members[i].id]
          if (!member.refs) continue
          for (var j=0; j<member.refs.length; j++) {
            if (ref0 === member.refs[j]) {
              ref0 = -1
              holes.push(ppositions.length/2)
              continue
            }
            if (ref0 < 0) { ref0 = member.refs[j] }
            var ref = deps[member.refs[j]]
            ppositions.push(ref.lon, ref.lat)
            coords.push(ref.lon, ref.lat)
          }
        }
      }
      if (closed) {
        holes.splice(-1,1)
        var pcells = earcut(ppositions, holes)
        for (var j=0; j<pcells.length; j++) {
          cells.push(pcells[j] + coords.length/2 - ppositions.length/2)
        }
        ppositions = []
        holes = []
      }
      var pCount = coords.length/2
      var pCountLen = varint.encodingLength(pCount)
      var cLen = varint.encodingLength(cells.length/3)
      var cSize = 0
      for (var i=0; i<cells.length; i++) {
        cSize+=varint.encodingLength(cells[i])
      }
      var labelLen = getLabelLen(item.tags)
      var buf = Buffer.alloc(1 + typeLen + idLen + pCountLen + pCount*4*2 + cLen + cSize + labelLen)
      var offset = 0
      buf.writeUInt8(0x03, 0)
      offset+=1
      varint.encode(type, buf, offset)
      offset+=varint.encode.bytes
      varint.encode(id, buf, offset)
      offset+=varint.encode.bytes
      varint.encode(pCount, buf, offset)
      offset+=varint.encode.bytes
      for (var i=0; i<coords.length; i++) {
        buf.writeFloatLE(coords[i], offset)
        offset+=4
      }
      varint.encode(cells.length/3, buf, offset)
      offset+=varint.encode.bytes
      cells.forEach(function (item) {
        varint.encode(item, buf, offset)
        offset+=varint.encode.bytes
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
