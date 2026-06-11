import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { SettingsViewClient } from "@/components/settings/settings-view-client";

// Mock the server action
vi.mock("@/actions/settings.actions", () => ({
  updateSettingsAction: vi.fn().mockResolvedValue(undefined),
}));

describe("SettingsViewClient", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
    localStorage.clear();
  });

  it("renders the settings form with correct labels", () => {
    render(
      <ThemeProvider>
        <SettingsViewClient
          scope="USER"
          currentTheme="system"
          trashRetentionDays={30}
          auditRetentionDays={90}
        />
      </ThemeProvider>
    );

    expect(screen.getByText("个人设置")).toBeInTheDocument();
    expect(screen.getByLabelText("主题")).toBeInTheDocument();
    expect(screen.getByLabelText("回收站保留天数")).toBeInTheDocument();
    expect(screen.getByLabelText("审计日志保留天数")).toBeInTheDocument();
  });

  it("renders global settings label for APP scope", () => {
    render(
      <ThemeProvider>
        <SettingsViewClient
          scope="APP"
          currentTheme="system"
          trashRetentionDays={30}
          auditRetentionDays={90}
        />
      </ThemeProvider>
    );

    expect(screen.getByText("全局设置")).toBeInTheDocument();
  });

  it("displays the current theme as default select value", () => {
    render(
      <ThemeProvider>
        <SettingsViewClient
          scope="USER"
          currentTheme="dark"
          trashRetentionDays={30}
          auditRetentionDays={90}
        />
      </ThemeProvider>
    );

    const themeSelect = screen.getByLabelText("主题") as HTMLSelectElement;
    expect(themeSelect.value).toBe("dark");
  });

  it("immediately applies theme change via next-themes when selecting dark", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <SettingsViewClient
          scope="USER"
          currentTheme="system"
          trashRetentionDays={30}
          auditRetentionDays={90}
        />
      </ThemeProvider>
    );

    const themeSelect = screen.getByLabelText("主题");
    await user.selectOptions(themeSelect, "dark");

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("removes dark class when switching to light theme", async () => {
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add("dark");

    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <SettingsViewClient
          scope="USER"
          currentTheme="dark"
          trashRetentionDays={30}
          auditRetentionDays={90}
        />
      </ThemeProvider>
    );

    const themeSelect = screen.getByLabelText("主题");
    await user.selectOptions(themeSelect, "light");

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("renders all three theme options", () => {
    render(
      <ThemeProvider>
        <SettingsViewClient
          scope="USER"
          currentTheme="system"
          trashRetentionDays={30}
          auditRetentionDays={90}
        />
      </ThemeProvider>
    );

    const themeSelect = screen.getByLabelText("主题");
    const options = themeSelect.querySelectorAll("option");
    expect(options.length).toBe(3);
    expect(options[0].textContent).toBe("跟随系统");
    expect(options[1].textContent).toBe("浅色");
    expect(options[2].textContent).toBe("深色");
  });

  it("has a submit button for saving settings", () => {
    render(
      <ThemeProvider>
        <SettingsViewClient
          scope="USER"
          currentTheme="system"
          trashRetentionDays={30}
          auditRetentionDays={90}
        />
      </ThemeProvider>
    );

    expect(screen.getByRole("button", { name: /保存设置/ })).toBeInTheDocument();
  });
});