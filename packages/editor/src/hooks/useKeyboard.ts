import { useEffect, useCallback, useRef } from 'react';

// 快捷键定义
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  disabled?: boolean;
}

// 快捷键配置
export interface KeyboardShortcutsConfig {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  target?: HTMLElement | Window | null;
}

// 默认快捷键
export const DEFAULT_SHORTCUTS = {
  // 编辑
  UNDO: { key: 'z', ctrl: true, description: 'Undo' },
  REDO: { key: 'z', ctrl: true, shift: true, description: 'Redo' },
  COPY: { key: 'c', ctrl: true, description: 'Copy' },
  PASTE: { key: 'v', ctrl: true, description: 'Paste' },
  CUT: { key: 'x', ctrl: true, description: 'Cut' },
  SELECT_ALL: { key: 'a', ctrl: true, description: 'Select All' },
  DELETE: { key: 'Delete', description: 'Delete' },
  BACKSPACE: { key: 'Backspace', description: 'Delete' },
  
  // 文件
  SAVE: { key: 's', ctrl: true, description: 'Save' },
  OPEN: { key: 'o', ctrl: true, description: 'Open' },
  
  // 视图
  ZOOM_IN: { key: '=', ctrl: true, description: 'Zoom In' },
  ZOOM_OUT: { key: '-', ctrl: true, description: 'Zoom Out' },
  FIT_VIEW: { key: '0', ctrl: true, description: 'Fit View' },
  
  // 执行
  RUN: { key: 'F5', description: 'Run Workflow' },
  STOP: { key: 'Escape', ctrl: true, description: 'Stop Execution' },
} as const;

/**
 * 检查快捷键是否匹配
 */
function matchesShortcut(event: KeyboardEvent, shortcut: Omit<KeyboardShortcut, 'action' | 'description'>): boolean {
  if (event.key !== shortcut.key) return false;
  if (shortcut.ctrl && !event.ctrlKey && !event.metaKey) return false;
  if (shortcut.shift && !event.shiftKey) return false;
  if (shortcut.alt && !event.altKey) return false;
  if (shortcut.meta && !event.metaKey) return false;
  
  // 检查多余的修饰键
  if (!shortcut.ctrl && (event.ctrlKey || event.metaKey)) return false;
  if (!shortcut.shift && event.shiftKey) return false;
  if (!shortcut.alt && event.altKey) return false;
  
  return true;
}

export interface UseKeyboardOptions {
  enabled?: boolean;
  target?: HTMLElement | Window | null;
}

export interface UseKeyboardReturn {
  // 注册快捷键
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (key: string) => void;
  
  // 批量操作
  registerShortcuts: (shortcuts: KeyboardShortcut[]) => void;
  unregisterAll: () => void;
  
  // 状态
  getRegisteredShortcuts: () => KeyboardShortcut[];
}

/**
 * 键盘快捷键 Hook
 */
