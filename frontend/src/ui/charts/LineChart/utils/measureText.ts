/**
 * Uses the Canvas API to measure the pixel width of a given text string.
 * This is a performant way to calculate text size without rendering it to the DOM.
 * @param text The text string to measure.
 * @param font The CSS font string (e.g., '12px Arial').
 * @returns The width of the text in pixels.
 */
interface MeasureText {
  (text: string, font: string): number;
  canvas?: HTMLCanvasElement;
}

export const measureText: MeasureText = (text: string, font: string): number => {
  // Re-use the same canvas element to avoid creating new ones unnecessarily.
  const canvas = measureText.canvas || (measureText.canvas = document.createElement('canvas'));
  const context = canvas.getContext('2d');
  
  if (!context) {
    // Fallback if canvas is not supported, though it's unlikely in modern browsers.
    return text.length * 8; 
  }
  
  context.font = font;
  const metrics = context.measureText(text);
  return metrics.width;
};

// Add a static property to the function to cache the canvas element.
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
    }
  }
  function __BROWSER_TOOLS_GLOBAL_HOOK__(debug: any): void;
  const __webpack_require__: any;
  const __non_webpack_require__: any;
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any;
  }
}

measureText.canvas = undefined; 