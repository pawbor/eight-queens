import React, { Component } from "react";
import "./App.css";

enum SquareColor {
  Black = "black",
  White = "white"
}

enum SquareContent {
  Empty = "Empty",
  Queen = "Queen",
  Blocked = "Blocked"
}

interface SquareCoordinates {
  rowIndex: number;
  columnIndex: number;
}

interface SquareId extends SquareCoordinates {
  key: string;
  diagonalIndices: [number, number];
}

interface BoardDescriptor {
  rows: RowDescriptor[];
}

interface RowDescriptor {
  index: number;
  squares: SquareDescriptor[];
}

interface SquareDescriptor {
  squareId: SquareId;
  color: SquareColor;
  content: SquareContent;
}

interface BoardState {
  queens: SquareId[];
}

const boardSize = 8;

class App extends Component<{}, { boardState: BoardState }> {
  constructor(props: any) {
    super(props);

    this.state = {
      boardState: createEmptyBoardState()
    };
  }

  handleSquareClick = (clickedSquare: SquareDescriptor) => {
    const boardState = updateBoardState(this.state.boardState, clickedSquare);
    this.setState({
      boardState
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

function createEmptyBoardState() {
  return {
    queens: []
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
    queens: updatedQueens
  };
}

function removeQueenFromBoard(
  boardState: BoardState,
  clickedSquare: SquareDescriptor
) {
  const { squareId } = clickedSquare;
  const updatedQueens = boardState.queens.filter(id => id !== squareId);
  return {
    queens: updatedQueens
  };
}

function createBoardDescriptor(boardState: BoardState, boardSize: number) {
  return {
    rows: Array.from({ length: boardSize }, (_, index) =>
      createRowDescriptor({ boardState, boardSize, index })
    )
  };
}

function createRowDescriptor(params: {
  boardState: BoardState;
  index: number;
  boardSize: number;
}) {
  const { boardState, index, boardSize } = params;
  return {
    index,
    squares: Array.from({ length: boardSize }, (_, columnIndex) =>
      createSquareDescriptor({ boardState, rowIndex: index, columnIndex })
    )
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
    content
  };
}

const squareIds: Record<string, SquareId> = {};

function retrieveSquareId({ rowIndex, columnIndex }: SquareCoordinates) {
  const key = `${rowIndex}/${columnIndex}`;
  return squareIds[key] || createSquareId({ key, rowIndex, columnIndex });
}

function createSquareId(
  params: Pick<SquareId, "key" | "rowIndex" | "columnIndex">
): SquareId {
  const { rowIndex, columnIndex } = params;
  const diagonalIndices: SquareId["diagonalIndices"] = [
    rowIndex - columnIndex,
    rowIndex + columnIndex + boardSize
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
  const isQueen = boardState.queens.some(id => id === squareId);
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
  return blockedColumns.some(blocked => blocked === columnIndex);
}

function computeBlockedColumns({ queens }: BoardState) {
  return queens.map(squareId => squareId.columnIndex);
}

function checkIfBlockedRow(boardState: BoardState, squareId: SquareId) {
  const { rowIndex } = squareId;
  const blockedRows = computeBlockedRows(boardState);
  return blockedRows.some(blocked => blocked === rowIndex);
}

function computeBlockedRows({ queens }: BoardState) {
  return queens.map(squareId => squareId.rowIndex);
}

function checkIfBlockedDiagonal(boardState: BoardState, squareId: SquareId) {
  const { diagonalIndices } = squareId;
  const blockedDiagonals = computeBlockedDiagonals(boardState);
  return blockedDiagonals.some(blocked => diagonalIndices.includes(blocked));
}

function computeBlockedDiagonals({ queens }: BoardState) {
  return queens
    .map(squareId => squareId.diagonalIndices)
    .reduce((prev, next) => prev.concat(next), [] as number[]);
}

function Board(params: { descriptor: BoardDescriptor; onSquareClick: any }) {
  const { descriptor, onSquareClick } = params;
  const rows = descriptor.rows.map(rowState => (
    <Row
      key={rowState.index}
      descriptor={rowState}
      onSquareClick={onSquareClick}
    />
  ));
  return <div className="Board">{rows}</div>;
}

function Row(params: {
  descriptor: RowDescriptor;
  onSquareClick: (square: SquareDescriptor) => {};
}) {
  const { descriptor, onSquareClick } = params;
  const squares = descriptor.squares.map(square => (
    <Square
      key={square.squareId.key}
      descriptor={square}
      onClick={() => onSquareClick(square)}
    />
  ));
  return <div className="Row">{squares}</div>;
}

const colorToClass = {
  [SquareColor.Black]: "Square--black",
  [SquareColor.White]: "Square--white"
};

const contentToComponent: Record<SquareContent, () => any> = {
  [SquareContent.Empty]: EmptySquare,
  [SquareContent.Queen]: Queen,
  [SquareContent.Blocked]: BlockedSquare
};

function Square(params: { descriptor: SquareDescriptor; onClick: () => {} }) {
  const { descriptor, onClick } = params;
  const colorClass = colorToClass[descriptor.color];
  const Content = contentToComponent[descriptor.content];
  return (
    <div className={`Square ${colorClass}`} onClick={onClick}>
      <Content />
    </div>
  );
}

function EmptySquare() {
  return <span style={{ opacity: 0.5 }}>X</span>;
}

function Queen() {
  return <span style={{ color: "red" }}>Q</span>;
}

function BlockedSquare() {
  return null;
}

export default App;
