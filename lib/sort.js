module.exports = function (members, deps) {
  var output = []
  var prevRole = null
  var start = 0

  for (var i=0; i<members.length; i++) {
    if (prevRole !== members[i].role) {
      output.push.apply(output, sortMembers(members.slice(start, i), deps))
      start = i
    }
    prevRole = members[i].role
  }
  output.push.apply(output, sortMembers(members.slice(start), deps))
  return output
}

function sortMembers (members, deps) {
  if (members.length === 0) return []
  var firstIDs = {}
  var lastIDs = {}
  var sorted = []
  for (var i=0; i<members.length; i++) {
    if (deps[members[i].id]) {
      var refs = deps[members[i].id].refs
      var fkey = refs[0]
      var lkey = refs[refs.length-1]
      firstIDs[fkey] = i
      lastIDs[lkey] = i
    }
  }
  var i = 0
  var j = 1
  var visited = {}
  var reverse = false
  while (true) {
    if (visited[i]) {
      i = j++ 
      if (j > members.length) break
      continue
    }
    visited[i] = true
    //sorted.push(members[i]) 
    sorted.push(Object.assign({reverse}, members[i]))
    if (deps[members[i].id]) {
      var refs = deps[members[i].id].refs
      var first = refs[0] //current
      var last = refs[refs.length-1] //current
      var fif = firstIDs[first]
      var lif = lastIDs[first]
      var fil = firstIDs[last]
      var lil = lastIDs[last]
      if (members[fif] !== undefined && !visited[fif]) {
        i = fif
        sorted[sorted.length-1].reverse = true
        reverse = false
      }
      else if (members[lif] !== undefined && !visited[lif]) {
        i = lif
        sorted[sorted.length-1].reverse = true
        reverse = true
      }
      else if (members[fil] !== undefined && !visited[fil]) {
        i = fil
        sorted[sorted.length-1].reverse = false
        reverse = false
      }
      else if (members[lil] !== undefined && !visited[lil]) {
        i = lil
        sorted[sorted.length-1].reverse = false
        reverse = true
      }
      else {
        i = j++ 
        if (j > members.length) break
      }
    } else {
      i = j++ 
      if (j > members.length) break
    }
  }
  return sorted
}
