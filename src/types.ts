export enum SquareColor {
  Black = "black",
  White = "white"
}

export enum SquareContent {
  Empty = "Empty",
  Queen = "Queen",
  Blocked = "Blocked"
}

export interface SquareCoordinates {
  rowIndex: number;
  columnIndex: number;
}

export interface SquareId extends SquareCoordinates {
  key: string;
  diagonalIndices: [number, number];
}

export interface BoardDescriptor {
  rows: RowDescriptor[];
}

export interface RowDescriptor {
  index: number;
  squares: SquareDescriptor[];
}

export interface SquareDescriptor {
  squareId: SquareId;
  color: SquareColor;
  content: SquareContent;
}

export interface BoardState {
  queens: SquareId[];
}
