import Maybe from '@pawbor/maybe';

import {
  resolvePartiallyWithBacktracking,
  PartialSolution,
  resolveWithBacktracking,
} from './backtracking';

interface SquareCoordinates {
  column: number;
  row: number;
}

type Queens = SquareCoordinates[];

interface GraphNode {
  queens: Queens;
  numberOfQueens: number;
  numberOfAvailableSquares: number;
  availableSquares: SquareCoordinates[];
}

export type PartialQueens = PartialSolution<Queens>;

export function findNQueensProblemSolution(n: number): Queens | undefined {
  const goal = n;
  const boardSize = n;

  const solutionNode = resolveWithBacktracking(
    createEmptyGraphNode(boardSize),
    {
      checkIfSolution: (candidate) => candidate.numberOfQueens === goal,
      findSortedSuccessors: (node) =>
        generateNeighbors(node).sort(
          (n1, n2) => n2.numberOfAvailableSquares - n1.numberOfAvailableSquares
        ),
    }
  );

  return Maybe(solutionNode)
    .map(({ queens }) => queens)
    .getRawValue();
}

export function findNQueensProblemPartialSolution(n: number): PartialQueens {
  const goal = n;
  const boardSize = n;

  const solutionNode = resolvePartiallyWithBacktracking(
    createEmptyGraphNode(boardSize),
    {
      checkIfSolution: (candidate) => candidate.numberOfQueens === goal,
      findSortedSuccessors: (node) =>
        generateNeighbors(node).sort(
          (n1, n2) => n2.numberOfAvailableSquares - n1.numberOfAvailableSquares
        ),
    }
  );

  return convertPartialSolution(solutionNode);
}

function convertPartialSolution(
  solutionNode: PartialSolution<GraphNode>
): PartialQueens {
  return {
    isSolution: solutionNode.isSolution,
    solutionCandidate: Maybe(solutionNode.solutionCandidate)
      .map(({ queens }) => queens)
      .getRawValue(),
    continue: () => {
      const partialGraphNode = solutionNode.continue();
      return convertPartialSolution(partialGraphNode);
    },
  };
}

function createEmptyGraphNode(boardSize: number): GraphNode {
  const availableSquares = generateAllCoordinates(boardSize);
  return {
    queens: [],
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
  const nextRow = Maybe(previousNode.queens.slice(-1)[0])
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
    queens: [...previousNode.queens, coordinates],
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
