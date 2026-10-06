"use client";

import { useId, useState } from "react";

export function useNetworkStrip() {
  const [listVisible, setListVisible] = useState(false);
  const contentId = useId();

  return {
    listVisible,
    contentId,
    toggleList: () => setListVisible((visible) => !visible),
  };
}
