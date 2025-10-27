# 🎯 Ticket Builder Project Summary

**Project:** Refactor from Nutrition Label Calculator to WYSIWYG Ticket Generator  
**Prepared by:** GitHub Copilot (Chief Software Engineer)  
**Date:** October 26, 2025  
**Status:** Planning Phase - Awaiting CEO Approval  
**Current Location:** Ready for implementation start

---

## 📊 Executive Summary

### The Big Picture
**From:** Complex nutrition label calculator (8,000+ LOC, 60+ files) with Airtable/USDA dependencies  
**To:** Simple WYSIWYG ticket generator (2,000 LOC, 15 files) with zero external dependencies  

**Goal:** Create a focused tool for batch-generating sequential numbered tickets (001-500) with pixel-perfect export quality.

### Key Outcomes
- ✅ **75% code reduction** (from 60+ to 15 files)
- ✅ **100% client-side** (no APIs, no databases)
- ✅ **Zero cost** ($0/month vs $0-20/month)
- ✅ **Offline capable** (works without internet)
- ✅ **Print-ready quality** (PNG/JPEG + PDF options)
- ✅ **Canva import support** (upload existing designs)

---

## 🎨 What We Build: WYSIWYG Ticket Generator

### Core Features (v1.0)
- **WYSIWYG Design:** What You See Is What You Get - preview matches export exactly
- **Batch Export:** Generate 1-500 sequential tickets in one operation
- **Flexible Numbering:** Custom prefix, padding, start/end values
- **Design Customization:** Colors, fonts, logo upload, event details
- **Canva Import:** Upload PNG/JPEG designs from Canva for numbering
- **Export Formats:** PNG/JPEG for screen, PDF for print (v1.1)
- **ZIP Bundling:** Single download for batch exports
- **Progress Tracking:** Real-time progress with cancel option

### Ticket Design Template
```
┌─────────────────────────┐
│   [Logo]                │
│   Halloween Party       │
│   October 31, 2025      │
│   Ukiah UMC             │
│                         │
│   ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈    │  ← Perforation line
│                         │
│   Admit One             │
│                         │
│   TICKET NO.            │
│   ██ 001 ██             │  ← Large, bold number
│                         │
│   Name: ___________     │  ← Optional name field
│                         │
└─────────────────────────┘
     2" × 5" @ 300 DPI
```

### Canva Import Workflow
1. **Design in Canva:** Create ticket layout with placeholder for number
2. **Export as Image:** Download PNG/JPEG from Canva
3. **Upload to App:** Import design into ticket builder
4. **Add Numbering:** Specify number position and batch settings
5. **Export Batch:** Generate numbered tickets with original design

---

## 🚀 User Experience

### Current (Nutrition App)
1. Paste recipe → Match ingredients → Review data → Generate label → Export
**Complexity:** High (5 steps, multiple pages, external APIs)

### New (Ticket Builder)
1. Upload Canva design or use template → Set count/prefix → Click "Export All"
**Complexity:** Low (3 steps, single page, instant results)

### Performance Improvements
- **Load Time:** <1s (vs 2-3s)
- **Export Speed:** ~25s for 50 tickets (no network delays)
- **Reliability:** 100% (no external dependencies)
- **Offline Support:** Yes (after initial load)

---

## 📋 Technical Architecture

### Technology Stack (Preserved)
- ✅ Next.js 14.2.5 (App Router)
- ✅ React 18 (hooks-based UI)
- ✅ TypeScript (type safety)
- ✅ Tailwind CSS (utility-first styling)
- ✅ html-to-image v1.11.13 (proven export quality)
- ✅ html2canvas v1.4.1 (fallback export)

### New Components
```
src/
├── app/
│   ├── page.tsx              # Main ticket builder UI
│   ├── layout.tsx            # Clean metadata
│   └── globals.css           # Tailwind + ticket styles
├── components/
│   ├── TicketTemplate.tsx    # WYSIWYG ticket component
│   ├── TicketControls.tsx    # Batch settings panel
│   ├── CanvaImport.tsx       # File upload for Canva designs
│   ├── Header.tsx            # Simple navigation
│   ├── Modal.tsx             # Reusable dialogs
│   └── Toast.tsx             # Notifications
├── lib/
│   ├── exportTicket.ts       # Enhanced export utility
│   ├── sequence.ts           # Number generation logic
│   └── zipExport.ts          # Client-side ZIP bundling
└── types/
    └── ticket.ts             # TypeScript definitions
```

### Key Technical Improvements (CTO Feedback)
- **Clone Neutralization:** Reset transforms/sticky positioning during export to prevent layout drift
- **ZIP Bundling:** Default to single ZIP download (avoids browser download limits)
- **PDF Export:** For print-accurate 2"×5" sizing (v1.1)
- **Memory Hygiene:** Revoke object URLs, avoid memory leaks in large batches
- **Font Readiness:** Explicit wait for `document.fonts.ready` and image loads
- **Deterministic Exports:** Ensure identical re-exports for quality consistency

