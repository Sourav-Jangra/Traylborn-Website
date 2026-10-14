import { Fragment } from "react";
import { Accent } from "@/components/layout/section-heading";

/** Renders admin title text: "*words*" become the accent style and line breaks are kept. */
export function RichTitle({ text, accentClassName }: { text: string; accentClassName?: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line.split("*").map((part, j) =>
            j % 2 === 1 ? (
              <Accent key={j} className={accentClassName}>{part}</Accent>
            ) : (
              <Fragment key={j}>{part}</Fragment>
            ),
          )}
        </Fragment>
      ))}
    </>
  );
}

/** The same text as plain words, for alt text, labels and admin lists. */
export function plainTitle(text: string) {
  return text.replace(/\*/g, "").replace(/\s*\n\s*/g, " ");
}
