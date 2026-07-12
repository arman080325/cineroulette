"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics-client";
import { getSessionId } from "@/lib/session";

export function AnalyticsInit() {
  useEffect(() => {
    initAnalytics(getSessionId());
  }, []);
  return null;
}