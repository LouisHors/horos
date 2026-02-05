/**
 * 快捷键配置和工具函数
 */

// 快捷键定义
export interface ShortcutDefinition {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  category: 'edit' | 'file' | 'view' | 'execution' | 'navigation';
}

// 默认快捷键映射
export const DEFAULT_SHORTCUTS: Record<string, ShortcutDefinition> = {
  // 编辑
  undo: {
    key: 'z',
    ctrl: true,
    description: '撤销',
    category: 'edit',
  },
  redo: {
    key: 'z',
    ctrl: true,
    shift: true,
    description: '重做',
    category: 'edit',
  },
  copy: {
    key: 'c',
    ctrl: true,
    description: '复制',
    category: 'edit',
  },
  paste: {
    key: 'v',
    ctrl: true,
    description: '粘贴',
    category: 'edit',
  },
  cut: {
    key: 'x',
    ctrl: true,
    description: '剪切',
    category: 'edit',
  },
  delete: {
    key: 'Delete',
    description: '删除',
    category: 'edit',
  },
  selectAll: {
    key: 'a',
    ctrl: true,
    description: '全选',
    category: 'edit',
  },
  duplicate: {
    key: 'd',
    ctrl: true,
    description: '复制选中项',
    category: 'edit',
  },
  
  // 文件
  save: {
    key: 's',
    ctrl: true,
    description: '保存',
    category: 'file',
  },
  open: {
    key: 'o',
    ctrl: true,
    description: '打开',
    category: 'file',
  },
  new: {
    key: 'n',
    ctrl: true,
    description: '新建',
    category: 'file',
  },
  import: {
    key: 'i',
    ctrl: true,
    shift: true,
    description: '导入',
    category: 'file',
  },
  export: {
    key: 'e',
    ctrl: true,
    shift: true,
    description: '导出',
    category: 'file',
  },
  
  // 视图
  zoomIn: {
    key: '=',
    ctrl: true,
    description: '放大',
    category: 'view',
  },
  zoomOut: {
    key: '-',
    ctrl: true,
    description: '缩小',
    category: 'view',
  },
  fitView: {
    key: '0',
    ctrl: true,
    description: '适配视图',
    category: 'view',
  },
  toggleGrid: {
    key: 'g',
    ctrl: true,
    description: '切换网格',
    category: 'view',
  },
  toggleMinimap: {
    key: 'm',
    ctrl: true,
    description: '切换小地图',
    category: 'view',
  },
  toggleFullscreen: {
    key: 'f',
    ctrl: true,
    shift: true,
    description: '全屏',
    category: 'view',
  },
  
  // 执行
  run: {
    key: 'F5',
    description: '运行工作流',
    category: 'execution',
  },
  stop: {
    key: 'Escape',
    ctrl: true,
    description: '停止执行',
    category: 'execution',
  },
  debug: {
    key: 'F5',
    shift: true,
    description: '调试模式',
    category: 'execution',
  },
  stepOver: {
    key: 'F10',
    description: '单步跳过',
    category: 'execution',
  },
  stepInto: {
    key: 'F11',
    description: '单步进入',
    category: 'execution',
  },
  
  // 导航
  focusSearch: {
    key: 'f',
    ctrl: true,
    description: '搜索节点',
    category: 'navigation',
  },
  toggleSidebar: {
    key: 'b',
    ctrl: true,
    description: '切换侧边栏',
    category: 'navigation',
  },
  togglePropertyPanel: {
    key: 'p',
    ctrl: true,
    description: '切换属性面板',
    category: 'navigation',
  },
  openShortcuts: {
    key: '?',
    description: '快捷键帮助',
    category: 'navigation',
  },
};

// 获取快捷键显示文本
export function getShortcutDisplay(shortcut: ShortcutDefinition): string {
  const parts: string[] = [];
  
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.meta) parts.push('Cmd');
  
  // 特殊键映射
  const keyMap: Record<string, string> = {
    'Delete': 'Del',
    'Backspace': '⌫',
    'Enter': '↵',
    'Escape': 'Esc',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
  };
  
  parts.push(keyMap[shortcut.key] || shortcut.key);
  
  return parts.join('+');
}

// 获取 Mac 风格的快捷键显示
export function getMacShortcutDisplay(shortcut: ShortcutDefinition): string {
  const parts: string[] = [];
  
  if (shortcut.ctrl || shortcut.meta) parts.push('⌘');
  if (shortcut.shift) parts.push('⇧');
  if (shortcut.alt) parts.push('⌥');
  
  const keyMap: Record<string, string> = {
    'z': 'Z',
    'c': 'C',
    'v': 'V',
    'x': 'X',
    'a': 'A',
    's': 'S',
    'o': 'O',
    'n': 'N',
    'f': 'F',
    'g': 'G',
    'm': 'M',
    'p': 'P',
    'd': 'D',
    'i': 'I',
    'e': 'E',
    'b': 'B',
    '?': '?',
    '=': '=',
    '-': '-',
    '0': '0',
    'Delete': '⌫',
    'Backspace': '⌫',
    'Enter': '↵',
    'Escape': '⎋',
    'F5': 'F5',
    'F10': 'F10',
    'F11': 'F11',
  };
  
  parts.push(keyMap[shortcut.key] || shortcut.key);
  
  return parts.join('');
}

// 按类别分组快捷键
export function groupShortcutsByCategory(
  shortcuts: Record<string, ShortcutDefinition>
): Record<string, Array<{ key: string; shortcut: ShortcutDefinition }>> {
  const groups: Record<string, Array<{ key: string; shortcut: ShortcutDefinition }>> = {
    edit: [],
    file: [],
    view: [],
    execution: [],
    navigation: [],
  };
  
  Object.entries(shortcuts).forEach(([key, shortcut]) => {
    if (groups[shortcut.category]) {
      groups[shortcut.category].push({ key, shortcut });
    }
  });
  
  return groups;
}

// 检测是否为 Mac
export function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

// 获取适合当前平台的快捷键显示
export function getPlatformShortcutDisplay(shortcut: ShortcutDefinition): string {
  return isMac() ? getMacShortcutDisplay(shortcut) : getShortcutDisplay(shortcut);
}

// 快捷键帮助数据
export const SHORTCUT_HELP_DATA = groupShortcutsByCategory(DEFAULT_SHORTCUTS);

// 类别显示名称
export const CATEGORY_NAMES: Record<string, string> = {
  edit: '编辑',
  file: '文件',
  view: '视图',
  execution: '执行',
  navigation: '导航',
};

export default DEFAULT_SHORTCUTS;
