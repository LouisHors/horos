import React from 'react';
import { 
  Play, 
  Square, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock,
  Terminal,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useUIStore, PanelType } from '../../stores/uiStore';
import { ExecutionStatus, NodeExecutionStatus } from '../../types';
import { cn } from '../../utils/cn';

// 执行日志
export interface ExecutionLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  nodeId?: string;
  nodeName?: string;
  message: string;
  details?: Record<string, unknown>;
}

// 节点执行状态
export interface NodeExecutionState {
  nodeId: string;
  status: NodeExecutionStatus;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  output?: unknown;
  error?: string;
}

// 执行面板属性
export interface ExecutionPanelProps {
  className?: string;
  executionId?: string;
  status?: ExecutionStatus;
  logs?: ExecutionLog[];
  nodeStates?: NodeExecutionState[];
  onRun?: () => void;
  onStop?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onClearLogs?: () => void;
}

// 状态配置
const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  [ExecutionStatus.IDLE]: { 
    label: 'Ready', 
    color: 'text-gray-500', 
    icon: <Clock className="w-4 h-4" /> 
  },
  [ExecutionStatus.RUNNING]: { 
    label: 'Running', 
    color: 'text-blue-500', 
    icon: <Play className="w-4 h-4" /> 
  },
  [ExecutionStatus.PAUSED]: { 
    label: 'Paused', 
    color: 'text-yellow-500', 
    icon: <Pause className="w-4 h-4" /> 
  },
  [ExecutionStatus.COMPLETED]: { 
    label: 'Completed', 
    color: 'text-green-500', 
    icon: <CheckCircle className="w-4 h-4" /> 
  },
  [ExecutionStatus.FAILED]: { 
    label: 'Failed', 
    color: 'text-red-500', 
    icon: <XCircle className="w-4 h-4" /> 
  },
  [ExecutionStatus.CANCELLED]: { 
    label: 'Cancelled', 
    color: 'text-gray-500', 
    icon: <Square className="w-4 h-4" /> 
  },
};

