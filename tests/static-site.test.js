const fs = require('fs');
const path = require('path');

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
      'vendor/mermaid/mermaid.min.js',
      'javascripts/utils.js',
      'javascripts/samples.js',
      'javascripts/app.js'
    ]));

    assetPaths.forEach((assetPath) => {
      expect(fs.existsSync(path.join(siteRoot, assetPath))).toBe(true);
    });
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
