/**
 * @jest-environment jsdom
 */

const samples = require('../docs/javascripts/samples');
const { stripCodeFence } = require('../docs/javascripts/utils');
const { TextDecoder, TextEncoder } = require('util');

describe('bundled Mermaid samples', () => {
  let mermaid;

  beforeAll(async () => {
    global.TextDecoder = TextDecoder;
    global.TextEncoder = TextEncoder;
    global.structuredClone = global.structuredClone || ((value) => JSON.parse(JSON.stringify(value)));
    window.TextDecoder = TextDecoder;
    window.TextEncoder = TextEncoder;
    window.structuredClone = window.structuredClone || global.structuredClone;

    mermaid = (await import('mermaid')).default;
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      flowchart: {
        htmlLabels: true,
        useMaxWidth: true
      },
      sequence: {
        useMaxWidth: true
      }
    });
  });

  test.each(Object.entries(samples).filter(([, source]) => stripCodeFence(source).trim()))(
    '%s parses with Mermaid',
    async (_name, source) => {
      await expect(mermaid.parse(stripCodeFence(source), { suppressErrors: false })).resolves.toBeTruthy();
    }
  );

  test('samples do not rely on raw HTML labels', () => {
    Object.entries(samples).forEach(([name, source]) => {
      expect({ name, source: stripCodeFence(source) }).toEqual({
        name,
        source: expect.not.stringMatching(/<\/?[a-z][^>]*>/i)
      });
    });
  });
});
