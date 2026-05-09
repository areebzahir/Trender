# 🌱 Insert Seed Data into Supabase

## Current Status
✅ Database tables created (10 tables)  
❌ Seed data NOT inserted (tables are empty)

## Why Manual Insertion?
The RLS (Row Level Security) policies block writes using the anon key. The Supabase SQL Editor automatically uses the service role, which bypasses RLS.

---

## 📋 Quick Steps

### 1. Open Supabase SQL Editor
Click this link: [Open SQL Editor](https://supabase.com/dashboard/project/hbehelmqrzrnlmnhryfu/sql/new)

### 2. Copy the Seed SQL
Open this file in your editor:
```
supabase/seed/mock_ontario_furniture.sql
```

Select all (Ctrl+A) and copy (Ctrl+C)

### 3. Paste and Run
- Paste into the SQL Editor (Ctrl+V)
- Click the green "Run" button (or press Ctrl+Enter)

### 4. Verify Success
You should see messages like:
- ✅ "5 rows affected" (stores)
- ✅ "12 rows affected" (products)  
- ✅ "12 rows affected" (product_dimensions)
- ✅ "12 rows affected" (product_attributes)

### 5. Verify in Terminal
Run this command to confirm:
```bash
node scripts/insert-seed-data.mjs
```

You should see:
```
✅ Seed data already exists!

📦 Sample products:
   - Walnut Slab Coffee Table
   - Modern Beige Linen Sofa
   - Oak Bookshelf 5-Tier
   ...
```

---

## 🎯 What Gets Inserted

### 5 Ontario Furniture Stores
1. **Maple & Oak Furniture** (Toronto)
2. **Great Lakes Home Goods** (Mississauga)
3. **Northern Comfort Interiors** (Ottawa)
4. **Lakeshore Living Co.** (Hamilton)
5. **Article Canada** (Toronto)

### 12 Furniture Products
- Coffee tables, sofas, bookshelves
- Sectionals, TV stands, accent chairs
- Dining tables, bed frames, side tables
- With dimensions, colors, materials, styles

---

## 🔍 After Insertion

### Test in Browser Console
```javascript
import { searchProducts } from '@/services/furnitureSearchService';

// Search for sofas
const sofas = await searchProducts({ category: 'sofa' });
console.log(sofas);

// Search by style
const modern = await searchProducts({ styles: ['modern'] });
console.log(modern);
```

### Verify in Supabase Dashboard
- [View Stores Table](https://supabase.com/dashboard/project/hbehelmqrzrnlmnhryfu/editor/stores)
- [View Products Table](https://supabase.com/dashboard/project/hbehelmqrzrnlmnhryfu/editor/products)

---

## 🚀 Next Steps After Seed Data

1. ✅ Test product search in your app
2. ✅ Test the frontend furniture search service
3. ✅ Deploy Edge Functions (optional):
   ```bash
   supabase functions deploy search-products
   supabase functions deploy search-stores
   ```
4. ✅ Start building the ingestion pipeline for real data

---

## 💡 Troubleshooting

### "Permission denied" or "RLS policy violation"
- Make sure you're using the SQL Editor in Supabase dashboard
- The SQL Editor automatically uses service role privileges

### "Duplicate key value violates unique constraint"
- Seed data already exists! Run verification script:
  ```bash
  node scripts/insert-seed-data.mjs
  ```

### "Table does not exist"
- Run the migration first:
  ```bash
  node scripts/connect-supabase.mjs
  ```
- Follow instructions to apply migration SQL

---

## 📞 Need Help?
If you encounter issues, check:
1. Supabase project is active
2. You're logged into the correct Supabase account
3. The project URL matches: `hbehelmqrzrnlmnhryfu.supabase.co`
