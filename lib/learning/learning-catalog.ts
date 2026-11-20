/**
 * Justdy Learning Curriculum
 *
 * Central curriculum catalog for Pre-K through Grade 12.
 * This is an original proposed curriculum framework, not a claim
 * of official Common Core, NaCCA, or other standards alignment.
 *
 * Curriculum content is intentionally independent of the old games
 * and question-generation systems.
 */

export type LearningGrade = {
  label: string;
  slug: string;
  schoolLevel: "elementary" | "middle" | "high";
};

export type LearningSubject = {
  id: string;
  name: string;
  description: string;
};

export type LearningTopic = {
  name: string;
  slug: string;
  grade: number;
  subject: string;
  unitId: string;
  unitTitle: string;
  description: string;
  objectives: string[];
};

export type LearningUnit = {
  id: string;
  title: string;
  description: string;
  topics: {
    name: string;
    description: string;
    objectives: string[];
  }[];
};

const grades: LearningGrade[] = [
  { label: "Pre-K", slug: "pre-k", schoolLevel: "elementary" },
  { label: "Kindergarten", slug: "kindergarten", schoolLevel: "elementary" },
  { label: "Grade 1", slug: "grade-1", schoolLevel: "elementary" },
  { label: "Grade 2", slug: "grade-2", schoolLevel: "elementary" },
  { label: "Grade 3", slug: "grade-3", schoolLevel: "elementary" },
  { label: "Grade 4", slug: "grade-4", schoolLevel: "elementary" },
  { label: "Grade 5", slug: "grade-5", schoolLevel: "elementary" },
  { label: "Grade 6", slug: "grade-6", schoolLevel: "middle" },
  { label: "Grade 7", slug: "grade-7", schoolLevel: "middle" },
  { label: "Grade 8", slug: "grade-8", schoolLevel: "middle" },
  { label: "Grade 9", slug: "grade-9", schoolLevel: "high" },
  { label: "Grade 10", slug: "grade-10", schoolLevel: "high" },
  { label: "Grade 11", slug: "grade-11", schoolLevel: "high" },
  { label: "Grade 12", slug: "grade-12", schoolLevel: "high" },
];

const subjects: LearningSubject[] = [
  {
    id: "mathematics",
    name: "Mathematics",
    description:
      "Build mathematical confidence through structured lessons, worked examples, adaptive practice, and real-world problem solving.",
  },
  {
    id: "science",
    name: "Science",
    description:
      "Explore living things, discover how the world works, and develop scientific thinking.",
  },
  {
    id: "english",
    name: "English",
    description:
      "Develop reading, writing, vocabulary, grammar, and communication skills.",
  },
  {
    id: "technology",
    name: "Technology",
    description:
      "Discover digital literacy, computing concepts, and practical technology skills.",
  },
];

type TopicDefinition = {
  name: string;
  description: string;
  objectives: string[];
};

type UnitDefinition = {
  id: string;
  title: string;
  description: string;
  topics: TopicDefinition[];
};

const topic = (
  name: string,
  description: string,
  ...objectives: string[]
): TopicDefinition => ({ name, description, objectives });

const unit = (
  id: string,
  title: string,
  description: string,
  ...topics: TopicDefinition[]
): UnitDefinition => ({ id, title, description, topics });

