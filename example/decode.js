var decode = require('../decode.js')

var buffers = [
  Buffer.from('039502ed8f9330046c63ef412932f841bd68ef418534f8419f6bef41b731f8416c63ef412932f84101010302000000000000000000', 'hex'),
  Buffer.from('019502a3fdb0bb0e53a5f041b158f941', 'hex'),
  Buffer.from('02c801a09bd3b701022154f141df2ef941c054f141132ff941', 'hex')
]

console.log(decode(buffers))
