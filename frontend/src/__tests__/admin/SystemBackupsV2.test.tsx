import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  within,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import api from "../../api/axiosConfig";
import { setUiVersion } from "../../utils/uiVersion";
import SystemTab from "../../admin/SystemTab";
import Backups from "../../admin/Backups";

vi.mock("../../api/axiosConfig", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock("../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

const mockedGet = api.get as unknown as ReturnType<typeof vi.fn>;
const mockedPost = api.post as unknown as ReturnType<typeof vi.fn>;
const mockedDelete = api.delete as unknown as ReturnType<typeof vi.fn>;

const run = (status: string, message: string | null = null) => ({
  startedAt: "2026-11-20T02:00:00Z",
  finishedAt: null,
  status,
  message,
  durationMs: 1200,
  manual: false,
});

const job = (key: string, displayName: string, recentRuns: unknown[] = []) => ({
  key,
  displayName,
  enabled: true,
  frequency: "DAILY",
  hourOfDay: 2,
  minuteOfHour: 0,
  daysOfWeek: [],
  dayOfMonth: null,
  monthOfYear: null,
  nextRunAt: "2026-11-22T02:00:00Z",
  recentRuns,
});

const JOBS = [
  job("subscriptions", "Subscriptions", [run("SUCCESS")]),
  job("backup", "database backup", [run("FAILURE", "disk full")]),
  job("demo-cleanup", "Demo cleanup"),
];

/** Job names in the order they appear in the list (read from the row toggles). */
const jobOrder = () =>
  screen
    .getAllByRole("button", { name: /^Show details for / })
    .map((b) => b.getAttribute("aria-label")!.replace("Show details for ", ""));

describe("System tab (v2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setUiVersion("v2");
    mockedGet.mockResolvedValue({ data: JOBS });
    mockedPost.mockResolvedValue({});
  });

  afterEach(() => setUiVersion("v1"));

  it("lists jobs alphabetically (case-insensitive) by default", async () => {
    render(<SystemTab />);
    await waitFor(() =>
      expect(jobOrder()).toEqual([
        "database backup",
        "Demo cleanup",
        "Subscriptions",
      ]),
    );
  });

  it("reorders when the sort changes", async () => {
    render(<SystemTab />);
    await waitFor(() => expect(jobOrder()).toHaveLength(3));

    fireEvent.click(screen.getByRole("tab", { name: "Status" }));
    expect(jobOrder()[0]).toBe("database backup"); // failed first

    fireEvent.click(screen.getByRole("button", { name: "Reverse order" }));
    expect(jobOrder()[2]).toBe("database backup");
  });

  it("runs a job from its expanded panel and shows its run history", async () => {
    render(<SystemTab />);
    await waitFor(() => expect(jobOrder()).toHaveLength(3));
    expect(screen.getAllByText("Daily at 02:00")).toHaveLength(3);

    expect(screen.queryByText("Recent runs")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Show details for database backup" }),
    );

    // History is shown for the expanded job only.
    expect(screen.getByText("Recent runs")).toBeInTheDocument();
    expect(screen.getByText("disk full")).toBeInTheDocument();

    const panel = document.getElementById("job-panel-backup")!;
    fireEvent.click(within(panel).getByRole("button", { name: "Run now" }));
    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith("/admin/jobs/backup/run"),
    );
  });
});

describe("Backups (v2)", () => {
  let modalRoot: HTMLDivElement;

  beforeEach(() => {
    // ModalDialog portals into #modal-root; jsdom lacks the <dialog> API.
    modalRoot = document.createElement("div");
    modalRoot.id = "modal-root";
    document.body.appendChild(modalRoot);
    HTMLDialogElement.prototype.showModal = vi.fn(function (
      this: HTMLDialogElement,
    ) {
      this.setAttribute("open", "");
    });
    HTMLDialogElement.prototype.close = vi.fn(function (
      this: HTMLDialogElement,
    ) {
      this.removeAttribute("open");
    });
  });

  afterEach(() => modalRoot.remove());

  const entries = [
    { key: "daily_2026-11-20_02-00", lastModified: null, sizeBytes: 2048 },
    { key: "daily_2026-11-19_02-00", lastModified: null, sizeBytes: 2048 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    setUiVersion("v2");
    mockedGet.mockResolvedValue({ data: entries });
    mockedDelete.mockResolvedValue({});
  });

  afterEach(() => setUiVersion("v1"));

  it("renders snapshot rows and wires the row actions", async () => {
    render(<Backups />);
    await waitFor(() =>
      expect(
        screen.getAllByRole("checkbox", { name: /^Select (?!all)/ }),
      ).toHaveLength(2),
    );
    // The bulk-bar "Delete" comes first in the DOM; row deletes follow it.
    const rowDeletes = screen
      .getAllByRole("button", { name: "Delete" })
      .slice(1);
    expect(rowDeletes).toHaveLength(2);

    // Row delete opens the confirm modal; confirming calls the delete handler.
    fireEvent.click(rowDeletes[0]);
    fireEvent.click(
      await screen.findByRole("button", { name: "Delete backup" }),
    );
    await waitFor(() =>
      expect(mockedDelete).toHaveBeenCalledWith(
        `/admin/backup/${encodeURIComponent(entries[0].key)}`,
      ),
    );
  });

  it("runs a backup from the toolbar", async () => {
    render(<Backups />);
    await waitFor(() => expect(mockedGet).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /Run backup/ }));
    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith("/admin/backup"),
    );
  });
});
