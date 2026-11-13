import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import { DropdownManageButton } from "../../../components/ui/DropdownManageButton";
import { setUiVersion } from "../../../utils/uiVersion";

describe("DropdownManageButton", () => {
  it("keeps the v1 dashed border by default", () => {
    render(
      <DropdownManageButton
        icon={faGear}
        label="Manage tags"
        onClick={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Manage tags" })).toHaveClass(
      "border-dashed",
    );
  });

  describe("v2", () => {
    beforeEach(() => setUiVersion("v2"));
    afterEach(() => setUiVersion("v1"));

    it("drops the dashed border for a raised hover row", () => {
      render(
        <DropdownManageButton
          icon={faGear}
          label="Manage tags"
          onClick={() => {}}
        />,
      );
      const btn = screen.getByRole("button", { name: "Manage tags" });
      expect(btn).toHaveClass("hover:bg-app-raised");
      expect(btn.classList.contains("border-dashed")).toBe(false);
      expect(btn.classList.contains("border")).toBe(false);
    });

    it("still fires onClick", () => {
      const onClick = vi.fn();
      render(
        <DropdownManageButton
          icon={faGear}
          label="Manage tags"
          onClick={onClick}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Manage tags" }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});
