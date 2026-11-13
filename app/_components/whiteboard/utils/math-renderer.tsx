const MATH_SYMBOLS: Record<string, string> = {
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  Delta: "Δ",
  theta: "θ",
  lambda: "λ",
  mu: "μ",
  sigma: "σ",
  Sigma: "Σ",
  phi: "φ",
  varphi: "ϕ",
  omega: "ω",
  Omega: "Ω",
  pi: "π",
  rho: "ρ",
  tau: "τ",
  infinity: "∞",
  pm: "±",
  mp: "∓",
  times: "×",
  cdot: "·",
  div: "÷",
  le: "≤",
  ge: "≥",
  geq: "≥",
  leq: "≤",
  neq: "≠",
  approx: "≈",
  propto: "∝",
  degree: "°",
  sum: "∑",
  prod: "∏",
  int: "∫",
  partial: "∂",
  nabla: "∇",
  rightarrow: "→",
  leftarrow: "←",
  Rightarrow: "⇒",
  Leftarrow: "⇐",
  infty: "∞",
};

export function latexToReadable(text: string): string {
  const convert = (source: string): string => {
    let value = source;

    const readBalancedGroup = (
      input: string,
      openIndex: number,
    ): { content: string; end: number } | null => {
      if (input[openIndex] !== "{") return null;

      let depth = 0;
      for (let index = openIndex; index < input.length; index++) {
        if (input[index] === "{") depth++;
        if (input[index] === "}") {
          depth--;
          if (depth === 0) {
            return {
              content: input.slice(openIndex + 1, index),
              end: index + 1,
            };
          }
        }
      }

      return null;
    };

    // Resolve fractions from the inside out so nested fractions work too.
    let fractionIndex = value.indexOf("\\frac");
    while (fractionIndex !== -1) {
      const numeratorStart = fractionIndex + 5;

      // Skip optional whitespace between \frac and its arguments.
      let numeratorIndex = numeratorStart;
      while (/\s/.test(value[numeratorIndex] ?? "")) numeratorIndex++;

      const numerator = readBalancedGroup(value, numeratorIndex);

      if (!numerator) {
        fractionIndex = value.indexOf("\\frac", fractionIndex + 5);
        continue;
      }

      let denominatorIndex = numerator.end;
      while (/\s/.test(value[denominatorIndex] ?? "")) denominatorIndex++;

      const denominator = readBalancedGroup(value, denominatorIndex);

      if (!denominator) {
        fractionIndex = value.indexOf("\\frac", fractionIndex + 5);
        continue;
      }

      const numeratorText = convert(numerator.content);
      const denominatorText = convert(denominator.content);

      value =
        value.slice(0, fractionIndex) +
        `${numeratorText}/${denominatorText}` +
        value.slice(denominator.end);

      fractionIndex = value.indexOf("\\frac");
    }

    // Common LaTeX symbols.
    Object.entries(MATH_SYMBOLS).forEach(([name, symbol]) => {
      value = value.replace(new RegExp(`\\\\${name}\\b`, "g"), symbol);
    });

    value = value.replace(/\\text\{([^{}]*)\}/g, "$1");
    value = value.replace(/\\left|\\right/g, "");
    value = value.replace(/\\,|\\;|\\!|\\quad/g, " ");
    value = value.replace(/\\sqrt(?:\[([^\]]+)\])?\{([^{}]*)\}/g, (_match, index, radicand) => `${index ? `${index}√` : "√"}(${radicand})`);
    value = value.replace(/\\sqrt\s*([A-Za-z0-9])/g, "√$1");
    value = value.replace(/\^\{([^{}]*)\}/g, "^$1");
    value = value.replace(/_\{([^{}]*)\}/g, "_$1");

    // Remove only grouping braces that are left after the supported
    // structures have been converted.
    value = value.replace(/[{}]/g, "");

    return value;
  };

  return convert(text);
}

type StructuredMathLayout = {
  environment: "matrix" | "pmatrix" | "bmatrix" | "Bmatrix" | "vmatrix" | "Vmatrix" | "cases" | "aligned";
  rows: string[][];
  columnWidths: number[];
  rowHeight: number;
  width: number;
  height: number;
  padding: number;
};

