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

  function ensureMermaidCodeFence(source) {
    const trimmed = String(source || '').trim();

    if (!trimmed) {
      return '';
    }

    if (/^```\s*(?:mermaid)?\s*[\s\S]*?```$/i.test(trimmed)) {
      return trimmed;
    }

    return `\`\`\`mermaid\n${trimmed}\n\`\`\``;
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

  function bytesToBase64(bytes) {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(bytes).toString('base64');
    }

    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  function base64ToBytes(base64Text) {
    if (typeof Buffer !== 'undefined') {
      return Uint8Array.from(Buffer.from(base64Text, 'base64'));
    }

    const binary = atob(base64Text);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }

  function encodeMermaidSourceForUrl(source) {
    const bytes = new TextEncoder().encode(String(source || ''));
    return bytesToBase64(bytes)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  function decodeMermaidSourceFromUrl(encodedSource) {
    try {
      const rawValue = String(encodedSource || '').trim();
      const normalized = rawValue
        .replace(/\s/g, '+')
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

      if (!rawValue || /[^A-Za-z0-9+/=]/.test(padded) || padded.length % 4 !== 0) {
        throw new Error('Invalid base64 Mermaid source.');
      }

      const decoder = new TextDecoder('utf-8', { fatal: true });
      return {
        ok: true,
        source: decoder.decode(base64ToBytes(padded))
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Shared diagram link could not be decoded. Check the mmd URL value and try again.'
      };
    }
  }

  return {
    decodeMermaidSourceFromUrl,
    ensureMermaidCodeFence,
    encodeMermaidSourceForUrl,
    createPngExportSource,
    createSvgDownloadBlob,
    clampNumber,
    PNG_DOWNLOAD,
    prepareSourceForPngExport,
    SVG_DOWNLOAD,
    stripCodeFence
  };
});
