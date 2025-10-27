# 🚀 Vercel Deployment Instructions

## Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Add Airtable integration"
git push origin main
```

---

## Step 2: Deploy to Vercel

1. **Go to:** https://vercel.com
2. **Sign in** with GitHub
3. **Click "Add New Project"**
4. **Import your repository:** `samuelmholley1/liturgists.ukiahumc.org`
5. **Click "Deploy"** (don't add env vars yet, we'll do that next)

---

## Step 3: Add Environment Variables in Vercel

After your first deployment:

1. **Go to your project** in Vercel dashboard
2. **Click "Settings"** tab
3. **Click "Environment Variables"** in left sidebar
4. **Add these THREE variables:**

### Variable 1:
- **Name:** `AIRTABLE_PAT_TOKEN`
- **Value:** `[YOUR_PAT_TOKEN - starts with pat...]`
- **Environment:** Check all boxes (Production, Preview, Development)
- Click "Save"

### Variable 2:
- **Name:** `AIRTABLE_BASE_ID`
- **Value:** `[YOUR_BASE_ID_HERE - starts with app...]`
- **Environment:** Check all boxes (Production, Preview, Development)
- Click "Save"

### Variable 3:
- **Name:** `AIRTABLE_TABLE_NAME`
- **Value:** `liturgists.ukiahumc.org`
- **Environment:** Check all boxes (Production, Preview, Development)
- Click "Save"

---

## Step 4: Redeploy

After adding environment variables:

1. **Go to "Deployments"** tab
2. **Find your latest deployment**
3. **Click the three dots** (...) menu
4. **Click "Redeploy"**
5. **Check "Use existing Build Cache"**
6. **Click "Redeploy"**

---

## Step 5: Test Your Live Site!

Once redeployed:
1. Visit your production URL (something like `liturgists-ukiahumc-org.vercel.app`)
2. Try signing up
3. Check your Airtable - the data should appear!

---

## 🎉 YOU'RE LIVE!

Your site is now deployed and connected to Airtable. Every signup will be saved automatically!

---

## 🔄 Future Updates

Whenever you make code changes:
```bash
git add .
git commit -m "Your change description"
git push origin main
```

Vercel will automatically redeploy! 🚀
