// Formula validation utility for data manipulation
// Provides basic math expression validation and variable extraction

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  detectedVariables: string[];
}

// Simple formula validator - checks basic syntax and extracts variables
export const validateFormula = (
  expression: string, 
  availableVariables: string[]
): ValidationResult => {
  if (!expression.trim()) {
    return {
      isValid: false,
      errorMessage: "Formula cannot be empty",
      detectedVariables: []
    };
  }

  // Remove whitespace for processing
  const cleanExpression = expression.replace(/\s+/g, '');

  // Check for basic syntax issues
  const syntaxChecks = [
    { pattern: /[^\w+\-*/().]/g, message: "Invalid characters detected" },
    { pattern: /[+\-*/]{2,}/g, message: "Consecutive operators not allowed" },
    { pattern: /[+\-*/]$/g, message: "Formula cannot end with an operator" },
    { pattern: /^[+*/]/g, message: "Formula cannot start with *, /, or +" },
  ];

  for (const check of syntaxChecks) {
    if (check.pattern.test(cleanExpression)) {
      return {
        isValid: false,
        errorMessage: check.message,
        detectedVariables: []
      };
    }
  }

  // Check for balanced parentheses
  let openParens = 0;
  for (const char of cleanExpression) {
    if (char === '(') openParens++;
    if (char === ')') openParens--;
    if (openParens < 0) {
      return {
        isValid: false,
        errorMessage: "Mismatched parentheses",
        detectedVariables: []
      };
    }
  }
  
  if (openParens !== 0) {
    return {
      isValid: false,
      errorMessage: "Unbalanced parentheses",
      detectedVariables: []
    };
  }

  // Extract variable names (sequences of word characters)
  const variableMatches = cleanExpression.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
  const detectedVariables = Array.from(new Set(variableMatches)); // Remove duplicates

  // Check if all variables are available
  const unavailableVars = detectedVariables.filter(
    variable => !availableVariables.includes(variable)
  );

  if (unavailableVars.length > 0) {
    return {
      isValid: false,
      errorMessage: `Unknown variables: ${unavailableVars.join(', ')}`,
      detectedVariables
    };
  }

  // Check that we have at least one variable
  if (detectedVariables.length === 0) {
    return {
      isValid: false,
      errorMessage: "Formula must contain at least one series variable",
      detectedVariables: []
    };
  }

  return {
    isValid: true,
    detectedVariables
  };
};

// Generate example formulas for help text
export const getExampleFormulas = (availableVariables: string[]): string[] => {
  if (availableVariables.length === 0) return [];
  
  const examples = [];
  const first = availableVariables[0];
  const second = availableVariables[1] || first;
  
  examples.push(`${first} * 100`);
  examples.push(`(${first} + ${second}) / 2`);
  
  if (availableVariables.length >= 3) {
    const third = availableVariables[2];
    examples.push(`(${first} + ${second}) / ${third}`);
  }
  
  return examples;
}; 