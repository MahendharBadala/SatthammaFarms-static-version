import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "../lib/productApi";

export default function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // Keep cache for 10 minutes
    refetchOnWindowFocus: false,
  });
}