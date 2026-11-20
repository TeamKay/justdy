export type WorkedExampleCheck = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

export const linearEquationsWorkedChecks: Record<string, WorkedExampleCheck> = {
  "variables-and-equations-0": {
    question: "If x = 4, what is the value of x + 6?",
    options: ["8", "9", "10", "11"],
    correctAnswer: 2,
    explanation: "Replace x with 4: 4 + 6 = 10.",
  },

  "one-step-equations-0": {
    question: "To solve x + 7 = 15, what should you do to both sides first?",
    options: [
      "Add 7",
      "Subtract 7",
      "Multiply by 7",
      "Divide by 7",
    ],
    correctAnswer: 1,
    explanation:
      "Subtract 7 from both sides to undo the addition. This gives x = 15 - 7 = 8.",
  },
  "one-step-equations-1": {
    question: "What operation should you use first to solve x - 6 = 9?",
    options: ["Subtract 6", "Multiply by 6", "Add 6", "Divide by 6"],
    correctAnswer: 2,
    explanation:
      "Add 6 to both sides to undo subtraction. Therefore, x = 9 + 6 = 15.",
  },
  "one-step-equations-2": {
    question: "How would you isolate x in 4x = 28?",
    options: [
      "Add 4 to both sides",
      "Subtract 4 from both sides",
      "Multiply both sides by 4",
      "Divide both sides by 4",
    ],
    correctAnswer: 3,
    explanation:
      "Since x is multiplied by 4, divide both sides by 4. This gives x = 28 ÷ 4 = 7.",
  },
  "one-step-equations-3": {
    question: "Which operation undoes x ÷ 5 = 3?",
    options: ["Add 5", "Multiply by 5", "Subtract 5", "Divide by 5"],
    correctAnswer: 1,
    explanation:
      "Multiplication by 5 undoes division by 5. Multiply both sides by 5 to get x = 15.",
  },

  "two-step-equations-0": {
    question: "When solving 3x + 4 = 19, which operation should you perform first?",
    options: [
      "Divide both sides by 3",
      "Add 4 to both sides",
      "Subtract 4 from both sides",
      "Multiply both sides by 3",
    ],
    correctAnswer: 2,
    explanation:
      "Undo the addition first. Subtract 4 from both sides to get 3x = 15, then divide by 3 to get x = 5.",
  },
  "two-step-equations-1": {
    question: "What should you do first to solve 2x - 7 = 13?",
    options: [
      "Add 7 to both sides",
      "Subtract 7 from both sides",
      "Divide both sides by 2",
      "Multiply both sides by 2",
    ],
    correctAnswer: 0,
    explanation:
      "Add 7 to both sides to undo the subtraction. You get 2x = 20, then divide by 2 to get x = 10.",
  },
  "two-step-equations-2": {
    question: "What is the solution to 5x + 2 = 32?",
    options: ["x = 5", "x = 6", "x = 7", "x = 8"],
    correctAnswer: 1,
    explanation:
      "Subtract 2 from both sides: 5x = 30. Divide by 5: x = 6.",
  },

  "negative-numbers-and-fractions-0": {
    question: "What is the solution to x + 8 = 3?",
    options: ["x = 5", "x = -5", "x = 11", "x = -11"],
    correctAnswer: 1,
    explanation:
      "Subtract 8 from both sides: x = 3 - 8 = -5.",
  },
  "negative-numbers-and-fractions-1": {
    question: "What is the solution to -3x = 18?",
    options: ["x = 6", "x = -3", "x = -6", "x = 15"],
    correctAnswer: 2,
    explanation:
      "Divide both sides by -3. Since 18 ÷ (-3) = -6, the solution is x = -6.",
  },
  "negative-numbers-and-fractions-2": {
    question: "What is the solution to x/4 + 2 = 5?",
    options: ["x = 3", "x = 7", "x = 10", "x = 12"],
    correctAnswer: 3,
    explanation:
      "Subtract 2 from both sides: x/4 = 3. Multiply both sides by 4: x = 12.",
  },

  "checking-solutions-0": {
    question: "Does x = 4 make the equation 2x + 3 = 11 true?",
    options: [
      "Yes, because both sides equal 11",
      "No, because the left side equals 8",
      "No, because the right side equals 8",
      "Yes, because both sides equal 4",
    ],
    correctAnswer: 0,
    explanation:
      "Substitute 4 for x: 2(4) + 3 = 8 + 3 = 11. Both sides equal 11, so x = 4 is a solution.",
  },

  "word-problems-0": {
    question: "Ama has some money. She receives $6 and now has $20. How much did she have at first?",
    options: ["$12", "$13", "$14", "$26"],
    correctAnswer: 2,
    explanation:
      "Let x be her original amount. The equation is x + 6 = 20. Subtract 6: x = $14.",
  },
  "word-problems-1": {
    question: "A number multiplied by 4 and increased by 3 gives 27. What is the number?",
    options: ["5", "6", "7", "8"],
    correctAnswer: 1,
    explanation:
      "Write 4x + 3 = 27. Subtract 3 to get 4x = 24. Divide by 4: x = 6.",
  },
};
