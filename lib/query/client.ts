import { QueryClient } from "@tanstack/react-query";
import { DemoApiError } from "@/lib/http/request";

/** Each authenticated provider tree owns its cache; credentials never enter query keys. */
export function createDemoQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failures, error) =>
          failures < 1 &&
          !(error instanceof DemoApiError && error.status >= 400 && error.status < 500),
        refetchOnWindowFocus: false,
        staleTime: 15_000,
      },
    },
  });
}
