//input osm data put it in a through stream, like the pbf parser.
//denormalize data
//pipe it out.
var fs = require('fs')
var through = require('through2')
var parseOSM = require('osm-pbf-parser')
var georenderPack = require('../index.js')
 
var osm = parseOSM()
var denormalizedItems = {}
var references = {}
var itemRefArray

fs.createReadStream(process.argv[2])
  .pipe(osm)
  .pipe(through.obj(write, end))

function write (items, enc, next) {
  items.forEach(function (item) {
    if (item.type === 'node') {
      references[item.id] = [item.lat, item.lon]
    }
    if (item.type === 'way') {
      denormalizedItems[item.id] = item
      itemRefArray = item.refs.map(function(ref){
        return references[ref]  
      })
      denormalizedItems[item.id].refs = itemRefArray
    }
  })
  next()
}

function end (next) {
  console.log(denormalizedItems)
}

/*
  items.forEach(function (item) {
   if (item.type === 'way') {console.log(georenderPack(item))}
  })
*/
