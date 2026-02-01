import p5 from "p5";

type TurtleOptions = {
  step: number;
  angleDeg: number;
  startX?: number;
  startY?: number;
  startAngleDeg?: number;
};

const expandLSystem = (
  axiom: string,
  rules: Map<string, string>,
  iterations: number,
) => {
  let current = axiom;
  for (let i = 0; i < iterations; i += 1) {
    let next = "";
    for (const symbol of current) {
      next += rules.get(symbol) ?? symbol;
    }
    current = next;
  }
  return current;
};

export const drawLSystem = (
  p: p5,
  axiom: string,
  rules: Map<string, string>,
  iterations: number,
  options: TurtleOptions,
) => {
  const turtleCommands = new Set(["F", "f", "+", "-"]);
  const { step, angleDeg, startX, startY, startAngleDeg } = options;
  const program = expandLSystem(axiom, rules, Math.max(0, iterations));
  const filteredProgram = Array.from(program).filter((command) =>
    turtleCommands.has(command),
  );

  const originX = startX ?? 0;
  const originY = startY ?? 0;
  const angleStep = p.radians(angleDeg);

  const getBounds = () => {
    let x = originX;
    let y = originY;
    let angle = p.radians(startAngleDeg ?? -90);
    let minX = x;
    let maxX = x;
    let minY = y;
    let maxY = y;

    for (const command of filteredProgram) {
      switch (command) {
        case "F":
        case "f": {
          x += step * Math.cos(angle);
          y += step * Math.sin(angle);
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          break;
        }
        case "+": {
          angle += angleStep;
          break;
        }
        case "-": {
          angle -= angleStep;
          break;
        }
        default:
          break;
      }
    }

    return { minX, maxX, minY, maxY };
  };

  const { minX, maxX, minY, maxY } = getBounds();
  const boundsWidth = Math.max(1, maxX - minX);
  const boundsHeight = Math.max(1, maxY - minY);
  const padding = 20;
  const scale = Math.min(
    (p.width - padding * 2) / boundsWidth,
    (p.height - padding * 2) / boundsHeight,
  );
  const safeScale = Number.isFinite(scale) ? Math.max(0.01, scale) : 1;
  const boundsCenterX = (minX + maxX) / 2;
  const boundsCenterY = (minY + maxY) / 2;

  p.push();
  p.translate(p.width / 2, p.height / 2);
  p.scale(safeScale);
  p.translate(-boundsCenterX, -boundsCenterY);
  p.stroke(32);
  p.noFill();
  p.strokeWeight(Math.max(0.5, 1 / safeScale));

  let x = originX;
  let y = originY;
  let angle = p.radians(startAngleDeg ?? -90);
  for (const command of filteredProgram) {
    switch (command) {
      case "F": {
        const nextX = x + step * Math.cos(angle);
        const nextY = y + step * Math.sin(angle);
        p.line(x, y, nextX, nextY);
        x = nextX;
        y = nextY;
        break;
      }
      case "f": {
        x += step * Math.cos(angle);
        y += step * Math.sin(angle);
        break;
      }
      case "+": {
        angle += angleStep;
        break;
      }
      case "-": {
        angle -= angleStep;
        break;
      }
      default:
        break;
    }
  }

  p.pop();
};
