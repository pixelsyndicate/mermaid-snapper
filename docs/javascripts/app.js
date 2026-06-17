(function bootMermaidHelper() {
  const {
    clampNumber,
    createPngExportSource,
    createSvgDownloadBlob,
    PNG_DOWNLOAD,
    SVG_DOWNLOAD,
    stripCodeFence
  } = window.MermaidHelperUtils;
  const samples = window.MermaidHelperSamples;
  const storageKeys = {
    source: 'mermaid-helper-source',
    theme: 'mermaid-helper-theme',
    look: 'mermaid-helper-look',
    width: 'mermaid-helper-width',
    scale: 'mermaid-helper-scale',
    background: 'mermaid-helper-background',
    split: 'mermaid-helper-split',
    stackedSplit: 'mermaid-helper-stacked-split'
  };

  const mainEl = document.querySelector('main');
  const sourceEl = document.getElementById('source');
  const sampleSelect = document.getElementById('sampleSelect');
  const themeSelect = document.getElementById('themeSelect');
  const lookSelect = document.getElementById('lookSelect');
  const widthInput = document.getElementById('widthInput');
  const scaleInput = document.getElementById('scaleInput');
  const bgInput = document.getElementById('bgInput');
  const splitter = document.getElementById('splitter');
  const captureArea = document.getElementById('captureArea');
  const diagramEl = document.getElementById('diagram');
  const errorEl = document.getElementById('error');
  const statusEl = document.getElementById('status');
  const pngButton = document.getElementById('downloadPngBtn');

  let currentSvgText = '';
  let renderCount = 0;
  let splitPercent = 42;
  let stackedEditorHeight = 340;
  let isDraggingSplit = false;
  let isExportingPng = false;
  let lastRenderedStatus = '';
  let pngExportSupport = {
    checked: false,
    supported: true,
    reason: ''
  };

  function applyPreviewSettings() {
    const width = clampNumber(widthInput.value, 360, 2400, 960);
    const scale = clampNumber(scaleInput.value, 40, 500, 100);
    const scaleFactor = scale / 100;

    widthInput.value = width;
    scaleInput.value = scale;
    captureArea.style.width = `${width}px`;
    captureArea.style.backgroundColor = bgInput.value || '#ffffff';
    captureArea.style.transform = `scale(${scaleFactor})`;
    captureArea.style.marginRight = scaleFactor <= 1 ? '0' : `${width * (scaleFactor - 1)}px`;
    captureArea.style.marginBottom = scaleFactor <= 1 ? '0' : `${captureArea.offsetHeight * (scaleFactor - 1)}px`;
  }

  function applySplit(percent) {
    splitPercent = clampNumber(percent, 25, 75, 42);
    mainEl.style.setProperty('--editor-width', `${splitPercent}%`);
    splitter.setAttribute('aria-valuenow', String(Math.round(splitPercent)));
  }

  function applyStackedSplit(height) {
    stackedEditorHeight = clampNumber(height, 280, 640, 340);
    mainEl.style.setProperty('--stacked-editor-height', `${stackedEditorHeight}px`);
    splitter.setAttribute('aria-valuenow', String(Math.round(stackedEditorHeight)));
  }

  function isStackedLayout() {
    return window.matchMedia('(max-width: 991.98px)').matches;
  }

  function updateSplitFromClientX(clientX) {
    const rect = mainEl.getBoundingClientRect();
    const nextPercent = ((clientX - rect.left) / rect.width) * 100;
    applySplit(nextPercent);
  }

  function updateSplitFromClientY(clientY) {
    const editorTop = document.querySelector('.editor-panel').getBoundingClientRect().top;
    applyStackedSplit(clientY - editorTop);
  }

  function updateSplitterAccessibility() {
    if (isStackedLayout()) {
      splitter.setAttribute('aria-label', 'Resize editor and preview rows');
      splitter.setAttribute('aria-orientation', 'horizontal');
      splitter.setAttribute('aria-valuemin', '280');
      splitter.setAttribute('aria-valuemax', '640');
      splitter.setAttribute('aria-valuenow', String(Math.round(stackedEditorHeight)));
    } else {
      splitter.setAttribute('aria-label', 'Resize editor and preview panes');
      splitter.setAttribute('aria-orientation', 'vertical');
      splitter.setAttribute('aria-valuemin', '25');
      splitter.setAttribute('aria-valuemax', '75');
      splitter.setAttribute('aria-valuenow', String(Math.round(splitPercent)));
    }
  }

  function setError(message) {
    errorEl.style.display = message ? 'block' : 'none';
    errorEl.textContent = message || '';
  }

  function setStatus(message) {
    statusEl.textContent = message;
  }

  function getPngBlockedMessage() {
    return 'PNG export disabled: this browser taints the canvas after drawing the generated SVG image, so toDataURL is blocked for security.';
  }

  function isTaintedCanvasError(error) {
    const message = error && error.message ? error.message : String(error || '');
    return /tainted canvases|may not be exported|toDataURL|SecurityError/i.test(message);
  }

  function setPngExportSupport(supported, reason) {
    pngExportSupport = {
      checked: true,
      supported,
      reason: reason || ''
    };
    pngButton.disabled = !supported || isExportingPng;
    pngButton.title = supported ? '' : pngExportSupport.reason;
    pngButton.setAttribute('aria-disabled', String(!supported || isExportingPng));
  }

  function setRenderedStatus() {
    lastRenderedStatus = `Rendered ${new Date().toLocaleTimeString()}`;
    setStatus(pngExportSupport.supported ? lastRenderedStatus : `${lastRenderedStatus}. ${pngExportSupport.reason}`);
  }

  function refreshPngBlockedStatus() {
    setStatus(lastRenderedStatus ? `${lastRenderedStatus}. ${pngExportSupport.reason}` : pngExportSupport.reason);
  }

  function persist() {
    localStorage.setItem(storageKeys.source, sourceEl.value);
    localStorage.setItem(storageKeys.theme, themeSelect.value);
    localStorage.setItem(storageKeys.look, lookSelect.value);
    localStorage.setItem(storageKeys.width, widthInput.value);
    localStorage.setItem(storageKeys.scale, scaleInput.value);
    localStorage.setItem(storageKeys.background, bgInput.value);
    localStorage.setItem(storageKeys.split, String(Math.round(splitPercent)));
    localStorage.setItem(storageKeys.stackedSplit, String(Math.round(stackedEditorHeight)));
  }

  function restore() {
    const savedSource = localStorage.getItem(storageKeys.source);
    const savedLook = localStorage.getItem(storageKeys.look);
    sourceEl.value = savedSource || samples.dashboard;
    themeSelect.value = localStorage.getItem(storageKeys.theme) || 'default';
    lookSelect.value = savedLook && savedLook !== 'default' ? savedLook : 'classic';
    widthInput.value = localStorage.getItem(storageKeys.width) || '960';
    scaleInput.value = localStorage.getItem(storageKeys.scale) || '100';
    bgInput.value = localStorage.getItem(storageKeys.background) || '#ffffff';
    sampleSelect.value = savedSource ? 'last' : 'dashboard';
    applySplit(localStorage.getItem(storageKeys.split) || 42);
    applyStackedSplit(localStorage.getItem(storageKeys.stackedSplit) || 340);
    updateSplitterAccessibility();
    applyPreviewSettings();
  }

  function getMermaidConfig(htmlLabels) {
    const config = {
      startOnLoad: false,
      securityLevel: 'loose',
      theme: themeSelect.value,
      look: lookSelect.value,
      htmlLabels,
      flowchart: {
        useMaxWidth: true
      },
      sequence: {
        useMaxWidth: true
      }
    };

    return config;
  }

  async function renderMermaid() {
    setError('');
    applyPreviewSettings();
    persist();

    const source = stripCodeFence(sourceEl.value);
    if (!source) {
      currentSvgText = '';
      diagramEl.innerHTML = '<div class="empty-state">Paste Mermaid source or choose a sample, then render.</div>';
      setStatus('No source to render');
      return;
    }

    try {
      renderCount += 1;
      mermaid.initialize(getMermaidConfig(true));
      await mermaid.parse(source);
      const result = await mermaid.render(`mermaid-render-${Date.now()}-${renderCount}`, source);
      currentSvgText = result.svg;
      diagramEl.innerHTML = result.svg;
      setRenderedStatus();
      detectPngExportSupport(source);
    } catch (error) {
      setError(error && error.message ? error.message : String(error));
      setStatus('Render failed');
    }
  }

  async function renderSvgForPngExport(source) {
    renderCount += 1;
    mermaid.initialize(getMermaidConfig(false));
    await mermaid.parse(source);
    const result = await mermaid.render(`mermaid-png-export-${Date.now()}-${renderCount}`, source);
    return result.svg;
  }

  function getSvgElement() {
    return diagramEl.querySelector('svg');
  }

  function getSerializedSvg(svgSource) {
    const sourceSvg = svgSource || getSvgElement();
    if (!sourceSvg) {
      throw new Error('No rendered SVG is available. Render a diagram first.');
    }

    const clone = typeof sourceSvg === 'string'
      ? new DOMParser().parseFromString(sourceSvg, 'image/svg+xml').documentElement
      : sourceSvg.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('style', `background: ${bgInput.value || '#ffffff'};`);
    return new XMLSerializer().serializeToString(clone);
  }

  function triggerDownload(href, filename) {
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function downloadBlob(blob, filename, revokeDelayMs = 60000) {
    const url = URL.createObjectURL(blob);
    triggerDownload(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), revokeDelayMs);
  }

  function drawSvgTextToCanvas(svgText, width, height, scale) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.fillStyle = bgInput.value || '#ffffff';
      ctx.fillRect(0, 0, width, height);

      const image = new Image();
      const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' }));
      image.onload = () => {
        try {
          ctx.drawImage(image, 0, 0, width, height);
          URL.revokeObjectURL(url);
          resolve(canvas);
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('The generated SVG could not be loaded for PNG export.'));
      };
      image.src = url;
    });
  }

  async function createPngCanvasFromSource(source) {
    const exportSvg = await renderSvgForPngExport(createPngExportSource(source));
    const svgText = getSerializedSvg(exportSvg);
    const svgDoc = new DOMParser().parseFromString(svgText, 'image/svg+xml').documentElement;
    const viewBox = svgDoc.getAttribute('viewBox');
    const viewBoxParts = viewBox ? viewBox.split(/\s+/).map(Number) : [];
    const measuredSvg = getSvgElement();
    const rect = measuredSvg ? measuredSvg.getBoundingClientRect() : { width: 960, height: 540 };
    const width = Math.max(1, Math.ceil(viewBoxParts[2] || parseFloat(svgDoc.getAttribute('width')) || rect.width));
    const height = Math.max(1, Math.ceil(viewBoxParts[3] || parseFloat(svgDoc.getAttribute('height')) || rect.height));
    return drawSvgTextToCanvas(svgText, width, height, 2);
  }

  function downloadSvg() {
    try {
      const svgText = getSerializedSvg();
      downloadBlob(createSvgDownloadBlob(svgText), SVG_DOWNLOAD.filename);
      setStatus('SVG downloaded');
    } catch (error) {
      setError(error.message);
    }
  }

  async function downloadPng() {
    if (isExportingPng || !pngExportSupport.supported) {
      if (!pngExportSupport.supported) {
        setStatus(pngExportSupport.reason);
      }
      return;
    }

    isExportingPng = true;
    pngButton.disabled = true;

    try {
      const source = stripCodeFence(sourceEl.value);
      if (!source) {
        throw new Error('No source is available. Render a diagram first.');
      }

      setError('');
      setStatus('Preparing PNG...');
      const canvas = await createPngCanvasFromSource(source);
      triggerDownload(canvas.toDataURL(PNG_DOWNLOAD.mimeType), PNG_DOWNLOAD.filename);
      setStatus('PNG downloaded');
    } catch (error) {
      setError(error.message);
      if (isTaintedCanvasError(error)) {
        setPngExportSupport(false, getPngBlockedMessage());
        refreshPngBlockedStatus();
      } else {
        setStatus('PNG export failed');
      }
    } finally {
      isExportingPng = false;
      pngButton.disabled = !pngExportSupport.supported;
      pngButton.setAttribute('aria-disabled', String(!pngExportSupport.supported));
    }
  }

  async function detectPngExportSupport(source) {
    if (!source) {
      return;
    }

    try {
      const canvas = await createPngCanvasFromSource(source);
      canvas.toDataURL(PNG_DOWNLOAD.mimeType);
      const wasUnsupported = !pngExportSupport.supported;
      setPngExportSupport(true, '');
      if (wasUnsupported && lastRenderedStatus) {
        setStatus(lastRenderedStatus);
      }
    } catch (error) {
      if (isTaintedCanvasError(error)) {
        setPngExportSupport(false, getPngBlockedMessage());
        refreshPngBlockedStatus();
      }
    }
  }

  async function copySvg() {
    try {
      const svgText = getSerializedSvg();
      await navigator.clipboard.writeText(svgText);
      setStatus('SVG copied');
    } catch (error) {
      setError('Copy failed. Browser clipboard access may be restricted.');
    }
  }

  sampleSelect.addEventListener('change', () => {
    const value = sampleSelect.value;
    sourceEl.value = value === 'last' ? localStorage.getItem(storageKeys.source) || samples.dashboard : samples[value] || '';
    persist();
    renderMermaid();
  });

  document.getElementById('renderBtn').addEventListener('click', renderMermaid);
  document.getElementById('clearBtn').addEventListener('click', () => {
    sourceEl.value = '';
    sampleSelect.value = 'blank';
    persist();
    renderMermaid();
  });
  document.getElementById('downloadSvgBtn').addEventListener('click', downloadSvg);
  pngButton.addEventListener('click', downloadPng);
  document.getElementById('copySvgBtn').addEventListener('click', copySvg);

  [themeSelect, lookSelect, widthInput, scaleInput, bgInput].forEach((control) => {
    control.addEventListener('change', () => {
      applyPreviewSettings();
      persist();
      if (control === themeSelect || control === lookSelect) {
        renderMermaid();
      }
    });
    control.addEventListener('input', () => {
      applyPreviewSettings();
      persist();
    });
  });

  sourceEl.addEventListener('input', () => {
    sampleSelect.value = 'last';
    persist();
  });

  splitter.addEventListener('pointerdown', (event) => {
    isDraggingSplit = true;
    splitter.setPointerCapture(event.pointerId);
    document.body.classList.add('is-resizing');
    updateSplitterAccessibility();
    if (isStackedLayout()) {
      document.body.classList.add('is-resizing-row');
      updateSplitFromClientY(event.clientY);
    } else {
      document.body.classList.add('is-resizing-col');
      updateSplitFromClientX(event.clientX);
    }
    event.preventDefault();
  });

  splitter.addEventListener('pointermove', (event) => {
    if (!isDraggingSplit) {
      return;
    }
    if (isStackedLayout()) {
      updateSplitFromClientY(event.clientY);
    } else {
      updateSplitFromClientX(event.clientX);
    }
    persist();
  });

  splitter.addEventListener('pointerup', (event) => {
    isDraggingSplit = false;
    document.body.classList.remove('is-resizing');
    document.body.classList.remove('is-resizing-col');
    document.body.classList.remove('is-resizing-row');
    splitter.releasePointerCapture(event.pointerId);
    persist();
  });

  splitter.addEventListener('pointercancel', () => {
    isDraggingSplit = false;
    document.body.classList.remove('is-resizing');
    document.body.classList.remove('is-resizing-col');
    document.body.classList.remove('is-resizing-row');
    persist();
  });

  splitter.addEventListener('keydown', (event) => {
    const stacked = isStackedLayout();
    const step = event.shiftKey ? (stacked ? 30 : 5) : (stacked ? 10 : 1);
    if (stacked && event.key === 'ArrowUp') {
      applyStackedSplit(stackedEditorHeight - step);
    } else if (stacked && event.key === 'ArrowDown') {
      applyStackedSplit(stackedEditorHeight + step);
    } else if (!stacked && event.key === 'ArrowLeft') {
      applySplit(splitPercent - step);
    } else if (!stacked && event.key === 'ArrowRight') {
      applySplit(splitPercent + step);
    } else if (event.key === 'Home') {
      stacked ? applyStackedSplit(280) : applySplit(25);
    } else if (event.key === 'End') {
      stacked ? applyStackedSplit(640) : applySplit(75);
    } else {
      return;
    }
    updateSplitterAccessibility();
    persist();
    event.preventDefault();
  });

  window.addEventListener('resize', updateSplitterAccessibility);

  restore();
  renderMermaid();
})();
