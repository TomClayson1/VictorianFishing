import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error(
    '[Supabase] Missing environment variables.\n' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file\n' +
    'then restart the dev server.'
  )
}

export const supabase = createClient(url, key)

supabase
  .from('species_config')
  .select('slug')
  .limit(1)
  .then(({ data, error }) => {
    if (error) console.error('[Supabase] Connection failed:', error.message)
    else console.log('[Supabase] Connected ✓', data)
  })
