//input osm data put it in a through stream, like the pbf parser.
//denormalize data
//pipe it out.
var fs = require('fs')
var through = require('through2')
var parseOSM = require('osm-pbf-parser')
var georenderPack = require('../index.js')
 
var osm = parseOSM()
var denormalizedItems = {}

fs.createReadStream(process.argv[2])
  .pipe(osm)
  .pipe(through.obj(write, end))

function write (items, enc, next) {
  items.forEach(function (item) {
    if (item.type === 'node') {
      denormalizedItems[item.id] = item
    }
    else if (item.type === 'way') {
      denormalizedItems[item.id] = item
      denormalizedItems[item.id].refs = item.refs.map(function(ref){
        return [denormalizedItems[ref].lon, denormalizedItems[ref].lat]  
      })
    }
  })
  next()
}
function end (next) {
  Object.values(denormalizedItems).forEach(function(entry){
    if (entry.type === 'node') console.log(entry, georenderPack(entry))
  })
}
