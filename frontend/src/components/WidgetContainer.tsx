import React from 'react';
import { LucideIcon } from 'lucide-react';

interface WidgetContainerProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerRight?: React.ReactNode;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  iconColor = "text-slate-300", 
  children, 
  className = "", 
  contentClassName = "",
  headerRight
}) => {
  return (
    <div className={`kats-panel rounded-lg flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 shadow-lg ${className}`}>
      <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/80">
        <span className={`flex items-center gap-2 text-sm font-bold ${iconColor}`}>
          <Icon className="w-5 h-5" />
          {title}
        </span>
        <div className="flex items-center gap-2">
          {subtitle && (
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
              {subtitle}
            </span>
          )}
          {headerRight}
        </div>
      </div>
      <div className={`flex-1 overflow-hidden p-3 ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};
