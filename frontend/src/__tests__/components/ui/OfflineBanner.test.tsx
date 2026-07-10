import { describe, it, expect, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { OfflineBanner } from "../../../components/ui/OfflineBanner";
import { setOnline } from "../../../test/testUtils";

const OFFLINE_COPY =
  "You're offline — changes are saved locally and will sync when you reconnect.";

describe("OfflineBanner", () => {
  afterEach(() => setOnline(true));

  it("renders nothing while online", () => {
    setOnline(true);
    render(<OfflineBanner />);
    expect(screen.queryByText(OFFLINE_COPY)).not.toBeInTheDocument();
  });

  it("shows the strip when the browser goes offline", () => {
    setOnline(true);
    render(<OfflineBanner />);
    expect(screen.queryByText(OFFLINE_COPY)).not.toBeInTheDocument();

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByText(OFFLINE_COPY)).toBeInTheDocument();
  });
});
