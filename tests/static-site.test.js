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

    expect(html).toContain('<title>Mermaid Screenshot Helper</title>');
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
});
