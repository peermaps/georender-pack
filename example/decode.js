const Decoder = require('../decoder.js')
const fs = require('fs')
const readline = require('readline')

var filename = process.argv[2]

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
