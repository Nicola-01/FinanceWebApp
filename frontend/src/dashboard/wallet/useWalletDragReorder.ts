import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { Wallet } from "../../types/domain.ts";
import { writeWalletOrder } from "../../utils/walletOrder.ts";

/**
 * Drag-to-reorder for the wallet bar: dnd-kit sensors, the dragged id, the
 * handlers (which persist the new order) and the trailing-click swallow.
 */
export function useWalletDragReorder(
  setWallets: React.Dispatch<React.SetStateAction<Wallet[]>>,
) {
  const [activeId, setActiveId] = useState<string | null>(null);
  // The wallet cards are real <a> links (so mouse users get open-in-new-tab via
  // middle/right-click). dnd-kit leaves a synthetic `click` behind on drag
  // release, and that click would navigate — turning a reorder into a page
  // load. This flag lets us swallow exactly that one trailing click.
  const suppressNextClick = useRef(false);

  // Kill the trailing click in the capture phase, on `document`, BEFORE it can
  // reach any wallet-card link (or React's own handlers). It fires wherever the
  // pointer was released, so a per-card guard can't catch it reliably — this
  // one is authoritative because it's armed by dnd-kit's own drag lifecycle.
  useEffect(() => {
    const onClickCapture = (e: MouseEvent) => {
      if (suppressNextClick.current) {
        suppressNextClick.current = false;
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, []);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    // A real drag started (activation threshold met) → arm the click swallow.
    suppressNextClick.current = true;
  };

  // Disarm as a fallback: the browser fires the trailing `click` synchronously
  // right after `mouseup` (so onClickCapture consumes the flag first); this
  // clears it for the no-click case so a later genuine click isn't eaten.
  const disarmClickSuppress = () => {
    setTimeout(() => {
      suppressNextClick.current = false;
    }, 0);
  };

  // Persist the order when a drag ends.
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    disarmClickSuppress();
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWallets((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newArray = arrayMove(items, oldIndex, newIndex);
        writeWalletOrder(newArray.map((w) => w.id));
        return newArray;
      });
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    disarmClickSuppress();
  };

  return {
    activeId,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  };
}