const mathematicsCurriculum: Record<number, UnitDefinition[]> = {
  [-2]: [
    unit("numbers-counting", "Numbers and Counting", "Discover numbers through objects, pictures, movement, and play.",
      topic("Introduction to Numbers", "Understand that numbers tell us how many.", "Recognize numbers in everyday life.", "Connect number words to quantities."),
      topic("Counting 1–5", "Count small groups of familiar objects.", "Say numbers one through five in order.", "Count each object once."),
      topic("Counting 1–10", "Extend counting to ten using objects and pictures.", "Count objects from one to ten.", "Identify the final number as the total."),
      topic("Counting Objects", "Practise counting objects in different arrangements.", "Count objects in a line and scattered groups.", "Avoid skipping or counting objects twice."),
      topic("Number Recognition", "Begin recognizing written numerals.", "Recognize numerals 1–5.", "Match a numeral to a group of objects."),
      topic("Comparing Small Groups", "Notice when one group has more or fewer objects.", "Compare groups using more, fewer, and the same.")
    ),
    unit("shapes-space", "Shapes and Space", "Explore shapes and positions in the surrounding environment.",
      topic("Circles and Squares", "Recognize familiar shapes.", "Identify circles and squares.", "Find these shapes in everyday objects."),
      topic("Triangles and Rectangles", "Recognize more common two-dimensional shapes.", "Identify triangles and rectangles.", "Describe simple shape features."),
      topic("Shape Sorting", "Sort objects according to shape.", "Group objects with similar shapes.", "Explain a simple sorting rule."),
      topic("Position and Direction", "Describe where objects are located.", "Use in, on, under, beside, and behind.")
    ),
    unit("patterns-classification", "Patterns and Sorting", "Explore repetition, similarities, and differences.",
      topic("Sorting by Color", "Group objects according to color.", "Identify matching colors.", "Sort a collection using one color rule."),
      topic("Sorting by Size", "Compare and group objects by size.", "Use big and small.", "Sort objects by size."),
      topic("Simple Patterns", "Recognize and continue repeating patterns.", "Identify repeating sequences.", "Continue an AB pattern."),
      topic("Matching Objects", "Recognize objects that belong together.", "Match identical objects.", "Identify simple similarities.")
    ),
    unit("measurement-comparison", "Measurement and Comparison", "Compare familiar objects using everyday language.",
      topic("Big and Small", "Compare the sizes of objects.", "Identify bigger and smaller objects."),
      topic("Long and Short", "Compare lengths informally.", "Use longer and shorter to describe objects."),
      topic("Heavy and Light", "Compare the weight of familiar objects.", "Identify heavier and lighter objects."),
      topic("Full and Empty", "Explore capacity through containers.", "Compare full, empty, and partly full containers.")
    ),
    unit("early-addition", "Early Mathematical Thinking", "Develop readiness for simple mathematical operations.",
      topic("Putting Groups Together", "Explore joining small groups of objects.", "Combine two small groups using objects."),
      topic("Taking Objects Away", "Explore removing objects from a group.", "Describe how a group changes when objects are removed."),
      topic("Same and Different", "Compare quantities and attributes.", "Recognize matching and non-matching groups.")
    )
  ],

  [-1]: [
    unit("numbers-counting", "Numbers and Counting", "Develop number recognition, counting, and quantity understanding.",
      topic("Numbers 0–10", "Recognize and represent numbers from zero to ten.", "Read numerals 0–10.", "Match numerals to quantities."),
      topic("Counting 1–20", "Count forward to twenty.", "Count objects accurately.", "Identify the total quantity."),
      topic("Number Order", "Understand which numbers come before and after others.", "Sequence numbers 0–20.", "Identify missing numbers."),
      topic("One More and One Less", "Explore neighboring quantities.", "Find one more or one less than a number."),
      topic("Comparing Numbers", "Compare groups and written numbers.", "Use more than, fewer than, and equal to."),
      topic("Number Representations", "Represent quantities with objects, fingers, and pictures.", "Show a number in different ways.")
    ),
    unit("addition-subtraction", "Early Addition and Subtraction", "Explore joining and separating quantities.",
      topic("Adding Objects", "Join groups to find a total.", "Combine groups using counters or pictures."),
      topic("Taking Away", "Remove objects to find what remains.", "Model subtraction with objects."),
      topic("Number Bonds", "Explore pairs that make a number.", "Find different pairs that make totals up to ten."),
      topic("Addition Stories", "Solve simple joining stories.", "Represent a story with objects or pictures."),
      topic("Subtraction Stories", "Solve simple take-away stories.", "Represent a story with objects or pictures.")
    ),
    unit("shapes-patterns", "Shapes and Patterns", "Recognize shapes and create repeating patterns.",
      topic("Two-Dimensional Shapes", "Identify common flat shapes.", "Recognize circles, triangles, squares, and rectangles."),
      topic("Three-Dimensional Objects", "Explore solid shapes.", "Recognize cubes, spheres, and cylinders."),
      topic("Repeating Patterns", "Continue and create simple patterns.", "Identify repeating units."),
      topic("Sorting and Classifying", "Group objects using shared properties.", "Explain a sorting rule.")
    ),
    unit("measurement-data", "Measurement and Data", "Compare measurements and interpret simple information.",
      topic("Length and Height", "Compare and describe lengths.", "Use longer, shorter, and taller."),
      topic("Weight and Capacity", "Compare weight and container capacity.", "Use heavier, lighter, full, and empty."),
      topic("Time and Daily Events", "Understand simple daily sequences.", "Order familiar daily activities."),
      topic("Sorting and Counting Data", "Organize objects and count categories.", "Create and interpret simple object groups.")
    )
  ],

  1: [
    unit("place-value", "Numbers and Place Value", "Understand numbers and how they represent quantities.",
      topic("Counting to 100", "Count forward and backward within 100.", "Count by ones and tens.", "Identify missing numbers."),
      topic("Reading and Writing Numbers", "Read and write numbers in different forms.", "Recognize numerals to 100.", "Represent numbers with objects and drawings."),
      topic("Tens and Ones", "Understand two-digit numbers as tens and ones.", "Compose two-digit numbers.", "Decompose numbers into tens and ones."),
      topic("Comparing Numbers", "Compare two-digit numbers.", "Use greater than, less than, and equal to."),
      topic("Number Patterns", "Identify and extend number sequences.", "Count by twos, fives, and tens.")
    ),
    unit("addition-subtraction", "Addition and Subtraction", "Build fluency with addition and subtraction within 20.",
      topic("Addition within 10", "Join groups and find totals.", "Use objects and number lines."),
      topic("Subtraction within 10", "Take away and find differences.", "Use objects and number lines."),
      topic("Addition within 20", "Add numbers within twenty.", "Use counting on and known facts."),
      topic("Subtraction within 20", "Subtract within twenty.", "Use counting back and related facts."),
      topic("Missing Numbers", "Find unknown values in simple equations.", "Complete addition and subtraction statements."),
      topic("Word Problems", "Apply addition and subtraction to everyday situations.", "Identify relevant information and choose an operation.")
    ),
    unit("measurement-time", "Measurement and Time", "Compare lengths, time, and everyday quantities.",
      topic("Comparing Lengths", "Compare and order objects by length.", "Use non-standard units."),
      topic("Time to the Hour", "Read and describe hour times.", "Recognize hour and minute hands."),
      topic("Money", "Recognize and compare common coins.", "Count simple coin combinations."),
      topic("Data and Graphs", "Organize and interpret simple data.", "Read picture graphs and tally marks.")
    ),
    unit("geometry", "Shapes and Geometry", "Identify shapes and describe their properties.",
      topic("Flat Shapes", "Recognize two-dimensional shapes.", "Describe sides and corners."),
      topic("Solid Shapes", "Recognize three-dimensional shapes.", "Compare cubes, cones, cylinders, and spheres."),
      topic("Position and Direction", "Describe relative positions.", "Use above, below, left, and right.")
    )
  ],

  2: [
    unit("place-value", "Place Value and Number Sense", "Understand three-digit numbers and number relationships.",
      topic("Numbers to 1,000", "Read, write, and represent three-digit numbers.", "Identify hundreds, tens, and ones."),
      topic("Expanded Form", "Decompose numbers by place value.", "Write numbers in expanded form."),
      topic("Comparing and Ordering", "Compare and order three-digit numbers.", "Use place value to justify comparisons."),
      topic("Skip Counting", "Count by equal intervals.", "Count by twos, fives, tens, and hundreds.")
    ),
    unit("operations", "Addition and Subtraction", "Develop strategies for multi-digit addition and subtraction.",
      topic("Adding Two-Digit Numbers", "Add two-digit numbers.", "Use place-value strategies and regrouping."),
      topic("Subtracting Two-Digit Numbers", "Subtract two-digit numbers.", "Use place-value strategies and regrouping."),
      topic("Adding and Subtracting Three-Digit Numbers", "Work with three-digit calculations.", "Use hundreds, tens, and ones."),
      topic("Estimation", "Estimate sums and differences.", "Use rounding and compatible numbers."),
      topic("One-Step Word Problems", "Solve real-world addition and subtraction problems.", "Choose an operation and explain the solution.")
    ),
    unit("multiplication-sharing", "Multiplication and Equal Sharing", "Build foundations for multiplication and division.",
      topic("Equal Groups", "Represent equal groups with objects.", "Count equal groups."),
      topic("Repeated Addition", "Connect repeated addition to multiplication.", "Write repeated addition expressions."),
      topic("Arrays", "Represent multiplication using rows and columns.", "Build and interpret arrays."),
      topic("Equal Sharing", "Share quantities equally.", "Find the number in each group."),
      topic("Odd and Even Numbers", "Classify numbers by equal pairing.", "Identify odd and even numbers.")
    ),
    unit("measurement-geometry", "Measurement and Geometry", "Explore measurement, shapes, and spatial reasoning.",
      topic("Length", "Measure and compare lengths.", "Use standard units and measuring tools."),
      topic("Time", "Read clocks and understand time intervals.", "Tell time to five-minute intervals."),
      topic("Money", "Solve simple money problems.", "Count coins and calculate totals."),
      topic("Shapes and Angles", "Describe shapes and their features.", "Recognize common polygons and right angles."),
      topic("Perimeter Foundations", "Explore distance around shapes.", "Measure and add side lengths.")
    )
  ],

  3: [
    unit("multiplication-division", "Multiplication and Division", "Develop multiplication and division understanding and fluency.",
      topic("Multiplication Facts", "Build fluency with multiplication facts.", "Use equal groups and arrays."),
      topic("Division Facts", "Connect division to multiplication.", "Use sharing and grouping strategies."),
      topic("Multiplication Strategies", "Multiply one-digit numbers by larger numbers.", "Use distributive and area strategies."),
      topic("Remainders", "Interpret remainders in division.", "Explain what a remainder means in context."),
      topic("Word Problems", "Solve multi-step multiplication and division problems.", "Select operations and check reasonableness.")
    ),
    unit("fractions", "Fractions", "Understand fractions as equal parts of a whole.",
      topic("Understanding Fractions", "Describe equal parts of a whole.", "Identify numerator and denominator."),
      topic("Unit Fractions", "Recognize fractions with numerator one.", "Represent unit fractions visually."),
      topic("Comparing Fractions", "Compare fractions with related denominators.", "Use visual fraction models."),
      topic("Fractions on a Number Line", "Locate simple fractions on a number line.", "Partition intervals equally.")
    ),
    unit("number-operations", "Number Operations", "Strengthen addition and subtraction strategies.",
      topic("Multi-Digit Addition", "Add larger numbers accurately.", "Use place-value strategies and regrouping."),
      topic("Multi-Digit Subtraction", "Subtract larger numbers accurately.", "Use regrouping and estimation."),
      topic("Mental Math", "Use efficient mental strategies.", "Apply compensation and known facts.")
    ),
    unit("measurement-geometry", "Measurement and Geometry", "Apply measurement and geometric reasoning.",
      topic("Area", "Understand area as covering a surface.", "Count square units and use arrays."),
      topic("Perimeter", "Measure the distance around a shape.", "Add side lengths."),
      topic("Time and Measurement", "Solve elapsed-time and measurement problems.", "Convert simple units."),
      topic("Shapes and Angles", "Classify shapes by their properties.", "Identify right angles and quadrilaterals.")
    ),
    unit("data-patterns", "Patterns and Data", "Identify numerical patterns and interpret data.",
      topic("Number Patterns", "Describe and extend numerical patterns.", "Identify rules in sequences."),
      topic("Graphs", "Read and create simple graphs.", "Interpret scaled picture and bar graphs."),
      topic("Data Questions", "Use data to answer questions.", "Compare categories and totals.")
    )
  ],

  4: [
    unit("place-value-operations", "Place Value and Multi-Digit Operations", "Extend number sense and computational fluency.",
      topic("Large Numbers", "Read and compare multi-digit whole numbers.", "Understand place value through millions."),
      topic("Multi-Digit Addition", "Add multi-digit whole numbers.", "Use standard and alternative algorithms."),
      topic("Multi-Digit Subtraction", "Subtract multi-digit whole numbers.", "Regroup across place values."),
      topic("Multiplication", "Multiply multi-digit numbers.", "Use area models and standard algorithms."),
      topic("Division", "Divide multi-digit numbers by one-digit divisors.", "Interpret quotients and remainders.")
    ),
    unit("fractions", "Fractions and Decimals", "Represent, compare, and operate with fractions and decimals.",
      topic("Equivalent Fractions", "Recognize equivalent fraction values.", "Generate equivalent fractions."),
      topic("Comparing Fractions", "Compare fractions with unlike denominators.", "Use common denominators and visual models."),
      topic("Adding and Subtracting Fractions", "Combine fractions with like denominators.", "Add and subtract fractional parts."),
      topic("Decimal Notation", "Represent tenths and hundredths.", "Connect fractions and decimals."),
      topic("Comparing Decimals", "Compare decimal values.", "Use place-value reasoning.")
    ),
    unit("factors-multiples", "Factors and Multiples", "Explore divisibility and number relationships.",
      topic("Factors", "Identify factors of whole numbers.", "Use factor pairs."),
      topic("Multiples", "Generate multiples of whole numbers.", "Identify common multiples."),
      topic("Prime and Composite Numbers", "Classify whole numbers.", "Use factor reasoning.")
    ),
    unit("measurement-geometry", "Measurement and Geometry", "Develop measurement and geometric reasoning.",
      topic("Measurement Conversions", "Convert related measurement units.", "Use multiplicative relationships."),
      topic("Area and Perimeter", "Solve area and perimeter problems.", "Apply formulas to rectangles."),
      topic("Angles", "Measure and classify angles.", "Use a protractor and angle benchmarks."),
      topic("Lines and Shapes", "Classify geometric figures.", "Identify parallel and perpendicular lines.")
    )
  ],

  5: [
    unit("number-operations", "Number Sense and Operations", "Work confidently with whole numbers and numerical expressions.",
      topic("Order of Operations", "Evaluate expressions using operation conventions.", "Apply grouping, multiplication, division, addition, and subtraction."),
      topic("Whole Number Operations", "Solve multi-step whole-number problems.", "Estimate and check results."),
      topic("Patterns and Expressions", "Describe numerical relationships.", "Write and evaluate simple expressions.")
    ),
    unit("fractions-decimals", "Fractions and Decimals", "Perform operations with fractions and decimals.",
      topic("Fraction Equivalence", "Generate and compare equivalent fractions.", "Use common denominators."),
      topic("Adding and Subtracting Fractions", "Add and subtract fractions.", "Use equivalent fractions."),
      topic("Multiplying Fractions", "Multiply fractions and whole numbers.", "Interpret products with visual models."),
      topic("Decimal Operations", "Add, subtract, and multiply decimals.", "Use place-value reasoning."),
      topic("Fractions and Decimals", "Connect fractional and decimal representations.", "Convert familiar fractions to decimals.")
    ),
    unit("ratios-percentages", "Ratios and Percentages", "Explore proportional reasoning.",
      topic("Ratios", "Compare quantities using ratios.", "Represent ratios in different forms."),
      topic("Percent Concepts", "Understand percent as parts per hundred.", "Connect percentages, fractions, and decimals."),
      topic("Percent of a Quantity", "Find familiar percentages of quantities.", "Use benchmark percentages.")
    ),
    unit("geometry-measurement", "Geometry and Measurement", "Apply formulas and spatial reasoning.",
      topic("Area of Polygons", "Find areas of common shapes.", "Use area formulas."),
      topic("Volume", "Understand and calculate volume.", "Count and calculate cubic units."),
      topic("Coordinate Plane", "Plot points in the first quadrant.", "Read ordered pairs."),
      topic("Classifying Shapes", "Classify two-dimensional figures.", "Use properties of sides and angles.")
    ),
    unit("data-statistics", "Data and Statistics", "Summarize and interpret data.",
      topic("Data Displays", "Create and interpret data displays.", "Read line plots and graphs."),
      topic("Mean and Averages", "Understand averages informally.", "Calculate simple arithmetic means."),
      topic("Probability Foundations", "Describe likelihood.", "Compare possible outcomes.")
    )
  ],

  6: [
    unit("ratios-rates", "Ratios, Rates, and Proportional Reasoning", "Understand multiplicative relationships.",
      topic("Ratios", "Represent and interpret ratios.", "Write equivalent ratios."),
      topic("Unit Rates", "Calculate rates per one unit.", "Compare unit prices and speeds."),
      topic("Ratio Tables", "Use tables to represent equivalent ratios.", "Find missing values."),
      topic("Percentages", "Solve percentage problems.", "Connect percent, fractions, and decimals.")
    ),
    unit("number-system", "The Number System", "Extend number understanding to rational numbers.",
      topic("Fractions and Decimals", "Operate with fractions and decimals.", "Compare and calculate with rational values."),
      topic("Integers", "Understand positive and negative numbers.", "Represent integers on number lines."),
      topic("Absolute Value", "Interpret distance from zero.", "Compare absolute values."),
      topic("Coordinate Plane", "Plot and interpret points in four quadrants.", "Use ordered pairs.")
    ),
    unit("expressions-equations", "Expressions and Equations", "Use variables to represent mathematical relationships.",
      topic("Writing Expressions", "Translate words into expressions.", "Identify variables and constants."),
      topic("Evaluating Expressions", "Substitute values into expressions.", "Follow order of operations."),
      topic("One-Step Equations", "Solve one-step equations.", "Use inverse operations."),
      topic("Inequalities", "Represent and solve simple inequalities.", "Interpret inequality symbols.")
    ),
    unit("geometry-statistics", "Geometry and Statistics", "Apply formulas and analyze data.",
      topic("Area and Surface Area", "Calculate areas and surface areas.", "Use geometric formulas."),
      topic("Volume", "Calculate volume of rectangular prisms.", "Use cubic units."),
      topic("Statistical Questions", "Understand variability in data.", "Distinguish statistical and non-statistical questions."),
      topic("Measures of Center", "Summarize data distributions.", "Find mean, median, and range.")
    )
  ],

  7: [
    unit("proportional-reasoning", "Proportional Relationships", "Analyze proportional relationships in different representations.",
      topic("Unit Rates", "Interpret unit rates in context.", "Compare proportional situations."),
      topic("Proportional Tables", "Identify proportional relationships in tables.", "Find constant of proportionality."),
      topic("Percent Applications", "Solve percent increase, decrease, and discount problems.", "Use multipliers and proportional reasoning."),
      topic("Scale Drawings", "Use scale factors to interpret drawings.", "Calculate actual and scaled lengths.")
    ),
    unit("rational-numbers", "Rational Numbers", "Perform operations with positive and negative rational numbers.",
      topic("Integer Operations", "Add, subtract, multiply, and divide integers.", "Use number-line and sign reasoning."),
      topic("Fraction Operations", "Calculate with rational fractions.", "Apply operation rules."),
      topic("Decimal Operations", "Calculate with rational decimals.", "Estimate and verify results."),
      topic("Rational Number Applications", "Solve contextual problems with rational numbers.", "Interpret signs and magnitudes.")
    ),
    unit("equations-inequalities", "Equations and Inequalities", "Represent and solve multi-step relationships.",
      topic("Algebraic Expressions", "Simplify expressions.", "Combine like terms."),
      topic("Two-Step Equations", "Solve equations using inverse operations.", "Check solutions by substitution."),
      topic("Inequalities", "Solve and graph inequalities.", "Interpret solution sets."),
      topic("Equivalent Expressions", "Recognize equivalent algebraic forms.", "Use properties of operations.")
    ),
    unit("geometry-probability", "Geometry and Probability", "Apply geometric reasoning and probability concepts.",
      topic("Circles", "Explore circumference and area.", "Use radius, diameter, and pi."),
      topic("Angle Relationships", "Solve problems involving angles.", "Use complementary, supplementary, and vertical angles."),
      topic("Probability", "Calculate probabilities of simple events.", "Compare theoretical and experimental probability."),
      topic("Sampling and Data", "Interpret samples and populations.", "Evaluate simple data claims.")
    )
  ],

  8: [
    unit("linear-equations", "Linear Equations and Relationships", "Understand linear relationships and solve equations.",
      topic("Linear Equations", "Solve linear equations in one variable.", "Use inverse operations and equivalent equations."),
      topic("Equations with Variables on Both Sides", "Solve more complex linear equations.", "Collect variable and constant terms."),
      topic("Systems Foundations", "Explore pairs of linear relationships.", "Interpret intersections."),
      topic("Linear Inequalities", "Solve and graph linear inequalities.", "Represent solution intervals.")
    ),
    unit("functions", "Functions", "Understand functions as relationships between inputs and outputs.",
      topic("Function Concepts", "Identify inputs, outputs, and rules.", "Determine whether a relation is a function."),
      topic("Function Representations", "Represent functions using tables, graphs, and rules.", "Translate between representations."),
      topic("Linear Functions", "Analyze slope and intercept.", "Interpret rate of change."),
      topic("Comparing Functions", "Compare functions in different forms.", "Explain differences in rates and starting values.")
    ),
    unit("geometry", "Geometry and the Pythagorean Theorem", "Use geometric properties to solve problems.",
      topic("Transformations", "Explore translations, reflections, and rotations.", "Describe transformations on a coordinate plane."),
      topic("Congruence and Similarity", "Compare figures by size and shape.", "Use scale factors."),
      topic("Pythagorean Theorem", "Relate the sides of right triangles.", "Apply a² + b² = c²."),
      topic("Volume", "Calculate volume of common solids.", "Use geometric volume formulas.")
    ),
    unit("exponents-statistics", "Exponents, Scientific Notation, and Statistics", "Extend number systems and analyze data.",
      topic("Integer Exponents", "Use exponent rules and notation.", "Evaluate powers."),
      topic("Scientific Notation", "Represent very large and small numbers.", "Convert between standard and scientific notation."),
      topic("Scatter Plots", "Analyze relationships in bivariate data.", "Describe association and trend."),
      topic("Linear Models", "Use lines to model data.", "Interpret slope and intercept in context.")
    )
  ],

  9: [
    unit("algebra-foundations", "Algebra Foundations", "Develop fluency with expressions, equations, and inequalities.",
      topic("Real Number System", "Classify and operate with real numbers.", "Use properties of real numbers."),
      topic("Expressions and Polynomials", "Simplify and operate with polynomials.", "Combine like terms and apply distributive property."),
      topic("Linear Equations", "Solve and interpret linear equations.", "Model contextual situations."),
      topic("Linear Inequalities", "Solve and graph inequalities.", "Represent solution sets."),
      topic("Systems of Equations", "Solve systems of linear equations.", "Use graphing, substitution, and elimination.")
    ),
    unit("functions-modeling", "Functions and Modeling", "Represent relationships using functions.",
      topic("Function Notation", "Interpret and evaluate function notation.", "Identify domain and range."),
      topic("Linear Functions", "Analyze slope and intercept.", "Write equations from information."),
      topic("Sequences", "Represent arithmetic sequences.", "Find explicit and recursive patterns."),
      topic("Modeling with Functions", "Use functions to represent real situations.", "Interpret parameters and outputs.")
    ),
    unit("geometry", "Euclidean Geometry", "Reason about geometric figures and relationships.",
      topic("Lines and Angles", "Use angle relationships.", "Apply parallel-line angle properties."),
      topic("Triangles", "Analyze triangle properties.", "Use congruence and similarity."),
      topic("Coordinate Geometry", "Use coordinates to investigate figures.", "Calculate distance and midpoint."),
      topic("Area and Volume", "Apply geometric formulas.", "Solve composite measurement problems.")
    ),
    unit("statistics-probability", "Statistics and Probability", "Collect, summarize, and interpret data.",
      topic("Descriptive Statistics", "Summarize distributions.", "Calculate measures of center and spread."),
      topic("Data Displays", "Choose and interpret appropriate displays.", "Analyze shape, center, and variability."),
      topic("Probability", "Calculate probabilities of compound events.", "Use sample spaces."),
      topic("Modeling Data", "Interpret relationships in data.", "Distinguish association from causation.")
    )
  ],

  10: [
    unit("advanced-algebra", "Advanced Algebra", "Explore polynomial, rational, and radical expressions.",
      topic("Polynomial Operations", "Add, subtract, and multiply polynomials.", "Use algebraic properties."),
      topic("Factoring", "Factor polynomial expressions.", "Use common factors and special products."),
      topic("Quadratic Equations", "Solve quadratic equations.", "Use factoring, completing the square, and formula."),
      topic("Radical Expressions", "Simplify and operate with radicals.", "Apply exponent and radical rules."),
      topic("Rational Expressions", "Simplify and solve rational expressions.", "Identify restrictions and equivalent forms.")
    ),
    unit("quadratic-functions", "Quadratic Functions", "Analyze quadratic relationships and their graphs.",
      topic("Quadratic Graphs", "Interpret parabolas.", "Identify vertex, axis of symmetry, and intercepts."),
      topic("Quadratic Models", "Model situations with quadratic functions.", "Interpret maximum and minimum values."),
      topic("Complex Solutions", "Explore the role of complex numbers.", "Interpret discriminants.")
    ),
    unit("geometry-trigonometry", "Geometry and Trigonometry", "Develop geometric and trigonometric reasoning.",
      topic("Similarity and Congruence", "Prove and apply figure relationships.", "Use transformations and proportional sides."),
      topic("Right Triangle Trigonometry", "Use sine, cosine, and tangent.", "Solve right-triangle problems."),
      topic("Circle Geometry", "Explore circle theorems and measures.", "Use arc, angle, and chord relationships."),
      topic("Three-Dimensional Geometry", "Analyze solids and cross-sections.", "Calculate surface area and volume.")
    ),
    unit("statistics", "Statistics and Data Analysis", "Use statistical reasoning to interpret information.",
      topic("Data Distributions", "Compare distributions.", "Use measures of center and spread."),
      topic("Regression", "Model relationships with regression.", "Interpret correlation and residuals."),
      topic("Probability Models", "Use probability models.", "Calculate compound probabilities.")
    )
  ],

  11: [
    unit("functions", "Functions and Their Families", "Analyze function families and transformations.",
      topic("Polynomial Functions", "Analyze polynomial behavior.", "Identify zeros, end behavior, and multiplicity."),
      topic("Rational Functions", "Analyze rational functions.", "Identify asymptotes and restrictions."),
      topic("Exponential Functions", "Model exponential growth and decay.", "Interpret bases and rates."),
      topic("Logarithmic Functions", "Understand logarithms as inverse functions.", "Solve logarithmic equations."),
      topic("Function Transformations", "Transform and compare function graphs.", "Apply shifts, stretches, and reflections.")
    ),
    unit("trigonometry", "Trigonometry", "Extend trigonometric understanding beyond right triangles.",
      topic("Unit Circle", "Represent angles on the unit circle.", "Use radian and degree measures."),
      topic("Trigonometric Functions", "Analyze sine, cosine, and tangent.", "Interpret periodic graphs."),
      topic("Trigonometric Identities", "Use fundamental identities.", "Simplify trigonometric expressions."),
      topic("Trigonometric Equations", "Solve trigonometric equations.", "Find solutions over specified intervals.")
    ),
    unit("sequences-series", "Sequences and Series", "Understand recursive and explicit numerical patterns.",
      topic("Arithmetic Sequences", "Analyze constant-difference sequences.", "Find terms and sums."),
      topic("Geometric Sequences", "Analyze constant-ratio sequences.", "Find terms and sums."),
      topic("Series Applications", "Apply sequence and series models.", "Solve contextual problems.")
    ),
    unit("statistics-probability", "Statistics and Probability", "Develop deeper statistical and probabilistic reasoning.",
      topic("Sampling and Study Design", "Evaluate statistical investigations.", "Identify bias and sampling methods."),
      topic("Conditional Probability", "Analyze conditional events.", "Use tables and probability notation."),
      topic("Random Variables", "Understand discrete random variables.", "Calculate expected values."),
      topic("Normal Distributions", "Interpret normal models.", "Use standardized scores.")
    )
  ],

  12: [
    unit("advanced-functions", "Advanced Functions", "Synthesize function concepts and mathematical modeling.",
      topic("Function Analysis", "Analyze domains, ranges, and behavior.", "Compare function families."),
      topic("Exponential and Logarithmic Models", "Solve growth and decay problems.", "Apply logarithmic reasoning."),
      topic("Sequences and Series", "Apply sequence and series formulas.", "Model financial and numerical patterns."),
      topic("Limits Foundations", "Explore the idea of a limit.", "Interpret behavior near a point.")
    ),
    unit("calculus-foundations", "Calculus Foundations", "Introduce rates of change and accumulation.",
      topic("Limits and Continuity", "Understand limits and continuity.", "Evaluate simple limits graphically and algebraically."),
      topic("Derivatives", "Understand instantaneous rates of change.", "Differentiate basic functions."),
      topic("Derivative Applications", "Apply derivatives to motion and optimization.", "Interpret slopes and extrema."),
      topic("Integrals", "Understand accumulation and area.", "Evaluate basic antiderivatives and definite integrals.")
    ),
    unit("advanced-trigonometry", "Advanced Trigonometry", "Apply trigonometric concepts to complex problems.",
      topic("Trigonometric Identities", "Prove and apply identities.", "Use angle and double-angle identities."),
      topic("Trigonometric Equations", "Solve equations over intervals.", "Use identities and unit-circle reasoning."),
      topic("Periodic Modeling", "Model periodic phenomena.", "Interpret amplitude, period, and phase shift.")
    ),
    unit("probability-statistics", "Probability and Statistics", "Use data and probability to make informed decisions.",
      topic("Probability Distributions", "Analyze probability distributions.", "Calculate expected values and variation."),
      topic("Statistical Inference", "Understand estimation and hypothesis testing.", "Interpret confidence intervals and tests."),
      topic("Correlation and Regression", "Model and interpret relationships.", "Evaluate residuals and model fit."),
      topic("Combinatorics", "Count possible arrangements and selections.", "Apply permutations and combinations.")
    ),
    unit("financial-mathematics", "Financial Mathematics", "Apply mathematics to personal finance and decision-making.",
      topic("Interest", "Compare simple and compound interest.", "Calculate growth over time."),
      topic("Loans and Repayments", "Understand loan costs and repayment.", "Interpret principal, interest, and payment schedules."),
      topic("Budgeting and Investment", "Use mathematics in financial planning.", "Compare costs, returns, and risks.")
    )
  ]
};

function createSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getLearningGrades(): LearningGrade[] {
  return grades;
}

export function getLearningGrade(slug: string): LearningGrade | undefined {
  return grades.find((grade) => grade.slug === slug);
}

export function getLearningSubjects(): LearningSubject[] {
  return subjects;
}

export function getLearningSubject(subjectId: string): LearningSubject | undefined {
  return subjects.find((subject) => subject.id === subjectId);
}

/**
 * Numeric curriculum keys:
 * Pre-K = -2, Kindergarten = -1, Grades 1–12 = their grade number.
 */
export function getGradeNumber(grade: LearningGrade): number | null {
  if (grade.slug === "pre-k") return -2;
  if (grade.slug === "kindergarten") return -1;

  const match = grade.label.match(/^Grade (\d+)$/);
  return match ? Number(match[1]) : null;
}

export function getLearningUnits(
  grade: number,
  subjectId: string,
): LearningUnit[] {
  if (subjectId !== "mathematics") return [];

  return (mathematicsCurriculum[grade] ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    topics: item.topics,
  }));
}

export function getLearningTopics(
  grade: number,
  subjectId: string,
): LearningTopic[] {
  if (subjectId !== "mathematics") return [];

  return (mathematicsCurriculum[grade] ?? []).flatMap((item) =>
    item.topics.map((entry) => ({
      name: entry.name,
      slug: createSlug(entry.name),
      grade,
      subject: subjectId,
      unitId: item.id,
      unitTitle: item.title,
      description: entry.description,
      objectives: entry.objectives,
    })),
  );
}

export function getLearningTopic(
  grade: number,
  subjectId: string,
  topicSlug: string,
): LearningTopic | undefined {
  return getLearningTopics(grade, subjectId).find(
    (entry) => entry.slug === topicSlug,
  );
}

export function isLearningSubjectAvailable(
  grade: number,
  subjectId: string,
): boolean {
  return subjectId === "mathematics" &&
    (mathematicsCurriculum[grade]?.length ?? 0) > 0;
}
