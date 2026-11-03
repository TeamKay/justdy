/**
 * Math Quest provisional grade-banded question engine.
 * These are original practice questions, not an official standards-aligned curriculum.
 * Review against the school's chosen curriculum before classroom deployment.
 */
export type MathQuestGrade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type MathQuestQuestion = {
  topic: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  hint: string;
};

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const choose = <T,>(items: T[]) => items[rand(0, items.length - 1)];

function finish(topic: string, prompt: string, value: number, explanation: string, hint: string): MathQuestQuestion {
  const answer = String(Number.isInteger(value) ? value : Number(value.toFixed(2)));
  const options = new Set<string>([answer]);
  const step = Math.max(1, Math.ceil(Math.abs(value) * 0.12));
  const offsets = [-3, -2, -1, 1, 2, 3, -5, 5].map(n => n * step);
  for (const offset of offsets) {
    if (options.size >= 4) break;
    const candidate = Number.isInteger(value) ? String(value + offset) : String(Number((value + offset / 10).toFixed(2)));
    if (candidate !== answer) options.add(candidate);
  }
  while (options.size < 4) options.add(String(value + rand(7, 20)));
  return { topic, prompt, answer, explanation, hint, options: [...options].sort(() => Math.random() - 0.5) };
}

export function makeCurriculumQuestion(grade: MathQuestGrade, difficulty: number, topicOffset: number): MathQuestQuestion {
  const scale = 1 + Math.max(0, Math.min(4, difficulty - 1)) * 0.18;
  const n = (min: number, max: number) => rand(min, Math.max(min, Math.round(max * scale)));
  const topicIndex = ((topicOffset % 6) + 6) % 6;

  switch (grade) {
    case 1: {
      switch (topicIndex) {
        case 0: { const a=rand(1,10), b=rand(1,10); return finish("Counting & place value", `What number is ${a} more than ${b}?`, a+b, `${b} + ${a} = ${a+b}.`, `Start at ${b} and count on ${a}.`); }
        case 1: { const a=rand(5,20), b=rand(1,Math.min(10,5+a)); return finish("Addition & subtraction", `${a} − ${b} = ?`, a-b, `${a} − ${b} = ${a-b}.`, `Count back ${b} from ${a}.`); }
        case 2: { const a=rand(2,5), b=rand(2,5); return finish("Tens & ones", `How many ones are in ${a} tens and ${b} ones?`, a*10+b, `${a} tens = ${a*10}; add ${b} ones to get ${a*10+b}.`, `A ten is worth 10 ones.`); }
        case 3: { const a=rand(2,5); return finish("Equal groups", `There are ${a} pairs of stars. How many stars are there?`, a*2, `${a} groups of 2 make ${a*2}.`, `Count by twos ${a} times.`); }
        case 4: { const a=rand(2,9), b=rand(2,9); return finish("Measurement", `A ribbon is ${a} cm long. Another is ${b} cm long. What is their total length?`, a+b, `${a} + ${b} = ${a+b} cm.`, `Put the two lengths together.`); }
        default: { const a=rand(1,8); return finish("Shapes", `A triangle has how many sides?`, 3, `A triangle has 3 straight sides and 3 corners.`, `Think of a three-sided shape.`); }
      }
    }
    case 2: {
      switch(topicIndex) {
        case 0: { const a=rand(20,70), b=rand(10,Math.min(29,99-a)); return finish("Place value", `What is ${a} + ${b}?`, a+b, `${a} + ${b} = ${a+b}.`, `Add tens, then add ones.`); }
        case 1: { const a=rand(30,99), b=rand(10,a-1); return finish("Addition & subtraction", `${a} − ${b} = ?`, a-b, `${a} − ${b} = ${a-b}.`, `Subtract the tens and ones carefully.`); }
        case 2: { const a=rand(2,5), b=rand(2,5); return finish("Multiplication foundations", `There are ${a} bags with ${b} apples in each. How many apples?`, a*b, `${a} × ${b} = ${a*b}.`, `Add ${b} equal groups ${a} times.`); }
        case 3: { const divisor=rand(2,5), quotient=rand(2,10), total=divisor*quotient; return finish("Equal sharing", `${total} shells are shared equally among ${divisor} friends. How many does each friend get?`, quotient, `${total} ÷ ${divisor} = ${quotient}.`, `Find the number that multiplied by ${divisor} gives ${total}.`); }
        case 4: { const h=rand(2,8), w=rand(2,8); return finish("Measurement", `A rectangle is ${h} cm long and ${w} cm wide. What is its perimeter?`, 2*(h+w), `Perimeter = 2 × (${h} + ${w}) = ${2*(h+w)} cm.`, `Add all four sides.`); }
        default: { const a=rand(1,12); return finish("Time & money", `How many minutes are there in ${a} groups of 5 minutes?`, a*5, `${a} × 5 = ${a*5} minutes.`, `Count in fives.`); }
      }
    }
    case 3: {
      switch(topicIndex) {
        case 0: { const a=n(4,12), b=n(3,9); return finish("Multiplication", `${a} × ${b} = ?`, a*b, `${a} × ${b} = ${a*b}.`, `Use equal groups or an area model.`); }
        case 1: { const d=rand(2,9), q=rand(3,12), total=d*q; return finish("Division", `${total} ÷ ${d} = ?`, q, `${total} ÷ ${d} = ${q}, because ${d} × ${q} = ${total}.`, `Use the related multiplication fact.`); }
        case 2: { const a=rand(2,8); return finish("Fractions", `A shape is split into 8 equal parts. ${a} parts are shaded. What is the shaded fraction as a decimal?`, a/8, `The shaded fraction is ${a}/8 = ${(a/8).toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}.`, `Write shaded parts over total equal parts.`); }
        case 3: { const a=rand(100,500), b=rand(100, Math.min(400,999-a)); return finish("Addition & subtraction", `${a} + ${b} = ?`, a+b, `${a} + ${b} = ${a+b}.`, `Add hundreds, tens and ones.`); }
        case 4: { const l=rand(3,12), w=rand(2,9); return finish("Area & perimeter", `What is the area of a ${l} cm by ${w} cm rectangle?`, l*w, `Area = length × width = ${l} × ${w} = ${l*w} cm².`, `Multiply length by width.`); }
        default: { const a=rand(2,8), b=rand(2,8); return finish("Patterns", `The pattern is ${a}, ${a+b}, ${a+2*b}, ... What is the next number?`, a+3*b, `The pattern increases by ${b}; ${a+2*b} + ${b} = ${a+3*b}.`, `Find the constant amount added each time.`); }
      }
    }
    case 4: {
      switch(topicIndex) {
        case 0: { const a=rand(12,35), b=rand(11,24); return finish("Multi-digit multiplication", `${a} × ${b} = ?`, a*b, `${a} × ${b} = ${a*b}.`, `Break one factor into tens and ones.`); }
        case 1: { const den=choose([2,3,4,5,6,8,10,12]), num=rand(1,den-1), add=rand(1,den-num); return finish("Fractions", `${num}/${den} + ${add}/${den} = ? (give the numerator)`, num+add, `With equal denominators, add numerators: ${num} + ${add} = ${num+add}.`, `Keep the denominator and add the numerators.`); }
        case 2: { const a=rand(2,9); return finish("Decimals", `What is ${a}.4 + 2.3?`, a+4.7, `Align decimal points: ${a}.4 + 2.3 = ${(a+4.7).toFixed(1)}.`, `Add tenths to tenths and ones to ones.`); }
        case 3: { const a=rand(2,9), b=rand(2,9); return finish("Factors & multiples", `What is the least common multiple of ${a} and ${b}?`, lcm(a,b), `The first shared multiple of ${a} and ${b} is ${lcm(a,b)}.`, `List multiples of each number until one matches.`); }
        case 4: { const a=rand(3,12), b=rand(3,12); return finish("Geometry", `A rectangle has length ${a} cm and width ${b} cm. What is its perimeter?`, 2*(a+b), `2 × (${a} + ${b}) = ${2*(a+b)} cm.`, `Perimeter is the distance around the shape.`); }
        default: { const h=rand(2,12), m=rand(1,59); return finish("Time & measurement", `How many minutes are in ${h} hours and ${m} minutes?`, h*60+m, `${h} × 60 + ${m} = ${h*60+m} minutes.`, `Each hour contains 60 minutes.`); }
      }
    }
    case 5: {
      switch(topicIndex) {
        case 0: { const den=rand(2,12), num=rand(1,den-1), whole=rand(2,9), amount=den*whole; return finish("Fractions", `What is ${num}/${den} of ${amount}?`, num*whole, `${amount} ÷ ${den} = ${whole}; ${whole} × ${num} = ${num*whole}.`, `Divide by the denominator, then multiply by the numerator.`); }
        case 1: { const a=rand(12,89)/10, b=rand(11,59)/10; return finish("Decimals", `${a.toFixed(1)} + ${b.toFixed(1)} = ?`, Number((a+b).toFixed(1)), `${a.toFixed(1)} + ${b.toFixed(1)} = ${(a+b).toFixed(1)}.`, `Line up the decimal points.`); }
        case 2: { const a=rand(10,80), p=choose([10,20,25,50]); return finish("Percentages", `What is ${p}% of ${a}?`, a*p/100, `${p}% = ${p/100}; ${a} × ${p/100} = ${a*p/100}.`, `Convert the percentage to a decimal or fraction.`); }
        case 3: { const a=rand(2,12), b=rand(2,12); return finish("Order of operations", `${a} + ${b} × 3 = ?`, a+b*3, `Multiply first: ${b} × 3 = ${b*3}; then add ${a}.`, `Multiplication comes before addition.`); }
        case 4: { const base=rand(4,15), height=rand(3,12); return finish("Geometry", `What is the area of a triangle with base ${base} cm and height ${height} cm?`, base*height/2, `Area = ½ × base × height = ½ × ${base} × ${height} = ${base*height/2} cm².`, `Multiply base by height, then divide by 2.`); }
        default: { const a=rand(2,9), b=rand(2,9); return finish("Volume", `A rectangular prism measures ${a} cm × ${b} cm × 2 cm. What is its volume?`, a*b*2, `Volume = length × width × height = ${a} × ${b} × 2 = ${a*b*2} cm³.`, `Multiply the three dimensions.`); }
      }
    }
    case 6: {
      switch(topicIndex) {
        case 0: { const a=rand(3,12), b=rand(2,10); return finish("Ratios", `The ratio of red to blue gems is ${a}:${b}. If there are ${a*3} red gems, how many blue gems are there?`, b*3, `The scale factor is 3, so ${b} × 3 = ${b*3} blue gems.`, `Find the scale factor from the first part of the ratio.`); }
        case 1: { const a=rand(10,80), p=choose([10,15,20,25,50]); return finish("Percentages", `A ${a}-coin item is discounted by ${p}%. How many coins is the discount?`, a*p/100, `${p}% of ${a} = ${a} × ${p/100} = ${a*p/100}.`, `Find the percentage amount, not the sale price.`); }
        case 2: { const a=rand(-12,12), b=rand(-12,12); return finish("Integers", `(${a}) + (${b}) = ?`, a+b, `Adding signed integers gives ${a} + (${b}) = ${a+b}.`, `Use a number line or combine positive and negative amounts.`); }
        case 3: { const a=rand(2,12), b=rand(2,12); return finish("Expressions", `Evaluate 3 × ${a} + ${b} when the variable value is ${a}.`, 3*a+b, `Substitute ${a}: 3 × ${a} + ${b} = ${3*a+b}.`, `Replace the variable with its given value.`); }
        case 4: { const a=rand(3,15), b=rand(3,15); return finish("Geometry", `Two angles in a triangle are ${a*5}° and ${b*5}°. Find the third angle.`, 180-a*5-b*5, `Triangle angles total 180°: 180 − ${a*5} − ${b*5} = ${180-a*5-b*5}°.`, `Subtract the two known angles from 180°.`); }
        default: { const a=rand(2,9), b=rand(2,9); return finish("Statistics", `Find the mean of ${a}, ${b}, and ${a+b}.`, (a+b+a+b)/3, `Mean = sum ÷ count = (${a} + ${b} + ${a+b}) ÷ 3 = ${(2*a+2*b)/3}.`, `Add all values, then divide by 3.`); }
      }
    }
    case 7: {
      switch(topicIndex) {
        case 0: { const a=rand(2,12), b=rand(2,12); return finish("Proportional relationships", `If 1 notebook costs ${a} coins, how much do ${b} notebooks cost?`, a*b, `${a} × ${b} = ${a*b} coins.`, `Use the unit rate and multiply by the number of notebooks.`); }
        case 1: { const a=rand(10,80), b=rand(2,9); return finish("Rational numbers", `${a} ÷ ${b} = ? (round to 2 decimal places)`, Number((a/b).toFixed(2)), `${a} ÷ ${b} ≈ ${(a/b).toFixed(2)}.`, `Divide, then round to the nearest hundredth.`); }
        case 2: { const x=rand(2,12), b=rand(2,15); return finish("Linear equations", `Solve: ${x}x + ${b} = ${x*x+b}.`, x, `Subtract ${b}, then divide by ${x}: x = ${x}.`, `Undo addition first, then undo multiplication.`); }
        case 3: { const a=rand(2,9), b=rand(2,9); return finish("Exponents", `Evaluate ${a}² + ${b}.`, a*a+b, `${a}² = ${a*a}; ${a*a} + ${b} = ${a*a+b}.`, `A square means multiply the number by itself.`); }
        case 4: { const r=rand(2,10); return finish("Geometry", `Using π ≈ 3.14, find the circumference of a circle with radius ${r} cm.`, Number((2*3.14*r).toFixed(2)), `C = 2πr = 2 × 3.14 × ${r} = ${(2*3.14*r).toFixed(2)} cm.`, `Circumference = 2 × π × radius.`); }
        default: { const a=rand(2,10), b=rand(2,10); return finish("Probability", `A bag has ${a} red and ${b} blue counters. What is the probability of picking red? Give the numerator.`, a, `There are ${a} red counters, so the probability is ${a}/${a+b}.`, `Probability = favourable outcomes over all outcomes.`); }
      }
    }
    default: {
      switch(topicIndex) {
        case 0: { const a=rand(2,10), b=rand(2,10); return finish("Linear equations", `Solve: ${a}x − ${b} = ${a*3-b}.`, 3, `${a}x = ${a*3}; x = 3.`, `Add ${b} to both sides, then divide by ${a}.`); }
        case 1: { const a=rand(2,9), b=rand(2,9); return finish("Functions", `For f(x) = ${a}x + ${b}, find f(3).`, 3*a+b, `f(3) = ${a} × 3 + ${b} = ${3*a+b}.`, `Substitute 3 for x.`); }
        case 2: { const a=rand(2,9), b=rand(2,9); return finish("Pythagorean theorem", `A right triangle has legs ${a} and ${b}. What is the square of the hypotenuse?`, a*a+b*b, `c² = a² + b² = ${a*a} + ${b*b} = ${a*a+b*b}.`, `Square both legs and add; this asks for c².`); }
        case 3: { const a=rand(2,12), b=rand(2,12); return finish("Scientific notation", `What is ${a} × 10² + ${b} × 10?`, a*100+b*10, `${a} × 100 + ${b} × 10 = ${a*100+b*10}.`, `10² is 100; 10 is ten.`); }
        case 4: { const a=rand(2,8), b=rand(2,8); return finish("Geometry", `A cylinder has radius ${a} cm and height ${b} cm. Using π ≈ 3.14, what is its volume?`, Number((3.14*a*a*b).toFixed(2)), `V = πr²h = 3.14 × ${a}² × ${b} = ${(3.14*a*a*b).toFixed(2)} cm³.`, `Square the radius, multiply by height and π.`); }
        default: { const a=rand(2,12), b=rand(2,12); return finish("Statistics", `A data set has values ${a}, ${b}, and ${a+b}. What is the mean?`, (2*a+2*b)/3, `Mean = (${a} + ${b} + ${a+b}) ÷ 3 = ${(2*a+2*b)/3}.`, `Add the values and divide by the number of values.`); }
      }
    }
  }
}

