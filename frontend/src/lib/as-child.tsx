import {
  cloneElement,
  createElement,
  isValidElement,
  type JSX,
  type ReactElement,
} from "react";
import { cn } from "@/lib/utils";

type PolyProps<T extends keyof JSX.IntrinsicElements> =
  JSX.IntrinsicElements[T] & {
    asChild?: boolean;
  };

export const createPolymorphic = <T extends keyof JSX.IntrinsicElements>(
  tag: T,
) => {
  const Poly = (props: PolyProps<T>) => {
    const { asChild, className, children, ...rest } = props;

    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<{ className?: string }>;

      return cloneElement(child, {
        ...rest,
        className: cn(className, child.props.className),
      });
    }

    return createElement(tag, { ...rest, className }, children);
  };

  return Poly;
};
