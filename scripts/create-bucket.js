/**
 * Script to manually create the resumes storage bucket
 * Run with: node scripts/create-bucket.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createBucket() {
  console.log('🔍 Checking if resumes bucket exists...');
  
  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('❌ Error listing buckets:', listError);
    return;
  }
  
  const bucketExists = buckets.some(b => b.name === 'resumes');
  
  if (bucketExists) {
    console.log('✅ Resumes bucket already exists!');
    return;
  }
  
  console.log('📦 Creating resumes bucket...');
  
  // Create bucket
  const { data: bucket, error: createError } = await supabase.storage.createBucket('resumes', {
    public: false,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  });
  
  if (createError) {
    console.error('❌ Error creating bucket:', createError);
    return;
  }
  
  console.log('✅ Resumes bucket created successfully!');
  console.log('Bucket:', bucket);
}

createBucket().catch(console.error);
