import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

vi.mock("./authHelper", () => ({ getToken: vi.fn() }));

import ProtectedRoute from "./ProtectedRoute";
import { getToken } from "./authHelper";

const mockedGetToken = getToken as unknown as ReturnType<typeof vi.fn>;

function renderAt(path = "/protected") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>secret content</div>} />
        </Route>
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    mockedGetToken.mockReset();
    localStorage.clear();
  });

  it("renders the protected outlet when a token exists", () => {
    mockedGetToken.mockReturnValue("some-token");
    renderAt();
    expect(screen.getByText("secret content")).toBeInTheDocument();
    expect(screen.queryByText("login page")).not.toBeInTheDocument();
  });

  it("redirects to /login when no token exists", () => {
    mockedGetToken.mockReturnValue(null);
    renderAt();
    expect(screen.getByText("login page")).toBeInTheDocument();
    expect(screen.queryByText("secret content")).not.toBeInTheDocument();
  });

  it("clears mustChangePWD from storage on redirect", () => {
    mockedGetToken.mockReturnValue(null);
    localStorage.setItem("mustChangePWD", "true");
    renderAt();
    expect(localStorage.getItem("mustChangePWD")).toBeNull();
  });
});
