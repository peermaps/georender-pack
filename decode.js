var getNormals = require('polyline-normals')
var varint = require('varint')
module.exports = function (buffers) {
  var sizes = {
    point: { types: 0, ids: 0, positions: 0 },
    line: { types: 0, ids: 0, positions: 0, normals: 0 },
    area: { types: 0, ids: 0, positions: 0, cells: 0 }
  }
  buffers.forEach(function (buf) {
    var featureType = buf.readUInt8(0)
    var offset = 1
    if (featureType === 1) {
      sizes.point.types++
      sizes.point.ids+=2
      sizes.point.positions+=2
    }
    else if (featureType === 2) {
      varint.decode(buf, offset) //types
      offset+=varint.decode.bytes
      varint.decode(buf, offset) //id
      offset+=varint.decode.bytes
      var plen = varint.decode(buf, offset) //pcount
      offset+=varint.decode.bytes
      sizes.line.types+=plen*2+2
      sizes.line.ids+=plen*4+4
      sizes.line.positions+=plen*4+4
      sizes.line.normals+=plen*4+4
    }
    else if (featureType === 3) {
      varint.decode(buf, offset) //types
      offset+=varint.decode.bytes
      varint.decode(buf, offset) //id
      offset+=varint.decode.bytes
      var plen = varint.decode(buf, offset) //pcount
      offset+=varint.decode.bytes
      offset+=plen*8
      sizes.area.types+=plen
      sizes.area.ids+=plen*2
      sizes.area.positions+=plen*2
      var clen = varint.decode(buf, offset) //clen
      offset+=varint.decode.bytes
      sizes.area.cells+=clen*3
    }
  })
  var data = {
    point: {
      types: new Float32Array(sizes.point.types),
      ids: new Float32Array(sizes.point.ids),
      positions: new Float32Array(sizes.point.positions)
    },
    line: {
      types: new Float32Array(sizes.line.types),
      ids: new Float32Array(sizes.line.ids),
      positions: new Float32Array(sizes.line.positions),
      normals: new Float32Array(sizes.line.normals)
    },
    area: {
      types: new Float32Array(sizes.area.types),
      ids: new Float32Array(sizes.area.ids),
      positions: new Float32Array(sizes.area.positions),
      cells: new Uint32Array(sizes.area.cells)
    }
  }
  var offsets = {
    point: { types: 0, ids: 0, positions: 0 },
    line: { types: 0, ids: 0, positions: 0, normals: 0 },
    area: { types: 0, ids: 0, positions: 0, cells: 0 }
  }
  var pindex = 0
  buffers.forEach(function (buf) {
    var offset = 0
    var featureType = buf.readUInt8(offset)
    offset+=1
    if (featureType === 1) {
      data.point.types[offsets.point.types++] = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      data.point.ids[offsets.point.ids++] = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      data.point.positions[offsets.point.positions++] = buf.readFloatLE(offset)
      offset+=4
      data.point.positions[offsets.point.positions++] = buf.readFloatLE(offset)
      offset+=4
    }
    else if (featureType === 2) {
      var type = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      var id = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      var plen = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      var positions = []
      var lon, lat
      data.line.types[offsets.line.types++] = type
      data.line.ids[offsets.line.ids++] = id
      for (var i=0; i<plen; i++) {
        data.line.types[offsets.line.types++] = type
        data.line.types[offsets.line.types++] = type
        data.line.ids[offsets.line.ids++] = id
        data.line.ids[offsets.line.ids++] = id
        lon = buf.readFloatLE(offset)
        offset+=4
        lat = buf.readFloatLE(offset)
        offset+=4
        if (i === 0) {
          data.line.positions[offsets.line.positions++] = lon
          data.line.positions[offsets.line.positions++] = lat
        }
        data.line.positions[offsets.line.positions++] = lon
        data.line.positions[offsets.line.positions++] = lat
        data.line.positions[offsets.line.positions++] = lon
        data.line.positions[offsets.line.positions++] = lat
        positions.push([lon, lat])
      }
      data.line.types[offsets.line.types++] = type
      data.line.ids[offsets.line.ids++] = id
      data.line.positions[offsets.line.positions++] = lon
      data.line.positions[offsets.line.positions++] = lat

      var normals = getNormals(positions)
      //console.log('normals = ', normals)
      var scale = Math.sqrt(normals[0][1])
      data.line.normals[offsets.line.normals++] = normals[0][0][0]*scale
      data.line.normals[offsets.line.normals++] = normals[0][0][1]*scale
      for (var i=0; i<normals.length; i++) {
        scale = Math.sqrt(normals[i][1])
        data.line.normals[offsets.line.normals++] = normals[i][0][0]*scale
        data.line.normals[offsets.line.normals++] = normals[i][0][1]*scale
        data.line.normals[offsets.line.normals++] = -1*normals[i][0][0]*scale
        data.line.normals[offsets.line.normals++] = -1*normals[i][0][1]*scale
      }
      var normOffset = offsets.line.normals
      data.line.normals[offsets.line.normals++] = data.line.normals[normOffset-2]
      data.line.normals[offsets.line.normals++] = data.line.normals[normOffset-1]
    }
    else if (featureType === 3) {
      var type = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      var id = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      var plen = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      for (var i=0; i<plen; i++) {
        data.area.types[offsets.area.types++] = type
        data.area.ids[offsets.area.ids++] = id
        data.area.positions[offsets.area.positions++] = buf.readFloatLE(offset)
        offset+=4
        data.area.positions[offsets.area.positions++] = buf.readFloatLE(offset)
        offset+=4
      }
      var clen = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      for (var i=0; i<clen; i++) {
        data.area.cells[offsets.area.cells++] = varint.decode(buf, offset) + pindex
        offset+=varint.decode.bytes
        data.area.cells[offsets.area.cells++] = varint.decode(buf, offset) + pindex
        offset+=varint.decode.bytes
        data.area.cells[offsets.area.cells++] = varint.decode(buf, offset) + pindex
        offset+=varint.decode.bytes
      }
      pindex+=plen
    }
  })
  return data
}
