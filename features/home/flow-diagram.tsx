"use client";
import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { LINKS, NODES } from "./flow-diagram-content";
import { FlowLink } from "./flow-link";
import { FlowNode } from "./flow-node";
import { SiteFlowDiagram } from "./site-flow/site-flow-diagram";

/**
 * The whole product on one canvas: you set the rules with one signature, an agent works inside
 * them, and the money settles on any network. The connector labels say who does what — "you
 * sign" versus "enforced on every move" — because that split is the point of the product.
 */
export function FlowDiagram({
  className,
  siteStyle = false,
}: {
  className?: string;
  siteStyle?: boolean;
}) {
  if (siteStyle) return <SiteFlowDiagram className={className} />;
  return (
    <div className={cn("grid gap-3 xl:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]", className)}>
      {NODES.map((node, index) => (
        <Fragment key={node.step}>
          <FlowNode node={node} />
          {index < NODES.length - 1 ? <FlowLink label={LINKS[index] ?? ""} index={index} /> : null}
        </Fragment>
      ))}
    </div>
  );
}
