"use client";

import { useEffect } from "react";
import { isNativeApp } from "@/lib/native";

/**
 * Marks <html> with data-native="true" when the app is running inside the iOS
 * shell. Mounted once near the root; it renders nothing. Safe-area padding in
 * globals.css hangs off that attribute, so a browser — where the attribute is
 * never set — lays out exactly as it did before.
 */
export function NativeController() {
  useEffect(() => {
    if (isNativeApp()) document.documentElement.dataset.native = "true";
  }, []);

  return null;
}
