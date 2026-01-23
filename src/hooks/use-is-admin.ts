import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

export function useIsAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["auth", "isAdmin", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (error) throw error;
      return Boolean(data);
    },
  });
}
