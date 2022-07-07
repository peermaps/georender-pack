module.exports = function getLoops(cells, positions) {
  var loops = [], loop = []
  var visited = Array(positions.length).fill(false)
  var edgeGraph = getEdgeGraph(cells)
  for (var i = 0; i < positions.length; i++) {
    if (visited[i]) continue
    var firstIndex = i, lastIndex = -1
    for (var d = 0; d < 2; d++) {
      var start = i, c = i, prev = -1
      do {
        if (visited[c]) break
        if (d === 0) {
          loop.push(positions[c])
          lastIndex = c
        } else {
          loop.unshift(positions[c])
          firstIndex = c
        }
        visited[c] = true
        var es = edgeGraph[c]
        if (es === undefined) break
        var e = -1
        if (d === 0) {
          for (var j = 0; j < es.length; j++) {
            var x = es[j]
            if (visited[x]) continue
            e = x
            break
          }
        } else {
          for (var j = es.length-1; j >= 0; j--) {
            var x = es[j]
            if (visited[x]) continue
            e = x
            break
          }
        }
        if (e < 0) break
        prev = c
        c = e
      } while (start !== c)
    }
    if (loop.length > 2) {
      if (firstIndex !== lastIndex) {
        loop.push(loop[0])
      }
      loops.push(loop)
      loop = []
    }
  }
  return loops
}

function getEdgeGraph(cells) {
  var graph = {}, count = {}
  for (var i = 0; i < cells.length; i+=3) {
    var c0 = cells[i+0]
    var c1 = cells[i+1]
    var c2 = cells[i+2]
    var k01 = ekey(c0,c1)
    var k02 = ekey(c0,c2)
    var k12 = ekey(c1,c2)
    count[k01] = (count[k01] || 0) + 1
    count[k02] = (count[k02] || 0) + 1
    count[k12] = (count[k12] || 0) + 1
  }
  for (var i = 0; i < cells.length; i+=3) {
    var c0 = cells[i+0]
    var c1 = cells[i+1]
    var c2 = cells[i+2]
    var k01 = ekey(c0,c1)
    var k02 = ekey(c0,c2)
    var k12 = ekey(c1,c2)
    if (count[k01] === 1) addGraph(graph,c0,c1)
    if (count[k02] === 1) addGraph(graph,c0,c2)
    if (count[k12] === 1) addGraph(graph,c1,c2)
  }
  return graph
}

function addGraph(graph,a,b) {
  if (graph[a] === undefined) graph[a] = [b]
  else if (graph[a][0] > b) graph[a].unshift(b)
  else graph[a].push(b)
  if (graph[b] === undefined) graph[b] = [a]
  else if (graph[b][0] > a) graph[b].unshift(a)
  else graph[b].push(a)
}

function ekey(a,b) { return Math.min(a,b) + ',' + Math.max(a,b) }
