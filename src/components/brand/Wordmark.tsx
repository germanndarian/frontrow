import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * FRONTROW wordmark. The mark is the stadium logo (a top-down ground inside its
 * stands) in a rounded tile. Display type, tight tracking, FRONT solid + ROW muted.
 */
export function Wordmark({
  className,
  showMark = true,
}: {
  className?: string;
  showMark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {showMark && (
        <Image
          src="/stadium-logo.png"
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 rounded-[8px] object-cover ring-1 ring-inset ring-line"
        />
      )}
      <span className="font-display text-[19px] font-extrabold leading-none tracking-[-0.02em] text-ink">
        FRONT<span className="text-muted">ROW</span>
      </span>
    </span>
  );
}
