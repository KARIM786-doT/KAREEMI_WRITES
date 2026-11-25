import { getSupabase, isSupabaseConfigured } from "./supabase-client.js";
export async function requireAdmin(){
 if(!isSupabaseConfigured)throw new Error("Supabase is not configured. Admin access is unavailable in demo mode.");
 const supabase=await getSupabase();const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user){location.replace("../login.html");return null;}
 const {data:profile,error:profileError}=await supabase.from("profiles").select("role,full_name").eq("id",user.id).maybeSingle();
 if(profileError||profile?.role!=="admin"){await supabase.auth.signOut();location.replace("../login.html?restricted=1");return null;}
 return {supabase,user,profile};
}
export async function signOut(){const supabase=await getSupabase();if(supabase)await supabase.auth.signOut();location.href="../index.html";}