export function parseStructuredMath(
  text: string,
  fontSize: number,
  ctx?: CanvasRenderingContext2D | null,
): StructuredMathLayout | null {
  const match = text.trim().match(
    /^\\begin\{(matrix|pmatrix|bmatrix|Bmatrix|vmatrix|Vmatrix|cases|aligned)\}([\s\S]*?)\\end\{\1\}$/,
  );
  if (!match) return null;

  const environment = match[1] as StructuredMathLayout["environment"];
  const body = match[2].trim();
  const rows = body
    .split(/\\\\/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => row.split("&").map((cell) => cell.trim()));

  if (!rows.length) return null;

  const columnCount = Math.max(...rows.map((row) => row.length));
  const normalizedRows = rows.map((row) =>
    Array.from({ length: columnCount }, (_, index) => row[index] ?? ""),
  );
  const padding = fontSize * (environment === "aligned" ? 0.45 : 0.7);
  const columnWidths = Array.from({ length: columnCount }, (_, column) =>
    Math.max(
      fontSize * 0.7,
      ...normalizedRows.map((row) =>
        measureMathRenderWidth(row[column], fontSize * 0.94, ctx),
      ),
    ),
  );
  const rowHeight = fontSize * 1.55;
  const delimiterWidth =
    environment === "matrix" || environment === "aligned" ? 0 :
    environment === "cases" ? fontSize * 0.62 : fontSize * 0.9;
  const width =
    columnWidths.reduce((sum, value) => sum + value, 0) +
    Math.max(0, columnCount - 1) * padding +
    delimiterWidth * 2 +
    (environment === "cases" ? fontSize * 0.25 : 0);
  const height = Math.max(fontSize * 1.35, normalizedRows.length * rowHeight);

  return {
    environment,
    rows: normalizedRows,
    columnWidths,
    rowHeight,
    width,
    height,
    padding,
  };
}

export function renderLatexPreview(text: string, color: string) {
  const value = text.trim();
  const structured = parseStructuredMath(value, 22);
  if (structured) {
    const isCases = structured.environment === "cases";
    const isAligned = structured.environment === "aligned";
    const grid = (
      <span
        className="inline-grid items-center gap-x-3 gap-y-1 font-serif text-lg"
        style={{
          color,
          gridTemplateColumns: `repeat(${structured.columnWidths.length}, max-content)`,
        }}
      >
        {structured.rows.flatMap((row, rowIndex) =>
          row.map((cell, columnIndex) => (
            <span
              key={`${rowIndex}-${columnIndex}`}
              className={isAligned && columnIndex === 0 ? "text-right" : "text-left"}
            >
              {latexToReadable(cell)}
            </span>
          )),
        )}
      </span>
    );
    if (isCases) {
      return (
        <span className="inline-flex items-center gap-1" style={{ color }}>
          <span className="font-serif text-5xl leading-none">{"{"}</span>
          {grid}
        </span>
      );
    }
    if (["pmatrix", "bmatrix", "Bmatrix", "vmatrix", "Vmatrix"].includes(structured.environment)) {
      const delimiters: Record<string, [string, string]> = {
        pmatrix: ["(", ")"],
        bmatrix: ["[", "]"],
        Bmatrix: ["{", "}"],
        vmatrix: ["|", "|"],
        Vmatrix: ["‖", "‖"],
      };
      const [left, right] = delimiters[structured.environment];
      return (
        <span className="inline-flex items-center gap-1" style={{ color }}>
          <span className="font-serif text-4xl leading-none">{left}</span>
          {grid}
          <span className="font-serif text-4xl leading-none">{right}</span>
        </span>
      );
    }
    return grid;
  }

  const fraction = value.match(/^\\frac\{([^{}]*)\}\{([^{}]*)\}$/);
  if (fraction) {
    return (
      <span
        className="inline-flex flex-col items-center justify-center leading-none"
        style={{ color }}
      >
        <span className="border-b-2 border-current px-2 pb-1">
          {latexToReadable(fraction[1])}
        </span>
        <span className="px-2 pt-1">{latexToReadable(fraction[2])}</span>
      </span>
    );
  }

  const sqrt = value.match(/^\\sqrt\{([^{}]*)\}$/);
  if (sqrt) {
    return (
      <span style={{ color }}>
        √
        <span className="border-t-2 border-current px-1">
          {latexToReadable(sqrt[1])}
        </span>
      </span>
    );
  }

  return <span style={{ color }}>{latexToReadable(value)}</span>;
}

