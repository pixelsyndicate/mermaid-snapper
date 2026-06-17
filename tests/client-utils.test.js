const {
  clampNumber,
  createPngExportSource,
  createSvgDownloadBlob,
  PNG_DOWNLOAD,
  prepareSourceForPngExport,
  SVG_DOWNLOAD,
  stripCodeFence
} = require('../docs/javascripts/utils');
const samples = require('../docs/javascripts/samples');

describe('client utility behavior', () => {
  test('strips fenced Mermaid source', () => {
    const source = [
      '```mermaid',
      'flowchart TD',
      '  A --> B',
      '```'
    ].join('\n');

    expect(stripCodeFence(source)).toBe('flowchart TD\n  A --> B');
  });

  test('preserves unfenced Mermaid source', () => {
    const source = 'flowchart LR\n  Start --> Finish';

    expect(stripCodeFence(source)).toBe(source);
  });

  test('clamps invalid numeric settings to defaults', () => {
    expect(clampNumber('not-a-number', 360, 2400, 960)).toBe(960);
    expect(clampNumber('100', 360, 2400, 960)).toBe(360);
    expect(clampNumber('2600', 360, 2400, 960)).toBe(2400);
  });

  test('prepares HTML labels for canvas-safe PNG export', () => {
    const source = [
      'flowchart TD',
      '  A["<b>Intake Trigger</b><br/>Business request"] --> B["Plain label"]'
    ].join('\n');

    expect(prepareSourceForPngExport(source)).toBe([
      'flowchart TD',
      '  A["Intake Trigger Business request"] --> B["Plain label"]'
    ].join('\n'));
  });

  test.each([
    [
      'line break tags',
      'flowchart TD\n  A["One<br>Two<BR/>Three<br />Four"]',
      'flowchart TD\n  A["One Two Three Four"]'
    ],
    [
      'nested formatting tags',
      'flowchart TD\n  A["<b><i>Bold label</i></b>"]',
      'flowchart TD\n  A["Bold label"]'
    ],
    [
      'tags with attributes',
      'flowchart TD\n  A["<span class=\'note\'>Tagged label</span>"]',
      'flowchart TD\n  A["Tagged label"]'
    ],
    [
      'mixed inline formatting',
      'flowchart TD\n  A["Before <small>small</small> and <strong>strong</strong>"]',
      'flowchart TD\n  A["Before small and strong"]'
    ]
  ])('prepares %s for PNG export', (_name, source, expected) => {
    expect(prepareSourceForPngExport(source)).toBe(expected);
  });

  test('prepares every bundled sample without leaving HTML tags', () => {
    Object.entries(samples).forEach(([name, source]) => {
      const prepared = prepareSourceForPngExport(source);

      expect(prepared).not.toMatch(/<\/?[a-z][^>]*>/i);
      if (name !== 'blank') {
        expect(prepared.trim()).not.toBe('');
      }
    });
  });

  test('creates PNG export source from fenced Mermaid source', () => {
    const source = [
      '```mermaid',
      'flowchart TD',
      '  A["<b>Intake</b><br/>Request"]',
      '```'
    ].join('\n');

    expect(createPngExportSource(source)).toBe('flowchart TD\n  A["Intake Request"]');
  });

  test('creates SVG download blobs with the expected metadata', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    const blob = createSvgDownloadBlob(svg);

    expect(SVG_DOWNLOAD).toEqual({
      filename: 'mermaid-diagram.svg',
      mimeType: 'image/svg+xml;charset=utf-8'
    });
    expect(PNG_DOWNLOAD).toEqual({
      filename: 'mermaid-diagram.png',
      mimeType: 'image/png'
    });
    expect(blob.type).toBe(SVG_DOWNLOAD.mimeType);
    expect(await blob.text()).toBe(svg);
  });
});
