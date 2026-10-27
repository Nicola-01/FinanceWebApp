import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { useRef } from "react";
import { useOutsideClick } from "../../hooks/useOutsideClick";

const Harness = ({
  onOutside,
  enabled,
}: {
  onOutside: (e: MouseEvent) => void;
  enabled?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, onOutside, enabled);
  return (
    <div>
      <div ref={ref} data-testid="inside">
        <span data-testid="child" />
      </div>
      <div data-testid="outside" />
    </div>
  );
};

describe("useOutsideClick", () => {
  it("fires on a mousedown outside the ref, not inside it", () => {
    const onOutside = vi.fn();
    const { getByTestId } = render(<Harness onOutside={onOutside} />);
    fireEvent.mouseDown(getByTestId("child"));
    fireEvent.mouseDown(getByTestId("inside"));
    expect(onOutside).not.toHaveBeenCalled();
    fireEvent.mouseDown(getByTestId("outside"));
    expect(onOutside).toHaveBeenCalledTimes(1);
  });

  it("does not listen while disabled", () => {
    const onOutside = vi.fn();
    const { getByTestId } = render(
      <Harness onOutside={onOutside} enabled={false} />,
    );
    fireEvent.mouseDown(getByTestId("outside"));
    expect(onOutside).not.toHaveBeenCalled();
  });

  it("always calls the latest handler", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { getByTestId, rerender } = render(<Harness onOutside={first} />);
    rerender(<Harness onOutside={second} />);
    fireEvent.mouseDown(getByTestId("outside"));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
