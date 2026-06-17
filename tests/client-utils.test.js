const {
  clampNumber,
  prepareSourceForPngExport,
  stripCodeFence
} = require('../docs/javascripts/utils');

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
});
