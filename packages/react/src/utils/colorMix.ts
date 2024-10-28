function getParsedColor(input: unknown) {
  if (typeof input !== 'string') {
    return null;
  }

  const color = input.trim();
  const lastCommaIndex = color.lastIndexOf(',');

  if (lastCommaIndex === -1) {
    return null;
  }

  const rawPayload = color.slice(lastCommaIndex + 1).trim();
  const payload = rawPayload.endsWith('%')
    ? Number(rawPayload.slice(0, -1)) / 100
    : Number(color.slice(lastCommaIndex + 1));

  if (Number.isNaN(payload)) {
    return null;
  }

  return {
    color: color.slice(0, lastCommaIndex).trim(),
    payload: Math.max(0, Math.min(1, payload)),
  };
}

function alpha(input: string) {
  const parsed = getParsedColor(input);

  if (!parsed) {
    return input;
  }

  if (parsed.payload === 1) {
    return parsed.color;
  }

  if (parsed.payload === 0) {
    return 'transparent';
  }

  const mixPercentage = (1 - parsed.payload) * 100;

  return `color-mix(in srgb, ${parsed.color}, transparent ${mixPercentage}%)`;
}

function lighten(input: string) {
  const parsed = getParsedColor(input);

  if (!parsed) {
    return input;
  }

  return `color-mix(in srgb, ${parsed.color}, white ${parsed.payload * 100}%)`;
}

function darken(input: string) {
  const parsed = getParsedColor(input);

  if (!parsed) {
    return input;
  }

  return `color-mix(in srgb, ${parsed.color}, black ${parsed.payload * 100}%)`;
}

export { alpha, lighten, darken };