export function estimateMathMetrics(
  text: string,
  fontSize: number,
  ctx?: CanvasRenderingContext2D | null,
) {
  const structured = parseStructuredMath(text, fontSize, ctx);
  if (structured) {
    return { width: structured.width, height: structured.height };
  }
  const readable = latexToReadable(text);
  const plainWidth = ctx
    ? ctx.measureText(readable).width
    : readable.length * fontSize * 0.62;
  const fractionCount = (text.match(/\\frac/g) || []).length;
  const sqrtCount = (text.match(/\\sqrt/g) || []).length;
  const superscriptCount = (text.match(/\^/g) || []).length;
  const subscriptCount = (text.match(/_/g) || []).length;

  const commandCount = (text.match(/\\[A-Za-z]+/g) || []).length;
  const groupCount = (text.match(/[{}]/g) || []).length / 2;
  return {
    width: Math.max(
      fontSize * 0.8,
      plainWidth * 1.08 +
        fractionCount * fontSize * 0.25 +
        sqrtCount * fontSize * 0.14 +
        commandCount * fontSize * 0.08 +
        groupCount * fontSize * 0.025,
    ),
    height:
      fontSize *
      (1.25 +
        Math.min(1.2, fractionCount * 0.55) +
        Math.min(0.45, (superscriptCount + subscriptCount) * 0.08)),
  };
}

