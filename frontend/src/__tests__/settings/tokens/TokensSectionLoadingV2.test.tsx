import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { setUiVersion } from "../../../utils/uiVersion";

vi.mock("../../../settings/tokens/useTokens", () => ({
  useTokens: () => ({
    tokens: [],
    loading: true,
    walletsMap: {},
    revokingId: null,
    pausingId: null,
    selected: new Set<string>(),
    clearSelection: vi.fn(),
    bulkConfirm: false,
    setBulkConfirm: vi.fn(),
    bulkDeleting: false,
    bulkPausing: false,
    fetchTokens: vi.fn(),
    handleRevoke: vi.fn(),
    handlePauseToggle: vi.fn(),
    toggleSelect: vi.fn(),
    selectAll: vi.fn(),
    handleBulkDelete: vi.fn(),
    handleBulkPause: vi.fn(),
  }),
}));
vi.mock("../../../settings/tokens/useTokenDialog", () => ({
  useTokenDialog: () => ({ openCreate: vi.fn(), openEdit: vi.fn() }),
}));
vi.mock("../../../settings/tokens/TokenDialog", () => ({
  TokenDialog: () => null,
}));
vi.mock("../../../settings/tokens/McpConnectGuide", () => ({
  McpConnectGuide: () => null,
}));
vi.mock("../../../modals/common/DeleteModalContext", () => ({
  useDeleteModal: () => ({ current: null }),
}));

import { TokensSection } from "../../../settings/sections/TokensSection";

describe("TokensSection (v2 loading)", () => {
  beforeEach(() => {
    setUiVersion("v2");
  });

  it("shows token-row skeletons instead of a spinner", () => {
    const { container } = render(<TokensSection />);

    const pulses = container.querySelectorAll(".animate-pulse");
    // three rows, each with an icon chip and two text lines
    expect(pulses.length).toBe(9);
    expect(container.querySelector(".animate-spin")).toBeNull();
    expect(screen.queryByText("No tokens yet")).not.toBeInTheDocument();
  });
});
