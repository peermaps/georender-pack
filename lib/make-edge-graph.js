module.exports = makeEdgeGraph

function makeEdgeGraph (cells) {
  var edgeGraph = {}
  for (var i=0; i<cells.length; i+=3) {
    var a = Math.min(cells[i], cells[i+1]) + ',' + Math.max(cells[i], cells[i+1])
    var b = Math.min(cells[i+1], cells[i+2]) + ',' + Math.max(cells[i+1], cells[i+2])
    var c = Math.min(cells[i], cells[i+2]) + ',' + Math.max(cells[i], cells[i+2])
    if (!edgeGraph[a]) {
      edgeGraph[a] = 1
    } else edgeGraph[a] = edgeGraph[a] + 1
    if (!edgeGraph[b]) {
      edgeGraph[b] = 1
    } else edgeGraph[b] = edgeGraph[b] + 1
    if (!edgeGraph[c]) {
      edgeGraph[c] = 1
    } else edgeGraph[c] = edgeGraph[c] + 1
  }
  return edgeGraph
}
