/**
 * Script to clean all resumes from storage and database
 * Run with: node scripts/clean-resumes.js
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

async function cleanResumes() {
  console.log('🧹 Starting cleanup...\n');
  
  // 1. List all files in resumes bucket
  console.log('📂 Listing files in resumes bucket...');
  const { data: files, error: listError } = await supabase.storage
    .from('resumes')
    .list('', {
      limit: 1000,
      offset: 0,
    });
  
  if (listError) {
    console.error('❌ Error listing files:', listError);
    return;
  }
  
  if (!files || files.length === 0) {
    console.log('✅ No files found in resumes bucket');
  } else {
    console.log(`Found ${files.length} items in root`);
    
    // Get all files from all folders
    const allFilePaths = [];
    
    for (const item of files) {
      if (item.name) {
        // This is a folder, list files inside it
        const { data: folderFiles, error: folderError } = await supabase.storage
          .from('resumes')
          .list(item.name, {
            limit: 1000,
            offset: 0,
          });
        
        if (!folderError && folderFiles) {
          for (const file of folderFiles) {
            if (file.name) {
              allFilePaths.push(`${item.name}/${file.name}`);
            }
          }
        }
      }
    }
    
    console.log(`Found ${allFilePaths.length} files to delete`);
    
    if (allFilePaths.length > 0) {
      console.log('🗑️  Deleting files from storage...');
      const { error: deleteError } = await supabase.storage
        .from('resumes')
        .remove(allFilePaths);
      
      if (deleteError) {
        console.error('❌ Error deleting files:', deleteError);
      } else {
        console.log(`✅ Deleted ${allFilePaths.length} files from storage`);
      }
    }
  }
  
  // 2. Clear resume data from user_profiles
  console.log('\n🗄️  Clearing resume data from user_profiles...');
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({
      resume_url: null,
      parsed_resume_data: null,
      resume_parsed_at: null,
      resume_parsing_error: null,
      updated_at: new Date().toISOString()
    })
    .not('resume_url', 'is', null);
  
  if (updateError) {
    console.error('❌ Error updating user_profiles:', updateError);
  } else {
    console.log('✅ Cleared resume data from user_profiles');
  }
  
  // 3. Clear resume parsing jobs (if table exists)
  console.log('\n🔄 Clearing resume parsing jobs...');
  const { error: deleteJobsError } = await supabase
    .from('resume_parsing_jobs')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
  
  if (deleteJobsError) {
    if (deleteJobsError.code === '42P01') {
      console.log('⚠️  resume_parsing_jobs table does not exist (skipping)');
    } else {
      console.error('❌ Error deleting parsing jobs:', deleteJobsError);
    }
  } else {
    console.log('✅ Cleared resume parsing jobs');
  }
  
  console.log('\n✨ Cleanup complete!');
}

cleanResumes().catch(console.error);