// 日志级别样式
const logLevelStyles: Record<ExecutionLog['level'], string> = {
  info: 'text-blue-600 bg-blue-50',
  warn: 'text-yellow-600 bg-yellow-50',
  error: 'text-red-600 bg-red-50',
  debug: 'text-gray-600 bg-gray-50',
};

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({
  className,
  executionId,
  status = ExecutionStatus.IDLE,
  logs = [],
  nodeStates = [],
  onRun,
  onStop,
  onPause,
  onResume,
  onClearLogs,
}) => {
  const { panels, togglePanel } = useUIStore();
  const panelState = panels[PanelType.EXECUTION];
  
  const [showLogs, setShowLogs] = React.useState(true);
  const [showNodes, setShowNodes] = React.useState(true);
  const [selectedLogLevel, setSelectedLogLevel] = React.useState<ExecutionLog['level'] | 'all'>('all');
  
  // 过滤日志
  const filteredLogs = React.useMemo(() => {
    if (selectedLogLevel === 'all') return logs;
    return logs.filter(log => log.level === selectedLogLevel);
  }, [logs, selectedLogLevel]);
  
  // 统计
  const stats = React.useMemo(() => {
    const total = nodeStates.length;
    const completed = nodeStates.filter(n => n.status === NodeExecutionStatus.SUCCESS).length;
    const failed = nodeStates.filter(n => n.status === NodeExecutionStatus.ERROR).length;
    const running = nodeStates.filter(n => n.status === NodeExecutionStatus.RUNNING).length;
    return { total, completed, failed, running };
  }, [nodeStates]);
  
  if (!panelState.visible) return null;
  
  return (
    <div 
      className={cn(
        'border-t border-gray-200 bg-white flex flex-col',
        className
      )}
      style={{ height: panelState.height }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">Execution</span>
          {executionId && (
            <span className="text-xs text-gray-500 font-mono">{executionId.slice(0, 8)}</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* 状态指示 */}
          <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium', statusConfig[status]?.color || 'text-gray-500')}>
            {statusConfig[status]?.icon}
            {statusConfig[status]?.label || status}
          </div>
          
          {/* 控制按钮 */}
          {status === ExecutionStatus.IDLE || status === ExecutionStatus.COMPLETED || status === ExecutionStatus.FAILED || status === ExecutionStatus.CANCELLED ? (
            <button
              onClick={onRun}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Run"
            >
              <Play className="w-4 h-4" />
            </button>
          ) : status === ExecutionStatus.RUNNING ? (
            <>
              <button
                onClick={onPause}
                className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                title="Pause"
              >
                <Pause className="w-4 h-4" />
              </button>
              <button
                onClick={onStop}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Stop"
              >
                <Square className="w-4 h-4" />
              </button>
            </>
          ) : status === ExecutionStatus.PAUSED ? (
            <>
              <button
                onClick={onResume}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Resume"
              >
                <Play className="w-4 h-4" />
              </button>
              <button
                onClick={onStop}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Stop"
              >
                <Square className="w-4 h-4" />
              </button>
            </>
          ) : null}
          
          <button
            onClick={() => togglePanel(PanelType.EXECUTION)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors ml-2"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Stats Bar */}
      <div className="flex items-center gap-4 px-4 py-1.5 bg-white border-b border-gray-100 text-xs">
        <span className="text-gray-500">
          Nodes: <strong className="text-gray-900">{stats.completed}/{stats.total}</strong>
        </span>
        {stats.running > 0 && (
          <span className="text-blue-500">
            Running: <strong>{stats.running}</strong>
          </span>
        )}
        {stats.failed > 0 && (
          <span className="text-red-500">
            Failed: <strong>{stats.failed}</strong>
          </span>
        )}
        <span className="text-gray-500 ml-auto">
          Logs: <strong className="text-gray-900">{logs.length}</strong>
        </span>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Node States */}
        <div className={cn('border-r border-gray-200 overflow-y-auto', showNodes ? 'w-1/3' : 'w-0')}>
          {showNodes && (
            <>
              <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                <button
                  onClick={() => setShowNodes(!showNodes)}
                  className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
                >
                  <ChevronRight className={cn('w-3 h-3 transition-transform', showNodes && 'rotate-90')} />
                  Nodes
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {nodeStates.map(node => (
                  <div 
                    key={node.nodeId}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50"
                  >
                    <div className={cn('w-2 h-2 rounded-full', {
                      'bg-gray-300': node.status === NodeExecutionStatus.PENDING,
                      'bg-blue-500 animate-pulse': node.status === NodeExecutionStatus.RUNNING,
                      'bg-green-500': node.status === NodeExecutionStatus.SUCCESS,
                      'bg-red-500': node.status === NodeExecutionStatus.ERROR,
                      'bg-yellow-500': node.status === NodeExecutionStatus.SKIPPED,
                    })} />
                    <span className="text-xs text-gray-600 flex-1 truncate">{node.nodeId}</span>
                    {node.duration && (
                      <span className="text-xs text-gray-400">{node.duration}ms</span>
                    )}
                  </div>
                ))}
                {nodeStates.length === 0 && (
                  <div className="px-3 py-4 text-xs text-gray-400 text-center">
                    No execution data
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Logs */}
        <div className={cn('flex-1 flex flex-col', showLogs ? 'block' : 'hidden')}>
          <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-100">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
            >
              <ChevronRight className={cn('w-3 h-3 transition-transform', showLogs && 'rotate-90')} />
              Logs
            </button>
            
            <div className="flex items-center gap-2">
              {/* 日志级别过滤 */}
              <select
                value={selectedLogLevel}
                onChange={(e) => setSelectedLogLevel(e.target.value as any)}
                className="text-xs border border-gray-200 rounded px-2 py-0.5 bg-white"
              >
                <option value="all">All</option>
                <option value="info">Info</option>
                <option value="warn">Warn</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
              
              <button
                onClick={onClearLogs}
                className="text-xs text-gray-500 hover:text-red-600"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto font-mono text-xs">
            {filteredLogs.map((log, index) => (
              <div 
                key={log.id || index}
                className={cn('flex gap-2 px-3 py-1 border-b border-gray-50', logLevelStyles[log.level])}
              >
                <span className="text-gray-400 whitespace-nowrap">
                  {log.timestamp.toLocaleTimeString()}
                </span>
                <span className={cn('px-1 rounded text-[10px] uppercase font-bold', logLevelStyles[log.level])}>
                  {log.level}
                </span>
                {log.nodeName && (
                  <span className="text-gray-500">[{log.nodeName}]</span>
                )}
                <span className="flex-1">{log.message}</span>
              </div>
            ))}
            {filteredLogs.length === 0 && (
              <div className="px-3 py-4 text-gray-400 text-center">
                No logs
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutionPanel;
