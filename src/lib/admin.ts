import { supabase } from "@/integrations/supabase/client";

const ADMIN_EMAILS = ["newarcstyle@gmail.com"];

export async function isAdmin(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) return false;

    return ADMIN_EMAILS.includes(user.email.toLowerCase());
}

export async function requireAdmin() {
    const admin = await isAdmin();
    if (!admin) {
        throw new Error("Unauthorized: Admin access required");
    }
    return true;
}
