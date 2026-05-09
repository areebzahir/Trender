#!/usr/bin/env tsx
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function debug() {
  console.log('🔍 Debugging product_attributes table...\n');
  
  // Get all attributes
  const { data: attrs, error } = await supabase
    .from('product_attributes')
    .select('*');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${attrs?.length || 0} attribute records\n`);
  
  if (attrs && attrs.length > 0) {
    attrs.forEach((attr, i) => {
      console.log(`${i + 1}. Product ID: ${attr.product_id}`);
      console.log(`   Colors: ${JSON.stringify(attr.colors)}`);
      console.log(`   Materials: ${JSON.stringify(attr.materials)}`);
      console.log(`   Styles: ${JSON.stringify(attr.styles)}`);
      console.log(`   Room Types: ${JSON.stringify(attr.room_types)}`);
      console.log(`   Tags: ${JSON.stringify(attr.tags)}`);
      console.log('');
    });
  }
}

debug();
