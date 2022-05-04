var getNormals = require('polyline-normals')
var varint = require('varint')
var makeEdgeGraph = require('./lib/makeEdgeGraph.js')

module.exports = function (buffers) {
  var sizes = {
    point: { types: 0, ids: 0, positions: 0 },
    line: { types: 0, ids: 0, positions: 0, normals: 0 },
    area: { types: 0, ids: 0, positions: 0, cells: 0 },
    areaBorder: { types: 0, ids: 0, positions: 0, normals: 0 },
  }
  for (var bufi = 0; bufi < buffers.length; bufi++) {
    var buf = buffers[bufi]
    if (buf.length === 0) return
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
      sizes.line.ids+=plen*2+2
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
      sizes.areaBorder.types+=plen*2+2
      sizes.areaBorder.ids+=plen*2+2
      sizes.areaBorder.positions+=plen*4+4
      sizes.areaBorder.normals+=plen*4+4
      var clen = varint.decode(buf, offset) //clen
      offset+=varint.decode.bytes
      sizes.area.cells+=clen*3
    }
    else if (featureType === 4) {
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
      for (var i=0; i<clen*3; i++) {
        var c = varint.decode(buf, offset)
        offset+=varint.decode.bytes
      }
      var elen = varint.decode(buf, offset) //elen
      offset+=varint.decode.bytes
      var epl = 0, esize = 0, eprev = 0
      for (var i=0; i<elen; i++) {
        var e = varint.decode(buf, offset)
        offset+=varint.decode.bytes
        if (e === 0) { // edge break
          if (epl >= 2) {
            esize += epl*2 + 2
          }
          epl = 0
        } else if (e % 2 === 0) { // edge index
          var ei = Math.floor(e/2)-1
          epl++
          eprev = ei
        } else { // edge range
          epl += Math.floor(e/2)-eprev-1
          eprev = e1
        }
      }
      if (epl >= 2) {
        esize += epl*2 + 2
      }
      sizes.areaBorder.types+=esize
      sizes.areaBorder.ids+=esize
      sizes.areaBorder.positions+=esize*2
      sizes.areaBorder.normals+=esize*2
    }
  }
  var data = {
    point: {
      types: new Float32Array(sizes.point.types),
      ids: Array(sizes.point.ids).fill(0),
      positions: new Float32Array(sizes.point.positions),
      labels: {}
    },
    line: {
      types: new Float32Array(sizes.line.types),
      ids: Array(sizes.line.ids).fill(0),
      positions: new Float32Array(sizes.line.positions),
      normals: new Float32Array(sizes.line.normals),
      labels: {}
    },
    area: {
      types: new Float32Array(sizes.area.types),
      ids: Array(sizes.area.ids).fill(0),
      positions: new Float32Array(sizes.area.positions),
      cells: new Uint32Array(sizes.area.cells),
      labels: {}
    },
    areaBorder: {
      types: new Float32Array(sizes.areaBorder.types),
      ids: Array(sizes.areaBorder.ids).fill(0),
      positions: new Float32Array(sizes.areaBorder.positions),
      normals: new Float32Array(sizes.areaBorder.normals)
    },
  }
  var offsets = {
    point: { types: 0, ids: 0, positions: 0, labels: 0 },
    line: { types: 0, ids: 0, positions: 0, normals: 0, labels: 0 },
    area: { types: 0, ids: 0, positions: 0, cells: 0, labels: 0 },
    areaBorder: { types: 0, ids: 0, positions: 0, normals: 0 },
  }
  var pindex = 0
  for (var bufi = 0; bufi < buffers.length; bufi++) {
    var buf = buffers[bufi]
    if (buf.length === 0) return
    var offset = 0
    var featureType = buf.readUInt8(offset)
    offset+=1
    if (featureType === 1) {
      data.point.types[offsets.point.types++] = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      var id = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      data.point.ids[offsets.point.ids++] = id
      data.point.positions[offsets.point.positions++] = buf.readFloatLE(offset)
      offset+=4
      data.point.positions[offsets.point.positions++] = buf.readFloatLE(offset)
      offset+=4
      offset = decodeLabels(buf, offset, data.point, id)
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
      offset = decodeLabels(buf, offset, data.line, id)
    }
    else if (featureType === 3) {
      var type = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      var id = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      var plen = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      var positions = []
      var lon, lat
      for (var i=0; i<plen; i++) {
        lon = buf.readFloatLE(offset)
        offset+=4
        lat = buf.readFloatLE(offset)
        data.area.types[offsets.area.types++] = type
        data.area.ids[offsets.area.ids++] = id
        data.area.positions[offsets.area.positions++] = lon
        data.area.positions[offsets.area.positions++] = lat
        offset+=4
        positions.push([lon, lat])
      }
      var clen = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      var cells = []
      for (var i=0; i<clen; i++) {
        var c0 = varint.decode(buf, offset)
        data.area.cells[offsets.area.cells++] = c0 + pindex
        cells.push(c0)
        offset+=varint.decode.bytes
        var c1 = varint.decode(buf, offset)
        data.area.cells[offsets.area.cells++] = c1 + pindex
        cells.push(c1)
        offset+=varint.decode.bytes
        var c2 = varint.decode(buf, offset)
        data.area.cells[offsets.area.cells++] = c2 + pindex
        cells.push(c2)
        offset+=varint.decode.bytes
      }
      var edgeGraph = makeEdgeGraph(cells)
      var start = 0
      for (var j=0; j<positions.length; j++) {
        var a = j
        var b = (j+1)%positions.length
        var ab = a + ',' + b
        if ((ab !== '0,1' && edgeGraph[ab] !==1) || j === positions.length-1) {
          var pos = positions.slice(start, j+1)
          if (pos.length === 0) continue
          start = j+1
          var normals = getNormals(pos, true)
          var positionsCount = 2+6+(4*pos.length)

          if (offsets.areaBorder.positions + pos.length + positionsCount >= data.areaBorder.positions.length) {
            var ndataTypes = new Float32Array(data.areaBorder.types.length*1.2)
            for (var k=0; k<data.areaBorder.types.length; k++) {
              ndataTypes[k] = data.areaBorder.types[k]
            }
            data.areaBorder.types = ndataTypes
            var ndataPos = new Float32Array(data.areaBorder.positions.length*1.2)
            for (var k=0; k<data.areaBorder.positions.length; k++) {
              ndataPos[k] = data.areaBorder.positions[k]
            }
            data.areaBorder.positions = ndataPos
            var ndataNorms = new Float32Array(data.areaBorder.normals.length*1.2)
            for (var k=0; k<data.areaBorder.normals.length; k++) {
              ndataNorms[k] = data.areaBorder.normals[k]
            }
            data.areaBorder.normals = ndataNorms
          }

          for (var k=0; k<pos.length; k++){
            var scale = Math.sqrt(normals[k][1])
            if (k === 0) {
              data.areaBorder.types[offsets.areaBorder.types++] = type
              data.areaBorder.ids[offsets.areaBorder.ids++] = id
              data.areaBorder.positions[offsets.areaBorder.positions++] = pos[0][0]
              data.areaBorder.positions[offsets.areaBorder.positions++] = pos[0][1]
              data.areaBorder.normals[offsets.areaBorder.normals++] = normals[0][0][0]*scale
              data.areaBorder.normals[offsets.areaBorder.normals++] = normals[0][0][1]*scale
            }
            data.areaBorder.types[offsets.areaBorder.types++] = type
            data.areaBorder.types[offsets.areaBorder.types++] = type
            data.areaBorder.ids[offsets.areaBorder.ids++] = id
            data.areaBorder.ids[offsets.areaBorder.ids++] = id
            data.areaBorder.positions[offsets.areaBorder.positions++] = pos[k][0]
            data.areaBorder.positions[offsets.areaBorder.positions++] = pos[k][1]
            data.areaBorder.positions[offsets.areaBorder.positions++] = pos[k][0]
            data.areaBorder.positions[offsets.areaBorder.positions++] = pos[k][1]
            data.areaBorder.normals[offsets.areaBorder.normals++] = normals[k][0][0]*scale
            data.areaBorder.normals[offsets.areaBorder.normals++] = normals[k][0][1]*scale
            data.areaBorder.normals[offsets.areaBorder.normals++] = -normals[k][0][0]*scale
            data.areaBorder.normals[offsets.areaBorder.normals++] = -normals[k][0][1]*scale
          }
          data.areaBorder.types[offsets.areaBorder.types++] = type
          data.areaBorder.types[offsets.areaBorder.types++] = type
          data.areaBorder.types[offsets.areaBorder.types++] = type
          data.areaBorder.ids[offsets.areaBorder.ids++] = id
          data.areaBorder.ids[offsets.areaBorder.ids++] = id
          data.areaBorder.ids[offsets.areaBorder.ids++] = id
          data.areaBorder.positions[offsets.areaBorder.positions++] = pos[0][0]
          data.areaBorder.positions[offsets.areaBorder.positions++] = pos[0][1]
          data.areaBorder.positions[offsets.areaBorder.positions++] = pos[0][0]
          data.areaBorder.positions[offsets.areaBorder.positions++] = pos[0][1]
          data.areaBorder.positions[offsets.areaBorder.positions++] = pos[0][0]
          data.areaBorder.positions[offsets.areaBorder.positions++] = pos[0][1]
          data.areaBorder.normals[offsets.areaBorder.normals++] = normals[0][0][0]*scale
          data.areaBorder.normals[offsets.areaBorder.normals++] = normals[0][0][1]*scale
          data.areaBorder.normals[offsets.areaBorder.normals++] = -normals[0][0][0]*scale
          data.areaBorder.normals[offsets.areaBorder.normals++] = -normals[0][0][1]*scale
          data.areaBorder.normals[offsets.areaBorder.normals++] = -normals[0][0][0]*scale
          data.areaBorder.normals[offsets.areaBorder.normals++] = -normals[0][0][1]*scale
        }
      }
      pindex+=plen
      offset = decodeLabels(buf, offset, data.area, id)
    }
    else if (featureType === 4) {
      var type = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      var id = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      var plen = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      var pstart = offsets.area.positions
      var lon, lat
      for (var i=0; i<plen; i++) {
        lon = buf.readFloatLE(offset)
        offset+=4
        lat = buf.readFloatLE(offset)
        offset+=4
        data.area.types[offsets.area.types++] = type
        data.area.ids[offsets.area.ids++] = id
        data.area.positions[offsets.area.positions++] = lon
        data.area.positions[offsets.area.positions++] = lat
      }
      var clen = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      for (var i=0; i<clen*3; i++) {
        var c = varint.decode(buf, offset)
        data.area.cells[offsets.area.cells++] = c + pindex
        offset+=varint.decode.bytes
      }
      var elen = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      var positions = [], eprev = 0
      for (var i=0; i<elen; i++) {
        var e = varint.decode(buf, offset)
        offset+=varint.decode.bytes
        if (e === 0) { // edge break
          addAreaBorderPositions(data, offsets, positions, id, type)
          positions = []
        } else if (e % 2 === 0) { // edge index
          var ei = Math.floor(e/2)-1
          positions.push([
            data.area.positions[pstart+ei*2+0],
            data.area.positions[pstart+ei*2+1]
          ])
          eprev = ei
        } else { // edge range
          var e0 = eprev+1
          var e1 = Math.floor(e/2)-1
          for (var ex = e0; ex <= e1; ex++) {
            positions.push([
              data.area.positions[pstart+ex*2+0],
              data.area.positions[pstart+ex*2+1]
            ])
          }
          eprev = e1
        }
      }
      addAreaBorderPositions(data, offsets, positions, id, type)
      pindex+=plen
      offset = decodeLabels(buf, offset, data.area, id)
    }
  }
  return data
}

