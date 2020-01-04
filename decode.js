module.exports = function (buffers) {
  var sizes = {
    point: { type: 0, id: 0, position: 0 },
    line: { type: 0, id: 0, position: 0 },
    area: { type: 0, id: 0, position: 0, cell: 0 }
  }
  buffers.forEach(function (buf) {
    var featureType = buf.readUInt8(0)
    if (featureType === 1) {
      sizes.point.type++
      sizes.point.id+=2
      sizes.point.position+=2
    }
    else if (featureType === 2) {
      var plen = buf.readUInt16LE(13)
      sizes.line.type+=plen
      sizes.line.id+=plen*2
      sizes.line.position+=plen*2
    }
    else if (featureType === 3) {
      var plen = buf.readUInt16LE(13)
      sizes.area.type+=plen
      sizes.area.id+=plen*2
      sizes.area.position+=plen*2
      var clen = buf.readUInt16LE(15+8*plen)
      sizes.area.cell+=clen*3
    }
  })
  var data = {
    point: {
      type: new Float32Array(sizes.point.type),
      id: new Float32Array(sizes.point.id),
      position: new Float32Array(sizes.point.position)
    },
    line: {
      type: new Float32Array(sizes.line.type),
      id: new Float32Array(sizes.line.id),
      position: new Float32Array(sizes.line.position) 
    },
    area: {
      type: new Float32Array(sizes.area.type),
      id: new Float32Array(sizes.area.id),
      position: new Float32Array(sizes.area.position),
      cell: new Uint32Array(sizes.area.cell)
    }
  }
  var offsets = {
    point: { type: 0, id: 0, position: 0 },
    line: { type: 0, id: 0, position: 0 },
    area: { type: 0, id: 0, position: 0, cell: 0 }
  }
  buffers.forEach(function (buf) {
    var offset = 0
    var featureType = buf.readUInt8(offset)
    offset+=1
    if (featureType === 1) {
      data.point.type[offsets.point.type++] = buf.readUInt32LE(offset)
      offset+=4
      data.point.id[offsets.point.id++] = buf.readUInt32LE(offset)
      offset+=4
      data.point.id[offsets.point.id++] = buf.readUInt32LE(offset)
      offset+=4
      data.point.position[offsets.point.position++] = buf.readFloatLE(offset)
      offset+=4
      data.point.position[offsets.point.position++] = buf.readFloatLE(offset)
      offset+=4
    }
    else if (featureType === 2) {
      var type = buf.readUInt32LE(offset)
      offset+=4
      var id0 = buf.readUInt32LE(offset)
      offset+=4
      var id1 = buf.readUInt32LE(offset)
      offset+=4
      var plen = buf.readUInt16LE(offset)
      offset+=2
      for (var i=0; i<plen; i++) {
        data.line.type[offsets.line.type++] = type
        data.line.id[offsets.line.id++] = id0
        data.line.id[offsets.line.id++] = id1
        data.line.position[offsets.line.position++] = buf.readFloatLE(offset)
        offset+=4
        data.line.position[offsets.line.position++] = buf.readFloatLE(offset)
        offset+=4
      }
    }
    else if (featureType === 3) {
      var type = buf.readUInt32LE(offset)
      offset+=4
      var id0 = buf.readUInt32LE(offset)
      offset+=4
      var id1 = buf.readUInt32LE(offset)
      offset+=4
      var plen = buf.readUInt16LE(offset)
      offset+=2
      for (var i=0; i<plen; i++) {
        data.area.type[offsets.area.type++] = type
        data.area.id[offsets.area.id++] = id0
        data.area.id[offsets.area.id++] = id1
        data.area.position[offsets.area.position++] = buf.readFloatLE(offset)
        offset+=4
        data.area.position[offsets.area.position++] = buf.readFloatLE(offset)
        offset+=4
      }
      var clen = buf.readUInt16LE(offset)
      offset+=2
      for (var i=0; i<clen; i++) {
        data.area.cell[offsets.area.cell++] = buf.readUInt16LE(offset)
        offset+=2
        data.area.cell[offsets.area.cell++] = buf.readUInt16LE(offset)
        offset+=2
        data.area.cell[offsets.area.cell++] = buf.readUInt16LE(offset)
        offset+=2
      }
    }
  })
  return data
}
