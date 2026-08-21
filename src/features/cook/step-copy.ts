export interface CookStepCopy {
  title: string;
  description: string;
}

function sentenceCase(value: string) {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;
}

export function cookStepCopy(instruction: string): CookStepCopy {
  const [opening, ...rest] = instruction.split(/,\s*/);
  if (!rest.length) {
    const conciseOpening = opening.split(/\s+(?:into|in|until|with|over|for)\s+/i)[0];
    const title = conciseOpening.split(/\s+/).length <= 7
      ? conciseOpening.replace(/[.!?]+$/, "")
      : "Focus on this step";
    return { title, description: instruction };
  }
  if (opening.split(/\s+/).length > 7) {
    return { title: "Focus on this step", description: instruction };
  }

  const description = sentenceCase(rest.join(", "));
  return {
    title: opening.replace(/[.!?]+$/, ""),
    description: /[.!?]$/.test(description) ? description : `${description}.`,
  };
}
