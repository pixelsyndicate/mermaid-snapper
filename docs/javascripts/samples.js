(function exposeSamples(root, factory) {
  const samples = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = samples;
  }

  root.MermaidHelperSamples = samples;
})(typeof window !== 'undefined' ? window : globalThis, function createSamples() {
  return {
  dashboard: `\`\`\`mermaid
flowchart TD
  A["\`Product Analytics Overview
Overall usage, users, platforms, errors, endpoints, response times\`"]
  B["\`User Engagement Detail
Users, calls, errors, response times, platform mix\`"]
  C["\`User Drill-In
One user's utilization, endpoints, platforms, errors, slow calls\`"]
  D["\`Endpoint Detail
Endpoint volume, latency, errors, impacted users\`"]
  E["\`Platform Detail
Web, iOS/mobile, Android, browser usage and health\`"]
  F["\`Error Detail
Failures by user, endpoint, client, and status\`"]
  G["\`Field Extraction Readiness
Verify telemetry field availability and correlation quality\`"]
  H["\`Log Search Window
Batch child-operation analysis for grouped endpoints\`"]

  A -->|"identity"| C
  A -->|"non-batch endpoint"| D
  A -->|"batch endpoint"| H
  A -->|"platform/client"| E
  A -->|"status/error endpoint"| F
  B -->|"identity"| C
  D -->|"identity + endpoint"| C
  D -->|"platform"| E
  E -->|"identity + platform"| C
  E -->|"non-batch endpoint"| D
  E -->|"batch endpoint"| H
  F -->|"identity + endpoint + status"| C
  F -->|"platform"| E
  F -->|"non-batch failed endpoint"| D
  F -->|"batch failed endpoint"| H
  C -->|"non-batch endpoint"| D
  C -->|"batch endpoint"| H
  C -->|"platform"| E
  G -->|"validates readiness for"| A
\`\`\``,
  mermaidSnapper: `\`\`\`mermaid
flowchart LR
  subgraph Legend[" "]
    direction TB
    LInput["input"]
    LApp["app logic"]
    LMermaid["mermaid.js"]
    LAction["user/browser operation"]
    LOutput["output"]
  end

  subgraph Inputs["Diagram source inputs"]
    Query["Shared URL ?mmd=..."]
    Storage["Browser localStorage"]
    Sample["Sample selector"]
    Paste["User pasted source"]
  end

  subgraph Editor["Editor state"]
    Decode["Decode shared source"]
    Restore["Restore saved source"]
    LoadSample["Load bundled sample"]
    TextArea["Mermaid source textbox"]
    RenderClick["Render button"]
  end

  subgraph Render["Render pipeline"]
    Persist["Persist source and settings"]
    StripFence["Strip Mermaid code fence"]
    Config["\`Build Mermaid config
theme, look, labels\`"]
    Parse["mermaid.parse(source)"]
    RenderSvg["mermaid.render(id, source)"]
  end

  subgraph Preview["Preview and artboard"]
    SvgResponse["Rendered SVG response"]
    InsertSvg["Insert SVG into preview"]
    Measure["Measure visible SVG content bounds"]
    Trim["Trim SVG viewBox to content"]
    SizeArtboard["Size capture area
content + padding"]
    ApplyDisplay["Apply scale and background"]
    PreviewReady["Preview ready"]
  end

  subgraph Actions["User actions after render"]
    Fit["Fit preview"]
    CopyLink["Copy Link"]
    CopySvg["Copy SVG"]
    DownloadSvg["Download SVG"]
    DownloadPng["Download PNG"]
  end

  Query --> Decode --> TextArea
  Storage --> Restore --> TextArea
  Sample --> LoadSample --> TextArea
  Paste --> TextArea
  TextArea --> RenderClick

  RenderClick --> Persist
  Persist --> StripFence
  StripFence --> Config
  Config --> Parse
  Parse --> RenderSvg
  RenderSvg --> SvgResponse

  SvgResponse --> InsertSvg
  InsertSvg --> Measure
  Measure --> Trim
  Trim --> SizeArtboard
  SizeArtboard --> ApplyDisplay
  ApplyDisplay --> PreviewReady

  PreviewReady --> Fit
  PreviewReady --> CopyLink
  PreviewReady --> CopySvg
  PreviewReady --> DownloadSvg
  PreviewReady --> DownloadPng

  CopyLink --> Encode["Encode current source as ?mmd="]
  Encode --> ShareClipboard["Write share URL to clipboard"]

  CopySvg --> SerializeCopy["Serialize rendered SVG markup"]
  SerializeCopy --> SvgClipboard["Write SVG text to clipboard"]

  DownloadSvg --> SerializeDownload["Serialize rendered SVG markup"]
  SerializeDownload --> SvgBlob["Create SVG Blob"]
  SvgBlob --> SvgFile["Download SVG file"]

  DownloadPng --> PngRender["Render export-safe SVG"]
  PngRender --> Canvas["Draw SVG to browser canvas"]
  Canvas --> PngFile["Download PNG if canvas is allowed"]

  classDef input fill:#e0f2fe,stroke:#0284c7,color:#0f172a
  classDef app fill:#eef2ff,stroke:#6366f1,color:#0f172a
  classDef mermaid fill:#dcfce7,stroke:#16a34a,color:#0f172a
  classDef output fill:#fef9c3,stroke:#ca8a04,color:#0f172a
  classDef action fill:#fce7f3,stroke:#db2777,color:#0f172a
  classDef legendGroup fill:transparent,stroke:transparent,color:transparent

  class Query,Storage,Sample,Paste,LInput input
  class Decode,Restore,LoadSample,TextArea,RenderClick,Persist,StripFence,Config,Measure,Trim,SizeArtboard,ApplyDisplay,SerializeCopy,SerializeDownload,SvgBlob,LApp app
  class Parse,RenderSvg,SvgResponse,PngRender,LMermaid mermaid
  class PreviewReady,ShareClipboard,SvgClipboard,SvgFile,PngFile,LOutput output
  class Fit,CopyLink,CopySvg,DownloadSvg,DownloadPng,Encode,Canvas,LAction action
  class Legend legendGroup
\`\`\``,
  orders: `\`\`\`mermaid
flowchart TD
  A["\`Customer Order Portal
User starts an order or quote\`"]
  B["\`Identity Service
Authenticate user and load account context\`"]
  C["\`Product Catalog
Search, filter, and select products\`"]
  D["\`Pricing Engine
Apply contract pricing and discounts\`"]
  E["\`Inventory Check
Validate availability by warehouse\`"]
  F["\`Order Review
Confirm items, pricing, shipping, and tax\`"]
  G["\`Payment Authorization
Authorize credit card or account terms\`"]
  H["\`ERP Submission
Create sales order in downstream ERP\`"]
  I["\`Exception Queue
Manual review for failed or risky orders\`"]
  J["\`Confirmation
Email confirmation and tracking details\`"]
  K["\`Ops Dashboard
Monitor volume, failures, latency, and retries\`"]

  A -->|"login required"| B
  B -->|"authenticated"| C
  C -->|"selected items"| D
  D -->|"priced cart"| E
  E -->|"available"| F
  E -->|"partial or unavailable"| I
  F -->|"submit"| G
  G -->|"approved"| H
  G -->|"declined"| I
  H -->|"created"| J
  H -->|"submission failure"| I
  I -->|"resolved"| H
  A -->|"usage telemetry"| K
  D -->|"pricing telemetry"| K
  H -->|"ERP status"| K
  I -->|"exception metrics"| K
\`\`\``,
  flowchart: `\`\`\`mermaid
flowchart TD
    A["\`**Intake Trigger**
Business request, Jira, Confluence note, incident, consumer need\`"] --> B["\`**Plan Discovery**
Identify stakeholders, source systems, likely SMEs, decision owners\`"]
    B --> C["\`**Business Elicitation**
Interviews, workflow review, examples, current workaround, success outcome\`"]
    C --> D["\`**First Requirement Draft**
Purpose, users, business outcome, scope, assumptions, open questions\`"]
    D --> E{"\`**API / Data / Integration**
technical risk?\`"}
    E -- "Low risk / known pattern" --> F["\`**Contract Drafting**
Endpoint, inputs, outputs, errors, examples, acceptance criteria\`"]
    E -- "Data source / integration unknown" --> G["\`**Technical Discovery Branch**
Developer / tech lead / data owner validates source truth\`"]
    G --> H["\`**Technical Evidence**
Tables/views, joins, formulas, virtual tables, synonyms, grants, raw query proof, sample records\`"]
    H --> F
    F --> I["\`**Testability Review**
QA/test owner checks examples, edge cases, no-data behavior, invalid-input behavior, acceptance criteria\`"]
    I --> J["\`**Business Validation Review**
Business owner confirms meanings, calculations, sample values, and decision usefulness\`"]
    J --> K{"\`**Ready Review**
Can dev estimate and start
without rediscovering basic truth?\`"}
    K -- "No" --> L["\`**Resolve Gaps**
Clarify scope, add evidence, answer questions, link dependency, or record waiver\`"]
    L --> F
    K -- "Yes" --> M["\`**Definition of Ready Met**
Requirement owner accepts readiness with technical/test/business inputs\`"]
    M --> N["\`**Developer Handoff**
Jira/story implementation, repo/context, expected tests, evidence expectations\`"]
    N --> O["\`**Implementation and Ongoing Clarification**
Developer builds, asks questions, updates decisions/evidence\`"]
    O --> P["\`**Definition of Done Review**
Tests, PR, CI/CD, test-environment smoke, source validation, and business evidence as applicable\`"]
\`\`\``,
  class: `\`\`\`mermaid
classDiagram
  direction LR
  class DiagramRequest {
    +String title
    +String targetAudience
    +String diagramType
    +validate()
  }
  class MermaidSource {
    +String code
    +String theme
    +renderSvg()
    +exportPng()
  }
  class ConfluencePage {
    +String spaceKey
    +String pageTitle
    +attachImage()
  }
  DiagramRequest --> MermaidSource : produces
  MermaidSource --> ConfluencePage : captured for
\`\`\``,
  er: `\`\`\`mermaid
erDiagram
  USER ||--o{ DIAGRAM : creates
  DIAGRAM ||--o{ EXPORT : generates
  DIAGRAM }o--|| DIAGRAM_TYPE : uses
  CONFLUENCE_PAGE ||--o{ EXPORT : embeds

  USER {
    string user_id PK
    string display_name
  }
  DIAGRAM {
    string diagram_id PK
    string title
    string source_text
    datetime updated_at
  }
  DIAGRAM_TYPE {
    string type_id PK
    string mermaid_keyword
  }
  EXPORT {
    string export_id PK
    string format
    datetime captured_at
  }
  CONFLUENCE_PAGE {
    string page_id PK
    string space_key
    string title
  }
\`\`\``,
  gantt: `\`\`\`mermaid
gantt
  title Diagram Screenshot Workflow
  dateFormat  YYYY-MM-DD
  axisFormat  %b %d

  section Prepare
  Draft Mermaid source       :done,    draft, 2026-06-10, 1d
  Review diagram meaning     :active,  review, after draft, 1d

  section Capture
  Render in helper           :capture, after review, 1d
  Export SVG or PNG          :export,  after capture, 1d

  section Publish
  Attach to Confluence       :publish, after export, 1d
  Link source in page notes  :notes,   after publish, 1d
\`\`\``,
  pie: `\`\`\`mermaid
pie showData
  title Diagram Requests by Type
  "Flowcharts" : 42
  "Sequence and API flows" : 18
  "Data models" : 16
  "Architecture" : 14
  "Planning charts" : 10
\`\`\``,
  quadrant: `\`\`\`mermaid
quadrantChart
  title Diagram Candidates
  x-axis Low implementation effort --> High implementation effort
  y-axis Low communication value --> High communication value
  quadrant-1 Big bets
  quadrant-2 Quick wins
  quadrant-3 Ignore for now
  quadrant-4 Automate carefully
  Flowchart samples: [0.22, 0.82]
  ER examples: [0.34, 0.74]
  Event modeling: [0.74, 0.78]
  Custom icon packs: [0.82, 0.44]
\`\`\``,
  requirement: `\`\`\`mermaid
requirementDiagram
  requirement image_capture {
    id: "REQ-001"
    text: The helper shall render Mermaid diagrams from local HTML without a web host.
    risk: Medium
    verifymethod: Test
  }

  functionalRequirement export_options {
    id: "REQ-002"
    text: The helper shall export rendered diagrams as SVG and PNG.
    risk: Low
    verifymethod: Demonstration
  }

  element local_html {
    type: HTML Application
    docref: index.html
  }

  element confluence_doc {
    type: Documentation Target
    docref: Confluence
  }

  local_html - satisfies -> image_capture
  local_html - satisfies -> export_options
  export_options - traces -> confluence_doc
\`\`\``,
  mindmap: `\`\`\`mermaid
mindmap
  root((Mermaid Screenshot Helper))
    Source
      Paste code
      Select sample
      Restore last saved
    Render
      Theme
      Width
      Scale
      Background
    Export
      Copy SVG
      Download SVG
      Download PNG
    Publish
      Confluence page
      Jira note
      Architecture review
\`\`\``,
  timeline: `\`\`\`mermaid
timeline
  title Diagram Helper History
  2026-06-10 : Local HTML helper created
             : Initial flowchart samples added
  2026-06-12 : Screenshot workflow refined
             : Mermaid 11 samples added
  Next       : Capture diagrams for Confluence
             : Keep Mermaid source reusable
\`\`\``,
  architecture: `\`\`\`mermaid
architecture-beta
  group browser(cloud)[Browser]
  group docs(cloud)[Documentation]

  service html(server)[Local HTML Helper] in browser
  service mermaid(server)[Mermaid Renderer] in browser
  service source(disk)[Embedded Samples] in browser
  service svg(disk)[SVG or PNG Export] in browser
  service confluence(internet)[Confluence Page] in docs

  source:R --> L:html
  html:R --> L:mermaid
  mermaid:R --> L:svg
  svg:R --> L:confluence
\`\`\``,
  radar: `\`\`\`mermaid
radar-beta
  title Diagram Format Fit
  axis clarity["Clarity"], speed["Speed"], detail["Detail"], reuse["Reuse"], confluence["Confluence Fit"]
  curve flowchart["Flowchart"]{95, 90, 70, 90, 95}
  curve architecture["Architecture"]{85, 70, 90, 75, 85}
  curve eventModel["Event Modeling"]{80, 60, 95, 80, 75}
  max 100
  min 0
  ticks 5
  showLegend true
\`\`\``,
  eventmodeling: `\`\`\`mermaid
eventmodeling
  tf 01 ui DiagramEditor
  tf 02 cmd RenderDiagram
  tf 03 evt DiagramRendered
  tf 04 rmo PreviewPanel
  tf 05 cmd ExportPng
  tf 06 evt ImageExported
  tf 07 pcr ConfluencePublisher
\`\`\``,
  venn: `\`\`\`mermaid
venn-beta
  set "Source Control"["Text source"] : 70
  set "Visual Review"["Visual review"] : 65
  set "Documentation"["Confluence docs"] : 75
  union "Source Control","Visual Review" : 35
  union "Visual Review","Documentation" : 42
  union "Source Control","Documentation" : 30
  union "Source Control","Visual Review","Documentation" : 18
\`\`\``,
  treeview: `\`\`\`mermaid
treeView-beta
  "SVG-Mermaid-Intepreter"
    "index.html"
      "Embedded Mermaid samples"
      "Render and export controls"
      "Local storage"
    "sample-order-fulfillment-mermaid.txt"
    "sample-drilldown-dashboard-mermaid.txt"
    "requirements-writing-stages-mermaid.txt"
\`\`\``,
  blank: ''
  };
});
