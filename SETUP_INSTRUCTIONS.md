# 🚀 Complete Supabase Database Setup

## You Need to Run 2 SQL Files in Order

### Step 1: Create Tables (Migration)
1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/hbehelmqrzrnlmnhryfu/sql/new
2. Open this file in your code editor: `supabase/migrations/20240001_furniture_catalog.sql`
3. Select ALL (Ctrl+A) and Copy (Ctrl+C)
4. Paste into Supabase SQL Editor (Ctrl+V)
5. Click the green **"RUN"** button
6. Wait for "Success. No rows returned" message

### Step 2: Insert Seed Data
1. Keep the SQL Editor open (or open a new query)
2. **Clear the editor** (select all and delete)
3. Open this file: `supabase/seed/mock_ontario_furniture.sql`
4. Select ALL (Ctrl+A) and Copy (Ctrl+C)
5. Paste into Supabase SQL Editor (Ctrl+V)
6. Click **"RUN"** again
7. You should see success messages showing rows inserted

### Step 3: Verify
Run this command in your terminal:
```bash
node scripts/connect-supabase.mjs
```

You should see all 10 tables with data!

---

## What Gets Created

### 10 Tables:
1. `stores` - 5 Ontario furniture stores
2. `store_locations` - Physical locations
3. `products` - 12 furniture products
4. `product_dimensions` - Size data for all products
5. `product_attributes` - Colors, materials, styles
6. `product_embeddings` - For AI search (empty for now)
7. `scrape_jobs` - Ingestion tracking
8. `scrape_job_items` - Individual scrape results
9. `room_photos` - User uploads (future)
10. `furniture_request_logs` - Search analytics

### Sample Data:
- **5 Stores**: Maple & Oak, Great Lakes Home Goods, Northern Comfort, Lakeshore Living, Article
- **12 Products**: Sofas, tables, chairs, bookshelves with full details

---

## Troubleshooting

### "Extension does not exist"
This is fine - Supabase will create the extensions automatically.

### "Relation already exists"
Tables already exist! Skip to Step 2 (seed data).

### "Permission denied"
Make sure you're logged into the correct Supabase account.

---

## After Setup

View your tables:
- https://supabase.com/dashboard/project/hbehelmqrzrnlmnhryfu/editor

Test in browser console:
```javascript
import { searchProducts } from '@/services/furnitureSearchService';
const sofas = await searchProducts({ category: 'sofa' });
console.log(sofas);
```
