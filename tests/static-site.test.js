const fs = require('fs');
const path = require('path');

const packageJson = require('../package.json');
const samples = require('../docs/javascripts/samples');
const metadata = require('../docs/javascripts/metadata');

const siteRoot = path.join(__dirname, '..', 'docs');

function readSiteFile(relativePath) {
  return fs.readFileSync(path.join(siteRoot, relativePath), 'utf8');
}

describe('static GitHub Pages-ready site', () => {
  test('index.html is the static app entrypoint', () => {
    const html = readSiteFile('index.html');

    expect(html).toContain('<title>Mermaid Snapper</title>');
    expect(html).toContain('<link rel="icon" href="./images/favicon.svg" type="image/svg+xml">');
    expect(html).toContain('./vendor/mermaid/mermaid.min.js');
    expect(html).toContain('./javascripts/app.js');
    expect(html).not.toContain('/healthz');
    expect(html).not.toContain('src="/vendor/mermaid/mermaid.min.js"');
  });

  test('index.html references static assets that exist', () => {
    const html = readSiteFile('index.html');
    const assetPaths = [...html.matchAll(/(?:href|src)="\.\/([^"]+)"/g)]
      .map((match) => match[1]);

    expect(assetPaths).toEqual(expect.arrayContaining([
      'stylesheets/app.css',
      'images/favicon.svg',
      'vendor/mermaid/mermaid.min.js',
      'javascripts/metadata.js',
      'javascripts/utils.js',
      'javascripts/samples.js',
      'javascripts/app.js'
    ]));

    assetPaths.forEach((assetPath) => {
      expect(fs.existsSync(path.join(siteRoot, assetPath))).toBe(true);
    });
  });

  test('Mermaid is vendored for static hosting', () => {
    const html = readSiteFile('index.html');
    const vendoredMermaidPath = path.join(siteRoot, 'vendor', 'mermaid', 'mermaid.min.js');
    const scriptSources = [...html.matchAll(/<script src="([^"]+)"/g)].map((match) => match[1]);

    expect(html).toContain('./vendor/mermaid/mermaid.min.js');
    expect(scriptSources).not.toEqual(expect.arrayContaining([
      expect.stringMatching(/https?:\/\/.*mermaid/i)
    ]));
    expect(fs.existsSync(vendoredMermaidPath)).toBe(true);
    expect(fs.statSync(vendoredMermaidPath).size).toBeGreaterThan(100000);
  });

  test('header includes Mermaid documentation link', () => {
    const html = readSiteFile('index.html');

    expect(html).toContain('test, preview and capture mermaid.js diagrams');
    expect(html).toContain('id="helpBtn"');
    expect(html).toContain('aria-controls="helpDialog"');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain(
      '<a class="version" id="mermaidDocsLink" href="https://mermaid.js.org/intro/" target="_blank" rel="noopener noreferrer">Mermaid 11.15.0</a>'
    );
  });

  test('header Mermaid version matches package dependency', () => {
    const html = readSiteFile('index.html');
    const versionMatch = html.match(/class="version"[^>]*>Mermaid ([^<]+)<\/a>/);
    const dependencyVersion = packageJson.dependencies.mermaid.replace(/^[^\d]*/, '');

    expect(versionMatch).not.toBeNull();
    expect(versionMatch[1]).toBe(dependencyVersion);
  });

  test('app version surfaces match package metadata', () => {
    const html = readSiteFile('index.html');
    const readRootFile = (relativePath) => fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
    const packageLock = require('../package-lock.json');
    const readme = readRootFile('README.md');
    const changelog = readRootFile('CHANGELOG.md');
    const version = packageJson.version;

    expect(metadata).toEqual(expect.objectContaining({
      appVersion: version,
      releaseDate: '20260622',
      mermaidDocsUrl: 'https://mermaid.js.org/intro/',
      repositoryUrl: 'https://github.com/pixelsyndicate/mermaid-snapper',
      pagesUrl: 'https://pixelsyndicate.github.io/mermaid-snapper/'
    }));
    expect(packageLock.version).toBe(version);
    expect(packageLock.packages[''].version).toBe(version);
    expect(html).toContain('<span class="app-version" id="appVersion"></span>');
    expect(html).toContain('<dd id="aboutAppVersion"></dd>');
    expect(html).not.toContain(`v${version} (${metadata.releaseDate})`);
    expect(readme).toContain(`Current app version: \`${version}\``);
    expect(readme).toContain('[CHANGELOG.md](CHANGELOG.md)');
    expect(changelog).toContain(`## ${version} - `);
  });

  test('diagram and display controls are grouped separately', () => {
    const html = readSiteFile('index.html');

    expect(html).toContain('<fieldset class="control-group diagram-options">');
    expect(html).toContain('<legend>Diagram options</legend>');
    expect(html).toContain('for="themeSelect">Theme</label>');
    expect(html).toContain('for="lookSelect">Look</label>');
    expect(html).toContain('<select id="lookSelect">');
    expect(html).toContain('<option value="classic">Classic</option>');
    expect(html).toContain('<option value="neo">Neo</option>');
    expect(html).toContain('<option value="handDrawn">Hand drawn</option>');
    expect(html.match(/<select id="lookSelect">([\s\S]*?)<\/select>/)[1]).not.toContain('value="default"');
    expect(html).not.toContain('id="layoutSelect"');
    expect(html).toContain('<fieldset class="control-group display-options">');
    expect(html).toContain('<legend>Display options</legend>');
    expect(html).toContain('for="widthInput">Width</label>');
    expect(html).toContain('for="scaleInput">Scale</label>');
    expect(html).toContain('data-step-target="widthInput"');
    expect(html).toContain('data-step-target="scaleInput"');
    expect(html).toContain('for="bgInput">Background</label>');
  });

  test('stacked layout keeps editor alerts visible below the textarea', () => {
    const html = readSiteFile('index.html');
    const css = readSiteFile('stylesheets/app.css');
    const js = readSiteFile('javascripts/app.js');

    expect(html).toContain('<div class="editor-alerts">');
    expect(html).toContain('<div class="controls export-controls">');
    expect(css).toContain('sm 576px, md 768px, lg 992px, xl 1200px, xxl 1400px');
    expect(css).toContain('--stacked-editor-height: 340px;');
    expect(css).toContain('@media (max-width: 991.98px)');
    expect(css).toContain('grid-template-rows: var(--stacked-editor-height) 18px minmax(260px, 1fr);');
    expect(css).toContain('cursor: row-resize;');
    expect(css).toContain('background: linear-gradient(180deg, #d8e3f1, #eef4fb);');
    expect(css).toContain('background: var(--accent);');
    expect(css).toContain('@media (max-width: 767.98px)');
    expect(css).toContain('.header-title p,');
    expect(css).toContain('.export-controls button');
    expect(css).toContain('.number-stepper');
    expect(css).toContain('.step-button');
    expect(css).toContain('.tips-control');
    expect(css).toContain('.tips-popover');
    expect(css).toContain('.export-controls');
    expect(css).toContain('margin-left: auto;');
    expect(css).toContain('width: 320px;');
    expect(css).toContain('.tips-control:focus-within .tips-popover');
    expect(css).toContain('.preview-shell.is-panning');
    expect(css).toContain('cursor: grab;');
    expect(css).toContain('user-select: none;');
    expect(js).toContain("stackedSplit: 'mermaid-helper-stacked-split'");
    expect(js).toContain('Resize editor and preview rows');
    expect(js).toContain('function updateSplitFromClientY(clientY)');
    expect(js).toContain('function getEditableNumber(input)');
    expect(js).toContain('commit: false');
    expect(js).toContain("document.querySelectorAll('[data-step-target]')");
    expect(js).not.toContain('input.focus();');
    expect(js).toContain('const stackedSplitLimits = {');
    expect(js).toContain('min: 180');
    expect(js).toContain("splitter.setAttribute('aria-valuemin', String(stackedSplitLimits.min));");
    expect(js).toContain('stacked ? applyStackedSplit(stackedSplitLimits.min) : applySplit(25);');
    expect(js).toContain("const previewShell = document.querySelector('.preview-shell');");
    expect(js).toContain('function startPreviewPan(event)');
    expect(js).toContain("event.pointerType === 'touch'");
    expect(js).toContain('function scalePreviewWithWheel(event)');
    expect(js).toContain("previewShell.addEventListener('wheel', scalePreviewWithWheel, { passive: false });");
  });

  test('sample dropdown options are backed by the sample catalog', () => {
    const html = readSiteFile('index.html');
    const sampleSelectMarkup = html.match(/<select id="sampleSelect">([\s\S]*?)<\/select>/)[1];
    const sampleOptionValues = [...sampleSelectMarkup.matchAll(/<option value="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((value) => value !== 'last');

    expect(sampleOptionValues).toContain('blank');
    sampleOptionValues.forEach((value) => {
      expect(samples).toHaveProperty(value);
    });
  });

  test('shared Mermaid URLs can be imported and copied', () => {
    const html = readSiteFile('index.html');
    const appJs = readSiteFile('javascripts/app.js');
    const utilsJs = readSiteFile('javascripts/utils.js');

    expect(html).toContain('<button id="copyLinkBtn" type="button">Copy Link</button>');
    expect(appJs).toContain("const copyLinkButton = document.getElementById('copyLinkBtn');");
    expect(appJs).toContain('const params = new URLSearchParams(window.location.search);');
    expect(appJs).toContain("params.has('mmd')");
    expect(appJs).toContain("decodeMermaidSourceFromUrl(params.get('mmd'))");
    expect(appJs).toContain('restore(sharedSource && sharedSource.ok ? sharedSource.source : null);');
    expect(appJs).toContain("sampleSelect.value = hasImportedSource || savedSource ? 'last' : 'dashboard';");
    expect(appJs).toContain("url.searchParams.set('mmd', encodeMermaidSourceForUrl(source));");
    expect(appJs).toContain("setStatus('Link copied');");
    expect(utilsJs).toContain('function encodeMermaidSourceForUrl(source)');
    expect(utilsJs).toContain('function decodeMermaidSourceFromUrl(encodedSource)');
  });

  test('Jekyll processing is disabled for branch-based Pages publishing', () => {
    expect(fs.existsSync(path.join(siteRoot, '.nojekyll'))).toBe(true);
  });

  test('deployable samples avoid internal organization markers', () => {
    const sampleText = JSON.stringify(samples);

    ['BSN', 'APP/RTR', 'Splunk', 'SAP/HANA', 'QAS'].forEach((marker) => {
      expect(sampleText).not.toContain(marker);
    });
  });

  test('PNG export warning explains browser canvas security blocking', () => {
    const appJs = readSiteFile('javascripts/app.js');
    const css = readSiteFile('stylesheets/app.css');

    expect(appJs).toContain('PNG export disabled: this browser taints the canvas after drawing the generated SVG image');
    expect(appJs).toContain('toDataURL is blocked for security');
    expect(css).toContain('button:disabled');
    expect(css).toContain('cursor: not-allowed;');
  });

  test('Mermaid look selector is persisted and passed into render config', () => {
    const appJs = readSiteFile('javascripts/app.js');

    expect(appJs).toContain("look: 'mermaid-helper-look'");
    expect(appJs).toContain("const lookSelect = document.getElementById('lookSelect');");
    expect(appJs).toContain('localStorage.setItem(storageKeys.look, lookSelect.value);');
    expect(appJs).toContain("lookSelect.value = savedLook && savedLook !== 'default' ? savedLook : 'classic';");
    expect(appJs).toContain('look: lookSelect.value');
    expect(appJs).toContain('[themeSelect, lookSelect].forEach((control) => {');
    expect(appJs).toContain('renderMermaid();');
    expect(appJs).not.toContain("if (lookSelect.value !== 'default')");
    expect(appJs).not.toContain('layoutSelect');
  });

  test('help dialog is available from the header and remains visible in compact layouts', () => {
    const html = readSiteFile('index.html');
    const css = readSiteFile('stylesheets/app.css');
    const appJs = readSiteFile('javascripts/app.js');

    expect(html).toContain('id="helpBackdrop" hidden');
    expect(html).toContain('id="helpDialog"');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('About Mermaid Snapper');
    expect(html).toContain('App version');
    expect(html).toContain('Mermaid library');
    expect(html).toContain('Mouse Controls');
    expect(html).toContain('Hold Ctrl and use the mouse wheel over the preview to change Scale in 5% steps.');
    expect(html).not.toContain('App type');
    expect(html).not.toContain('Static browser app');
    expect(html).toContain('Render Mermaid source from pasted code, bundled samples, or shared diagram links');
    expect(html).toContain('Copy Link creates a shareable Mermaid Snapper URL.');
    expect(html).toContain('PNG export may be disabled when browser security blocks SVG-to-canvas export.');
    expect(html).toContain('https://github.com/pixelsyndicate/mermaid-snapper');
    expect(html).toContain('https://pixelsyndicate.github.io/mermaid-snapper/');
    expect(html).toContain('https://openai.com/codex/');
    expect(html).toContain('vibe-coded with CODEX by OpenAI');
    expect(html).toContain('id="helpOkBtn"');
    expect(html).toContain('class="tips-control"');
    expect(html).toContain('>i</button>');
    expect(html).toContain('id="previewTips"');
    expect(html).toContain('aria-describedby="previewTips"');
    expect(html).toContain('Drag the preview to pan.');
    expect(css).toContain('.modal-backdrop');
    expect(css).toContain('.modal-backdrop[hidden]');
    expect(css).toContain('.about-credit');
    expect(css).toContain('.header-actions');
    expect(appJs).toContain("const helpButton = document.getElementById('helpBtn');");
    expect(appJs).toContain("const helpOkButton = document.getElementById('helpOkBtn');");
    expect(appJs).toContain('const metadata = window.MermaidSnapperMetadata || {};');
    expect(appJs).toContain('function applyMetadata()');
    expect(appJs).toContain("appVersionEl.textContent = versionText;");
    expect(appJs).toContain("aboutAppVersionEl.textContent = `${versionText}${releaseText}`;");
    expect(appJs).toContain('function openHelpDialog()');
    expect(appJs).toContain('function closeHelpDialog()');
    expect(appJs).toContain("event.key === 'Escape'");
  });
});
