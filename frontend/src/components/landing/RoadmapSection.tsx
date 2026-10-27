import React from "react";
import { ArrowRight, ListChecks } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";

/**
 * "Always improving" section — points visitors at the public roadmap (/ToDo).
 */
const RoadmapSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4 max-w-5xl mx-auto">
      <div className="bg-gradient-to-br from-app-input/50 to-transparent border border-app-border rounded-[var(--r-card)] p-8 md:p-12 backdrop-blur-sm shadow-[0_20px_60px_-30px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center gap-8 md:gap-12">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand-1)]/25 to-[var(--brand-2)]/25 border border-app-border flex items-center justify-center shrink-0">
          <ListChecks className="w-8 h-8 text-app-purple" />
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl font-bold mb-3 text-app-text">
            Built in the open, always improving.
          </h2>
          <p className="text-app-muted text-lg leading-relaxed">
            This is a personal project under active development. Check the
            roadmap to see what's in progress, what shipped recently, and where
            it's heading next.
          </p>
        </div>

        <div className="shrink-0">
          <Button
            variant="secondary"
            size="md"
            className="group"
            onClick={() => navigate("/ToDo")}
          >
            View roadmap
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RoadmapSection;
