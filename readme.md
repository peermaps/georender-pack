pack osm data into a buffer based on the [peermaps buffer
schema](https://github.com/peermaps/docs/blob/master/bufferschema.md). also includes
code to unpack buffers in the above schema.

this is part of the [peermaps](https://github.com/peermaps/) pipeline.

# example

## encode

```
var fs = require('fs')
var through = require('through2')
var parseOSM = require('osm-pbf-parser')
var encode = require('georender-pack/encode')
 
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
    console.log(encode(item, itemsRefsObject))
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
  Buffer.from('039502ed8f9330046c63ef412932f841bd68ef418534f8419f6bef41b731f8416c63ef412932f84101010302000000000000000000', 'hex'),
  Buffer.from('019502a3fdb0bb0e53a5f041b158f941', 'hex'),
  Buffer.from('02c801a09bd3b701022154f141df2ef941c054f141132ff941', 'hex')
]

console.log(decode(buffers))
```

to run this example, do `npm run decode-example`. you should see output like
this:

```
{ point:
   { types: Float32Array [ 277 ],
     ids: Float32Array [ 3882630912, 0 ],
     positions: Float32Array [ 30.080724716186523, 31.168306350708008 ] },
  line:
   { types: Float32Array [ 200, 200, 200, 200, 200, 200 ], ...

```

# api

you can load both the encode and decode methods:

`var geo = require('georender-pack')`

or you can load just the method that you need:

`var encode = require('georender-pack/encode')`

`var decode = require('georender-pack/decode')`

## encode(item[, itemDependencies])

input is a single osm entry for a node or way (this package currently doesn't handle relations)
processed through
[`osm-pbf-parser`](https://www.npmjs.com/package/osm-pbf-parser). there is a
second, optional argument for any dependencies for the first argument (for
example, if the first argument is a way, the second argument should contain data
for all the points that make up the way).

output is a single buffer based on the [peermaps buffer
schema](https://github.com/peermaps/docs/blob/master/bufferschema.md).

## decode(buffers)

input is an array of buffers based on the [peermaps buffer
schema](https://github.com/peermaps/docs/blob/master/bufferschema.md).

output is an object containing buffer data in this structure:

```
{
  point: {
    types: Float32Array [],
    ids: Float32Array [],
    positions: Float32Array [],
    labels: {} // id => [ label strings ]
  },
  line: {
    types: Float32Array [],
    ids: Float32Array [],
    positions: Float32Array [],
    labels: {} // id => [ label strings ]
  },
  area: {
    types: Float32Array [],
    ids: Float32Array [],
    positions: Float32Array [],
    cells: Uint32Array [],
    labels: {} // id => [ label strings ]
  }
}
```

the output data does not come out as one array for each point/line/area, but in arrays that
include all the point/line/area data. points that make up each point/line/area are accessible
by offset into these arrays.

here's an example of what an array of label strings might look like:

```
['=Toshkent', 'aa=Tashkent', 'en=Tashkent', 'alt:uz=Тoшкент']
```

## `Decoder`

The Decoder class is useful if you are loading a large pbf file and don't want
to load the whole file into memory to decode it. 

Use `decode(buffer)` on each encoded buffer, and then `decoder.data` will
contain the decoded data. 

```js
var decoder = new Decoder()

var rl = readline.createInterface({
  input: fs.createReadStream(filename)
})

rl.on('line', (buffer) => {
  decoder.decode(Buffer.from(buffer, 'hex'))
})

rl.on('close', () => {
  console.log(decoder.data)
})
```


# installation

in your terminal, run `npm install georender-pack`.


# license

MIT
