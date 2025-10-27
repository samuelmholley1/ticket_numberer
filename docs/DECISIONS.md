# Architecture Decision Records

This document records key architectural decisions for the Ticket Builder project.

## 1. WYSIWYG Ticket Design (ADR-001)

**Date:** October 26, 2025  
**Status:** Accepted  

### Context
Need to provide users with a reliable way to design tickets that look exactly like the exported output.

### Decision
Implement WYSIWYG (What You See Is What You Get) design using fixed-pixel artboards with html-to-image for export.

### Consequences
- **Positive**: Pixel-perfect fidelity between preview and export
- **Positive**: No external design tools required
- **Negative**: Limited to web-based design capabilities
- **Negative**: Requires careful DOM manipulation to prevent layout shifts

## 2. Canva Import as Image Upload (ADR-002)

**Date:** October 26, 2025  
**Status:** Accepted  

### Context
Users want to import designs from Canva for numbering.

### Decision
Support PNG/JPEG image upload from Canva, overlay sequential numbers programmatically.

### Consequences
- **Positive**: Simple implementation, no complex parsing
- **Positive**: Works with any image editor output
- **Negative**: No vector editing capabilities
- **Negative**: Limited to static designs (no dynamic elements)

## 3. ZIP Bundling for Batch Exports (ADR-003)

**Date:** October 26, 2025  
**Status:** Accepted  

### Context
Batch exports of 100+ tickets need to be downloaded efficiently without overwhelming browsers.

### Decision
Bundle all exported tickets into a single ZIP file for download.

### Consequences
- **Positive**: Single download experience
- **Positive**: Avoids browser download limits
- **Negative**: Requires client-side ZIP generation
- **Negative**: Memory usage for large batches

## 4. Optional PDF Export (ADR-004)

**Date:** October 26, 2025  
**Status:** Accepted  

### Context
Some users need print-ready PDFs with exact physical dimensions.

### Decision
Add PDF export option (v1.1) using a library that supports page size specification.

### Consequences
- **Positive**: Accurate physical printing
- **Positive**: Professional print workflows
- **Negative**: Additional dependency and complexity
- **Negative**: Larger bundle size

## 5. No External APIs (ADR-005)

**Date:** October 26, 2025  
**Status:** Accepted  

### Context
Previous nutrition app had dependencies on Airtable and USDA APIs.

### Decision
Build a completely client-side application with no external API dependencies.

### Consequences
- **Positive**: Works offline
- **Positive**: Zero operational costs
- **Positive**: No rate limiting or service outages
- **Negative**: All processing happens in browser
- **Negative**: Limited to client-side capabilities

## 6. Next.js with App Router (ADR-006)

**Date:** October 26, 2025  
**Status:** Accepted  

### Context
Need a modern React framework for the ticket builder.

### Decision
Use Next.js 14 with App Router for the application framework.

### Consequences
- **Positive**: Excellent developer experience
- **Positive**: Built-in optimizations
- **Positive**: Large ecosystem and community
- **Negative**: Opinionated structure
- **Negative**: Learning curve for App Router

## 7. Tailwind CSS for Styling (ADR-007)

**Date:** October 26, 2025  
**Status:** Accepted  

### Context
Need a CSS framework that supports rapid UI development.

### Decision
Use Tailwind CSS for utility-first styling.

### Consequences
- **Positive**: Fast development and prototyping
- **Positive**: Consistent design system
- **Positive**: Small production bundle
- **Negative**: Inline styling approach
- **Negative**: Learning curve for utility classes

## 8. Playwright for Testing (ADR-008)

**Date:** October 26, 2025  
**Status:** Accepted  

### Context
Need end-to-end testing for the export functionality.

### Decision
Use Playwright for browser automation and E2E testing.

### Consequences
- **Positive**: Cross-browser testing support
- **Positive**: Excellent debugging tools
- **Positive**: Active development and community
- **Negative**: Slower than unit tests
- **Negative**: Browser dependencies for CI

## Template for New ADRs

### Title (ADR-XXX)

**Date:** YYYY-MM-DD  
**Status:** Proposed | Accepted | Rejected | Superseded  

#### Context
What is the issue that we're seeing that is motivating this decision or change?

#### Decision
What is the change that we're proposing and/or doing?

#### Consequences
What becomes easier or more difficult to do because of this change?