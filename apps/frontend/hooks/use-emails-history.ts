import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useClearEmailsHistory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await api.post("/admin/emails/history/clear");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails-history"] });
      toast({
        title: "Đã xóa lịch sử",
        description: "Toàn bộ lịch sử gửi email đã được làm sạch.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi xóa lịch sử",
        description: error.response?.data?.message || "Đã có lỗi xảy ra",
        variant: "destructive",
      });
    },
  });
}
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