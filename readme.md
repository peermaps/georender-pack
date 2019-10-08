pack osm data into a buffer based on
https://github.com/peermaps/docs/blob/master/bufferschema.md . also includes
code to unpack buffers in the above schema for use elsewhere.

this is part of the https://github.com/peermaps/ pipeline.

# api

## encode 

input is a single osm entry for a node or way (currently doesn't handle relations)
processed through
[`osm-pbf-parser`](https://www.npmjs.com/package/osm-pbf-parser). there is a
second, optional argument for any dependencies for the first argument (for
example, if the first argument is a way, the second argument should contain data
for all the points that make up the way).

output is a single buffer based on https://github.com/peermaps/docs/blob/master/bufferschema.md .

## decode

input is an array of buffers based on https://github.com/peermaps/docs/blob/master/bufferschema.md .

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

the output data does not come out in the format of one array for each point/line/area, but in arrays that
include all the point/line/area data. points that make up each point/line/area are accessible
by offest into these arrays.

# triangulation

triangulation is done by https://www.npmjs.com/package/earcut. you can
substitute with your own triangulation library if you like.

# installation

in your terminal, run `npm install` after you've cloned the repo.

# example

first, open the terminal and navigate to the directory where you've cloned your
repo. go to the
`example` directory. once there, run `tar -xzvf geodata.tar.gz`. after that, the
`example` directory should have a file called `alexandria.pbf`.

## encode example

once you have `alexandria.pbf`, do `npm run encode-example`.

if everything worked correctly, you should see a bunch of buffer data in your
terminal that looks something like this:

```
<Buffer 02 c0 00 00 00 00 00 00 1c 38 cc a4 41 0e 00 b4 ca ee 41 35 12 f9 41 e5 c9 ee 41 09 12 f9 41 83 c9 ee 41 ee 11 f9 41 31 c9 ee 41 e5 11 f9 41 eb c8 ee ... 77 more bytes>
<Buffer 02 c0 00 00 00 00 00 00 46 38 cc a4 41 14 00 65 c8 ee 41 2d 17 f9 41 99 c8 ee 41 ac 16 f9 41 b0 c8 ee 41 55 16 f9 41 be c8 ee 41 da 15 f9 41 be c8 ee ... 125 more bytes>
```

## decode example

once you have `alexandria.pbf`, do `npm run decode-example`.

if everything worked correctly, you should see output that looks something like
this:

```
{ point:
   { type:
      Float32Array [
        277,
        277,
        277,
        277,
        277,
        277,
        277 ...

```
