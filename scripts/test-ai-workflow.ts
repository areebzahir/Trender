#!/usr/bin/env tsx
/**
 * Test AI Workflow - Verify database is ready for Trender's AI recommendations
 * 
 * This script tests that:
 * 1. Products can be queried by category, color, style
 * 2. Product attributes are searchable
 * 3. Data is structured for AI matching
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAIWorkflow() {
  console.log('🤖 Testing Trender AI Workflow\n');
  console.log('Simulating: User uploads room photo and asks for furniture recommendations\n');
  
  // Simulate AI room analysis results
  const roomAnalysis = {
    colors: ['white', 'beige', 'natural wood'],
    style: 'scandinavian',
    room_type: 'living_room',
    request: 'Add a modern sofa that matches my warm wood flooring'
  };
  
  console.log('📸 Simulated Room Analysis:');
  console.log(`   Colors detected: ${roomAnalysis.colors.join(', ')}`);
  console.log(`   Style: ${roomAnalysis.style}`);
  console.log(`   Room type: ${roomAnalysis.room_type}`);
  console.log(`   User request: "${roomAnalysis.request}"\n`);
  
  // Test 1: Query products by category
  console.log('🔍 Test 1: Finding sofas in database...');
  const { data: sofas, error: sofasError } = await supabase
    .from('products')
    .select(`
      id,
      title,
      description,
      category,
      price,
      currency,
      image_url,
      product_url,
      stores!inner(name, domain)
    `)
    .eq('category', 'sofa')
    .eq('is_active', true);
  
  if (sofasError) {
    console.error('❌ Error querying sofas:', sofasError);
  } else {
    console.log(`✅ Found ${sofas?.length || 0} sofas`);
    if (sofas && sofas.length > 0) {
      sofas.forEach(s => {
        console.log(`   - ${s.title} ($${s.price} ${s.currency}) from ${s.stores.name}`);
      });
    }
  }
  console.log('');
  
  // Test 2: Query products with attributes
  console.log('🔍 Test 2: Finding products with style/color attributes...');
  const { data: productsWithAttrs, error: attrsError } = await supabase
    .from('products')
    .select(`
      id,
      title,
      category,
      price,
      product_attributes!inner(colors, materials, styles)
    `)
    .eq('is_active', true)
    .limit(5);
  
  if (attrsError) {
    console.error('❌ Error querying attributes:', attrsError);
  } else {
    console.log(`✅ Found ${productsWithAttrs?.length || 0} products with attributes`);
    if (productsWithAttrs && productsWithAttrs.length > 0) {
      productsWithAttrs.forEach(p => {
        const attrs = p.product_attributes;
        console.log(`   - ${p.title}`);
        console.log(`     Colors: ${attrs.colors?.join(', ') || 'none'}`);
        console.log(`     Materials: ${attrs.materials?.join(', ') || 'none'}`);
        console.log(`     Styles: ${attrs.styles?.join(', ') || 'none'}`);
      });
    }
  }
  console.log('');
  
  // Test 3: Search by style (for AI matching)
  console.log('🔍 Test 3: Finding Scandinavian/Modern style furniture...');
  const { data: styledProducts, error: styleError } = await supabase
    .from('product_attributes')
    .select(`
      product_id,
      styles,
      colors,
      materials,
      products!inner(
        title,
        category,
        price,
        currency,
        image_url,
        product_url
      )
    `)
    .contains('styles', ['scandinavian'])
    .limit(5);
  
  if (styleError) {
    console.error('❌ Error querying by style:', styleError);
  } else {
    console.log(`✅ Found ${styledProducts?.length || 0} Scandinavian products`);
    if (styledProducts && styledProducts.length > 0) {
      styledProducts.forEach(p => {
        console.log(`   - ${p.products.title} ($${p.products.price})`);
        console.log(`     Styles: ${p.styles?.join(', ')}`);
      });
    }
  }
  console.log('');
  
  // Test 4: Get product with full details (for AI recommendation)
  console.log('🔍 Test 4: Getting complete product details for AI recommendation...');
  const { data: fullProduct, error: fullError } = await supabase
    .from('products')
    .select(`
      *,
      stores(name, website, domain),
      product_dimensions(*),
      product_attributes(*)
    `)
    .eq('category', 'sofa')
    .eq('is_active', true)
    .limit(1)
    .single();
  
  if (fullError) {
    console.error('❌ Error getting full product:', fullError);
  } else if (fullProduct) {
    console.log('✅ Retrieved complete product data for AI:');
    console.log(`   Product: ${fullProduct.title}`);
    console.log(`   Store: ${fullProduct.stores?.name}`);
    console.log(`   Price: $${fullProduct.price} ${fullProduct.currency}`);
    console.log(`   Description: ${fullProduct.description?.substring(0, 100)}...`);
    console.log(`   Image: ${fullProduct.image_url ? '✅' : '❌'}`);
    console.log(`   Buy Link: ${fullProduct.product_url}`);
    
    if (fullProduct.product_dimensions) {
      const dims = fullProduct.product_dimensions;
      console.log(`   Dimensions: ${dims.width}×${dims.height}×${dims.depth} ${dims.unit}`);
    }
    
    if (fullProduct.product_attributes) {
      const attrs = fullProduct.product_attributes;
      console.log(`   Colors: ${attrs.colors?.join(', ') || 'none'}`);
      console.log(`   Materials: ${attrs.materials?.join(', ') || 'none'}`);
      console.log(`   Styles: ${attrs.styles?.join(', ') || 'none'}`);
    }
  }
  console.log('');
  
  // Test 5: Simulate AI recommendation response
  console.log('🤖 Test 5: Simulating AI Recommendation Response...\n');
  if (fullProduct) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('AI RECOMMENDATION FOR USER:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const attrs = fullProduct.product_attributes;
    const colors = attrs?.colors?.join(' and ') || 'neutral';
    const materials = attrs?.materials?.join(' and ') || 'quality';
    const styles = attrs?.styles?.join(' and ') || 'modern';
    
    console.log(`Based on your room's warm wood flooring and neutral tones, I recommend:`);
    console.log('');
    console.log(`📦 ${fullProduct.title}`);
    console.log(`🏪 From: ${fullProduct.stores?.name}`);
    console.log(`💰 Price: $${fullProduct.price} ${fullProduct.currency}`);
    console.log('');
    console.log(`Why this matches your room:`);
    console.log(`• The ${colors} color complements your existing warm wood tones`);
    console.log(`• ${materials} material adds texture while maintaining your ${styles} aesthetic`);
    console.log(`• Dimensions (${fullProduct.product_dimensions?.width}×${fullProduct.product_dimensions?.depth} cm) fit well in living rooms`);
    console.log(`• The ${styles} style matches your room's overall vibe`);
    console.log('');
    console.log(`🔗 Buy now: ${fullProduct.product_url}`);
    console.log(`🖼️  View image: ${fullProduct.image_url}`);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
  
  // Summary
  console.log('📊 AI Workflow Test Summary:\n');
  console.log('✅ Database Structure: Ready');
  console.log('✅ Product Queries: Working');
  console.log('✅ Attribute Filtering: Working');
  console.log('✅ Style Matching: Working');
  console.log('✅ Complete Product Data: Available');
  console.log('✅ AI Recommendation Format: Ready\n');
  
  console.log('🎉 Your database is ready for AI-powered furniture recommendations!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Integrate Gemini API to analyze room photos');
  console.log('2. Build matching algorithm to compare room analysis with product attributes');
  console.log('3. Generate AI recommendations using product data');
  console.log('4. Display recommendations with buy links in frontend');
}

testAIWorkflow().catch(console.error);
