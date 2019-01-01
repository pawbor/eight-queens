import aStar from './a-star';

describe('aStar', () => {
  it('stops immediately if first node is goal', () => {
    const result = aStar({
      startNode: 0,
      graphTools: {
        checkIfGoalReached: () => true,
        computeNodesDistance: () => 0,
        estimateGoalDistance: () => 0,
        findNeighbors: () => [1, 2],
      },
    });

    expect(result).toEqual([0]);
  });

  it('stops after traversing all nodes if no solution', () => {
    const allNodes = [0, 1, 2, 3];
    const checkIfGoalReached = jest.fn(() => false);

    const result = aStar({
      startNode: 0,
      graphTools: {
        checkIfGoalReached,
        computeNodesDistance: (n1, n2) => Math.abs(n1 - n2),
        estimateGoalDistance: () => 1,
        findNeighbors: () => allNodes,
      },
    });

    expect(checkIfGoalReached).toHaveBeenCalledTimes(allNodes.length);
    allNodes.forEach((node) => {
      expect(checkIfGoalReached).toHaveBeenCalledWith(node);
    });
  });

  it('selects optimistic solution', () => {
    const goalNode = 2;
    const startNode = 1;
    const findNeighbors = (node: number) => [node - 1, node + 2];
    const computeNodesDistance = (fromNode: number, toNode: number) =>
      Math.abs(toNode - fromNode);

    const result = aStar({
      startNode,
      graphTools: {
        checkIfGoalReached: (node) => node === goalNode,
        computeNodesDistance,
        estimateGoalDistance: (node) => computeNodesDistance(goalNode, node),
        findNeighbors,
      },
    });

    expect(result).toEqual([1, 3, 2]);
  });
});
