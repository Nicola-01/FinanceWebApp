import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import {
  useLongPressSelect,
  LONG_PRESS_MS,
} from "../../../components/pat/useLongPressSelect";

function Row({
  onLongPress,
  onQuickClick,
}: {
  onLongPress: () => void;
  onQuickClick: () => void;
}) {
  const handlers = useLongPressSelect(onLongPress, onQuickClick);
  return (
    <div data-testid="row" {...handlers}>
      <button>inner</button>
    </div>
  );
}

const setup = () => {
  const onLongPress = vi.fn();
  const onQuickClick = vi.fn();
  const utils = render(
    <Row onLongPress={onLongPress} onQuickClick={onQuickClick} />,
  );
  return { ...utils, onLongPress, onQuickClick, row: utils.getByTestId("row") };
};

describe("useLongPressSelect", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fires onLongPress after the hold and swallows the following click", () => {
    const { row, onLongPress, onQuickClick } = setup();
    fireEvent.pointerDown(row, { clientX: 0, clientY: 0 });
    act(() => vi.advanceTimersByTime(LONG_PRESS_MS));
    expect(onLongPress).toHaveBeenCalledTimes(1);
    fireEvent.click(row);
    expect(onQuickClick).not.toHaveBeenCalled();
    fireEvent.click(row);
    expect(onQuickClick).toHaveBeenCalledTimes(1);
  });

  it("cancels the hold when released early or moved", () => {
    const { row, onLongPress } = setup();
    fireEvent.pointerDown(row, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(row);
    act(() => vi.advanceTimersByTime(LONG_PRESS_MS));
    fireEvent.pointerDown(row, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(row, { clientX: 20, clientY: 0 });
    act(() => vi.advanceTimersByTime(LONG_PRESS_MS));
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("ignores presses and clicks that start on a nested button", () => {
    const { getByText, onLongPress, onQuickClick } = setup();
    const btn = getByText("inner");
    fireEvent.pointerDown(btn);
    act(() => vi.advanceTimersByTime(LONG_PRESS_MS));
    fireEvent.click(btn);
    expect(onLongPress).not.toHaveBeenCalled();
    expect(onQuickClick).not.toHaveBeenCalled();
  });
});
