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
  const mode = html.getAttribute("data-theme-mode") ?? "light";
  return (
    <div>
      <span data-testid="theme-mode">{mode}</span>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme-mode");
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

  it("sets data-theme-mode to dark when theme is dark", () => {
    localStorage.setItem("theme", "dark");
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );
    expect(document.documentElement.getAttribute("data-theme-mode")).toBe("dark");
  });

  it("sets data-theme-mode to light when theme is light", () => {
    localStorage.setItem("theme", "light");
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );
    expect(document.documentElement.getAttribute("data-theme-mode")).toBe("light");
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
    expect(document.documentElement.getAttribute("data-theme-mode")).toBe("dark");
  });

  it("switches data-theme-mode from dark to light", async () => {
    localStorage.setItem("theme", "dark");
    document.documentElement.setAttribute("data-theme-mode", "dark");

    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeSelectForm />
      </ThemeProvider>
    );

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "light");

    expect(localStorage.getItem("theme")).toBe("light");
    expect(document.documentElement.getAttribute("data-theme-mode")).toBe("light");
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