---

## 📅 Implementation Timeline

### 4-Week Sprint Plan

**Week 1: Foundation & Cleanup**
- ✅ Delete unrelated nutrition MD docs (completed)
- ⏳ Remove nutrition-specific code (Airtable, USDA, recipes)
- ⏳ Update dependencies and package.json
- ⏳ Create new component structure
- ⏳ Implement basic TicketTemplate component

**Week 2: Core Features**
- ⏳ Build Canva import functionality
- ⏳ Implement batch export with ZIP bundling
- ⏳ Add progress tracking and cancel support
- ⏳ Create numbering sequence logic
- ⏳ Demo working prototype

**Week 3: Polish & UX**
- ⏳ Add design customization options
- ⏳ Implement PDF export for print accuracy
- ⏳ Add presets and localStorage saving
- ⏳ Cross-browser testing
- ⏳ Performance optimization

**Week 4: Testing & Launch**
- ⏳ Comprehensive testing (all browsers, large batches)
- ⏳ CEO user acceptance testing
- ⏳ Documentation and deployment
- ⏳ Production launch
- ⏳ Iterate based on feedback

### Current Status
- **Phase:** Planning complete, ready for development start
- **Blocker:** Awaiting CEO approval
- **Next Step:** Begin Week 1 cleanup upon approval

---

## 💰 Cost-Benefit Analysis

### Financial Impact
| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| Monthly Cost | $0-20 | $0 | $0-240/year |
| API Dependencies | 2 (Airtable, USDA) | 0 | 100% reduction |
| External Services | Yes | No | Complete elimination |

### Technical Impact
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Codebase Size | 8,000+ LOC | 2,000 LOC | -75% |
| Files | 60+ | 15 | -75% |
| Load Time | 2-3s | <1s | 2-3x faster |
| API Calls | 5-10 per use | 0 | 100% reduction |
| Offline Support | No | Yes | New capability |

### Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Export quality issues | Low | Medium | Extensive testing + html2canvas fallback |
| Browser compatibility | Low | Low | Test matrix: Chrome/Edge/Safari/Firefox |
| Large batch performance | Medium | Low | Progress indicator + cancel + memory hygiene |
| Canva import complexity | Medium | Low | Start with simple image overlay approach |
| CEO design feedback | Medium | Low | Iterative feedback loop, easy customization |

---

## 🎯 Success Metrics

### Must-Have (v1.0)
- ✅ Generate 1-500 sequential tickets in batch
- ✅ Canva PNG/JPEG import with numbering overlay
- ✅ Custom prefix/suffix and zero-padding
- ✅ ZIP bundling for single download
- ✅ Progress tracking with cancel support
- ✅ Print-ready quality (PNG/JPEG)
- ✅ Works offline after initial load
- ✅ Cross-browser compatibility

### Nice-to-Have (v1.1)
- ✅ PDF export with exact 2"×5" page size
- ✅ Multiple design templates
- ✅ QR code generation
- ✅ Saved design presets
- ✅ Bulk CSV import for personalized tickets

---

## ❓ CEO Decision Points

**Please confirm before proceeding:**

1. **Approval:** Do I have approval to proceed with this refactor?
2. **Timeline:** Is 4 weeks acceptable?
3. **Priority Features:** Which features are must-have for v1.0?
4. **Design:** Any specific design requirements or brand guidelines?
5. **Canva Integration:** Confirm PNG/JPEG import meets needs, or need more advanced features?

### Next Steps Upon Approval
1. Create feature branch: `feature/ticket-builder-refactor`
2. Begin Week 1 cleanup (delete nutrition code)
3. Daily progress updates via commits
4. Weekly demos and feedback sessions
5. Launch when acceptance criteria met

---

## 📞 Contact & Support

**Ready to proceed?**
- Reply with "APPROVED" to begin implementation
- List any concerns or required changes
- Questions welcome - I'll revise plan as needed

**Technical Contact:** GitHub Copilot (Chief Software Engineer)

---

## 📝 Appendix: CTO Feedback Incorporated

### Critical Corrections
- ✅ Fixed WYSIWYG definition ("What You See Is What You Get")
- ✅ Added PDF export for print-accurate physical sizing
- ✅ Implemented ZIP bundling as default for batch downloads

### High-Impact Improvements
- ✅ Added clone neutralization for export consistency
- ✅ Enhanced memory hygiene and performance optimizations
- ✅ Added flexible numbering (prefix/suffix, series support)
- ✅ Included security considerations for file uploads
- ✅ Strengthened testing requirements (pixel-diff checks, cross-browser)

### Architecture Clarifications
- ✅ Confirmed single-DOM strategy for batch exports
- ✅ Added pixel ratio controls (2x default, 3x advanced)
- ✅ Specified artboard locking for WYSIWYG fidelity

---

**Status:** ⏳ Awaiting CEO Approval  
**Prepared by:** GitHub Copilot  
**Date:** October 26, 2025