# Service Chronology Rules

## Main Page Display Rules

### Services Shown
- **Previous 2 Sundays** - The two most recent past Sunday services
- **All Upcoming Sundays** - Next 8 Sunday services

### "Current Service" Highlighting
The system automatically determines which Sunday should be highlighted as the **CURRENT SERVICE** based on Pacific Time:

**Rule 1: Sunday through Monday 5:59am PT**
- Highlights the most recent Sunday (e.g., if today is Sunday Oct 19 or Monday Oct 20 before 6am, Oct 19 is highlighted)

**Rule 2: Monday 6:00am PT onwards**
- Highlights the next upcoming Sunday (e.g., Monday Oct 20 at 6am or later, Oct 26 is highlighted)

### Visual Indicators
- **Current Service**: Purple border, purple background, "CURRENT SERVICE" badge
- **Hovered Service**: Yellow border and background
- **Other Services**: White background with gray border

## Auto-Refresh Behavior
- Page automatically checks for updates **every 15 minutes** while active
- Ensures service list and highlighting stays current without manual refresh
- At **6:00am PT every Monday**, the highlighting automatically switches to the next Sunday

## Archive Page

### Location
Access at: `/archive`

### Content
- All services older than the 2 most recent Sundays
- Displayed in reverse chronological order (most recent first)
- Shows complete signup information:
  - Main Liturgist
  - Backup Liturgist
  - Church Attendance responses

### Navigation
- Link to archive appears in top-right of main services section
- Archive page has "Back to Current Services" link

## Example Timeline

**Sunday, October 19, 2025 (any time)**
- Main page shows: Oct 12, Oct 19 (highlighted as CURRENT), Oct 26, Nov 2, Nov 9...
- Archive shows: All services before Oct 12

**Monday, October 20, 2025 at 5:59am PT**
- Main page shows: Oct 12, Oct 19 (still highlighted as CURRENT), Oct 26, Nov 2...
- Archive shows: All services before Oct 12

**Monday, October 20, 2025 at 6:00am PT** ⏰ **TRANSITION**
- Main page shows: Oct 12, Oct 19, Oct 26 (now highlighted as CURRENT), Nov 2...
- Archive shows: All services before Oct 12

**Sunday, October 26, 2025**
- Main page shows: Oct 19, Oct 26 (highlighted as CURRENT), Nov 2, Nov 9...
- Archive shows: All services before Oct 19 (Oct 12 has moved to archive)

## Technical Implementation

### Pacific Time Handling
```typescript
const pacificTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))
```

### Cutoff Logic
- If Monday AND before 6am PT: use yesterday (Sunday)
- Otherwise: use next Sunday

### Data Refresh
- Frontend: `setInterval()` every 15 minutes
- Cleanup: Interval cleared on component unmount
