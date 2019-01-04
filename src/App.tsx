import React, { Component } from 'react';
import Maybe from '@pawbor/maybe';

import {
  BoardDescriptor,
  SquareDescriptor,
  RowDescriptor,
  SquareContent,
  SquareColor,
  BoardState,
  SquareId,
  SquareCoordinates,
} from './types';

import { findNQueensProblemSolution } from './n-queens-problem';
import { Board } from './Board';

import './App.css';

const boardSize = 8;

class App extends Component<{}, { boardState: BoardState }> {
  constructor(props: any) {
    super(props);

    this.state = {
      boardState: createBoardStateWithSolution(),
    };
  }

  handleSquareClick = (clickedSquare: SquareDescriptor) => {
    const boardState = updateBoardState(this.state.boardState, clickedSquare);
    this.setState({
      boardState,
    });
  };

  render() {
    const { boardState } = this.state;
    const boardDescriptor = createBoardDescriptor(boardState, boardSize);
    const counter = boardState.queens.length;
    return (
      <div className="App">
        <Board
          descriptor={boardDescriptor}
          onSquareClick={this.handleSquareClick}
        />

        <div>{counter}</div>
      </div>
    );
  }
}

function createBoardStateWithSolution(): BoardState {
  return Maybe(findNQueensProblemSolution(boardSize))
    .map((queensCoordinates) =>
      queensCoordinates.map(({ row, column }) =>
        retrieveSquareId({ rowIndex: row, columnIndex: column })
      )
    )
    .map((queens) => ({
      queens,
    }))
    .getValue(createEmptyBoardState());
}

function createEmptyBoardState(): BoardState {
  return {
    queens: [],
  };
}

function updateBoardState(
  boardState: BoardState,
  clickedSquare: SquareDescriptor
) {
  switch (clickedSquare.content) {
    case SquareContent.Empty:
      return addQueenToBoard(boardState, clickedSquare);
    case SquareContent.Queen:
      return removeQueenFromBoard(boardState, clickedSquare);
    default:
      return boardState;
  }
}

function addQueenToBoard(
  boardState: BoardState,
  clickedSquare: SquareDescriptor
) {
  const { squareId } = clickedSquare;
  const updatedQueens = [...boardState.queens, squareId];
  return {
    queens: updatedQueens,
  };
}

function removeQueenFromBoard(
  boardState: BoardState,
  clickedSquare: SquareDescriptor
) {
  const { squareId } = clickedSquare;
  const updatedQueens = boardState.queens.filter((id) => id !== squareId);
  return {
    queens: updatedQueens,
  };
}

function createBoardDescriptor(
  boardState: BoardState,
  boardSize: number
): BoardDescriptor {
  return {
    rows: Array.from({ length: boardSize }, (_, index) =>
      createRowDescriptor({ boardState, boardSize, index })
    ),
  };
}

function createRowDescriptor(params: {
  boardState: BoardState;
  index: number;
  boardSize: number;
}): RowDescriptor {
  const { boardState, index, boardSize } = params;
  return {
    index,
    squares: Array.from({ length: boardSize }, (_, columnIndex) =>
      createSquareDescriptor({ boardState, rowIndex: index, columnIndex })
    ),
  };
}

function createSquareDescriptor(params: {
  boardState: BoardState;
  rowIndex: number;
  columnIndex: number;
}) {
  const { boardState, rowIndex, columnIndex } = params;
  const squareId = retrieveSquareId({ rowIndex, columnIndex });
  const color = computeSquareColor({ rowIndex, columnIndex });
  const content = computeContent(boardState, squareId);
  return {
    squareId,
    color,
    content,
  };
}

const squareIds: Record<string, SquareId> = {};

function retrieveSquareId({ rowIndex, columnIndex }: SquareCoordinates) {
  const key = `${rowIndex}/${columnIndex}`;
  return squareIds[key] || createSquareId({ key, rowIndex, columnIndex });
}

function createSquareId(
  params: Pick<SquareId, 'key' | 'rowIndex' | 'columnIndex'>
): SquareId {
  const { rowIndex, columnIndex } = params;
  const diagonalIndices: SquareId['diagonalIndices'] = [
    rowIndex - columnIndex,
    rowIndex + columnIndex + boardSize,
  ];
  const squareId = (squareIds[params.key] = { ...params, diagonalIndices });
  return squareId;
}

function computeSquareColor({ rowIndex, columnIndex }: SquareCoordinates) {
  return (columnIndex + (rowIndex % 2)) % 2
    ? SquareColor.Black
    : SquareColor.White;
}

function computeContent(boardState: BoardState, squareId: SquareId) {
  const isQueen = boardState.queens.some((id) => id === squareId);
  if (isQueen) {
    return SquareContent.Queen;
  }

  const isBlocked = checkIfBlocked(boardState, squareId);
  if (isBlocked) {
    return SquareContent.Blocked;
  }

  return SquareContent.Empty;
}

function checkIfBlocked(boardState: BoardState, squareId: SquareId) {
  return (
    checkIfBlockedColumn(boardState, squareId) ||
    checkIfBlockedRow(boardState, squareId) ||
    checkIfBlockedDiagonal(boardState, squareId)
  );
}

function checkIfBlockedColumn(boardState: BoardState, squareId: SquareId) {
  const { columnIndex } = squareId;
  const blockedColumns = computeBlockedColumns(boardState);
  return blockedColumns.some((blocked) => blocked === columnIndex);
}

function computeBlockedColumns({ queens }: BoardState) {
  return queens.map((squareId) => squareId.columnIndex);
}

function checkIfBlockedRow(boardState: BoardState, squareId: SquareId) {
  const { rowIndex } = squareId;
  const blockedRows = computeBlockedRows(boardState);
  return blockedRows.some((blocked) => blocked === rowIndex);
}

function computeBlockedRows({ queens }: BoardState) {
  return queens.map((squareId) => squareId.rowIndex);
}

function checkIfBlockedDiagonal(boardState: BoardState, squareId: SquareId) {
  const { diagonalIndices } = squareId;
  const blockedDiagonals = computeBlockedDiagonals(boardState);
  return blockedDiagonals.some((blocked) => diagonalIndices.includes(blocked));
}

function computeBlockedDiagonals({ queens }: BoardState) {
  return queens
    .map((squareId) => squareId.diagonalIndices)
    .reduce((prev, next) => prev.concat(next), [] as number[]);
}

export default App;
