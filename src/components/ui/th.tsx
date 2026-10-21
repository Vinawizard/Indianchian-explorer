import type { ComponentType, ReactNode } from "react";

/** A table header cell as in the original: a small icon in Trivolve blue and the tracked label. */
export function Th({ icon: Icon, children, className }: { icon?: ComponentType<{ "aria-hidden"?: boolean; className?: string }>; children: ReactNode; className?: string }) {
    return <th scope="col" className={className}><span className="h">{Icon && <Icon aria-hidden />}{children}</span></th>;
}
