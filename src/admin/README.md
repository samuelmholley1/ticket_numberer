# Admin Directory

This directory contains administrative information and utilities for managing the liturgist signup system.

## Files

### `/src/admin/liturgists.ts`
Contains the master list of all liturgists with their contact information.

**Data includes:**
- Name
- Email address
- Frequency (regular/occasional)

**Regular Liturgists (6):**
- Kay Lieberknecht
- Linda Nagel
- Lori
- Doug Pratt
- Gwen Hardage-Vergeer
- Mikey Pitts KLMP

**Occasional Liturgists (4):**
- Paula Martin
- Patrick Okey
- Vicki Okey
- Chad Raugewitz

### `/src/app/admin/page.tsx`
Admin page accessible at `/admin` that displays:
- Complete liturgist directory
- Copy email functionality
- Regular vs occasional categorization
- Quick stats

## Usage

### Accessing the Admin Page
Navigate to: `https://your-site.com/admin`

### Importing Liturgist Data in Code
```typescript
import { liturgists, getRegularLiturgists } from '@/admin/liturgists'

// Get all liturgists
const all = liturgists

// Get only regular liturgists
const regular = getRegularLiturgists()

// Get all emails as string
const emails = liturgists.map(l => l.email).join(', ')
```

## Future Enhancements

Possible additions:
- Password protection for admin page
- Ability to add/edit liturgists
- Send bulk emails to all liturgists
- Track liturgist statistics (how many times served, etc.)
- Availability tracking
