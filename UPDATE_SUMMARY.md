# Major Update - October 19, 2025

## 🔐 Password Protection
- **Password**: `lovewins`
- App is now protected - users must enter password to access
- Password stored in session (stays logged in until browser closed)

## 📅 Calendar Through End of Year
- Now generates ALL Sundays through December 31, 2025
- Previous 2 Sundays + all upcoming through year-end
- Purple highlight for "current service" in calendar
- Click any Sunday in calendar to jump to that service

## 📝 New Signup Flow

### Dropdown Selection
1. User clicks "Sign Up for This Service" button
2. Dropdown shows all 10 liturgists alphabetically + "Other" option
3. If selecting a known liturgist:
   - Email auto-populates (read-only)
   - Phone field optional
4. If selecting "Other":
   - Two fields appear: **First Name** and **Last Name** (both required)
   - Email field (required, editable)
   - Phone field (required)

### Role Selection
- Radio buttons: **Main Liturgist** or **Backup Liturgist**
- User chooses which role they're signing up for
- Submits to Airtable with correct role

## 🎨 New Collapsed View (2-Row Design)

Each Sunday shows TWO rows at a glance:

**Row 1 - Main Liturgist:**
- Shows: Liturgist: [Name] | [Email] | [Phone]
- Green text if filled
- Red "Empty - Sign Up!" if not filled

**Row 2 - Backup Liturgist:**
- Shows: Backup: [Name] | [Email] | [Phone]  
- Orange text if filled
- Gray "None" if not filled

### Why Show Contact Info?
Users can see each other's contact info to:
- Coordinate swapping if needed
- Contact backup if main can't make it
- Communicate about service details

## ❌ Removed Features
- **Attendance tracking** completely removed
- No more "Will you attend?" option
- Cleaner, focused on just liturgist scheduling

## 📊 Data Structure (Airtable Ready)

### What Gets Submitted:
```json
{
  "serviceDate": "2025-10-26",
  "displayDate": "October 26, 2025",
  "name": "Kay Lieberknecht" or "John Smith",
  "email": "kay.hoofin.it@gmail.com",
  "phone": "707-555-1234" or "",
  "role": "Liturgist" or "Backup",
  "attendanceStatus": "" (empty, no longer used)
}
```

### NO MANUAL EDITING NEEDED
- Form collects everything in the right format
- Dropdown pre-fills known liturgist emails
- "Other" users must provide all required info
- Phone is required for new people, optional for known liturgists
- Data goes straight to Airtable correctly formatted

## 👥 Known Liturgists in Dropdown

**Regular (6):**
1. Kay Lieberknecht
2. Linda Nagel
3. Lori
4. Doug Pratt
5. Gwen Hardage-Vergeer
6. Mikey Pitts KLMP

**Occasional (4):**
7. Paula Martin
8. Patrick Okey
9. Vicki Okey
10. Chad Raugewitz

Plus: **Other** option for anyone not listed

## 🎯 Current Service Logic

**Before 6am Monday PT:**
- Highlights the Sunday that just happened
- (e.g., Sunday afternoon = that Sunday is "current")

**After 6am Monday PT:**
- Switches to highlight next upcoming Sunday
- (e.g., Monday morning = next week's Sunday is "current")

## 🔄 Auto-Refresh
- Page refreshes data every 15 minutes automatically
- Ensures highlighting stays current
- New signups appear without manual refresh

## 📱 User Experience

### Compact & Scannable
- Each service is just 3 lines when collapsed
- See status of ~10 services at once
- Click any to expand for signup button

### Expandable for Details
- Click service bar to expand
- Shows "Sign Up for This Service" button
- Click again to collapse

### Mobile Friendly
- Responsive design
- Works on phones and tablets
- Password entry on any device

## 🚀 Next Steps for You

1. **Wait 1-2 minutes** for Vercel deployment
2. **Test the password**: `lovewins`
3. **Delete Sample Person** from Airtable (if still there)
4. **Test signup flow**:
   - Try selecting a known liturgist
   - Try "Other" option
   - Verify data appears in Airtable correctly
   - Check both main and backup roles
5. **Verify calendar** shows through December 31
6. **Check collapsed view** shows contact info correctly

## 📋 What's Different from Before

| Feature | Before | Now |
|---------|---------|-----|
| Password | None | Required: `lovewins` |
| Signup | Text fields | Dropdown + conditionals |
| Collapsed View | 1 line, icons | 2 rows, full contact info |
| Attendance | 3rd section | Removed completely |
| Calendar Range | 8 weeks | Through Dec 31 |
| Known Liturgists | Not used | Pre-fill from dropdown |
| Phone Number | Optional always | Required for "Other" |

## 🎉 Benefits

1. **No Airtable editing needed** - form collects everything correctly
2. **Easier signups** - dropdown is faster than typing
3. **Better coordination** - contact info visible for swapping
4. **Cleaner interface** - removed unnecessary attendance feature
5. **Full year planning** - see all services through December
6. **Secure** - password protection
7. **Professional** - polished, compact design
