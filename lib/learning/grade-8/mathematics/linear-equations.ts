export type DiagnosticQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  skill: string;
};

export type LessonSection = {
  id: string;
  title: string;
  explanation: string;
  keyIdea: string;
  examples: {
    problem: string;
    steps: string[];
    answer: string;
    check: string;
  }[];
};

export type PracticeQuestion = {
  id: string;
  question: string;
  hint: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

export type AssessmentQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
};

export const grade8LinearEquationsLesson = {
  id: "grade-8-linear-equations",
  grade: 8,
  subject: "Mathematics",
  topic: "Linear Equations",
  title: "Understanding and Solving Linear Equations",
  subtitle:
    "Learn how equations work, how to keep both sides balanced, and how to find the value of an unknown.",
  estimatedMinutes: 45,

  learningObjectives: [
    "Explain what a variable and an equation represent.",
    "Recognize that an equation is a statement that two expressions are equal.",
    "Use inverse operations to solve one-step equations.",
    "Solve two-step linear equations in one variable.",
    "Solve equations involving negative numbers and fractions.",
    "Check a solution by substituting it into the original equation.",
    "Translate simple word problems into linear equations.",
  ],

  introduction: {
    heading: "What is a linear equation?",
    paragraphs: [
      "Imagine that you and a friend have the same amount of money. You do not know exactly how much money your friend has, but you know that both of you have equal amounts. Mathematics gives us a way to represent situations like this using equations.",
      "A linear equation is a mathematical statement showing that two expressions are equal. It contains a variable, usually a letter such as x, whose value we may need to find.",
      "Our goal is to discover the value of the variable that makes the equation true.",
    ],
    example: "x + 5 = 12",
    exampleExplanation:
      "This equation tells us that an unknown number, x, increased by 5 gives 12. We want to find the unknown number.",
  },

  vocabulary: [
    {
      term: "Variable",
      definition:
        "A letter or symbol representing an unknown or changing number.",
      example: "In x + 4 = 10, x is the variable.",
    },
    {
      term: "Equation",
      definition:
        "A mathematical statement showing that two expressions have equal values.",
      example: "3x + 2 = 11.",
    },
    {
      term: "Coefficient",
      definition:
        "The number multiplying a variable.",
      example: "In 5x, the coefficient is 5.",
    },
    {
      term: "Constant",
      definition:
        "A number that does not contain a variable.",
      example: "In 2x + 7, the constant is 7.",
    },
    {
      term: "Inverse operations",
      definition:
        "Operations that undo one another.",
      example: "Addition and subtraction are inverse operations.",
    },
    {
      term: "Solution",
      definition:
        "A value of the variable that makes an equation true.",
      example: "For x + 3 = 8, the solution is x = 5.",
    },
  ],

  balanceModel: {
    heading: "Think of an equation as a balanced scale",
    explanation:
      "An equation works like a balanced scale. The left side and right side must have equal values. If you add, subtract, multiply, or divide one side by a number, you must do the same to the other side to preserve equality. When dividing, the divisor must not be zero.",
    equation: "x + 3 = 8",
    steps: [
      "The left side contains the unknown number plus 3.",
      "Subtract 3 from the left side to undo the addition.",
      "Subtract 3 from the right side as well to keep the equation balanced.",
      "The equation becomes x = 5.",
    ],
    conclusion:
      "The unknown number is 5. Both sides of the original equation equal 8 when x = 5.",
  },

  sections: [
    {
      id: "variables-and-equations",
      title: "1. Understanding variables and equations",
      explanation:
        "A variable is a letter used to represent a number we do not yet know. An equation connects two expressions using an equals sign. The equals sign means that both sides have the same value; it does not simply mean that an answer comes next.",
      keyIdea:
        "An equation is true only when its left side and right side have equal values.",
      examples: [
        {
          problem: "If x = 4, evaluate x + 6.",
          steps: [
            "Replace x with 4.",
            "The expression becomes 4 + 6.",
            "Add the numbers: 4 + 6 = 10.",
          ],
          answer: "10",
          check: "The value of x + 6 is 10 when x = 4.",
        },
      ],
    },
    {
      id: "one-step-equations",
      title: "2. Solving one-step equations",
      explanation:
        "A one-step equation requires one inverse operation to isolate the variable. Addition is undone by subtraction, subtraction by addition, multiplication by division, and division by multiplication.",
      keyIdea:
        "Use the inverse operation on both sides of the equation to isolate the variable.",
      examples: [
        {
          problem: "x + 7 = 15",
          steps: [
            "We want x alone.",
            "The equation adds 7 to x, so subtract 7 from both sides.",
            "x + 7 - 7 = 15 - 7.",
            "Simplify both sides.",
          ],
          answer: "x = 8",
          check: "Substitute 8: 8 + 7 = 15. The equation is true.",
        },
        {
          problem: "x - 6 = 9",
          steps: [
            "We want x alone.",
            "The equation subtracts 6 from x, so add 6 to both sides.",
            "x - 6 + 6 = 9 + 6.",
            "Simplify both sides.",
          ],
          answer: "x = 15",
          check: "Substitute 15: 15 - 6 = 9. The equation is true.",
        },
        {
          problem: "4x = 28",
          steps: [
            "The variable x is multiplied by 4.",
            "Undo multiplication by dividing both sides by 4.",
            "4x ÷ 4 = 28 ÷ 4.",
            "Simplify both sides.",
          ],
          answer: "x = 7",
          check: "Substitute 7: 4 × 7 = 28. The equation is true.",
        },
        {
          problem: "x ÷ 5 = 3",
          steps: [
            "The variable is divided by 5.",
            "Undo division by multiplying both sides by 5.",
            "(x ÷ 5) × 5 = 3 × 5.",
            "Simplify both sides.",
          ],
          answer: "x = 15",
          check: "Substitute 15: 15 ÷ 5 = 3. The equation is true.",
        },
      ],
    },
    {
      id: "two-step-equations",
      title: "3. Solving two-step equations",
      explanation:
        "Some equations require two operations to isolate the variable. Undo the operations in reverse order. For example, if a number is multiplied by 3 and then increased by 4, subtract 4 first and divide by 3 second.",
      keyIdea:
        "Undo addition or subtraction first, then undo multiplication or division.",
      examples: [
        {
          problem: "3x + 4 = 19",
          steps: [
            "Subtract 4 from both sides: 3x = 15.",
            "Divide both sides by 3: x = 5.",
            "The variable is now isolated.",
          ],
          answer: "x = 5",
          check: "3(5) + 4 = 15 + 4 = 19.",
        },
        {
          problem: "2x - 7 = 13",
          steps: [
            "Add 7 to both sides: 2x = 20.",
            "Divide both sides by 2: x = 10.",
          ],
          answer: "x = 10",
          check: "2(10) - 7 = 20 - 7 = 13.",
        },
        {
          problem: "5x + 2 = 32",
          steps: [
            "Subtract 2 from both sides: 5x = 30.",
            "Divide both sides by 5: x = 6.",
          ],
          answer: "x = 6",
          check: "5(6) + 2 = 30 + 2 = 32.",
        },
      ],
    },
    {
      id: "negative-numbers-and-fractions",
      title: "4. Equations with negative numbers and fractions",
      explanation:
        "The same principles work when an equation contains negative numbers or fractions. Keep track of signs carefully and use equivalent operations on both sides.",
      keyIdea:
        "Do not change the rules when negative numbers or fractions appear. Keep both sides balanced.",
      examples: [
        {
          problem: "x + 8 = 3",
          steps: [
            "Subtract 8 from both sides.",
            "x = 3 - 8.",
            "Subtracting a larger number gives a negative result.",
          ],
          answer: "x = -5",
          check: "-5 + 8 = 3.",
        },
        {
          problem: "-3x = 18",
          steps: [
            "Divide both sides by -3.",
            "x = 18 ÷ (-3).",
            "A positive number divided by a negative number is negative.",
          ],
          answer: "x = -6",
          check: "-3(-6) = 18.",
        },
        {
          problem: "x/4 + 2 = 5",
          steps: [
            "Subtract 2 from both sides: x/4 = 3.",
            "Multiply both sides by 4.",
            "x = 12.",
          ],
          answer: "x = 12",
          check: "12/4 + 2 = 3 + 2 = 5.",
        },
      ],
    },
    {
      id: "checking-solutions",
      title: "5. Checking your solution",
      explanation:
        "Solving an equation is not complete until you check the answer. Replace the variable in the original equation with your answer and simplify both sides. If both sides are equal, your answer is correct.",
      keyIdea:
        "Always check by substituting your answer into the original equation.",
      examples: [
        {
          problem: "Check whether x = 4 solves 2x + 3 = 11.",
          steps: [
            "Replace x with 4 in the original equation.",
            "The left side becomes 2(4) + 3.",
            "Multiply first: 8 + 3 = 11.",
            "The right side is also 11.",
          ],
          answer: "Yes, x = 4 is a solution.",
          check: "11 = 11, so the equation is true.",
        },
      ],
    },
    {
      id: "word-problems",
      title: "6. Solving word problems",
      explanation:
        "A word problem describes a real situation. Identify the unknown, represent it with a variable, translate the information into an equation, solve, and explain what the answer means.",
      keyIdea:
        "Define the variable before writing the equation.",
      examples: [
        {
          problem:
            "Ama has some money. After receiving $6, she has $20. How much money did she have at first?",
          steps: [
            "Let x represent the amount Ama had at first.",
            "Receiving $6 means adding 6.",
            "Write the equation: x + 6 = 20.",
            "Subtract 6 from both sides.",
            "x = 20 - 6.",
          ],
          answer: "Ama had $14 at first.",
          check: "14 + 6 = 20, which matches the problem.",
        },
        {
          problem:
            "A number multiplied by 4 and then increased by 3 gives 27. Find the number.",
          steps: [
            "Let x represent the unknown number.",
            "Four times the number is 4x.",
            "Increased by 3 gives 4x + 3 = 27.",
            "Subtract 3 from both sides: 4x = 24.",
            "Divide both sides by 4: x = 6.",
          ],
          answer: "The number is 6.",
          check: "4(6) + 3 = 24 + 3 = 27.",
        },
      ],
    },
  ] satisfies LessonSection[],

  diagnosticQuestions: [
    {
      id: "diagnostic-1",
      question: "What is 8 + 7?",
      options: ["13", "14", "15", "16"],
      correctAnswer: 2,
      explanation: "8 + 7 = 15.",
      skill: "Basic addition",
    },
    {
      id: "diagnostic-2",
      question: "What is 18 - 25?",
      options: ["7", "-7", "43", "-43"],
      correctAnswer: 1,
      explanation:
        "Subtracting 25 from 18 gives -7 because 25 is 7 greater than 18.",
      skill: "Integer subtraction",
    },
    {
      id: "diagnostic-3",
      question: "What is 6 × 4?",
      options: ["10", "20", "24", "28"],
      correctAnswer: 2,
      explanation: "6 multiplied by 4 equals 24.",
      skill: "Multiplication",
    },
    {
      id: "diagnostic-4",
      question: "Which operation undoes multiplication by 5?",
      options: ["Addition", "Subtraction", "Division", "Multiplication"],
      correctAnswer: 2,
      explanation:
        "Division by 5 undoes multiplication by 5.",
      skill: "Inverse operations",
    },
    {
      id: "diagnostic-5",
      question: "If x = 3, what is the value of 2x + 1?",
      options: ["5", "6", "7", "8"],
      correctAnswer: 2,
      explanation:
        "Replace x with 3: 2(3) + 1 = 6 + 1 = 7.",
      skill: "Substitution",
    },
  ] satisfies DiagnosticQuestion[],

  guidedPractice: [
    {
      id: "practice-1",
      question: "Solve: x + 9 = 16",
      hint: "What operation will undo adding 9?",
      options: ["x = 7", "x = 9", "x = 25", "x = 16"],
      correctAnswer: 0,
      explanation:
        "Subtract 9 from both sides: x = 16 - 9 = 7.",
    },
    {
      id: "practice-2",
      question: "Solve: 5x = 35",
      hint: "What operation will undo multiplying by 5?",
      options: ["x = 5", "x = 7", "x = 30", "x = 40"],
      correctAnswer: 1,
      explanation:
        "Divide both sides by 5: x = 35 ÷ 5 = 7.",
    },
    {
      id: "practice-3",
      question: "Solve: 2x + 6 = 18",
      hint: "Undo the addition first. Then undo the multiplication.",
      options: ["x = 5", "x = 6", "x = 9", "x = 12"],
      correctAnswer: 1,
      explanation:
        "Subtract 6: 2x = 12. Divide by 2: x = 6.",
    },
    {
      id: "practice-4",
      question: "Solve: 3x - 5 = 10",
      hint: "Add 5 to both sides first.",
      options: ["x = 3", "x = 4", "x = 5", "x = 6"],
      correctAnswer: 2,
      explanation:
        "Add 5: 3x = 15. Divide by 3: x = 5.",
    },
    {
      id: "practice-5",
      question: "Solve: x - 12 = -4",
      hint: "Add 12 to both sides.",
      options: ["x = -16", "x = -8", "x = 8", "x = 16"],
      correctAnswer: 2,
      explanation:
        "Add 12 to both sides: x = -4 + 12 = 8.",
    },
  ] satisfies PracticeQuestion[],

  assessmentQuestions: [
    {
      id: "assessment-1",
      question: "Solve: x + 11 = 19",
      options: ["6", "7", "8", "9"],
      correctAnswer: 2,
      explanation:
        "Subtract 11 from both sides: x = 19 - 11 = 8.",
      points: 1,
    },
    {
      id: "assessment-2",
      question: "Solve: 7x = 42",
      options: ["5", "6", "7", "8"],
      correctAnswer: 1,
      explanation: "Divide both sides by 7: x = 42 ÷ 7 = 6.",
      points: 1,
    },
    {
      id: "assessment-3",
      question: "Solve: x - 9 = 4",
      options: ["-5", "5", "13", "15"],
      correctAnswer: 2,
      explanation: "Add 9 to both sides: x = 4 + 9 = 13.",
      points: 1,
    },
    {
      id: "assessment-4",
      question: "Solve: 3x + 2 = 20",
      options: ["4", "5", "6", "7"],
      correctAnswer: 2,
      explanation:
        "Subtract 2: 3x = 18. Divide by 3: x = 6.",
      points: 1,
    },
    {
      id: "assessment-5",
      question: "Solve: 4x - 7 = 17",
      options: ["4", "5", "6", "7"],
      correctAnswer: 2,
      explanation:
        "Add 7: 4x = 24. Divide by 4: x = 6.",
      points: 1,
    },
    {
      id: "assessment-6",
      question: "Solve: -2x = 14",
      options: ["-7", "-6", "6", "7"],
      correctAnswer: 0,
      explanation: "Divide both sides by -2: x = -7.",
      points: 1,
    },
    {
      id: "assessment-7",
      question: "Solve: x/3 + 4 = 9",
      options: ["12", "15", "18", "27"],
      correctAnswer: 1,
      explanation:
        "Subtract 4: x/3 = 5. Multiply by 3: x = 15.",
      points: 1,
    },
    {
      id: "assessment-8",
      question:
        "A number multiplied by 5 and then increased by 2 gives 32. What is the number?",
      options: ["5", "6", "7", "8"],
      correctAnswer: 1,
      explanation:
        "Let the number be x. Write 5x + 2 = 32. Subtract 2: 5x = 30. Divide by 5: x = 6.",
      points: 1,
    },
    {
      id: "assessment-9",
      question: "Which equation represents '7 less than a number is 15'?",
      options: ["x + 7 = 15", "7x = 15", "x - 7 = 15", "7 - x = 15"],
      correctAnswer: 2,
      explanation:
        "'7 less than a number' means subtract 7 from the number, giving x - 7 = 15.",
      points: 1,
    },
    {
      id: "assessment-10",
      question: "Which value makes 2x + 5 = 17 true?",
      options: ["4", "5", "6", "7"],
      correctAnswer: 2,
      explanation:
        "Substitute 6: 2(6) + 5 = 12 + 5 = 17.",
      points: 1,
    },
  ] satisfies AssessmentQuestion[],

  completionMessage: {
    heading: "You have completed Linear Equations!",
    description:
      "You have learned how to understand equations, isolate variables, solve one-step and two-step equations, and check your answers. Keep practising to build confidence.",
  },
} as const;
