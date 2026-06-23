(function bootMermaidHelper() {
  const {
    clampNumber,
    createPngExportSource,
    createSvgDownloadBlob,
    decodeMermaidSourceFromUrl,
    ensureMermaidCodeFence,
    encodeMermaidSourceForUrl,
    PNG_DOWNLOAD,
    SVG_DOWNLOAD,
    stripCodeFence
  } = window.MermaidHelperUtils;
  const samples = window.MermaidHelperSamples;
  const metadata = window.MermaidSnapperMetadata || {};
  const storageKeys = {
    source: 'mermaid-helper-source',
    theme: 'mermaid-helper-theme',
    look: 'mermaid-helper-look',
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
  const scaleInput = document.getElementById('scaleInput');
  const scaleValue = document.getElementById('scaleValue');
  const bgInput = document.getElementById('bgInput');
  const splitter = document.getElementById('splitter');
  const captureArea = document.getElementById('captureArea');
  const previewShell = document.querySelector('.preview-shell');
  const diagramEl = document.getElementById('diagram');
  const errorEl = document.getElementById('error');
  const statusEl = document.getElementById('status');
  const pngButton = document.getElementById('downloadPngBtn');
  const copyLinkButton = document.getElementById('copyLinkBtn');
  const fitPreviewButton = document.getElementById('fitPreviewBtn');
  const actualSizeButton = document.getElementById('actualSizeBtn');
  const resetPanButton = document.getElementById('resetPanBtn');
  const helpButton = document.getElementById('helpBtn');
  const helpBackdrop = document.getElementById('helpBackdrop');
  const helpDialog = document.getElementById('helpDialog');
  const helpCloseButton = document.getElementById('helpCloseBtn');
  const helpOkButton = document.getElementById('helpOkBtn');
  const appVersionEl = document.getElementById('appVersion');
  const aboutAppVersionEl = document.getElementById('aboutAppVersion');
  const homeLinks = document.querySelectorAll('[data-home-link]');
  const mermaidDocsLink = document.getElementById('mermaidDocsLink');
  const aboutMermaidDocsLink = document.getElementById('aboutMermaidDocsLink');
  const repositoryLink = document.getElementById('repositoryLink');
  const pagesLink = document.getElementById('pagesLink');
  const ARTBOARD_PADDING = 32;
  const scaleSetting = { min: 40, max: 500, fallback: 100, step: 5 };
  const stackedSplitLimits = {
    min: 0,
    max: 640,
    fallback: 340
  };

  let currentSvgText = '';
  let renderCount = 0;
  let splitPercent = 42;
  let stackedEditorHeight = 340;
  let isDraggingSplit = false;
  let isPanningPreview = false;
  let previewPanStart = {
    pointerId: null,
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0
  };
  let isExportingPng = false;
  let lastRenderedStatus = '';
  let previewScalePercent = 100;
  let isTemporaryFitScale = false;
  let pngExportSupport = {
    checked: false,
    supported: true,
    reason: ''
  };

  function applyPreviewSettings() {
    const scale = clampNumber(scaleInput.value, scaleSetting.min, scaleSetting.max, scaleSetting.fallback);
    const scaleFactor = scale / 100;
    previewScalePercent = scale;
    scaleInput.value = scale;

    scaleValue.textContent = `${scale}%`;
    scaleValue.classList.toggle('is-temporary', isTemporaryFitScale);
    scaleValue.title = isTemporaryFitScale ? 'Temporary fit scale' : 'Scale';
    captureArea.style.backgroundColor = bgInput.value || '#ffffff';
    captureArea.style.transform = `scale(${scaleFactor})`;
    captureArea.style.marginRight = scaleFactor <= 1 ? '0' : `${captureArea.offsetWidth * (scaleFactor - 1)}px`;
    captureArea.style.marginBottom = scaleFactor <= 1 ? '0' : `${captureArea.offsetHeight * (scaleFactor - 1)}px`;
    return true;
  }

  function setPreviewScale(scale, options = {}) {
    isTemporaryFitScale = options.temporary === true;
    scaleInput.value = clampNumber(scale, scaleSetting.min, scaleSetting.max, scaleSetting.fallback);
    applyPreviewSettings();
    if (!isTemporaryFitScale) {
      persist();
    }
  }

  function stepPreviewScale(direction) {
    const current = Number.isFinite(previewScalePercent) ? previewScalePercent : scaleSetting.fallback;
    setPreviewScale(current + (scaleSetting.step * direction));
  }

  function resetPreviewPan() {
    previewShell.scrollTo({
      left: 0,
      top: 0,
      behavior: 'smooth'
    });
  }

  function getVisibleDiagramSize() {
    if (!getSvgElement()) {
      return null;
    }

    const scaleFactor = Math.max(previewScalePercent / 100, 0.01);
    return {
      width: captureArea.offsetWidth / scaleFactor,
      height: captureArea.offsetHeight / scaleFactor
    };
  }

  function getRenderedSvgBounds(svg) {
    const ignoredTags = new Set(['defs', 'desc', 'metadata', 'style', 'title']);
    const boxes = Array.from(svg.children)
      .filter((child) => !ignoredTags.has(child.tagName.toLowerCase()) && typeof child.getBBox === 'function')
      .map((child) => {
        try {
          return child.getBBox();
        } catch (error) {
          return null;
        }
      })
      .filter((box) => box && box.width > 0 && box.height > 0);

    if (boxes.length > 0) {
      const x1 = Math.min(...boxes.map((box) => box.x));
      const y1 = Math.min(...boxes.map((box) => box.y));
      const x2 = Math.max(...boxes.map((box) => box.x + box.width));
      const y2 = Math.max(...boxes.map((box) => box.y + box.height));

      return {
        x: x1,
        y: y1,
        width: x2 - x1,
        height: y2 - y1
      };
    }

    try {
      const box = svg.getBBox();
      if (box.width > 0 && box.height > 0) {
        return {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height
        };
      }
    } catch (error) {
      // Some SVGs cannot be measured until attached and painted; fall back below.
    }

    const viewBox = svg.getAttribute('viewBox');
    const viewBoxParts = viewBox ? viewBox.trim().split(/\s+/).map(Number) : [];

    if (viewBoxParts.length === 4 && viewBoxParts.every(Number.isFinite) && viewBoxParts[2] > 0 && viewBoxParts[3] > 0) {
      return {
        x: viewBoxParts[0],
        y: viewBoxParts[1],
        width: viewBoxParts[2],
        height: viewBoxParts[3]
      };
    }

    const rect = svg.getBoundingClientRect();
    return {
      x: 0,
      y: 0,
      width: Math.max(1, rect.width / Math.max(previewScalePercent / 100, 0.01)),
      height: Math.max(1, rect.height / Math.max(previewScalePercent / 100, 0.01))
    };
  }

  function trimSvgToBounds(svg, bounds) {
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);

    svg.setAttribute('viewBox', `${bounds.x || 0} ${bounds.y || 0} ${width} ${height}`);
    svg.setAttribute('width', String(Math.ceil(width)));
    svg.setAttribute('height', String(Math.ceil(height)));
    svg.style.maxWidth = 'none';
  }

  function autoSizeArtboard() {
    const svg = getSvgElement();

    if (!svg) {
      captureArea.style.width = '';
      return;
    }

    const bounds = getRenderedSvgBounds(svg);
    trimSvgToBounds(svg, bounds);
    const artboardWidth = Math.ceil(bounds.width + (ARTBOARD_PADDING * 2));

    captureArea.style.width = `${artboardWidth}px`;
    applyPreviewSettings();
  }

  function fitPreviewToDiagram() {
    const diagramSize = getVisibleDiagramSize();

    if (!diagramSize) {
      setStatus('Render a diagram before fitting the preview');
      return;
    }

    const availableWidth = Math.max(1, previewShell.clientWidth - 36);
    const availableHeight = Math.max(1, previewShell.clientHeight - 36);
    const targetWidth = diagramSize.width + 64;
    const targetHeight = diagramSize.height + 64;
    const rawScale = Math.min(availableWidth / targetWidth, availableHeight / targetHeight) * 100;
    const fittedScale = Math.floor(clampNumber(rawScale, scaleSetting.min, scaleSetting.max, scaleSetting.fallback) / scaleSetting.step) * scaleSetting.step;

    setPreviewScale(fittedScale, { temporary: true });
    resetPreviewPan();
    setStatus(`Fit preview at ${fittedScale}%`);
  }

  function startPreviewPan(event) {
    if (event.button !== 0 || event.pointerType === 'touch' || event.target.closest('a, button, input, select, textarea')) {
      return;
    }

    isPanningPreview = true;
    previewPanStart = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      scrollLeft: previewShell.scrollLeft,
      scrollTop: previewShell.scrollTop
    };
    previewShell.classList.add('is-panning');
    previewShell.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function updatePreviewPan(event) {
    if (!isPanningPreview || event.pointerId !== previewPanStart.pointerId) {
      return;
    }

    previewShell.scrollLeft = previewPanStart.scrollLeft - (event.clientX - previewPanStart.x);
    previewShell.scrollTop = previewPanStart.scrollTop - (event.clientY - previewPanStart.y);
    event.preventDefault();
  }

  function stopPreviewPan(event) {
    if (!isPanningPreview || event.pointerId !== previewPanStart.pointerId) {
      return;
    }

    isPanningPreview = false;
    previewShell.classList.remove('is-panning');
    previewShell.releasePointerCapture(event.pointerId);
  }

  function scalePreviewWithWheel(event) {
    if (!event.ctrlKey) {
      return;
    }

    event.preventDefault();
    stepPreviewScale(event.deltaY < 0 ? 1 : -1);
  }

  function applyMetadata() {
    const versionText = metadata.appVersion ? `v${metadata.appVersion}` : '';
    const releaseText = metadata.releaseDate ? ` (${metadata.releaseDate})` : '';
    const linkTargets = [
      ...Array.from(homeLinks, (link) => [link, metadata.pagesUrl]),
      [mermaidDocsLink, metadata.mermaidDocsUrl],
      [aboutMermaidDocsLink, metadata.mermaidDocsUrl],
      [repositoryLink, metadata.repositoryUrl],
      [pagesLink, metadata.pagesUrl]
    ];

    appVersionEl.textContent = versionText;
    aboutAppVersionEl.textContent = `${versionText}${releaseText}`;
    linkTargets.forEach(([link, href]) => {
      if (href) {
        link.href = href;
      }
    });
  }

  function applySplit(percent) {
    splitPercent = clampNumber(percent, 25, 75, 42);
    mainEl.style.setProperty('--editor-width', `${splitPercent}%`);
    splitter.setAttribute('aria-valuenow', String(Math.round(splitPercent)));
  }

  function applyStackedSplit(height) {
    stackedEditorHeight = clampNumber(
      height,
      stackedSplitLimits.min,
      stackedSplitLimits.max,
      stackedSplitLimits.fallback
    );
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
      splitter.setAttribute('aria-valuemin', String(stackedSplitLimits.min));
      splitter.setAttribute('aria-valuemax', String(stackedSplitLimits.max));
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

  function openHelpDialog() {
    helpBackdrop.hidden = false;
    helpButton.setAttribute('aria-expanded', 'true');
    helpDialog.focus();
  }

  function closeHelpDialog() {
    helpBackdrop.hidden = true;
    helpButton.setAttribute('aria-expanded', 'false');
    helpButton.focus();
  }

  function persist() {
    localStorage.setItem(storageKeys.source, sourceEl.value);
    localStorage.setItem(storageKeys.theme, themeSelect.value);
    localStorage.setItem(storageKeys.look, lookSelect.value);
    if (!isTemporaryFitScale) {
      localStorage.setItem(storageKeys.scale, scaleInput.value);
    }
    localStorage.setItem(storageKeys.background, bgInput.value);
    localStorage.setItem(storageKeys.split, String(Math.round(splitPercent)));
    localStorage.setItem(storageKeys.stackedSplit, String(Math.round(stackedEditorHeight)));
  }

  function restore(importedSource) {
    const hasImportedSource = typeof importedSource === 'string';
    const savedSource = localStorage.getItem(storageKeys.source);
    const savedLook = localStorage.getItem(storageKeys.look);
    sourceEl.value = hasImportedSource ? importedSource : savedSource || samples.dashboard;
    themeSelect.value = localStorage.getItem(storageKeys.theme) || 'default';
    lookSelect.value = savedLook && savedLook !== 'default' ? savedLook : 'classic';
    scaleInput.value = localStorage.getItem(storageKeys.scale) || '100';
    isTemporaryFitScale = false;
    bgInput.value = localStorage.getItem(storageKeys.background) || '#ffffff';
    sampleSelect.value = hasImportedSource || savedSource ? 'last' : 'dashboard';
    applySplit(localStorage.getItem(storageKeys.split) || 42);
    applyStackedSplit(localStorage.getItem(storageKeys.stackedSplit) || 340);
    updateSplitterAccessibility();
    applyPreviewSettings();
  }

  function getSharedSourceFromUrl() {
    const params = new URLSearchParams(window.location.search);

    if (!params.has('mmd')) {
      return null;
    }

    return decodeMermaidSourceFromUrl(params.get('mmd'));
  }

  function clearSharedSourceFromUrl() {
    const url = new URL(window.location.href);

    if (!url.searchParams.has('mmd')) {
      return;
    }

    url.searchParams.delete('mmd');
    window.history.replaceState({}, document.title, url.toString());
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
      autoSizeArtboard();
      resetPreviewPan();
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

  async function copyShareLink() {
    try {
      const source = ensureMermaidCodeFence(sourceEl.value);
      const url = new URL(window.location.href);
      url.searchParams.set('mmd', encodeMermaidSourceForUrl(source));
      await navigator.clipboard.writeText(url.toString());
      setStatus('Link copied');
    } catch (error) {
      setError('Link copy failed. Browser clipboard access may be restricted.');
    }
  }

  sampleSelect.addEventListener('change', () => {
    const value = sampleSelect.value;
    clearSharedSourceFromUrl();
    sourceEl.value = value === 'last' ? localStorage.getItem(storageKeys.source) || samples.dashboard : samples[value] || '';
    persist();
    renderMermaid();
  });

  document.getElementById('renderBtn').addEventListener('click', renderMermaid);
  document.getElementById('clearBtn').addEventListener('click', () => {
    clearSharedSourceFromUrl();
    sourceEl.value = '';
    sampleSelect.value = 'blank';
    persist();
    renderMermaid();
  });
  document.getElementById('downloadSvgBtn').addEventListener('click', downloadSvg);
  pngButton.addEventListener('click', downloadPng);
  document.getElementById('copySvgBtn').addEventListener('click', copySvg);
  copyLinkButton.addEventListener('click', copyShareLink);
  helpButton.addEventListener('click', openHelpDialog);
  helpCloseButton.addEventListener('click', closeHelpDialog);
  helpOkButton.addEventListener('click', closeHelpDialog);
  helpBackdrop.addEventListener('click', (event) => {
    if (event.target === helpBackdrop) {
      closeHelpDialog();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !helpBackdrop.hidden) {
      closeHelpDialog();
    }
  });

  [themeSelect, lookSelect].forEach((control) => {
    control.addEventListener('change', () => {
      applyPreviewSettings();
      persist();
      renderMermaid();
    });
  });

  bgInput.addEventListener('change', () => {
    applyPreviewSettings();
    persist();
  });
  bgInput.addEventListener('input', () => {
    applyPreviewSettings();
    persist();
  });

  scaleInput.addEventListener('input', () => {
    setPreviewScale(scaleInput.value);
  });
  scaleInput.addEventListener('change', () => {
    setPreviewScale(scaleInput.value);
  });

  sourceEl.addEventListener('input', () => {
    clearSharedSourceFromUrl();
    sampleSelect.value = 'last';
    persist();
  });

  previewShell.addEventListener('pointerdown', startPreviewPan);
  previewShell.addEventListener('pointermove', updatePreviewPan);
  previewShell.addEventListener('pointerup', stopPreviewPan);
  previewShell.addEventListener('pointercancel', stopPreviewPan);
  previewShell.addEventListener('wheel', scalePreviewWithWheel, { passive: false });
  fitPreviewButton.addEventListener('click', fitPreviewToDiagram);
  actualSizeButton.addEventListener('click', () => setPreviewScale(100));
  resetPanButton.addEventListener('click', resetPreviewPan);

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
      stacked ? applyStackedSplit(stackedSplitLimits.min) : applySplit(25);
    } else if (event.key === 'End') {
      stacked ? applyStackedSplit(stackedSplitLimits.max) : applySplit(75);
    } else {
      return;
    }
    updateSplitterAccessibility();
    persist();
    event.preventDefault();
  });

  window.addEventListener('resize', updateSplitterAccessibility);

  applyMetadata();
  const sharedSource = getSharedSourceFromUrl();
  restore(sharedSource && sharedSource.ok ? ensureMermaidCodeFence(sharedSource.source) : null);
  const initialRender = renderMermaid();

  if (sharedSource && !sharedSource.ok) {
    initialRender.finally(() => {
      setError(sharedSource.error);
      setStatus('Shared link could not be decoded');
    });
  }
})();
