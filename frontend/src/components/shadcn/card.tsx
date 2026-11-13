import type React from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "@/lib/utils";

export const Card = (
  props: React.ComponentProps<"div"> & {
    size?: "default" | "sm";
  },
) => {
  const { className, size = "default", ...rest } = props;

  return (
    <div
      className={cn(
        "ring-foreground/10 bg-card text-card-foreground gap-(--card-spacing) overflow-hidden rounded-xl py-(--card-spacing) text-sm ring-1 [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl group/card flex flex-col",
        className,
      )}
      data-size={size}
      data-slot="card"
      {...rest}
    />
  );
};

export const cardMediaVariants = tv({
  base: [
    "flex shrink-0 items-center gap-2",
    "[&_svg]:pointer-events-none",
    "px-(--card-spacing)",
  ],
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: "bg-transparent",
      icon: "[&_svg:not([class*='size-'])]:size-4",
      image: [
        "overflow-hidden rounded-t-sm",
        "px-0",
        "[&_img]:size-full [&_img]:object-cover",
      ],
    },
  },
});

export interface CardMediaProps
  extends React.ComponentProps<"div">, VariantProps<typeof cardMediaVariants> {}

export const CardMedia = (props: CardMediaProps) => {
  const { variant = "default", className, ...rest } = props;

  return (
    <div
      className={cn(cardMediaVariants({ variant }), className)}
      data-slot="card-media"
      data-variant={variant}
      {...rest}
    />
  );
};

export interface CardHeaderProps extends React.ComponentProps<"div"> {
  /**
   * The description of the card
   */
  description?: string;
  /**
   * The title of the card
   */
  title?: string;
}

export const CardHeader = (props: CardHeaderProps) => {
  const { title, description, className, children, ...rest } = props;

  return (
    <div
      className={cn(
        "gap-1 rounded-t-xl px-(--card-spacing) [.border-b]:pb-(--card-spacing) group/card-header @container/card-header grid auto-rows-min items-start has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]",
        className,
      )}
      data-slot="card-header"
      {...rest}
    >
      {!!title && <CardTitle>{title}</CardTitle>}
      {!title && typeof children === "string" ? (
        <CardTitle>{children}</CardTitle>
      ) : null}
      {!!description && <CardDescription>{description}</CardDescription>}
      {!title && typeof children === "string" ? null : children}
    </div>
  );
};

export const CardTitle = (props: React.ComponentProps<"h2">) => {
  const { className, ...rest } = props;

  return (
    <h2
      className={cn(
        "text-base leading-snug font-medium group-data-[size=sm]/card:text-sm font-heading",
        className,
      )}
      data-slot="card-title"
      {...rest}
    />
  );
};

export const CardDescription = (props: React.ComponentProps<"div">) => {
  const { className, ...rest } = props;

  return (
    <div
      className={cn("text-muted-foreground text-sm", className)}
      data-slot="card-description"
      {...rest}
    />
  );
};

export const CardAction = (props: React.ComponentProps<"div">) => {
  const { className, ...rest } = props;

  return (
    <div
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      data-slot="card-action"
      {...rest}
    />
  );
};

export const CardContent = (props: React.ComponentProps<"div">) => {
  const { className, ...rest } = props;

  return (
    <div
      className={cn("px-(--card-spacing)", className)}
      data-slot="card-content"
      {...rest}
    />
  );
};

export const CardFooter = (props: React.ComponentProps<"div">) => {
  const { className, ...rest } = props;

  return (
    <div
      className={cn(
        "bg-muted/50 rounded-b-xl border-t p-(--card-spacing) flex items-center",
        className,
      )}
      data-slot="card-footer"
      {...rest}
    />
  );
};
