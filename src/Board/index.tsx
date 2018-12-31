import React from "react";

import {
  BoardDescriptor,
  SquareDescriptor,
  RowDescriptor,
  SquareContent,
  SquareColor
} from "../types";

import "./Board.css";

export function Board(params: {
  descriptor: BoardDescriptor;
  onSquareClick: any;
}) {
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
