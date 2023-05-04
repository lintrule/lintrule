import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = "https://tnonfjjphxbjghwnbero.supabase.co";

const key = Deno.env.get("SUPABASE_KEY");
const supabase = createClient(supabaseUrl, supabaseKey);
