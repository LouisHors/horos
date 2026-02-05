import React from 'react';
import {
  Play,
  Square,
  Save,
  FolderOpen,
  Undo,
  Redo,
  Trash2,
  Copy,
  ClipboardPaste,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3X3,
  Settings,
  Download,
  Upload,
} from 'lucide-react';
import { useUIStore, PanelType } from '../../stores/uiStore';
import { cn } from '../../utils/cn';

export interface ToolbarProps {
  className?: string;
  onRun?: () => void;
  onStop?: () => void;
  onSave?: () => void;
  onLoad?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onToggleGrid?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onOpenSettings?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  hasSelection?: boolean;
  isRunning?: boolean;
  zoom?: number;
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  shortcut?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  label,
  onClick,
  disabled = false,
  active = false,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={label}
    className={cn(
      'p-2 rounded-lg transition-all duration-200',
      'flex items-center justify-center',
      'hover:bg-gray-100 active:scale-95',
      disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent',
      active && 'bg-blue-50 text-blue-600'
    )}
  >
    {icon}
  </button>
);

interface ToolbarGroupProps {
  children: React.ReactNode;
  className?: string;
}

const ToolbarGroup: React.FC<ToolbarGroupProps> = ({ children, className }) => (
  <div className={cn('flex items-center gap-1 px-2 border-r border-gray-200 last:border-r-0', className)}>
    {children}
  </div>
);

export const Toolbar: React.FC<ToolbarProps> = ({
  className,
  onRun,
  onStop,
  onSave,
  onLoad,
  onUndo,
  onRedo,
  onDelete,
  onCopy,
  onPaste,
  onZoomIn,
  onZoomOut,
  onFitView,
  onToggleGrid,
  onExport,
  onImport,
  onOpenSettings,
  canUndo = false,
  canRedo = false,
  hasSelection = false,
  isRunning = false,
  zoom = 1,
}) => {
  const { canvasSettings, togglePanel, updateCanvasSettings } = useUIStore();

  const handleToggleGrid = () => {
    updateCanvasSettings({ showGrid: !canvasSettings.showGrid });
    onToggleGrid?.();
  };

  return (
    <div
      className={cn(
        'h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-2',
        'shadow-sm',
        className
      )}
    >
      {/* File Operations */}
      <ToolbarGroup>
        <ToolbarButton
          icon={<Save className="w-5 h-5" />}
          label="Save (Ctrl+S)"
          onClick={onSave}
        />
        <ToolbarButton
          icon={<FolderOpen className="w-5 h-5" />}
          label="Open (Ctrl+O)"
          onClick={onLoad}
        />
        <ToolbarButton
          icon={<Upload className="w-5 h-5" />}
          label="Import"
          onClick={onImport}
        />
        <ToolbarButton
          icon={<Download className="w-5 h-5" />}
          label="Export"
          onClick={onExport}
        />
      </ToolbarGroup>

      {/* Execution Controls */}
      <ToolbarGroup>
        {!isRunning ? (
          <ToolbarButton
            icon={<Play className="w-5 h-5 text-green-600" />}
            label="Run (F5)"
            onClick={onRun}
          />
        ) : (
          <ToolbarButton
            icon={<Square className="w-5 h-5 text-red-600" />}
            label="Stop"
            onClick={onStop}
          />
        )}
      </ToolbarGroup>

      {/* Edit Operations */}
      <ToolbarGroup>
        <ToolbarButton
          icon={<Undo className="w-5 h-5" />}
          label="Undo (Ctrl+Z)"
          onClick={onUndo}
          disabled={!canUndo}
        />
        <ToolbarButton
          icon={<Redo className="w-5 h-5" />}
          label="Redo (Ctrl+Shift+Z)"
          onClick={onRedo}
          disabled={!canRedo}
        />
        <ToolbarButton
          icon={<Copy className="w-5 h-5" />}
          label="Copy (Ctrl+C)"
          onClick={onCopy}
          disabled={!hasSelection}
        />
        <ToolbarButton
          icon={<ClipboardPaste className="w-5 h-5" />}
          label="Paste (Ctrl+V)"
          onClick={onPaste}
        />
        <ToolbarButton
          icon={<Trash2 className="w-5 h-5" />}
          label="Delete (Del)"
          onClick={onDelete}
          disabled={!hasSelection}
        />
      </ToolbarGroup>

      {/* View Controls */}
      <ToolbarGroup>
        <ToolbarButton
          icon={<ZoomOut className="w-5 h-5" />}
          label="Zoom Out (Ctrl+-)"
          onClick={onZoomOut}
        />
        <span className="text-xs text-gray-500 min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <ToolbarButton
          icon={<ZoomIn className="w-5 h-5" />}
          label="Zoom In (Ctrl+=)"
          onClick={onZoomIn}
        />
        <ToolbarButton
          icon={<Maximize className="w-5 h-5" />}
          label="Fit View (Ctrl+0)"
          onClick={onFitView}
        />
      </ToolbarGroup>

      {/* Canvas Settings */}
      <ToolbarGroup>
        <ToolbarButton
          icon={<Grid3X3 className="w-5 h-5" />}
          label="Toggle Grid"
          onClick={handleToggleGrid}
          active={canvasSettings.showGrid}
        />
      </ToolbarGroup>

      {/* Panel Toggles */}
      <ToolbarGroup>
        <ToolbarButton
          icon={<span className="text-xs font-bold">LIB</span>}
          label="Toggle Node Library"
          onClick={() => togglePanel(PanelType.NODE_LIBRARY)}
        />
        <ToolbarButton
          icon={<span className="text-xs font-bold">PROP</span>}
          label="Toggle Property Panel"
          onClick={() => togglePanel(PanelType.PROPERTY)}
        />
      </ToolbarGroup>

      {/* Settings */}
      <div className="flex-1" />
      <ToolbarGroup>
        <ToolbarButton
          icon={<Settings className="w-5 h-5" />}
          label="Settings"
          onClick={onOpenSettings}
        />
      </ToolbarGroup>
    </div>
  );
};

export default Toolbar;
