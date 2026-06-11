import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@/components/theme/theme-provider";

function ThemeAwareComponent() {
  return (
    <ThemeProvider>
      <ThemeDisplay />
    </ThemeProvider>
  );
}

function ThemeDisplay() {
  const html = document.documentElement;
  const isDark = html.classList.contains("dark");
  return (
    <div>
      <span data-testid="theme-class">{isDark ? "dark" : "light"}</span>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
    localStorage.clear();
  });

  it("renders children without crashing", () => {
    render(
      <ThemeProvider>
        <div>Hello</div>
      </ThemeProvider>
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("applies dark class to html element when theme is dark", () => {
    localStorage.setItem("theme", "dark");
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("does not apply dark class when theme is light", () => {
    localStorage.setItem("theme", "light");
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("persists theme preference to localStorage on change", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeSelectForm />
      </ThemeProvider>
    );

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "dark");

    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes dark class when switching from dark to light", async () => {
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add("dark");

    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeSelectForm />
      </ThemeProvider>
    );

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "light");

    expect(localStorage.getItem("theme")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});

import { useTheme } from "next-themes";

function ThemeSelectForm() {
  const { theme, setTheme } = useTheme();
  return (
    <select
      value={theme ?? "system"}
      onChange={(e) => setTheme(e.target.value)}
      aria-label="选择主题"
      role="combobox"
    >
      <option value="system">跟随系统</option>
      <option value="light">浅色</option>
      <option value="dark">深色</option>
    </select>
  );
}