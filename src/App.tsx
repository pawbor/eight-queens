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

import {
  findNQueensProblemPartialSolution,
  PartialQueens,
  findNQueensProblemSolution,
} from './n-queens-problem';
import { Board } from './Board';

import './App.css';

interface AppState {
  boardState: BoardState;
  calculationActive: boolean;
  preview: boolean;
}

class App extends Component<{}, AppState> {
  private partialSolution: PartialQueens | undefined;
  private queuedCalculation: number | undefined;

  constructor(props: any) {
    super(props);

    this.state = {
      boardState: createEmptyBoardState(8),
      calculationActive: false,
      preview: true,
    };

    this.partialSolution = undefined;
  }

  handleSquareClick = (clickedSquare: SquareDescriptor) => {
    const boardState = updateBoardState(this.state.boardState, clickedSquare);
    this.setState({
      boardState,
    });
  };

  render() {
    const { boardState } = this.state;
    const boardSize = boardState.size;
    const boardDescriptor = createBoardDescriptor(boardState);
    const counter = boardState.queens.length;
    return (
      <div className="App">
        <div>
          <input
            type="number"
            value={boardSize}
            onChange={(event) => this.onBoardSizeChange(event)}
          />
          <button type="button" onClick={() => this.startBlockingCalculation()}>
            Fast (blocking)
          </button>
          <button type="button" onClick={() => this.startCalculation()}>
            Start
          </button>
          <button type="button" onClick={() => this.pauseCalculation()}>
            Pause
          </button>
          <button type="button" onClick={() => this.stopCalculation()}>
            Stop
          </button>
          <label>
            <input
              type="checkbox"
              checked={this.state.preview}
              onChange={(event) => this.onPreviewChange(event)}
            />{' '}
            Preview
          </label>
        </div>
        <Board
          descriptor={boardDescriptor}
          onSquareClick={this.handleSquareClick}
        />

        <div>{counter}</div>
      </div>
    );
  }

  private onBoardSizeChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.resetBoardWithNewSize(Number(event.target.value));
  }

  private onPreviewChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      preview: event.target.checked,
    });
  }

  private resetBoardWithNewSize(size: number) {
    this.partialSolution = undefined;
    this.setState({
      boardState: createEmptyBoardState(size),
    });
  }

  private startBlockingCalculation() {
    const { boardState } = this.state;
    const solution = findNQueensProblemSolution(boardState.size);
    
    Maybe(solution)
      .map((queensCoordinates) =>
        queensCoordinates.map(({ row, column }) =>
          retrieveSquareId({ boardState, rowIndex: row, columnIndex: column })
        )
      )
      .map(
        (queens): BoardState => ({
          ...boardState,
          queens,
        })
      )
      .defaultValue(createEmptyBoardState(boardState.size))
      .do((boardState) => {
        this.setState({ boardState });
      });
  }

  private startCalculation() {
    this.setState({
      calculationActive: true,
    });

    this.iterateCalculation();
  }

  private pauseCalculation() {
    this.setState({
      calculationActive: false,
    });

    clearTimeout(this.queuedCalculation);
    this.queuedCalculation = undefined;
    this.updateBoardStateWithPartialSolution();
  }

  private stopCalculation() {
    this.pauseCalculation();
    this.partialSolution = undefined;
  }

  private iterateCalculation() {
    if (this.queuedCalculation) {
      return;
    }

    this.queuedCalculation = setTimeout(() => {
      this.queuedCalculation = undefined;
      if (!this.state.calculationActive) {
        return;
      }
      this.computeNextPartialSolution();
      if (this.state.preview) {
        this.updateBoardStateWithPartialSolution();
      }

      const solutionFound = this.checkIfSolutionFound();
      if (solutionFound) {
        this.updateBoardStateWithPartialSolution();
        this.stopCalculation();
      } else {
        this.iterateCalculation();
      }
    });
  }

  private computeNextPartialSolution() {
    const solutionFound = this.checkIfSolutionFound();

    if (solutionFound) {
      return;
    }

    if (this.partialSolution) {
      this.partialSolution = this.partialSolution.continue();
    } else {
      const { boardState } = this.state;
      this.partialSolution = findNQueensProblemPartialSolution(boardState.size);
    }
  }

  private checkIfSolutionFound(): boolean {
    return Boolean(this.partialSolution && this.partialSolution.isSolution);
  }

  private updateBoardStateWithPartialSolution(): void {
    const { boardState } = this.state;
    Maybe(this.partialSolution)
      .map(({ solutionCandidate }) => solutionCandidate)
      .map((queensCoordinates) =>
        queensCoordinates.map(({ row, column }) =>
          retrieveSquareId({ boardState, rowIndex: row, columnIndex: column })
        )
      )
      .map(
        (queens): BoardState => ({
          ...boardState,
          queens,
        })
      )
      .defaultValue(createEmptyBoardState(boardState.size))
      .do((boardState) => {
        this.setState({ boardState });
      });
  }
}

function createEmptyBoardState(size: number): BoardState {
  return {
    size,
    queens: [],
    squares: createAllSquares(size),
  };
}

function createAllSquares(boardSize: number): BoardState['squares'] {
  const sequence = Array.from({ length: boardSize }, (_, i) => i);
  return sequence
    .map((rowIndex) =>
      sequence.map(
        (columnIndex): SquareId =>
          createSquareId({ rowIndex, columnIndex }, boardSize)
      )
    )
    .reduce(
      (
        prev: BoardState['squares'],
        next: SquareId[]
      ): BoardState['squares'] => {
        next.forEach((square) => (prev[square.key] = square));
        return prev;
      },
      {}
    );
}

function createSquareId(
  { rowIndex, columnIndex }: SquareCoordinates,
  boardSize: number
): SquareId {
  const diagonalIndices: SquareId['diagonalIndices'] = [
    rowIndex - columnIndex,
    rowIndex + columnIndex + boardSize,
  ];
  return {
    key: squareKey({ rowIndex, columnIndex }),
    rowIndex,
    columnIndex,
    diagonalIndices,
  };
}

function updateBoardState(
  boardState: BoardState,
  clickedSquare: SquareDescriptor
): BoardState {
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
): BoardState {
  const { squareId } = clickedSquare;
  const updatedQueens = [...boardState.queens, squareId];
  return {
    ...boardState,
    queens: updatedQueens,
  };
}

function removeQueenFromBoard(
  boardState: BoardState,
  clickedSquare: SquareDescriptor
): BoardState {
  const { squareId } = clickedSquare;
  const updatedQueens = boardState.queens.filter((id) => id !== squareId);
  return {
    ...boardState,
    queens: updatedQueens,
  };
}

function createBoardDescriptor(boardState: BoardState): BoardDescriptor {
  const boardSize = boardState.size;
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
  const squareId = retrieveSquareId(params);
  const color = computeSquareColor({ rowIndex, columnIndex });
  const content = computeContent(boardState, squareId);
  return {
    squareId,
    color,
    content,
  };
}

function retrieveSquareId(params: {
  boardState: BoardState;
  rowIndex: number;
  columnIndex: number;
}) {
  const { boardState, rowIndex, columnIndex } = params;
  const key = squareKey({ rowIndex, columnIndex });
  return boardState.squares[key];
}

function squareKey({ rowIndex, columnIndex }: SquareCoordinates): string {
  return `${rowIndex}/${columnIndex}`;
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
