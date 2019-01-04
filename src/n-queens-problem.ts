import Maybe from '@pawbor/maybe';

import aStar from './a-star';

interface SquareCoordinates {
  column: number;
  row: number;
}

type Solution = SquareCoordinates[];

interface GraphNode {
  solution: Solution;
  numberOfQueens: number;
  numberOfAvailableSquares: number;
  availableSquares: SquareCoordinates[];
}

export function findNQueensProblemSolution(n: number): Solution | undefined {
  const goal = n;
  const boardSize = n;

  const path = aStar({
    startNode: createEmptyGraphNode(boardSize),
    graphTools: {
      checkIfGoalReached: (node) => node.numberOfQueens === goal,
      computeNodesDistance: (from) => -from.numberOfAvailableSquares,
      estimateGoalDistance: (node) => -node.numberOfAvailableSquares,
      findNeighbors: (previousNode) => generateNeighbors(previousNode),
    },
  });

  return Maybe(path.slice(-1)[0])
    .map((node) => node.solution)
    .getRawValue();
}

function createEmptyGraphNode(boardSize: number): GraphNode {
  const availableSquares = generateAllCoordinates(boardSize);
  return {
    solution: [],
    numberOfQueens: 0,
    numberOfAvailableSquares: availableSquares.length,
    availableSquares,
  };
}

function generateAllCoordinates(boardSize: number): SquareCoordinates[] {
  const sequence = Array.from({ length: boardSize }, (_, i) => i);
  return sequence
    .map((row) =>
      sequence.map((column): SquareCoordinates => ({ row, column }))
    )
    .reduce((prev, next) => prev.concat(next));
}

function generateNeighbors(previousNode: GraphNode): GraphNode[] {
  const nextRow = Maybe(previousNode.solution.slice(-1)[0])
    .map((coordinates) => coordinates.row + 1)
    .getValue(0);
  return previousNode.availableSquares
    .filter((coordinates) => coordinates.row === nextRow)
    .map((coordinates) => createGraphNode(previousNode, coordinates));
}

function createGraphNode(
  previousNode: GraphNode,
  coordinates: SquareCoordinates
): GraphNode {
  const availableSquares = filterAvailableSquares(
    previousNode.availableSquares,
    coordinates
  );

  return {
    solution: [...previousNode.solution, coordinates],
    numberOfQueens: previousNode.numberOfQueens + 1,
    numberOfAvailableSquares: availableSquares.length,
    availableSquares,
  };
}

function filterAvailableSquares(
  availableSquares: SquareCoordinates[],
  coordinates: SquareCoordinates
): SquareCoordinates[] {
  return availableSquares
    .filter(({ column }) => column !== coordinates.column)
    .filter(({ row }) => row !== coordinates.row)
    .filter(
      ({ row, column }) => row - column !== coordinates.row - coordinates.column
    )
    .filter(
      ({ row, column }) => row + column !== coordinates.row + coordinates.column
    );
}
