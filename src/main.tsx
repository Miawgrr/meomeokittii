import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// --- CIRCULAR REFERENCE PROTECTION ENGINE ---
function sanitizeValue(value: any): any {
  if (value === null || value === undefined) return value;
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  if (typeof value === "object") {
    try {
      const seen = new WeakSet();
      const stringified = JSON.stringify(value, (key, val) => {
        if (typeof val === "object" && val !== null) {
          if (seen.has(val)) {
            return "[Circular]";
          }
          seen.add(val);
        }
        return val;
      });
      return JSON.parse(stringified);
    } catch (e) {
      return "[Unserializable Object]";
    }
  }
  return value;
}

// Intercept console.error to sanitize circular structures
const originalConsoleError = console.error;
console.error = function (...args: any[]) {
  const safeArgs = args.map(arg => sanitizeValue(arg));
  originalConsoleError.apply(console, safeArgs);
};

// Intercept console.warn to sanitize circular structures
const originalConsoleWarn = console.warn;
console.warn = function (...args: any[]) {
  const safeArgs = args.map(arg => sanitizeValue(arg));
  originalConsoleWarn.apply(console, safeArgs);
};

// Intercept unhandled window errors
window.addEventListener("error", (event) => {
  if (event.error) {
    try {
      JSON.stringify(event.error);
    } catch (e) {
      event.preventDefault();
      const sanitized = sanitizeValue(event.error);
      const cleanError = new Error(sanitized.message || "An error occurred");
      cleanError.name = sanitized.name || "Error";
      cleanError.stack = sanitized.stack;
      setTimeout(() => {
        throw cleanError;
      }, 0);
    }
  }
}, true);

// Intercept unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  if (event.reason) {
    try {
      JSON.stringify(event.reason);
    } catch (e) {
      event.preventDefault();
      const sanitized = sanitizeValue(event.reason);
      const cleanError = new Error(sanitized.message || "Unhandled promise rejection");
      cleanError.name = sanitized.name || "UnhandledRejection";
      cleanError.stack = sanitized.stack;
      setTimeout(() => {
        throw cleanError;
      }, 0);
    }
  }
}, true);
// --------------------------------------------

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

