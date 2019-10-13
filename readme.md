pack osm data into a buffer based on the [peermaps buffer
schema](https://github.com/peermaps/docs/blob/master/bufferschema.md). also includes
code to unpack buffers in the above schema for use elsewhere.

this is part of the [peermaps](https://github.com/peermaps/) pipeline.

# example

## encode

```
var fs = require('fs')
var through = require('through2')
var parseOSM = require('osm-pbf-parser')
var georenderPack = require('../encode.js')
 
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
  Object.values(allItems).forEach(function (item) {
    console.log(georenderPack(item, itemsRefsObject))
  })
}
```

to run this example, first, open the terminal and navigate to the directory where you've cloned your
repo. run `npm run get-data`. if that worked correctly, the `example` directory should have a file called `alexandria.pbf`. once you have `alexandria.pbf`, do `npm run encode-example`. if everything worked correctly, you should see a bunch of buffer data in your terminal that looks something like this:

```
<Buffer 02 c0 00 00 00 00 00 00 1c 38 cc a4 41 0e 00 b4 ca ee 41 35 12 f9 41 e5 c9 ee 41 09 12 f9 41 83 c9 ee 41 ee 11 f9 41 31 c9 ee 41 e5 11 f9 41 eb c8 ee ... 77 more bytes>
<Buffer 02 c0 00 00 00 00 00 00 46 38 cc a4 41 14 00 65 c8 ee 41 2d 17 f9 41 99 c8 ee 41 ac 16 f9 41 b0 c8 ee 41 55 16 f9 41 be c8 ee 41 da 15 f9 41 be c8 ee ... 125 more bytes>
```

## decode

```
var decode = require('../decode.js')

var buffers = [
  Buffer.from('0115010000000000084c4080410daeef416391f941', 'hex'),
  Buffer.from('02cb000000000000103eba7f4109002eefef416ac2f9414aefef41abc2f9417cefef4117c3f941bef0ef41bdc5f9412cf1ef419cc6f94160f1ef41ecc6f94127f2ef4104c8f94139f2ef412dc8f94101f3ef41f0c9f941', 'hex'),
  Buffer.from('02d300000000000070047c794104004735ef41f28bf9419e35ef41de8bf9410636ef41b08bf9414b36ef41908bf941', 'hex'),
  Buffer.from('011501000000000050a2507941e815ef415cb6f941', 'hex'),
  Buffer.from('0315010000000000c01688784107008743ef414d9df941da47ef41039ff9418e48ef41df9df9415746ef41499df9412944ef413b9cf9411344ef41b39cf9418743ef414d9df9410400010006000500050004000300030002000100010005000300000000000000', 'hex')
]

buffers.forEach(function (buffer) {
  console.log(decode(buffers))
})
```

to run this example, do `npm run decode-example`. you should see output like
this:

```
{ point:
   { type: Float32Array [ 277, 277 ],
     id: Float32Array [ 34081152, 26544676 ],
     position:
      Float64Array [
        29.959985733032227,
        31.19598960876465,
        29.885696411132812,
        31.21404266357422 ] }, ...
```

# api

## var encode = require('georender-pack/encode')

input is a single osm entry for a node or way (this package currently doesn't handle relations)
processed through
[`osm-pbf-parser`](https://www.npmjs.com/package/osm-pbf-parser). there is a
second, optional argument for any dependencies for the first argument (for
example, if the first argument is a way, the second argument should contain data
for all the points that make up the way).

output is a single buffer based on the [peermaps buffer
schema](https://github.com/peermaps/docs/blob/master/bufferschema.md).

## var decode = require('georender-pack/decode')

input is an array of buffers based on the [peermaps buffer
schema](https://github.com/peermaps/docs/blob/master/bufferschema.md).

output is an object containing buffer data in this structure:

```
{
  point: {
    type: Float32Array [],
    id: Float32Array [],
    position: Float64Array []
  },
  line: {
    type: Float32Array [],
    id: Float64Array [],
    position: Float32Array []
  },
  area: {
    type: Float32Array [],
    id: Float64Array [],
    position: Float32Array [],
    cell: Uint32Array []
  }
}
```

the output data does not come out as one array for each point/line/area, but in arrays that
include all the point/line/area data. points that make up each point/line/area are accessible
by offest into these arrays.

# installation

in your terminal, run `npm install georender-pack`.


# license

MIT
