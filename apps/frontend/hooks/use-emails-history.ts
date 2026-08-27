import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useEmailsHistory() {
  return useQuery({
    queryKey: ["emails-history"],
    queryFn: async () => {
      const res = await api.get("/admin/emails/history");
      return res.data;
    },
    refetchInterval: 5000,
  });
}