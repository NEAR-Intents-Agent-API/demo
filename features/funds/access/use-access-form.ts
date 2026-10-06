"use client";

import { useState } from "react";
import type { AccessDuration } from "./access-form-utils";

export function useAccessForm() {
  const [days, setDays] = useState<AccessDuration>(7);
  return { days, setDays };
}
