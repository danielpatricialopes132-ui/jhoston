"use client";

import React, { useState, useEffect, useRef } from "react";

export default function PopUpCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [memory, setMemory] = useState<number>(0);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isCalculated, setIsCalculated] = useState(false);

  // Focus tracking state
  const [targetInput, setTargetInput] = useState<HTMLInputElement | null>(null);
  const [targetLabel, setTargetLabel] = useState<string>("");

  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const calculatorRef = useRef<HTMLDivElement>(null);

  // Get a readable label name for the tracked input
  const getInputLabel = (input: HTMLInputElement): string => {
    if (input.placeholder) return input.placeholder;

    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label && label.textContent) {
        return label.textContent.trim().replace(/:$/, "");
      }
    }

    const parentLabel = input.closest("label");
    if (parentLabel && parentLabel.textContent) {
      // Return parent text but strip nested element texts if possible
      return parentLabel.textContent.trim().replace(/:$/, "");
    }

    const ariaLabel = input.getAttribute("aria-label");
    if (ariaLabel) return ariaLabel;

    if (input.name) return input.name;
    if (input.id) return input.id;

    return "Campo " + (input.type === "number" ? "Numérico" : "Texto");
  };

  // Global listener for focus tracking
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === "INPUT") {
        const input = target as HTMLInputElement;

        // Skip inputs that are inside the calculator itself
        if (calculatorRef.current && calculatorRef.current.contains(input)) {
          return;
        }

        // We target number inputs, or text inputs that accept numbers (excluding search/checkbox/etc)
        const nonNumericTypes = ["checkbox", "radio", "submit", "button", "hidden", "file", "image", "reset"];
        if (!nonNumericTypes.includes(input.type)) {
          setTargetInput(input);
          setTargetLabel(getInputLabel(input));
        }
      }
    };

    document.addEventListener("focusin", handleFocusIn);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, []);

  // Global listener for keyboard shortcuts (F8 toggle, Ctrl+Enter transfer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F8: Toggle calculator visibility
      if (e.key === "F8") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }

      // Ctrl + Enter: Transfer result to input if calculator is open
      if (e.ctrlKey && e.key === "Enter") {
        if (isOpen) {
          e.preventDefault();
          handleTransfer();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, display]);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest(".display-container")) return; // Don't drag when clicking buttons/display

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // Safe arithmetic evaluator
  const evaluateExpression = (expr: string): number => {
    // Sanitize to only permit numbers, decimal point, operators and spaces
    const sanitized = expr.replace(/[^0-9+\-*/. ]/g, "");
    try {
      // Safe evaluation using Function constructor
      // eslint-disable-next-line no-new-func
      const fn = new Function(`return (${sanitized})`);
      const result = fn();
      if (typeof result !== "number" || isNaN(result) || !isFinite(result)) {
        return 0;
      }
      return result;
    } catch {
      return 0;
    }
  };

  // Calculator Logic
  const handleDigit = (digit: string) => {
    if (display === "0" || isCalculated) {
      setDisplay(digit);
      setIsCalculated(false);
    } else {
      setDisplay((prev) => prev + digit);
    }
  };

  const handleDecimal = () => {
    if (isCalculated) {
      setDisplay("0.");
      setIsCalculated(false);
      return;
    }
    // Only allow one decimal point per current number segment
    const parts = display.split(/[\+\-\*\/]/);
    const lastPart = parts[parts.length - 1];
    if (!lastPart.includes(".")) {
      setDisplay((prev) => prev + ".");
    }
  };

  const handleOperator = (op: string) => {
    setIsCalculated(false);
    // If last character is operator, replace it
    const lastChar = display.trim().slice(-1);
    if (["+", "-", "*", "/"].includes(lastChar)) {
      setDisplay((prev) => prev.trim().slice(0, -1) + " " + op + " ");
    } else {
      setDisplay((prev) => prev + " " + op + " ");
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setExpression("");
    setIsCalculated(false);
  };

  const handleBackspace = () => {
    if (isCalculated) {
      handleClear();
      return;
    }
    const trimmed = display.trim();
    if (trimmed.length <= 1 || trimmed === "0") {
      setDisplay("0");
    } else {
      // If we are deleting a space-surrounded operator, delete operator and spaces
      if (trimmed.endsWith(" ")) {
        setDisplay((prev) => prev.slice(0, -3));
      } else {
        setDisplay((prev) => prev.slice(0, -1));
      }
    }
  };

  const handleToggleSign = () => {
    try {
      const currentVal = evaluateExpression(display);
      setDisplay((currentVal * -1).toString());
      setIsCalculated(true);
    } catch {
      setDisplay("0");
    }
  };

  const handlePercent = () => {
    try {
      const currentVal = evaluateExpression(display);
      setDisplay((currentVal / 100).toString());
      setIsCalculated(true);
    } catch {
      setDisplay("0");
    }
  };

  const handleCalculate = () => {
    if (!display || isCalculated) return;
    const finalExpr = display.trim();
    const result = evaluateExpression(finalExpr);
    const resultStr = Number(result.toFixed(6)).toString(); // Remove trailing zeros from decimal format
    
    setExpression(finalExpr + " =");
    setDisplay(resultStr);
    setIsCalculated(true);

    // Save to history
    setHistory((prev) => [finalExpr + " = " + resultStr, ...prev.slice(0, 9)]);
  };

  // Memory Actions
  const handleMemoryClear = () => {
    setMemory(0);
  };

  const handleMemoryRecall = () => {
    setDisplay(memory.toString());
    setIsCalculated(true);
  };

  const handleMemoryAdd = () => {
    const val = evaluateExpression(display);
    setMemory((prev) => prev + val);
    setIsCalculated(true);
  };

  const handleMemorySubtract = () => {
    const val = evaluateExpression(display);
    setMemory((prev) => prev - val);
    setIsCalculated(true);
  };

  // Transfer the calculated value to the tracked input
  const handleTransfer = () => {
    if (!targetInput) return;

    let finalValue = display;
    try {
      // Evaluate if it's a raw formula
      const evaluated = evaluateExpression(display);
      finalValue = Number(evaluated.toFixed(6)).toString();
    } catch {}

    // Use property descriptor setter hack to trigger React state updates
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(targetInput, finalValue);
    } else {
      targetInput.value = finalValue;
    }

    // Trigger input and change events so frameworks/react registers changes
    targetInput.dispatchEvent(new Event("input", { bubbles: true }));
    targetInput.dispatchEvent(new Event("change", { bubbles: true }));

    // Flash success styling on target input
    const originalBorder = targetInput.style.borderColor;
    const originalShadow = targetInput.style.boxShadow;
    targetInput.style.borderColor = "var(--success)";
    targetInput.style.boxShadow = "0 0 8px rgba(16, 185, 129, 0.4)";
    setTimeout(() => {
      targetInput.style.borderColor = originalBorder;
      targetInput.style.boxShadow = originalShadow;
    }, 800);

    // Focus back on the input
    targetInput.focus();
  };

  if (!isOpen) {
    return (
      <>
        {/* Floating Trigger Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="calculator-trigger"
          title="Abrir Calculadora Rápida (F8)"
          aria-label="Abrir Calculadora Rápida"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <line x1="8" y1="6" x2="16" y2="6" />
            <line x1="16" y1="14" x2="16" y2="18" />
            <path d="M16 10h.01" />
            <path d="M12 10h.01" />
            <path d="M8 10h.01" />
            <path d="M12 14h.01" />
            <path d="M8 14h.01" />
            <path d="M12 18h.01" />
            <path d="M8 18h.01" />
          </svg>
        </button>

        <style jsx global>{`
          .calculator-trigger {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 54px;
            height: 54px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9998;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .calculator-trigger:hover {
            transform: scale(1.08) translateY(-2px);
            box-shadow: 0 6px 20px rgba(2, 132, 199, 0.6);
          }
          .calculator-trigger:active {
            transform: scale(0.95);
          }
        `}</style>
      </>
    );
  }

  return (
    <div
      ref={calculatorRef}
      className="popup-calculator"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      {/* Header */}
      <div className="calc-header" onMouseDown={handleMouseDown}>
        <div className="calc-title">
          <span style={{ fontSize: "16px" }}>📐</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-heading)" }}>
              Calculadora Rápida
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "1px" }}>
              Arraste para mover • F8 fechar
            </div>
          </div>
        </div>
        <div className="calc-header-actions">
          <button
            onClick={() => setShowHistory((prev) => !prev)}
            className={`btn-icon ${showHistory ? "active" : ""}`}
            title="Histórico"
          >
            🕒
          </button>
          <button onClick={() => setIsOpen(false)} className="btn-icon close-btn" title="Fechar">
            ✕
          </button>
        </div>
      </div>

      {/* Target Input Status bar */}
      <div className={`calc-target-bar ${targetInput ? "has-target" : ""}`}>
        <span style={{ marginRight: "4px" }}>🎯</span>
        <span className="target-label" title={targetLabel || "Clique em um campo numérico"}>
          {targetInput
            ? `Enviar para: ${targetLabel}`
            : "Nenhum campo selecionado (clique em um campo)"}
        </span>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="calc-history-panel">
          <div className="history-header">
            <span>Histórico</span>
            <button onClick={() => setHistory([])} style={{ fontSize: "10px", color: "var(--error)", background: "none", border: "none", cursor: "pointer" }}>
              Limpar
            </button>
          </div>
          <div className="history-list">
            {history.length === 0 ? (
              <div className="history-empty">Nenhum cálculo recente</div>
            ) : (
              history.map((item, idx) => (
                <div
                  key={idx}
                  className="history-item"
                  onClick={() => {
                    const resultPart = item.split("=")[1]?.trim();
                    if (resultPart) {
                      setDisplay(resultPart);
                      setIsCalculated(true);
                    }
                  }}
                  title="Clique para usar este resultado"
                >
                  {item}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Display Screen */}
      <div className="display-container">
        <div className="calc-expr-screen">{expression || "\u00A0"}</div>
        <div className="calc-display-screen">{display}</div>
      </div>

      {/* Keypad Grid */}
      <div className="calc-keypad">
        {/* Memory Row */}
        <button onClick={handleMemoryClear} className="btn-key btn-memory" title="Memory Clear">MC</button>
        <button onClick={handleMemoryRecall} className="btn-key btn-memory" title="Memory Recall">MR</button>
        <button onClick={handleMemoryAdd} className="btn-key btn-memory" title="Memory Add">M+</button>
        <button onClick={handleMemorySubtract} className="btn-key btn-memory" title="Memory Subtract">M-</button>

        {/* Math Functions Row */}
        <button onClick={handleClear} className="btn-key btn-fn" style={{ color: "var(--error)" }}>C</button>
        <button onClick={handleToggleSign} className="btn-key btn-fn">+/-</button>
        <button onClick={handlePercent} className="btn-key btn-fn">%</button>
        <button onClick={handleBackspace} className="btn-key btn-fn" title="Apagar último">⌫</button>

        {/* Main Grid */}
        <button onClick={() => handleDigit("7")} className="btn-key btn-num">7</button>
        <button onClick={() => handleDigit("8")} className="btn-key btn-num">8</button>
        <button onClick={() => handleDigit("9")} className="btn-key btn-num">9</button>
        <button onClick={() => handleOperator("/")} className="btn-key btn-op">÷</button>

        <button onClick={() => handleDigit("4")} className="btn-key btn-num">4</button>
        <button onClick={() => handleDigit("5")} className="btn-key btn-num">5</button>
        <button onClick={() => handleDigit("6")} className="btn-key btn-num">6</button>
        <button onClick={() => handleOperator("*")} className="btn-key btn-op">×</button>

        <button onClick={() => handleDigit("1")} className="btn-key btn-num">1</button>
        <button onClick={() => handleDigit("2")} className="btn-key btn-num">2</button>
        <button onClick={() => handleDigit("3")} className="btn-key btn-num">3</button>
        <button onClick={() => handleOperator("-")} className="btn-key btn-op">-</button>

        <button onClick={() => handleDigit("0")} className="btn-key btn-num">0</button>
        <button onClick={handleDecimal} className="btn-key btn-num">.</button>
        <button onClick={handleCalculate} className="btn-key btn-eval">=</button>
        <button onClick={() => handleOperator("+")} className="btn-key btn-op">+</button>
      </div>

      {/* Transfer Action Row */}
      <div className="calc-action-row">
        <button
          onClick={handleTransfer}
          disabled={!targetInput}
          className="btn-transfer-action"
          title="Transferir valor para o campo focado (Ctrl + Enter)"
        >
          <span>📥 Inserir no Campo</span>
          {targetInput && <span className="shortcut-badge">Ctrl+Enter</span>}
        </button>
      </div>

      {/* Embedded styles for beautiful look and glassmorphism */}
      <style jsx>{`
        .popup-calculator {
          position: fixed;
          bottom: 90px;
          right: 24px;
          width: 320px;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          user-select: none;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .calc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(241, 245, 249, 0.5);
          border-bottom: 1px solid var(--border-color);
          cursor: grab;
        }
        .calc-header:active {
          cursor: grabbing;
        }

        .calc-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .calc-header-actions {
          display: flex;
          gap: 6px;
        }

        .btn-icon {
          background: transparent;
          border: none;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 12px;
          color: var(--text-muted);
          transition: var(--transition);
        }
        .btn-icon:hover {
          background: rgba(0, 0, 0, 0.05);
          color: var(--text-heading);
        }
        .btn-icon.active {
          background: rgba(2, 132, 199, 0.1);
          color: var(--primary);
        }
        .close-btn:hover {
          background: var(--error-bg);
          color: var(--error);
        }

        .calc-target-bar {
          padding: 8px 16px;
          background: rgba(248, 250, 252, 0.8);
          border-bottom: 1px solid var(--border-color);
          font-size: 11px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .calc-target-bar.has-target {
          background: var(--info-bg);
          color: var(--info);
        }
        .target-label {
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 500;
        }

        .calc-history-panel {
          position: absolute;
          top: 85px;
          left: 0;
          right: 0;
          height: 190px;
          background: rgba(255, 255, 255, 0.98);
          border-bottom: 1px solid var(--border-color);
          z-index: 10;
          display: flex;
          flex-direction: column;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          padding: 8px 16px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          background: var(--bg-main);
          border-bottom: 1px solid var(--border-color);
        }

        .history-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px 0;
        }

        .history-empty {
          text-align: center;
          color: var(--text-muted);
          font-size: 12px;
          padding: 24px;
        }

        .history-item {
          padding: 8px 16px;
          font-size: 13px;
          color: var(--text-main);
          cursor: pointer;
          transition: var(--transition);
          text-align: right;
          border-bottom: 1px dashed rgba(0,0,0,0.04);
        }
        .history-item:hover {
          background: rgba(2, 132, 199, 0.05);
          color: var(--primary);
        }

        .display-container {
          padding: 16px;
          background: rgba(15, 23, 42, 0.03);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: center;
        }

        .calc-expr-screen {
          font-size: 12px;
          color: var(--text-muted);
          min-height: 18px;
          word-break: break-all;
          text-align: right;
          font-family: monospace;
        }

        .calc-display-screen {
          font-size: 28px;
          font-weight: 500;
          color: var(--text-heading);
          word-break: break-all;
          text-align: right;
          font-family: monospace;
          margin-top: 4px;
          width: 100%;
          overflow-x: auto;
        }

        .calc-keypad {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          padding: 12px;
          background: rgba(248, 250, 252, 0.3);
        }

        .btn-key {
          border: 1px solid rgba(0,0,0,0.03);
          height: 38px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          background: white;
          color: var(--text-main);
          box-shadow: var(--shadow-sm);
          transition: all 0.1s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-key:hover {
          background: #f1f5f9;
          transform: translateY(-1px);
        }

        .btn-key:active {
          transform: translateY(1px);
        }

        .btn-memory {
          font-size: 11px;
          font-weight: 600;
          color: var(--primary);
          background: rgba(2, 132, 199, 0.03);
        }

        .btn-num {
          font-weight: 600;
        }

        .btn-fn {
          background: #f8fafc;
          font-weight: 600;
        }

        .btn-op {
          background: rgba(13, 148, 136, 0.05);
          color: var(--secondary);
          font-size: 16px;
          font-weight: 600;
        }
        .btn-op:hover {
          background: rgba(13, 148, 136, 0.1);
        }

        .btn-eval {
          background: var(--secondary);
          color: white;
          font-size: 16px;
          font-weight: 600;
        }
        .btn-eval:hover {
          background: var(--secondary-hover);
        }

        .calc-action-row {
          padding: 0 12px 12px 12px;
          background: rgba(248, 250, 252, 0.3);
        }

        .btn-transfer-action {
          width: 100%;
          height: 40px;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          color: white;
          border: none;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 10px rgba(2, 132, 199, 0.2);
          transition: all 0.2s ease;
        }

        .btn-transfer-action:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(2, 132, 199, 0.3);
          filter: brightness(1.05);
        }

        .btn-transfer-action:active:not(:disabled) {
          transform: translateY(1px);
        }

        .btn-transfer-action:disabled {
          background: var(--border-color);
          color: var(--text-muted);
          box-shadow: none;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .shortcut-badge {
          font-size: 9px;
          background: rgba(255,255,255,0.25);
          padding: 2px 6px;
          border-radius: 4px;
          color: white;
        }
      `}</style>
    </div>
  );
}
