import React from "react";
import { CategoryIcon } from "../../ui/CategoryIcon";
import { V2_TRUST_ITEMS } from "../landingDemoData";

/** UI v2 trust section: open source, self-hostable, no ads, bring your history. */
const TrustV2: React.FC = () => (
  <section className="border-t border-app-border px-4 py-14 lg:px-8 lg:py-20">
    <div className="mx-auto max-w-6xl">
      <p className="mb-3 text-[13px] font-semibold text-app-muted">Trust</p>
      <h2 className="font-display text-[32px] leading-[1.08] font-semibold tracking-[-0.03em] text-app-text lg:text-[42px]">
        Your data stays yours.
      </h2>

      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
        {V2_TRUST_ITEMS.map((item) => (
          <div
            key={item.title}
            className="flex flex-col gap-3.5 border-t border-app-border pt-5"
          >
            <CategoryIcon icon={item.icon} color={item.color} />
            <h3 className="font-display text-lg font-semibold text-app-text">
              {item.title}
            </h3>
            <p className="text-sm leading-normal text-app-muted">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustV2;
