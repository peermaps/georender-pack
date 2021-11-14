var decode = require('../decode.js')

var buffers = [
  Buffer.from('029b038c948b7004b17cef41a98ef941b47def411490f941a77eef413391f941f97eef418f91f94100', 'hex'),
  Buffer.from('029b038f948b7003f95fef418190f941c95fef412d90f941955fef41d28ff94100', 'hex'),
  Buffer.from('01f105f0b48997015bc0ef415dfaf941163dd985d8b2d984d982d8a7d98620d8abd8b1d988d8aa00', 'hex')
]

console.log(decode(buffers))
