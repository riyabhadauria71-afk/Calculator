// ── DOM references ──────────────────────────────────────────
const valEl  = document.getElementById('val');
const exprEl = document.getElementById('expr');

// ── State ────────────────────────────────────────────────────
let currentValue  = '0';   // number currently on screen
let previousValue = null;  // left-hand operand
let operator      = null;  // pending operator
let justEvaluated = false; // true right after pressing =

// ── Helpers ──────────────────────────────────────────────────

/**
 * Format a number cleanly (removes floating-point noise).
 * Falls back to exponential notation for very large/small values.
 */
function format(n) {
  const s = parseFloat(n.toPrecision(12)).toString();
  return s.includes('e') ? n.toExponential(6) : s;
}

/** Update the main display value. */
function updateDisplay() {
  valEl.textContent = currentValue;
  valEl.className   = currentValue === 'Error' ? 'val error' : 'val';
}

/** Update the small expression line above the value. */
function updateExpr(text) {
  exprEl.textContent = text;
}

/** Return the display symbol for an operator. */
function opSymbol(op) {
  const map = { '/': '÷', '*': '×', '-': '−', '+': '+' };
  return map[op] || op;
}

// ── Core calculation ─────────────────────────────────────────

/** Perform the pending calculation and update state. */
function compute() {
  const a = parseFloat(previousValue);
  const b = parseFloat(currentValue);

  if (isNaN(a) || isNaN(b)) return;

  // Guard: division by zero
  if (operator === '/' && b === 0) {
    currentValue = 'Error';
    updateDisplay();
    updateExpr('');
    return;
  }

  let result;
  if      (operator === '+') result = a + b;
  else if (operator === '-') result = a - b;
  else if (operator === '*') result = a * b;
  else if (operator === '/') result = a / b;

  updateExpr(format(a) + ' ' + opSymbol(operator) + ' ' + format(b) + ' =');

  currentValue  = format(result);
  previousValue = null;
  operator      = null;
  justEvaluated = true;

  updateDisplay();
}

// ── Button handler ───────────────────────────────────────────

document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const num    = btn.dataset.num;
    const action = btn.dataset.action;
    const op     = btn.dataset.op;

    // ── Digit pressed ──
    if (num !== undefined) {
      if (currentValue === '0' || justEvaluated) {
        currentValue  = num;
        justEvaluated = false;
      } else if (currentValue.length < 15) {
        currentValue += num;
      }
      updateDisplay();
      if (!operator) updateExpr('');

    // ── Operator pressed ──
    } else if (op) {
      if (operator && !justEvaluated) compute();   // chain operators
      previousValue = currentValue;
      operator      = op;
      justEvaluated = false;
      updateExpr(format(parseFloat(currentValue)) + ' ' + opSymbol(op));
      currentValue = '0';
      updateDisplay();

    // ── Action buttons ──
    } else if (action === 'clear') {
      currentValue  = '0';
      previousValue = null;
      operator      = null;
      justEvaluated = false;
      updateExpr('');
      updateDisplay();

    } else if (action === 'dot') {
      if (justEvaluated) { currentValue = '0'; justEvaluated = false; }
      if (!currentValue.includes('.')) currentValue += '.';
      updateDisplay();

    } else if (action === 'sign') {
      if (currentValue !== '0' && currentValue !== 'Error') {
        currentValue = String(parseFloat(currentValue) * -1);
        updateDisplay();
      }

    } else if (action === 'percent') {
      if (currentValue !== 'Error') {
        currentValue = String(parseFloat(currentValue) / 100);
        updateDisplay();
      }

    } else if (action === 'eq') {
      if (operator && previousValue !== null) compute();
    }
  });
});

// ── Keyboard support ─────────────────────────────────────────

document.addEventListener('keydown', e => {
  const keyMap = {
    '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
    '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
    '+': '+', '-': '-', '*': '*', '/': '/',
    'Enter': 'eq', '=': 'eq',
    'Backspace': 'back',
    '.': '.',
    'Escape': 'clear',
    '%': 'percent'
  };

  const mapped = keyMap[e.key];
  if (!mapped) return;
  e.preventDefault();

  // Backspace: delete last digit
  if (mapped === 'back') {
    if (currentValue.length > 1 && !justEvaluated) {
      currentValue = currentValue.slice(0, -1);
    } else {
      currentValue = '0';
    }
    updateDisplay();
    return;
  }

  // Find and click the matching button
  const selector =
    mapped === 'eq'      ? '[data-action="eq"]'      :
    mapped === 'clear'   ? '[data-action="clear"]'   :
    mapped === '.'       ? '[data-action="dot"]'     :
    mapped === 'percent' ? '[data-action="percent"]' :
    `[data-num="${mapped}"], [data-op="${mapped}"]`;

  const target = document.querySelector(selector);
  if (target) target.click();
});
