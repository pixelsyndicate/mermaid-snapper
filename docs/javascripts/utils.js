(function exposeUtilities(root, factory) {
  const utilities = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = utilities;
  }

  root.MermaidHelperUtils = utilities;
})(typeof window !== 'undefined' ? window : globalThis, function createUtilities() {
  const SVG_DOWNLOAD = {
    filename: 'mermaid-diagram.svg',
    mimeType: 'image/svg+xml;charset=utf-8'
  };
  const PNG_DOWNLOAD = {
    filename: 'mermaid-diagram.png',
    mimeType: 'image/png'
  };

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

  function createPngExportSource(source) {
    return prepareSourceForPngExport(stripCodeFence(source));
  }

  function createSvgDownloadBlob(svgText) {
    return new Blob([String(svgText || '')], { type: SVG_DOWNLOAD.mimeType });
  }

  return {
    createPngExportSource,
    createSvgDownloadBlob,
    clampNumber,
    PNG_DOWNLOAD,
    prepareSourceForPngExport,
    SVG_DOWNLOAD,
    stripCodeFence
  };
});
