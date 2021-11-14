var getNormals = require('polyline-normals')
var varint = require('varint')
var makeEdgeGraph = require('./lib/makeEdgeGraph.js')

module.exports = function (buffers) {
  var sizes = {
    point: { types: 0, ids: 0, positions: 0 },
    line: { types: 0, ids: 0, positions: 0, normals: 0 },
    area: { types: 0, ids: 0, positions: 0, cells: 0 },
    areaBorder: { types: 0, ids: 0, positions: 0, normals: 0 }
  }
  buffers.forEach(function (buf) {
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
      var plenAB = plen*1.1
      offset+=varint.decode.bytes
      offset+=plen*8
      sizes.area.types+=plen
      sizes.area.ids+=plen*2
      sizes.area.positions+=plen*2
      sizes.areaBorder.types+=plenAB*2+2
      sizes.areaBorder.ids+=plenAB*2+2
      sizes.areaBorder.positions+=plenAB*4+4
      sizes.areaBorder.normals+=plenAB*4+4
      var clen = varint.decode(buf, offset) //clen
      offset+=varint.decode.bytes
      sizes.area.cells+=clen*3
    }
  })
  var data = {
    point: {
      types: new Float32Array(sizes.point.types),
      ids: Array(sizes.point.ids.length).fill(0),
      positions: new Float32Array(sizes.point.positions),
      labels: {}
    },
    line: {
      types: new Float32Array(sizes.line.types),
      ids: Array(sizes.line.ids.length).fill(0),
      positions: new Float32Array(sizes.line.positions),
      normals: new Float32Array(sizes.line.normals),
      labels: {}
    },
    area: {
      types: new Float32Array(sizes.area.types),
      ids: Array(sizes.area.ids.length).fill(0),
      positions: new Float32Array(sizes.area.positions),
      cells: new Uint32Array(sizes.area.cells),
      labels: {}
    },
    areaBorder: {
      types: new Float32Array(sizes.areaBorder.types),
      ids: Array(sizes.areaBorder.ids.length).fill(0),
      positions: new Float32Array(sizes.areaBorder.positions),
      normals: new Float32Array(sizes.areaBorder.normals)
    }
  }
  var offsets = {
    point: { types: 0, ids: 0, positions: 0, labels: 0 },
    line: { types: 0, ids: 0, positions: 0, normals: 0, labels: 0 },
    area: { types: 0, ids: 0, positions: 0, cells: 0, labels: 0 },
    areaBorder: { types: 0, ids: 0, positions: 0, normals: 0 }
  }
  var pindex = 0
  buffers.forEach(function (buf) {
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
      var propPos = []
      var propNorms = []
      for (var j=0; j<positions.length; j++) {
        var a = j 
        var b = (j+1)%positions.length
        var ab = a + ',' + b
        if ((ab !== '0,1' && edgeGraph[ab] !==1) || j === positions.length-1) {
          var pos = positions.slice(start, j+1)
          if (pos.length === 0) continue
          start = j+1
          var normals = getNormals(pos, true)
          var startNorm = 0
          //change 51 to number of times pen picks up * pos.length
          // copy everything in k loop but everywhere you do positions++, do
          // counter++ to get value for above
          if (offsets.areaBorder.positions + pos.length + 51 >= data.areaBorder.positions.length) {
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
            console.log('oops')
          }
          for (var k=0; k<pos.length; k++){
            var scale = Math.sqrt(normals[k][1])
            if (k === 0) {
              data.areaBorder.types[offsets.areaBorder.types++] = type
              data.areaBorder.ids[offsets.areaBorder.ids++] = id
              data.areaBorder.positions[offsets.areaBorder.positions++] = pos[0][0] 
              data.areaBorder.positions[offsets.areaBorder.positions++] = pos[0][1]
              propPos.push(pos[0][0], pos[0][1])
              startNorm = offsets.areaBorder.normals
              data.areaBorder.normals[offsets.areaBorder.normals++] = normals[0][0][0]*scale
              data.areaBorder.normals[offsets.areaBorder.normals++] = normals[0][0][1]*scale
              propNorms.push(normals[0][0][0]*scale)
              propNorms.push(normals[0][0][1]*scale)
            }
            data.areaBorder.types[offsets.areaBorder.types++] = type
            data.areaBorder.types[offsets.areaBorder.types++] = type
            data.areaBorder.ids[offsets.areaBorder.ids++] = id
            data.areaBorder.ids[offsets.areaBorder.ids++] = id
            data.areaBorder.positions[offsets.areaBorder.positions++] = pos[k][0] 
            data.areaBorder.positions[offsets.areaBorder.positions++] = pos[k][1]
            data.areaBorder.positions[offsets.areaBorder.positions++] = pos[k][0] 
            data.areaBorder.positions[offsets.areaBorder.positions++] = pos[k][1]
            propPos.push(pos[k][0], pos[k][1])
            propPos.push(pos[k][0], pos[k][1])
            data.areaBorder.normals[offsets.areaBorder.normals++] = normals[k][0][0]*scale
            data.areaBorder.normals[offsets.areaBorder.normals++] = normals[k][0][1]*scale
            data.areaBorder.normals[offsets.areaBorder.normals++] = -normals[k][0][0]*scale
            data.areaBorder.normals[offsets.areaBorder.normals++] = -normals[k][0][1]*scale
            propNorms.push(normals[k][0][0]*scale)
            propNorms.push(normals[k][0][1]*scale)
            propNorms.push(-normals[k][0][0]*scale)
            propNorms.push(-normals[k][0][1]*scale)
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
          propPos.push(pos[0][0], pos[0][1])
          propPos.push(pos[0][0], pos[0][1])
          propPos.push(pos[0][0], pos[0][1])
          data.areaBorder.normals[offsets.areaBorder.normals++] = normals[0][0][0]*scale
          data.areaBorder.normals[offsets.areaBorder.normals++] = normals[0][0][1]*scale
          data.areaBorder.normals[offsets.areaBorder.normals++] = -normals[0][0][0]*scale
          data.areaBorder.normals[offsets.areaBorder.normals++] = -normals[0][0][1]*scale
          data.areaBorder.normals[offsets.areaBorder.normals++] = -normals[0][0][0]*scale
          data.areaBorder.normals[offsets.areaBorder.normals++] = -normals[0][0][1]*scale
          propNorms.push(normals[0][0][0]*scale)
          propNorms.push(normals[0][0][1]*scale) 
          propNorms.push(-normals[0][0][0]*scale)
          propNorms.push(-normals[0][0][1]*scale) 
          propNorms.push(-normals[0][0][0]*scale)
          propNorms.push(-normals[0][0][1]*scale) 
        }
      }
      pindex+=plen
      offset = decodeLabels(buf, offset, data.area, id)
    }
  })
  data.areaBorder.positions = data.areaBorder.positions.subarray(0, offsets.areaBorder.positions)
  data.areaBorder.normals = data.areaBorder.normals.subarray(0, offsets.areaBorder.normals)
  console.log(data.areaBorder.positions)
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
