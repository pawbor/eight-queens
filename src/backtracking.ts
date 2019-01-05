interface ProblemDefinition<NodeT> {
  findSortedSuccessors: (currentNode: NodeT) => NodeT[];
  checkIfSolution: (candidate: NodeT) => boolean;
}

export function resolveWithBacktracking<NodeT>(
  currentNode: NodeT,
  problem: ProblemDefinition<NodeT>
): NodeT | undefined {
  const { findSortedSuccessors, checkIfSolution } = problem;
  const isSolution = checkIfSolution(currentNode);
  if (isSolution) {
    return currentNode;
  }
  const successors = findSortedSuccessors(currentNode);
  while (true) {
    const nextCandidate = successors.shift();
    if (!nextCandidate) {
      return undefined;
    }

    const result = resolveWithBacktracking(nextCandidate, problem);
    if (result !== undefined) {
      return result;
    }
  }
}

type Continue<NodeT> = () => PartialSolution<NodeT>;

export interface PartialSolution<NodeT> {
  isSolution: boolean;
  solutionCandidate: NodeT | undefined;
  continue: Continue<NodeT>;
}

export function resolvePartiallyWithBacktracking<NodeT>(
  currentNode: NodeT,
  problem: ProblemDefinition<NodeT>,
  continuePredecessor: Continue<NodeT> = () =>
    createFinalSolution<NodeT>(undefined)
): PartialSolution<NodeT> {
  const { findSortedSuccessors, checkIfSolution } = problem;

  const isSolution = checkIfSolution(currentNode);
  if (isSolution) {
    return createFinalSolution(currentNode);
  } else {
    const successors = findSortedSuccessors(currentNode);
    return {
      isSolution: false,
      solutionCandidate: currentNode,
      continue: () =>
        tryToResolveWithNextSuccessor(successors, problem, continuePredecessor),
    };
  }
}

function tryToResolveWithNextSuccessor<NodeT>(
  successors: NodeT[],
  problem: ProblemDefinition<NodeT>,
  continuePredecessor: Continue<NodeT>
): PartialSolution<NodeT> {
  const nextCandidate = successors.shift();
  if (nextCandidate) {
    const partial = resolvePartiallyWithBacktracking(
      nextCandidate,
      problem,
      () => tryToResolveWithNextSuccessor(successors, problem, continuePredecessor)
    );
    return partial;
  } else {
    return continuePredecessor();
  }
}

function createFinalSolution<NodeT>(
  solution: NodeT | undefined
): PartialSolution<NodeT> {
  return {
    isSolution: true,
    solutionCandidate: solution,
    continue: () => {
      throw new Error('solution already found');
    },
  };
}