export function useKeyboard(options: UseKeyboardOptions = {}): UseKeyboardReturn {
  const shortcutsRef = useRef<Map<string, KeyboardShortcut>>(new Map());
  const enabledRef = useRef(options.enabled ?? true);
  const targetRef = useRef(options.target ?? (typeof window !== 'undefined' ? window : null));
  
  // 更新配置
  useEffect(() => {
    enabledRef.current = options.enabled ?? true;
  }, [options.enabled]);
  
  useEffect(() => {
    if (options.target) {
      targetRef.current = options.target;
    }
  }, [options.target]);
  
  /**
   * 处理键盘事件
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabledRef.current) return;
    
    // 如果焦点在输入框中，忽略大部分快捷键
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || 
                    target.tagName === 'TEXTAREA' || 
                    target.isContentEditable;
    
    for (const shortcut of shortcutsRef.current.values()) {
      if (shortcut.disabled) continue;
      
      // 在输入框中只处理 Escape 和 Ctrl+Enter 等特定快捷键
      if (isInput) {
        const allowedInInput = ['Escape', 'Enter'];
        if (!allowedInInput.includes(event.key) && !event.ctrlKey && !event.metaKey) {
          continue;
        }
      }
      
      if (matchesShortcut(event, shortcut)) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        if (shortcut.stopPropagation) {
          event.stopPropagation();
        }
        
        shortcut.action();
        return;
      }
    }
  }, []);
  
  // 绑定事件
  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;
    
    target.addEventListener('keydown', handleKeyDown as EventListener);
    return () => {
      target.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [handleKeyDown]);
  
  /**
   * 注册单个快捷键
   */
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    const key = `${shortcut.key}-${shortcut.ctrl ? 'c' : ''}-${shortcut.shift ? 's' : ''}-${shortcut.alt ? 'a' : ''}`;
    shortcutsRef.current.set(key, shortcut);
  }, []);
  
  /**
   * 注销单个快捷键
   */
  const unregisterShortcut = useCallback((key: string) => {
    shortcutsRef.current.delete(key);
  }, []);
  
  /**
   * 批量注册
   */
  const registerShortcuts = useCallback((shortcuts: KeyboardShortcut[]) => {
    shortcuts.forEach(registerShortcut);
  }, [registerShortcut]);
  
  /**
   * 注销所有
   */
  const unregisterAll = useCallback(() => {
    shortcutsRef.current.clear();
  }, []);
  
  /**
   * 获取所有已注册快捷键
   */
  const getRegisteredShortcuts = useCallback(() => {
    return Array.from(shortcutsRef.current.values());
  }, []);
  
  return {
    registerShortcut,
    unregisterShortcut,
    registerShortcuts,
    unregisterAll,
    getRegisteredShortcuts,
  };
}

/**
 * 创建快捷键配置工厂函数
 */
export function createShortcuts(actions: {
  undo?: () => void;
  redo?: () => void;
  copy?: () => void;
  paste?: () => void;
  cut?: () => void;
  delete?: () => void;
  selectAll?: () => void;
  save?: () => void;
  zoomIn?: () => void;
  zoomOut?: () => void;
  fitView?: () => void;
  run?: () => void;
  stop?: () => void;
}): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = [];
  
  if (actions.undo) {
    shortcuts.push({
      ...DEFAULT_SHORTCUTS.UNDO,
      action: actions.undo,
    });
  }
  
  if (actions.redo) {
    shortcuts.push({
      ...DEFAULT_SHORTCUTS.REDO,
      action: actions.redo,
    });
  }
  
  if (actions.copy) {
    shortcuts.push({
      ...DEFAULT_SHORTCUTS.COPY,
      action: actions.copy,
    });
  }
  
  if (actions.paste) {
    shortcuts.push({
      ...DEFAULT_SHORTCUTS.PASTE,
      action: actions.paste,
    });
  }
  
  if (actions.cut) {
    shortcuts.push({
      ...DEFAULT_SHORTCUTS.CUT,
      action: actions.cut,
    });
  }
  
  if (actions.delete) {
    shortcuts.push({
      ...DEFAULT_SHORTCUTS.DELETE,
      action: actions.delete,
    });
    shortcuts.push({
      ...DEFAULT_SHORTCUTS.BACKSPACE,
      action: actions.delete,
    });
  }
  
  if (actions.selectAll) {
    shortcuts.push({
      ...DEFAULT_SHORTCUTS.SELECT_ALL,
      action: actions.selectAll,
    });
  }
  
  if (actions.save) {
    shortcuts.push({
      ...DEFAULT_SHORTCUTS.SAVE,
      action: actions.save,
      preventDefault: true,
    });
  }
  
  if (actions.zoomIn) {
    shortcuts.push({
      ...DEFAULT_SHORTCUTS.ZOOM_IN,
      action: actions.zoomIn,
    });
  }
  
  if (actions.zoomOut) {
    shortcuts.push({
      ...DEFAULT_SHORTCUTS.ZOOM_OUT,
      action: actions.zoomOut,
    });
  }
  
  if (actions.fitView) {
    shortcuts.push({
      ...DEFAULT_SHORTCUTS.FIT_VIEW,
      action: actions.fitView,
    });
  }
  
  if (actions.run) {
    shortcuts.push({
      ...DEFAULT_SHORTCUTS.RUN,
      action: actions.run,
    });
  }
  
  if (actions.stop) {
    shortcuts.push({
      ...DEFAULT_SHORTCUTS.STOP,
      action: actions.stop,
    });
  }
  
  return shortcuts;
}

export default useKeyboard;
