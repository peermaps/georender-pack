var getNormals = require('polyline-normals')
var varint = require('varint')

class Decoder {
  constructor () {
    this.sizes = {
      point: { types: 0, ids: 0, positions: 0 },
      line: { types: 0, ids: 0, positions: 0, normals: 0 },
      area: { types: 0, ids: 0, positions: 0, cells: 0 }
    }
    this.data = {
      point: {
        types: new Float32Array(this.sizes.point.types),
        ids: new Float32Array(this.sizes.point.ids),
        positions: new Float32Array(this.sizes.point.positions),
        labels: {}
      },
      line: {
        types: new Float32Array(this.sizes.line.types),
        ids: new Float32Array(this.sizes.line.ids),
        positions: new Float32Array(this.sizes.line.positions),
        normals: new Float32Array(this.sizes.line.normals),
        labels: {}
      },
      area: {
        types: new Float32Array(this.sizes.area.types),
        ids: new Float32Array(this.sizes.area.ids),
        positions: new Float32Array(this.sizes.area.positions),
        cells: new Uint32Array(this.sizes.area.cells),
        labels: {}
      }
    }
    this.offsets = {
      point: { types: 0, ids: 0, positions: 0, labels: 0 },
      line: { types: 0, ids: 0, positions: 0, normals: 0, labels: 0 },
      area: { types: 0, ids: 0, positions: 0, cells: 0, labels: 0 }
    }
  }
  decode (buf) {
    if (!buf.length) return //skip this
    var featureType = buf.readUInt8(0)
    var offset = 1
    if (featureType === 1) {
      this.sizes.point.types++
      this.sizes.point.ids+=2
      this.sizes.point.positions+=2
    }
    else if (featureType === 2) {
      varint.decode(buf, offset) //types
      offset+=varint.decode.bytes
      varint.decode(buf, offset) //id
      offset+=varint.decode.bytes
      var plen = varint.decode(buf, offset) //pcount
      offset+=varint.decode.bytes
      this.sizes.line.types+=plen*2+2
      this.sizes.line.ids+=plen*4+4
      this.sizes.line.positions+=plen*4+4
      this.sizes.line.normals+=plen*4+4
    }
    else if (featureType === 3) {
      varint.decode(buf, offset) //types
      offset+=varint.decode.bytes
      varint.decode(buf, offset) //id
      offset+=varint.decode.bytes
      var plen = varint.decode(buf, offset) //pcount
      offset+=varint.decode.bytes
      offset+=plen*8
      this.sizes.area.types+=plen
      this.sizes.area.ids+=plen*2
      this.sizes.area.positions+=plen*2
      var clen = varint.decode(buf, offset) //clen
      offset+=varint.decode.bytes
      this.sizes.area.cells+=clen*3
    }

    var pindex = 0
    var offset = 0
    var featureType = buf.readUInt8(offset)
    offset+=1
    if (featureType === 1) {
      this.data.point.types[this.offsets.point.types++] = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      var id = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      this.data.point.ids[this.offsets.point.ids++] = id
      this.data.point.positions[this.offsets.point.positions++] = buf.readFloatLE(offset)
      offset+=4
      this.data.point.positions[this.offsets.point.positions++] = buf.readFloatLE(offset)
      offset+=4
      offset = this.decodeLabels(buf, offset, this.data.point, id)
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
      this.data.line.types[this.offsets.line.types++] = type
      this.data.line.ids[this.offsets.line.ids++] = id
      for (var i=0; i<plen; i++) {
        this.data.line.types[this.offsets.line.types++] = type
        this.data.line.types[this.offsets.line.types++] = type
        this.data.line.ids[this.offsets.line.ids++] = id
        this.data.line.ids[this.offsets.line.ids++] = id
        lon = buf.readFloatLE(offset)
        offset+=4
        lat = buf.readFloatLE(offset)
        offset+=4
        if (i === 0) {
          this.data.line.positions[this.offsets.line.positions++] = lon
          this.data.line.positions[this.offsets.line.positions++] = lat
        }
        this.data.line.positions[this.offsets.line.positions++] = lon
        this.data.line.positions[this.offsets.line.positions++] = lat
        this.data.line.positions[this.offsets.line.positions++] = lon
        this.data.line.positions[this.offsets.line.positions++] = lat
        positions.push([lon, lat])
      }
      this.data.line.types[this.offsets.line.types++] = type
      this.data.line.ids[this.offsets.line.ids++] = id
      this.data.line.positions[this.offsets.line.positions++] = lon
      this.data.line.positions[this.offsets.line.positions++] = lat

      var normals = getNormals(positions)
      //console.log('normals = ', normals)
      var scale = Math.sqrt(normals[0][1])
      this.data.line.normals[this.offsets.line.normals++] = normals[0][0][0]*scale
      this.data.line.normals[this.offsets.line.normals++] = normals[0][0][1]*scale
      for (var i=0; i<normals.length; i++) {
        scale = Math.sqrt(normals[i][1])
        this.data.line.normals[this.offsets.line.normals++] = normals[i][0][0]*scale
        this.data.line.normals[this.offsets.line.normals++] = normals[i][0][1]*scale
        this.data.line.normals[this.offsets.line.normals++] = -1*normals[i][0][0]*scale
        this.data.line.normals[this.offsets.line.normals++] = -1*normals[i][0][1]*scale
      }
      var normOffset = this.offsets.line.normals
      this.data.line.normals[this.offsets.line.normals++] = this.data.line.normals[normOffset-2]
      this.data.line.normals[this.offsets.line.normals++] = this.data.line.normals[normOffset-1]
      offset = this.decodeLabels(buf, offset, this.data.line, id)
    }
    else if (featureType === 3) {
      var type = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      var id = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      var plen = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      for (var i=0; i<plen; i++) {
        this.data.area.types[this.offsets.area.types++] = type
        this.data.area.ids[this.offsets.area.ids++] = id
        this.data.area.positions[this.offsets.area.positions++] = buf.readFloatLE(offset)
        offset+=4
        this.data.area.positions[this.offsets.area.positions++] = buf.readFloatLE(offset)
        offset+=4
      }
      var clen = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      for (var i=0; i<clen; i++) {
        this.data.area.cells[this.offsets.area.cells++] = varint.decode(buf, offset) + pindex
        offset+=varint.decode.bytes
        this.data.area.cells[this.offsets.area.cells++] = varint.decode(buf, offset) + pindex
        offset+=varint.decode.bytes
        this.data.area.cells[this.offsets.area.cells++] = varint.decode(buf, offset) + pindex
        offset+=varint.decode.bytes
      }
      pindex+=plen
      offset = this.decodeLabels(buf, offset, this.data.area, id)
    }
  }

  decodeLabels (buf, offset, dataField, id) {
    dataField.labels[id] = []
    do {
      var labelLength = varint.decode(buf, offset)
      offset+=varint.decode.bytes
      var labelData = buf.slice(offset, offset+labelLength)
      offset+=labelLength
      dataField.labels[id].push(labelData.toString())
    } while (labelLength > 0)
    return offset
  }

}

module.exports = Decoder