function decodeLabels (buf, offset, data, id) {
  do {
    var labelLength = varint.decode(buf, offset)
    if (labelLength === 0) continue
    offset+=varint.decode.bytes
    var labelData = buf.slice(offset, offset+labelLength)
    offset+=labelLength
    if (!data.labels[id]) data.labels[id] = []
    data.labels[id].push(labelData.toString())
  } while (labelLength > 0)
  return offset
}

function addAreaBorderPositions(data, offsets, positions, id, type) {
  if (positions.length < 2) return
  var normals = getNormals(positions, false)
  var scale = Math.sqrt(normals[0][1])
  data.areaBorder.ids[offsets.areaBorder.ids++] = id
  data.areaBorder.types[offsets.areaBorder.types++] = type
  data.areaBorder.positions[offsets.areaBorder.positions++] = positions[0][0]
  data.areaBorder.positions[offsets.areaBorder.positions++] = positions[0][1]
  data.areaBorder.normals[offsets.areaBorder.normals++] = normals[0][0][0]*scale
  data.areaBorder.normals[offsets.areaBorder.normals++] = normals[0][0][1]*scale
  for (var j = 0; j < positions.length; j++) {
    scale = Math.sqrt(normals[j][1])
    data.areaBorder.ids[offsets.areaBorder.ids++] = id
    data.areaBorder.ids[offsets.areaBorder.ids++] = id
    data.areaBorder.types[offsets.areaBorder.types++] = type
    data.areaBorder.types[offsets.areaBorder.types++] = type
    data.areaBorder.positions[offsets.areaBorder.positions++] = positions[j][0]
    data.areaBorder.positions[offsets.areaBorder.positions++] = positions[j][1]
    data.areaBorder.positions[offsets.areaBorder.positions++] = positions[j][0]
    data.areaBorder.positions[offsets.areaBorder.positions++] = positions[j][1]
    data.areaBorder.normals[offsets.areaBorder.normals++] = normals[j][0][0]*scale
    data.areaBorder.normals[offsets.areaBorder.normals++] = normals[j][0][1]*scale
    data.areaBorder.normals[offsets.areaBorder.normals++] = -normals[j][0][0]*scale
    data.areaBorder.normals[offsets.areaBorder.normals++] = -normals[j][0][1]*scale
  }
  data.areaBorder.ids[offsets.areaBorder.ids++] = id
  data.areaBorder.types[offsets.areaBorder.types++] = type
  data.areaBorder.positions[offsets.areaBorder.positions++] = positions[j-1][0]
  data.areaBorder.positions[offsets.areaBorder.positions++] = positions[j-1][1]
  data.areaBorder.normals[offsets.areaBorder.normals++] = -normals[j-1][0][0]*scale
  data.areaBorder.normals[offsets.areaBorder.normals++] = -normals[j-1][0][1]*scale
}
