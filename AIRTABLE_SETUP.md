# Airtable Setup Instructions

## ✅ SETUP COMPLETED BY ENGINEER

The following has been installed and configured:
- ✅ Airtable package installed
- ✅ API integration code created
- ✅ Signup endpoint configured
- ✅ Frontend connected to Airtable

---

## 🔧 YOUR CONFIGURATION NEEDED

### Step 1: Get Your Airtable Credentials

1. **Get your API Token:**
   - Go to https://airtable.com/create/tokens
   - Click "Create new token"
   - Name it: "Liturgist Signup App"
   - Add these scopes:
     - `data.records:read`
     - `data.records:write`
   - Add access to your "Liturgist Signups" base
   - Click "Create token"
   - **COPY THE TOKEN** (starts with `pat...`)

2. **Get your Base ID:**
   - Go to https://airtable.com/api
   - Click on your "Liturgist Signups" base
   - The Base ID is shown in the introduction (starts with `app...`)
   - Or look in the URL: `https://airtable.com/[BASE_ID]/api/docs`

### Step 2: Add Credentials to .env.local

Open the file `.env.local` in your project and add your credentials:

```env
AIRTABLE_PAT_TOKEN=your_pat_token_here
AIRTABLE_BASE_ID=your_base_id_here
AIRTABLE_TABLE_NAME=liturgists.ukiahumc.org
```

Replace with your actual values:

```env
AIRTABLE_PAT_TOKEN=pat...
AIRTABLE_BASE_ID=app...
AIRTABLE_TABLE_NAME=liturgists.ukiahumc.org
```

### Step 3: Restart the Dev Server

After adding your credentials, restart the server:

```bash
npm run dev
```

---

## 📋 AIRTABLE TABLE STRUCTURE

Your Airtable table should have these fields:

| Field Name | Field Type | Options |
|------------|------------|---------|
| Service Date | Date | Date only |
| Display Date | Single line text | - |
| Name | Single line text | - |
| Email | Email | - |
| Phone | Phone number | - |
| Role | Single select | Liturgist, Backup, Attendance |
| Attendance Status | Single select | Yes, No, Maybe |
| Notes | Long text | - |
| Submitted At | Date | Include time |

---

## 🧪 TESTING

Once configured, test by:
1. Go to http://localhost:3000
2. Click any signup button
3. Fill out the form
4. Submit
5. Check your Airtable base - the record should appear!

---

## 🆘 TROUBLESHOOTING

**Error: "Invalid API key"**
- Make sure you copied the full PAT token (starts with `pat`)
- Make sure there are no extra spaces

**Error: "Base not found"**
- Double-check your Base ID (starts with `app`)
- Make sure the PAT token has access to this base

**Records not appearing?**
- Check the table name matches exactly: `liturgists.ukiahumc.org`
- Check your Airtable table has all the required fields
