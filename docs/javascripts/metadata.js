(function exposeMetadata(root, factory) {
  const metadata = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = metadata;
  }

  root.MermaidSnapperMetadata = metadata;
})(typeof window !== 'undefined' ? window : globalThis, function createMetadata() {
  return {
    appVersion: '0.3.0',
    releaseDate: '20260622',
    mermaidDocsUrl: 'https://mermaid.js.org/intro/',
    repositoryUrl: 'https://github.com/pixelsyndicate/mermaid-snapper',
    pagesUrl: 'https://pixelsyndicate.github.io/mermaid-snapper/'
  };
});
