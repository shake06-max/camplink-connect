import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useCartCount = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const reload = async () => {
    if (!user) return setCount(0);
    const { count: c } = await supabase
      .from("cart_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    setCount(c ?? 0);
  };

  useEffect(() => {
    reload();
    if (!user) return;
    const ch = supabase
      .channel("cart-" + user.id)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cart_items", filter: `user_id=eq.${user.id}` },
        () => reload()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id]);

  return count;
};
