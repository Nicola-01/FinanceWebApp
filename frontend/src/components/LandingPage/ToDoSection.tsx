import React from "react";
import { ArrowRight, ListChecks } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ToDoSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-4 max-w-5xl mx-auto z-10 relative">
      <div className="bg-gradient-to-br from-app-input/40 to-transparent border border-app-border rounded-3xl p-8 md:p-12 backdrop-blur-sm shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8 md:gap-12">
        {/* Background flare */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-app-purple/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand-1)]/25 to-[var(--brand-2)]/25 border border-app-border flex items-center justify-center shrink-0">
          <ListChecks className="w-8 h-8 text-app-purple" />
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl font-bold mb-3">
            Curious about what's next?
          </h2>
          <p className="text-app-muted text-lg leading-relaxed">
            I'm continuously building and iterating on this project. Take a look
            at the roadmap to see what features are currently in progress, what
            I've recently shipped, and where I'm heading next.
          </p>
        </div>

        <div className="shrink-0">
          <button
            onClick={() => navigate("/ToDo")}
            className="bg-app-hover hover:bg-white/20 border border-app-border font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center gap-2 group"
          >
            View Roadmap
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ToDoSection;
