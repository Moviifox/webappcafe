import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wettjhnirxvedwaibalh.supabase.co'
const supabaseAnonKey = 'sb_publishable_n9PfuFzFOUm42sqz7ZupSA_yPp8WPR1'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
