(function exposeUtilities(root, factory) {
  const utilities = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = utilities;
  }

  root.MermaidHelperUtils = utilities;
})(typeof window !== 'undefined' ? window : globalThis, function createUtilities() {
  function stripCodeFence(source) {
    const trimmed = String(source || '').trim();
    const match = trimmed.match(/^```\s*(?:mermaid)?\s*([\s\S]*?)\s*```$/i);
    return match ? match[1].trim() : trimmed;
  }

  function clampNumber(value, min, max, fallback) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.min(max, Math.max(min, parsed));
  }

  function prepareSourceForPngExport(source) {
    return String(source || '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/?[^>]+>/g, '');
  }

  return {
    clampNumber,
    prepareSourceForPngExport,
    stripCodeFence
  };
});
