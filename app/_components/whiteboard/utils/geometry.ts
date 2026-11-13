import type { Point, WhiteboardElement } from "../types/whiteboard";
import {
  estimateMathMetrics,
  measureMathRenderWidth,
} from "./math-renderer";

export function getElementBounds(
  element: WhiteboardElement,
  ctx?: CanvasRenderingContext2D | null,
): { left: number; top: number; right: number; bottom: number } {
  if (element.type === "stroke") {
    const xs = element.points.map((point) => point.x);
    const ys = element.points.map((point) => point.y);
    if (xs.length === 0) return { left: 0, top: 0, right: 0, bottom: 0 };
    const padding = Math.max(element.width, 8) + 4;
    return {
      left: Math.min(...xs) - padding,
      top: Math.min(...ys) - padding,
      right: Math.max(...xs) + padding,
      bottom: Math.max(...ys) + padding,
    };
  }

  if ("start" in element && "end" in element) {
    const padding = Math.max(element.width, 8) + 4;
    return {
      left: Math.min(element.start.x, element.end.x) - padding,
      top: Math.min(element.start.y, element.end.y) - padding,
      right: Math.max(element.start.x, element.end.x) + padding,
      bottom: Math.max(element.start.y, element.end.y) + padding,
    };
  }

  if (element.type === "image") {
    return {
      left: element.x,
      top: element.y,
      right: element.x + element.width,
      bottom: element.y + element.height,
    };
  }

  if (element.type === "text" && element.teachingTemplate) {
    const scaleX = Math.max(0.25, element.scaleX ?? 1);
    const scaleY = Math.max(0.25, element.scaleY ?? 1);
    const width = (element.cardWidth ?? 360) * scaleX;
    const height = (element.cardHeight ?? 190) * scaleY;
    return {
      left: element.x,
      top: element.y,
      right: element.x + width,
      bottom: element.y + height,
    };
  }

  const mathMetrics =
    element.type === "equation"
      ? estimateMathMetrics(element.text, element.fontSize, ctx)
      : null;

  let measuredWidth: number;
  let measuredHeight: number;

  if (mathMetrics) {
    const scaleX =
      element.type === "equation" ? Math.max(0.2, element.scaleX ?? 1) : 1;
    const scaleY =
      element.type === "equation" ? Math.max(0.2, element.scaleY ?? 1) : 1;
    // Use the same cursor/command rules as drawMathEquation so the dotted
    // selection frame encloses the complete rendered formula, including
    // fractions, square roots, commands, and text groups.
    const renderedWidth = measureMathRenderWidth(
      element.text,
      element.fontSize,
      ctx,
    );
    measuredWidth = renderedWidth * scaleX;
    measuredHeight = mathMetrics.height * scaleY;
  } else if (ctx) {
    // Text selection bounds must use the exact same font metrics as the
    // renderer. Previously the canvas context could still contain the font
    // from another element, which made the blue selection frame stop halfway
    // across longer/bold/italic text.
    ctx.save();
    ctx.font = `${element.italic ? "italic " : ""}${element.bold ? "700 " : "400 "}${element.fontSize}px Inter, sans-serif`;
    measuredWidth = ctx.measureText(element.text).width;
    const metrics = ctx.measureText(element.text);
    measuredHeight = Math.max(
      element.fontSize + 6,
      (metrics.actualBoundingBoxAscent || element.fontSize * 0.8) +
        (metrics.actualBoundingBoxDescent || element.fontSize * 0.2) +
        6,
    );
    ctx.restore();
  } else {
    measuredWidth = element.text.length * element.fontSize * 0.62;
    measuredHeight = element.fontSize + 6;
  }

  const padding =
    Math.max(7, element.fontSize * 0.14) *
    (element.type === "equation"
      ? Math.max(1, Math.min(element.scaleX ?? 1, element.scaleY ?? 1))
      : 1);

  return {
    left: element.x - padding,
    top: element.y - padding,
    right:
      element.x + Math.max(measuredWidth, element.fontSize * 0.6) + padding,
    bottom: element.y + measuredHeight + padding,
  };
}

export function pointInsideBounds(
  point: Point,
  bounds: { left: number; top: number; right: number; bottom: number },
  tolerance = 0,
): boolean {
  return (
    point.x >= bounds.left - tolerance &&
    point.x <= bounds.right + tolerance &&
    point.y >= bounds.top - tolerance &&
    point.y <= bounds.bottom + tolerance
  );
}

export function distanceToSegment(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = Math.max(
    0,
    Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared),
  );
  const projection = { x: a.x + t * dx, y: a.y + t * dy };
  return Math.hypot(point.x - projection.x, point.y - projection.y);
}

export function hitTestElement(
  element: WhiteboardElement,
  point: Point,
  ctx: CanvasRenderingContext2D | null,
): boolean {
  const bounds = getElementBounds(element, ctx);
  if (!pointInsideBounds(point, bounds, 12)) return false;

  if (element.type === "stroke") {
    const tolerance = Math.max(element.width, 12);
    for (let index = 1; index < element.points.length; index++) {
      if (
        distanceToSegment(
          point,
          element.points[index - 1],
          element.points[index],
        ) <= tolerance
      ) {
        return true;
      }
    }
    return (
      element.points.length === 1 &&
      Math.hypot(
        point.x - element.points[0].x,
        point.y - element.points[0].y,
      ) <= tolerance
    );
  }
  return true;
}

export function translateElement(
  element: WhiteboardElement,
  dx: number,
  dy: number,
): WhiteboardElement {
  if (element.type === "stroke") {
    return {
      ...element,
      points: element.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
    };
  }
  if ("start" in element && "end" in element) {
    return {
      ...element,
      start: { x: element.start.x + dx, y: element.start.y + dy },
      end: { x: element.end.x + dx, y: element.end.y + dy },
    };
  }
  return { ...element, x: element.x + dx, y: element.y + dy };
}