export function drawMathEquation(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color: string,
) {
  // Structured environments are laid out as aligned rows and columns before
  // falling back to the inline LaTeX renderer below.
  const structured = parseStructuredMath(text, fontSize, ctx);
  if (structured) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, fontSize * 0.045);

    const { environment, rows, columnWidths, rowHeight, width, height, padding } = structured;
    const startX = x;
    const topY = y + fontSize - height / 2;
    const isCases = environment === "cases";
    const leftDelimiter =
      environment === "pmatrix" ? "(" :
      environment === "bmatrix" ? "[" :
      environment === "Bmatrix" ? "{" :
      environment === "vmatrix" ? "|" :
      environment === "Vmatrix" ? "‖" : "";
    const rightDelimiter =
      environment === "pmatrix" ? ")" :
      environment === "bmatrix" ? "]" :
      environment === "Bmatrix" ? "}" :
      environment === "vmatrix" ? "|" :
      environment === "Vmatrix" ? "‖" : "";
    const delimiterWidth =
      environment === "matrix" || environment === "aligned" ? 0 :
      isCases ? fontSize * 0.62 : fontSize * 0.9;
    const cursorX = startX + (isCases ? fontSize * 0.7 : delimiterWidth);

    rows.forEach((row, rowIndex) => {
      const baseline = topY + rowHeight * (rowIndex + 0.5) + fontSize * 0.3;
      let cellX = cursorX;
      row.forEach((cell, columnIndex) => {
        const cellWidth = columnWidths[columnIndex] ?? fontSize;
        const actualWidth = measureMathRenderWidth(cell, fontSize * 0.94, ctx);
        const isAlignedLabel = environment === "aligned" && columnIndex === 0;
        const cellOrigin = isAlignedLabel
          ? cellX + cellWidth - actualWidth
          : cellX + (cellWidth - actualWidth) / 2;
        drawMathEquation(ctx, cell, cellOrigin, baseline - fontSize * 0.94, fontSize * 0.94, color);
        cellX += cellWidth + padding;
      });
    });

    if (isCases) {
      ctx.font = `${fontSize * 2.15}px Cambria Math, STIX Two Math, serif`;
      ctx.textBaseline = "middle";
      ctx.fillText("{", startX, topY + height / 2);
    } else if (leftDelimiter) {
      ctx.font = `${fontSize * 1.65}px Cambria Math, STIX Two Math, serif`;
      ctx.textBaseline = "middle";
      ctx.fillText(leftDelimiter, startX, topY + height / 2);
      ctx.fillText(rightDelimiter, startX + width - delimiterWidth, topY + height / 2);
    }
    ctx.restore();
    return;
  }

  // Lightweight LaTeX-style renderer for inline classroom notation.
  const render = (
    source: string,
    size: number,
    originX: number,
    originY: number,
  ) => {
    let cursorX = originX;
    let i = 0;
    const baseFont = `${size}px Cambria Math, STIX Two Math, Times New Roman, serif`;
    ctx.font = baseFont;
    ctx.textBaseline = "alphabetic";

    const readGroup = () => {
      if (source[i] === "{") {
        let depth = 0;
        const start = ++i;
        while (i < source.length) {
          if (source[i] === "{") depth++;
          else if (source[i] === "}") {
            if (depth === 0) break;
            depth--;
          }
          i++;
        }
        const group = source.slice(start, i);
        if (source[i] === "}") i++;
        return group;
      }
      if (source[i] === "\\") {
        const start = i;
        i++;
        while (i < source.length && /[A-Za-z]/.test(source[i])) i++;
        return source.slice(start, i);
      }
      return source[i++] || "";
    };

    const readCommand = () => {
      i++;
      const start = i;
      while (i < source.length && /[A-Za-z]/.test(source[i])) i++;
      return source.slice(start, i);
    };

    while (i < source.length) {
      if (/\s/.test(source[i])) {
        cursorX += size * 0.22;
        i++;
        continue;
      }

      if (source[i] === "\\") {
        const command = readCommand();
        if (command === "frac") {
          const numerator = readGroup();
          const denominator = readGroup();
          const fracSize = size * 0.86;
          const numMetrics = estimateMathMetrics(numerator, fracSize, ctx);
          const denMetrics = estimateMathMetrics(denominator, fracSize, ctx);
          const width =
            Math.max(numMetrics.width, denMetrics.width) + size * 0.35;
          const center = cursorX + width / 2;
          render(
            numerator,
            fracSize,
            center - numMetrics.width / 2,
            originY - size * 0.28,
          );
          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(1, size * 0.055);
          ctx.beginPath();
          ctx.moveTo(cursorX + size * 0.08, originY - size * 0.02);
          ctx.lineTo(cursorX + width - size * 0.08, originY - size * 0.02);
          ctx.stroke();
          render(
            denominator,
            fracSize,
            center - denMetrics.width / 2,
            originY + size * 0.72,
          );
          cursorX += width;
          continue;
        }
        if (command === "sqrt") {
          let rootIndex = "";
          if (source[i] === "[") {
            const closeIndex = source.indexOf("]", i + 1);
            if (closeIndex !== -1) {
              rootIndex = source.slice(i + 1, closeIndex);
              i = closeIndex + 1;
            }
          }
          const radicand = readGroup();
          const metrics = estimateMathMetrics(radicand, size * 0.9, ctx);
          const radicalX = cursorX + (rootIndex ? size * 0.24 : 0);
          if (rootIndex) {
            render(rootIndex, size * 0.43, cursorX, originY - size * 0.48);
          }
          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(1, size * 0.07);
          ctx.beginPath();
          ctx.moveTo(radicalX, originY - size * 0.28);
          ctx.lineTo(radicalX + size * 0.18, originY + size * 0.05);
          ctx.lineTo(radicalX + size * 0.34, originY - size * 0.62);
          ctx.lineTo(
            radicalX + size * 0.34 + metrics.width,
            originY - size * 0.62,
          );
          ctx.stroke();
          render(radicand, size * 0.9, radicalX + size * 0.36, originY);
          cursorX += (rootIndex ? size * 0.24 : 0) + size * 0.36 + metrics.width + size * 0.08;
          continue;
        }
        if (command === "text") {
          const content = readGroup();
          ctx.font = `${size}px Inter, sans-serif`;
          ctx.fillText(content, cursorX, originY);
          cursorX += ctx.measureText(content).width;
          continue;
        }

        const symbol = MATH_SYMBOLS[command] ?? command;
        ctx.font = baseFont;
        ctx.fillText(symbol, cursorX, originY);
        cursorX += ctx.measureText(symbol).width;
        continue;
      }

      if (source[i] === "^" || source[i] === "_") {
        const isSup = source[i] === "^";
        i++;
        const group = readGroup();
        const subSize = size * 0.62;
        const offsetY = isSup ? -size * 0.48 : size * 0.34;
        render(group, subSize, cursorX, originY + offsetY);
        continue;
      }

      if (source[i] === "{") {
        const group = readGroup();
        render(group, size, cursorX, originY);
        cursorX += estimateMathMetrics(group, size, ctx).width;
        continue;
      }

      const ch = source[i++];
      ctx.font = baseFont;
      ctx.fillText(ch, cursorX, originY);
      cursorX += ctx.measureText(ch).width;
    }
    return cursorX - originX;
  };

  ctx.save();
  ctx.fillStyle = color;
  render(text, fontSize, x, y + fontSize);
  ctx.restore();
}

