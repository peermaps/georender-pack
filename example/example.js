//input osm data put it in a through stream, like the pbf parser.
//denormalize data
//pipe it out.
var fs = require('fs')
var through = require('through2')
var parseOSM = require('osm-pbf-parser')
var georenderPack = require('../index.js')
 
var osm = parseOSM()
var allItems = {}
var itemsRefsObject = {}

fs.createReadStream(process.argv[2])
  .pipe(osm)
  .pipe(through.obj(write, end))

function write (items, enc, next) {
  items.forEach(function (item) {
    if (item.type === 'node') {
      allItems[item.id] = item
    }
    else if (item.type === 'way') {
      allItems[item.id] = item
      item.refs.forEach(function (ref) {
        if (!itemsRefsObject[ref]) itemsRefsObject[ref] = allItems[ref]
        else return
      })
    }
  })
  next()
}
function end (next) {
  //object.keys..do georenderPack on each one of those. 
  //georenderPack(entry, refsObject)
  Object.values(allItems).forEach(function (item) {
    console.log(georenderPack(item, itemsRefsObject))
  })
}
