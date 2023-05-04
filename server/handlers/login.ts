import { createClient } from "npm:@supabase/supabase-js@2";

export const handleLogin = async (request: Request): Promise<Response> => {
  const body = await request.json();
  return new Response("howdy partner", { status: 200 });
};
