import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NotificationBell } from "../../../header/notifications/NotificationBell";

describe("NotificationBell", () => {
  it("renders no amber dot when there are no unread notifications", () => {
    const { container } = render(
      <NotificationBell unreadCount={0} onOpen={() => {}} />,
    );
    expect(container.querySelector(".bg-amber-400")).toBeNull();
  });

  it("renders an amber dot when there are unread notifications", () => {
    const { container } = render(
      <NotificationBell unreadCount={3} onOpen={() => {}} />,
    );
    expect(container.querySelector(".bg-amber-400")).not.toBeNull();
  });

  it("opens the center on click", () => {
    const onOpen = vi.fn();
    render(<NotificationBell unreadCount={0} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
