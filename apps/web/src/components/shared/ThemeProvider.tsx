"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

function SystemThemeForcer({ children }: { children: React.ReactNode }) {
  const { setTheme, theme } = useTheme();
  React.useEffect(() => {
    if (theme !== "system") {
      setTheme("system");
    }
  }, [theme, setTheme]);
  return <>{children}</>;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <SystemThemeForcer>{children}</SystemThemeForcer>
    </NextThemesProvider>
  );
}
