import React from "react";

interface GlassContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const GlassContainer = ({
  children,
  className = "",
  ...props
}: GlassContainerProps) => {
  return (
    <div
      className={`glass rounded-2xl p-6 text-[var(--md-sys-color-on-surface)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_40px_0_rgba(31,38,135,0.45)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
