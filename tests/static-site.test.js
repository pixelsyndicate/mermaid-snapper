const fs = require('fs');
const path = require('path');

const packageJson = require('../package.json');
const samples = require('../docs/javascripts/samples');

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

    expect(html).toContain('test, preview and capture images using');
    expect(html).toContain(
      '<a class="version" href="https://mermaid.js.org/intro/" target="_blank" rel="noopener noreferrer">Mermaid 11.15.0</a>'
    );
  });

  test('header Mermaid version matches package dependency', () => {
    const html = readSiteFile('index.html');
    const versionMatch = html.match(/class="version"[^>]*>Mermaid ([^<]+)<\/a>/);
    const dependencyVersion = packageJson.dependencies.mermaid.replace(/^[^\d]*/, '');

    expect(versionMatch).not.toBeNull();
    expect(versionMatch[1]).toBe(dependencyVersion);
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
    expect(js).toContain("stackedSplit: 'mermaid-helper-stacked-split'");
    expect(js).toContain('Resize editor and preview rows');
    expect(js).toContain('function updateSplitFromClientY(clientY)');
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
    expect(appJs).toContain('control === themeSelect || control === lookSelect');
    expect(appJs).not.toContain("if (lookSelect.value !== 'default')");
    expect(appJs).not.toContain('layoutSelect');
  });
});