function lcm(a: number, b: number) { const gcd=(x:number,y:number):number=>y===0?x:gcd(y,x%y); return Math.abs(a*b)/gcd(a,b); }

export type TopicPerformance = { right: number; total: number };
export type AdaptiveQuestionResult = { question: MathQuestQuestion; message: string; focus: string };

/**
 * Selects the next topic using observed performance while giving unseen topics
 * a fair opportunity. Accuracy is treated cautiously until a topic has at least
 * three attempts, so one mistake does not permanently label a learner as weak.
 */
export function makeAdaptiveQuestion(
  grade: MathQuestGrade,
  difficulty: number,
  topicOffset: number,
  topicStats: Record<string, TopicPerformance>,
  previousTopic?: string,
): AdaptiveQuestionResult {
  const candidates = Array.from({ length: 6 }, (_, index) =>
    makeCurriculumQuestion(grade, difficulty, topicOffset + index),
  );
  const ranked = candidates.map((question, index) => {
    const stat = topicStats[question.topic] ?? { right: 0, total: 0 };
    const accuracy = stat.total ? stat.right / stat.total : 0.5;
    // Unseen topics receive a modest exploration bonus; low mastery receives
    // more attention once there is enough evidence to be meaningful.
    const exploration = stat.total === 0 ? 0.24 : stat.total < 3 ? 0.12 : 0;
    const weakness = stat.total >= 3 ? (1 - accuracy) * 0.72 : 0;
    const recencyPenalty = question.topic === previousTopic ? 0.18 : 0;
    return { question, index, score: exploration + weakness - recencyPenalty + (5 - index) * 0.001 };
  }).sort((a, b) => b.score - a.score);
  const chosen = ranked[0].question;
  const stat = topicStats[chosen.topic] ?? { right: 0, total: 0 };
  const accuracy = stat.total ? Math.round((stat.right / stat.total) * 100) : null;
  const message = stat.total === 0
    ? `Let's explore ${chosen.topic}. This topic is new to your learning profile.`
    : stat.total < 3
      ? `Let's build more evidence in ${chosen.topic} before adjusting its mastery level.`
      : accuracy !== null && accuracy < 65
        ? `We're revisiting ${chosen.topic} to strengthen your understanding.`
        : accuracy !== null && accuracy >= 85
          ? `Strong work in ${chosen.topic}. Keep stretching your skills.`
          : `Your next challenge focuses on ${chosen.topic}.`;
  return { question: chosen, message, focus: chosen.topic };
}
