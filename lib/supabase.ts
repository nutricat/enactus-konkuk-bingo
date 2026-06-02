import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Participant = {
  id: string
  name: string
  created_at: string
}

export type BingoCheck = {
  id: string
  participant_id: string
  cell_index: number
  checked: boolean
  updated_at: string
}
