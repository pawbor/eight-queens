import Maybe from '@pawbor/maybe';

interface NodeMeta<NodeT> {
  node: NodeT;
  closed: boolean;
  gScore: number;
  fScore: number;
  previousNodeMeta: NodeMeta<NodeT> | undefined;
}

interface GraphTools<NodeT> {
  checkIfGoalReached: (node: NodeT) => boolean;
  computeNodesDistance: (from: NodeT, to: NodeT) => number;
  estimateGoalDistance: (node: NodeT) => number;
  findNeighbors: (node: NodeT) => NodeT[];
}

type NodesSet<NodeT> = Map<NodeT, NodeMeta<NodeT>>;

export default function aStar<NodeT>(params: {
  startNode: NodeT;
  graphTools: GraphTools<NodeT>;
}): NodeT[] {
  const { startNode, graphTools } = params;
  const { checkIfGoalReached, estimateGoalDistance } = graphTools;
  const nodesSet: NodesSet<NodeT> = new Map();
  nodesSet.set(startNode, {
    node: startNode,
    closed: false,
    gScore: 0,
    fScore: estimateGoalDistance(startNode),
    previousNodeMeta: undefined,
  });

  while (true) {
    const cheapestNodeMeta = findCheapest(nodesSet);
    if (!cheapestNodeMeta) {
      return [];
    }

    cheapestNodeMeta.closed = true;

    const isGoalReached = checkIfGoalReached(cheapestNodeMeta.node);
    if (isGoalReached) {
      return findPath(cheapestNodeMeta, nodesSet);
    }

    addNeighbors(nodesSet, cheapestNodeMeta, graphTools);
  }
}

function findCheapest<NodeT>(
  nodesSet: NodesSet<NodeT>
): NodeMeta<NodeT> | undefined {
  const ascendingByFScore = (nm1: NodeMeta<NodeT>, nm2: NodeMeta<NodeT>) =>
    nm1.fScore - nm2.fScore;

  return Array.from(nodesSet.values())
    .filter(isNotClosed)
    .sort(ascendingByFScore)[0];
}

function findPath<NodeT>(
  targetNodeMeta: NodeMeta<NodeT>,
  nodesSet: NodesSet<NodeT>,
  previousPath: NodeT[] = []
): NodeT[] {
  const path = [targetNodeMeta.node, ...previousPath];

  const { previousNodeMeta } = targetNodeMeta;

  if (!previousNodeMeta) {
    return path;
  }

  return findPath(previousNodeMeta, nodesSet, path);
}

function addNeighbors<NodeT>(
  nodesSet: NodesSet<NodeT>,
  previousNodeMeta: NodeMeta<NodeT>,
  graphTools: GraphTools<NodeT>
) {
  const { findNeighbors } = graphTools;

  findNeighbors(previousNodeMeta.node)
    .map(
      (neighbor): NodeMeta<NodeT> =>
        computeNodeMeta({
          node: neighbor,
          previousNodeMeta,
          nodesSet,
          graphTools,
        })
    )
    .filter(isNotClosed)
    .forEach((nodeMeta) => {
      nodesSet.set(nodeMeta.node, nodeMeta);
    });
}

function computeNodeMeta<NodeT>(params: {
  node: NodeT;
  previousNodeMeta: NodeMeta<NodeT>;
  nodesSet: NodesSet<NodeT>;
  graphTools: GraphTools<NodeT>;
}): NodeMeta<NodeT> {
  const { node, previousNodeMeta, nodesSet, graphTools } = params;
  const { estimateGoalDistance } = graphTools;

  const gScore = computeGScore(params);
  const fScore = gScore + estimateGoalDistance(node);

  const freshMeta = {
    node,
    closed: false,
    gScore,
    fScore,
    previousNodeMeta,
  };

  return Maybe(nodesSet.get(node))
    .map((persistedMeta) => {
      if (persistedMeta.closed) {
        return persistedMeta;
      }

      if (persistedMeta.fScore > freshMeta.fScore) {
        return freshMeta;
      }
    })
    .getValue(freshMeta);
}

function computeGScore<NodeT>(params: {
  node: NodeT;
  previousNodeMeta: NodeMeta<NodeT>;
  graphTools: GraphTools<NodeT>;
}): number {
  const { node, previousNodeMeta, graphTools } = params;
  const { computeNodesDistance } = graphTools;

  return (
    previousNodeMeta.gScore + computeNodesDistance(previousNodeMeta.node, node)
  );
}

function isNotClosed<NodeT>(nodeMeta: NodeMeta<NodeT>) {
  return !nodeMeta.closed;
}