export function measureMathRenderWidth(
  text: string,
  fontSize: number,
  ctx?: CanvasRenderingContext2D | null,
): number {
  const structured = parseStructuredMath(text, fontSize, ctx);
  if (structured) return structured.width;

  const measure = (source: string, size: number): number => {
    let cursorX = 0;
    let i = 0;
    const baseFont = `${size}px Cambria Math, STIX Two Math, Times New Roman, serif`;

    const readGroup = (): string => {
      if (source[i] === "{") {
        let depth = 0;
        const start = ++i;
        while (i < source.length) {
          if (source[i] === "{") depth++;
          else if (source[i] === "}") {
            if (depth === 0) break;
            depth--;
          }
          i++;
        }
        const group = source.slice(start, i);
        if (source[i] === "}") i++;
        return group;
      }
      if (source[i] === "\\") {
        const start = i++;
        while (i < source.length && /[A-Za-z]/.test(source[i])) i++;
        return source.slice(start, i);
      }
      return source[i++] || "";
    };

    while (i < source.length) {
      if (/\s/.test(source[i])) {
        cursorX += size * 0.22;
        i++;
        continue;
      }

      if (source[i] === "\\") {
        i++;
        const start = i;
        while (i < source.length && /[A-Za-z]/.test(source[i])) i++;
        const command = source.slice(start, i);

        if (command === "frac") {
          const numerator = readGroup();
          const denominator = readGroup();
          const fracSize = size * 0.86;
          const width =
            Math.max(
              measure(numerator, fracSize),
              measure(denominator, fracSize),
            ) +
            size * 0.35;
          cursorX += width;
          continue;
        }

        if (command === "sqrt") {
          let rootIndex = "";
          if (source[i] === "[") {
            const closeIndex = source.indexOf("]", i + 1);
            if (closeIndex !== -1) {
              rootIndex = source.slice(i + 1, closeIndex);
              i = closeIndex + 1;
            }
          }
          const radicand = readGroup();
          cursorX += (rootIndex ? size * 0.24 + measure(rootIndex, size * 0.43) * 0.55 : 0) +
            size * 0.36 + measure(radicand, size * 0.9) + size * 0.08;
          continue;
        }

        if (command === "text") {
          const content = readGroup();
          if (ctx) {
            ctx.save();
            ctx.font = `${size}px Inter, sans-serif`;
            cursorX += ctx.measureText(content).width;
            ctx.restore();
          } else {
            cursorX += content.length * size * 0.56;
          }
          continue;
        }

        const symbol = MATH_SYMBOLS[command] ?? command;
        if (ctx) {
          ctx.save();
          ctx.font = baseFont;
          cursorX += ctx.measureText(symbol).width;
          ctx.restore();
        } else {
          cursorX += symbol.length * size * 0.62;
        }
        continue;
      }

      if (source[i] === "^" || source[i] === "_") {
        i++;
        readGroup();
        // Superscripts/subscripts are drawn at cursorX and do not advance it.
        continue;
      }

      if (source[i] === "{") {
        const group = readGroup();
        cursorX += measure(group, size);
        continue;
      }

      const ch = source[i++];
      if (ctx) {
        ctx.save();
        ctx.font = baseFont;
        cursorX += ctx.measureText(ch).width;
        ctx.restore();
      } else {
        cursorX += size * 0.62;
      }
    }

    return cursorX;
  };

  return Math.max(fontSize * 0.8, measure(text, fontSize));
}
