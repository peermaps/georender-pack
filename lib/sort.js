module.exports = function (members, deps, rid) {
  var output = []
  var prevRole = null
  var start = 0

  for (var i=0; i<members.length; i++) {
    if (prevRole !== members[i].role) {
      output.push.apply(output, sortMembers(members.slice(start, i), deps, rid))
      start = i
    }
    prevRole = members[i].role
  }
  output.push.apply(output, sortMembers(members.slice(start), deps, rid))
  return output
}

function sortMembers (members, deps, rid) {
  if (members.length === 0) return []
  var firstIDs = {}
  var lastIDs = {}
  var sorted = []
  for (var i=0; i<members.length; i++) {
    if (deps[members[i].id] && deps[members[i].id].refs) {
      var refs = deps[members[i].id].refs
      var fkey = refs[0]
      var lkey = refs[refs.length-1]
      if (firstIDs[fkey]) firstIDs[fkey].push(i)
      else firstIDs[fkey] = [i]
      if (lastIDs[lkey]) lastIDs[lkey].push(i)
      else lastIDs[lkey] = [i]
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
    sorted.push(Object.assign({reverse}, members[i]))
    if (deps[members[i].id] && deps[members[i].id].refs) {
      var refs = deps[members[i].id].refs
      var first = refs[0]
      var last = refs[refs.length-1]
      var fifs = firstIDs[first] || []
      var lifs = lastIDs[first] || []
      var fils = firstIDs[last] || []
      var lils = lastIDs[last] || []
      var maxk = Math.max(
        fifs.length, lifs.length, fils.length, lils.length
      )
      for (var k = 0; k < maxk; k++) {
        var fif = fifs[k]
        var lif = lifs[k]
        var fil = fils[k]
        var lil = lils[k]
        if (fil !== undefined && !visited[fil]) {
          i = fil
          sorted[sorted.length-1].reverse = false
          reverse = false
          break
        }
        else if (lif !== undefined && !visited[lif]) {
          i = lif
          sorted[sorted.length-1].reverse = true
          reverse = true
          break
        }
        else if (lil !== undefined && !visited[lil]) {
          i = lil
          sorted[sorted.length-1].reverse = false
          reverse = true
          break
        }
        else if (fif !== undefined && !visited[fif]) {
          i = fif
          reverse = false 
          break
        }
      }
      if (k === maxk) {
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
