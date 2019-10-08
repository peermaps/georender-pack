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
      sizes.point.id++
      sizes.point.position+=2
    }
    else if (featureType === 2) {
      sizes.line.type++
      sizes.line.id++
      var plen = buf.readUInt16LE(13)
      sizes.line.position+=plen*2
    }
    else if (featureType === 3) {
      sizes.area.type++
      sizes.area.id++
      var plen = buf.readUInt16LE(13)
      sizes.area.position+=plen*2
      var clen = buf.readUInt16LE(15+8*plen)
      sizes.area.cell+=clen*3
    }
  })
  var data = {
    point: {
      type: new Float32Array(sizes.point.type),
      id: new Float32Array(sizes.point.id),
      position: new Float64Array(sizes.point.position) 
    },
    line: {
      type: new Float32Array(sizes.line.type),
      id: new Float64Array(sizes.line.id),
      position: new Float32Array(sizes.line.position) 
    },
    area: {
      type: new Float32Array(sizes.area.type),
      id: new Float64Array(sizes.area.id),
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
      data.point.id[offsets.point.id++] = buf.readDoubleLE(offset)
      offset+=8
      data.point.position[offsets.point.position++] = buf.readFloatLE(offset)
      offset+=4
      data.point.position[offsets.point.position++] = buf.readFloatLE(offset)
      offset+=4
    }
    else if (featureType === 2) {
      data.line.type[offsets.line.type++] = buf.readUInt32LE(offset)
      offset+=4
      data.line.id[offsets.line.id++] = buf.readDoubleLE(offset)
      offset+=8
      var plen = buf.readUInt16LE(offset)
      offset+=2
      for (var i=0; i<plen; i++) {
        data.line.position[offsets.line.position++] = buf.readFloatLE(offset)
        offset+=4
        data.line.position[offsets.line.position++] = buf.readFloatLE(offset)
        offset+=4
      }
    }
    else if (featureType === 3) {
      data.area.type[offsets.area.type++] = buf.readUInt32LE(offset)
      offset+=4
      data.area.id[offsets.area.id++] = buf.readDoubleLE(offset)
      offset+=8
      var plen = buf.readUInt16LE(offset)
      offset+=2
      for (var i=0; i<plen; i++) {
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
