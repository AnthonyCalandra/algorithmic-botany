import p5 from "p5";
import "./styles.css";
import { drawLSystem } from "./turtle";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("Missing #app root element.");
}

app.innerHTML = `
  <div class="shell">
    <header class="header">
      <h1>Algorithmic Botany</h1>
      <p>p5.js canvas + TypeScript + vanilla DOM</p>
    </header>
    <section class="content">
      <aside class="panel">
        <h2>Controls</h2>
        <label>
          Iterations
          <input id="iterations-input" type="number" min="0" max="10" value="4" />
        </label>
        <label>
          L-system
          <input
            id="axiom-input"
            type="text"
            value="F+F+F"
            placeholder="Enter L-system string"
          />
        </label>
        <div class="rules">
          <div class="rules-header">
            <h3>Rules</h3>
            <button id="add-rule-btn" type="button" class="secondary-button">
              Add rule
            </button>
          </div>
          <div id="rules-list" class="rules-list"></div>
        </div>
        <button id="render-btn" type="button">Render</button>
        <p class="note">L-system logic will plug in here.</p>
      </aside>
      <div class="stage">
        <div id="canvas-root" class="canvas-root"></div>
      </div>
    </section>
  </div>
`;

const canvasRoot = document.querySelector<HTMLDivElement>("#canvas-root");
if (!canvasRoot) {
  throw new Error("Missing #canvas-root element.");
}

const sketch = (p: p5) => {
  p.setup = () => {
    const canvas = p.createCanvas(
      canvasRoot.clientWidth,
      canvasRoot.clientHeight,
    );
    canvas.parent(canvasRoot);
    p.pixelDensity(2);
    p.noLoop();
    p.clear();
  };

  p.windowResized = () => {
    p.resizeCanvas(canvasRoot.clientWidth, canvasRoot.clientHeight);
    p.clear();
  };
};

const instance = new p5(sketch);

const rulesList = document.querySelector<HTMLDivElement>("#rules-list");
if (!rulesList) {
  throw new Error("Missing #rules-list element.");
}

const addRuleButton = document.querySelector<HTMLButtonElement>("#add-rule-btn");
if (!addRuleButton) {
  throw new Error("Missing #add-rule-btn element.");
}

const iterationsInput =
  document.querySelector<HTMLInputElement>("#iterations-input");
if (!iterationsInput) {
  throw new Error("Missing #iterations-input element.");
}

const axiomInput = document.querySelector<HTMLInputElement>("#axiom-input");
if (!axiomInput) {
  throw new Error("Missing #axiom-input element.");
}

const STORAGE_KEY = "algorithmic-botany-controls";

type StoredRule = {
  symbol: string;
  production: string;
};

type StoredControls = {
  iterations: number;
  axiom: string;
  rules: StoredRule[];
};

const createRuleRow = (symbolValue = "", productionValue = "") => {
  const row = document.createElement("div");
  row.className = "rule-row";
  row.innerHTML = `
    <input
      class="rule-symbol"
      type="text"
      maxlength="1"
      placeholder="F"
      value="${symbolValue}"
    />
    <span class="rule-arrow">-&gt;</span>
    <input
      class="rule-production"
      type="text"
      placeholder="Ff"
      value="${productionValue}"
    />
    <button type="button" class="rule-remove" aria-label="Remove rule">
      x
    </button>
  `;

  const removeButton = row.querySelector<HTMLButtonElement>(".rule-remove");
  removeButton?.addEventListener("click", () => {
    row.remove();
  });

  return row;
};

const restoreControls = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return false;
  }
  try {
    const parsed = JSON.parse(raw) as StoredControls;
    if (Number.isFinite(parsed.iterations)) {
      iterationsInput.value = String(parsed.iterations);
    }
    if (typeof parsed.axiom === "string") {
      axiomInput.value = parsed.axiom;
    }
    if (Array.isArray(parsed.rules) && parsed.rules.length > 0) {
      rulesList.innerHTML = "";
      parsed.rules.forEach((rule) => {
        rulesList.appendChild(
          createRuleRow(rule.symbol ?? "", rule.production ?? ""),
        );
      });
    }
    return true;
  } catch {
    return false;
  }
};

if (!restoreControls()) {
  rulesList.appendChild(createRuleRow("F", "Ff"));
  rulesList.appendChild(createRuleRow("f", "ff"));
}

addRuleButton.addEventListener("click", () => {
  rulesList.appendChild(createRuleRow());
});

const renderButton = document.querySelector<HTMLButtonElement>("#render-btn");
renderButton?.addEventListener("click", () => {
  const iterations = iterationsInput
    ? Number.parseInt(iterationsInput.value, 10)
    : 0;
  const axiom = axiomInput?.value ?? "";
  const ruleRows = rulesList.querySelectorAll<HTMLDivElement>(".rule-row");
  const rules = new Map<string, string>();
  ruleRows.forEach((row) => {
    const symbol =
      row.querySelector<HTMLInputElement>(".rule-symbol")?.value.trim() ?? "";
    const production =
      row.querySelector<HTMLInputElement>(".rule-production")?.value.trim() ??
      "";
    if (symbol.length > 0) {
      rules.set(symbol, production);
    }
  });
  const storedRules: StoredRule[] = [];
  ruleRows.forEach((row) => {
    const symbol =
      row.querySelector<HTMLInputElement>(".rule-symbol")?.value.trim() ?? "";
    const production =
      row.querySelector<HTMLInputElement>(".rule-production")?.value.trim() ??
      "";
    if (symbol.length > 0 || production.length > 0) {
      storedRules.push({ symbol, production });
    }
  });
  const payload: StoredControls = {
    iterations,
    axiom,
    rules: storedRules,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  console.log("iterations:", iterations);
  console.log("axiom:", axiom);
  console.log("rules:");
  rules.forEach((value, key) => {
    console.log(`${key} -> ${value}`);
  });
  instance.clear();
  drawLSystem(instance, axiom, rules, iterations, {
    step: 10,
    angleDeg: 90,
  });
});
