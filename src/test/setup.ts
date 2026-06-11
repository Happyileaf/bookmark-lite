import "@testing-library/jest-dom/vitest";

const fn = () => {
  let _impl: ((...args: unknown[]) => unknown) | undefined;
  const mock = (...args: unknown[]) => _impl?.(...args);
  mock.mockImplementation = (impl: (...args: unknown[]) => unknown) => {
    _impl = impl;
    return mock;
  };
  return mock;
};

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: fn().mockImplementation((...args: unknown[]) => ({
    matches: false,
    media: String(args[0] ?? ""),
    onchange: null,
    addListener: fn(),
    removeListener: fn(),
    addEventListener: fn(),
    removeEventListener: fn(),
    dispatchEvent: fn(),
  })),
});