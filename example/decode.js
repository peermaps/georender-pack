const decode = require('../decode.js')
const fs = require('fs')
const readline = require('readline')

var filename = process.argv[2]

var rl = readline.createInterface({
  input: fs.createReadStream(filename)
})
rl.on('line', (buffer) => console.log(decode([Buffer.from(buffer, 'hex')])))
