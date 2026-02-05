import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// UI 面板类型
export enum PanelType {
  NODE_LIBRARY = 'nodeLibrary',
  PROPERTY = 'property',
  EXECUTION = 'execution',
  TOOLBAR = 'toolbar',
}

// 拖拽状态
export interface DragState {
  isDragging: boolean;
  type: 'node' | 'panel' | 'canvas' | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

// UI 状态接口
interface UIState {
  // 面板状态
  panels: {
    [PanelType.NODE_LIBRARY]: { visible: boolean; width: number };
    [PanelType.PROPERTY]: { visible: boolean; width: number };
    [PanelType.EXECUTION]: { visible: boolean; height: number };
    [PanelType.TOOLBAR]: { visible: boolean };
  };
  
  // 主题
  theme: 'light' | 'dark' | 'system';
  followSystemTheme: boolean;
  
  // 画布设置
  canvasSettings: {
    snapToGrid: boolean;
    gridSize: number;
    showGrid: boolean;
    showMinimap: boolean;
    showControls: boolean;
    gridType: 'dots' | 'lines';
  };
  
  // 拖拽状态
  dragState: DragState;
  
  // 右键菜单
  contextMenu: {
    visible: boolean;
    x: number;
    y: number;
    targetType: 'node' | 'edge' | 'canvas' | null;
    targetId: string | null;
  };
  
  // 操作
  togglePanel: (panel: PanelType) => void;
  setPanelVisible: (panel: PanelType, visible: boolean) => void;
  setPanelWidth: (panel: PanelType.NODE_LIBRARY | PanelType.PROPERTY, width: number) => void;
  setPanelHeight: (panel: PanelType.EXECUTION, height: number) => void;
  
  // 主题
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setFollowSystemTheme: (follow: boolean) => void;
  
  // 画布设置
  updateCanvasSettings: (settings: Partial<UIState['canvasSettings']>) => void;
  
  // 拖拽状态
  setDragState: (state: Partial<DragState>) => void;
  startDrag: (type: DragState['type'], x: number, y: number) => void;
  updateDrag: (x: number, y: number) => void;
  endDrag: () => void;
  
  // 右键菜单
  showContextMenu: (x: number, y: number, targetType: 'node' | 'edge' | 'canvas', targetId?: string) => void;
  hideContextMenu: () => void;
  
  // 快捷键帮助
  showShortcutsHelp: boolean;
  setShowShortcutsHelp: (show: boolean) => void;
  
  // 模态框
  modals: {
    importFlow: boolean;
    exportFlow: boolean;
    settings: boolean;
    keyboardShortcuts: boolean;
    about: boolean;
  };
  openModal: (modal: keyof UIState['modals']) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  closeAllModals: () => void;
  
  // 吐司通知
  toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  }>;
  addToast: (toast: Omit<UIState['toasts'][0], 'id'>) => void;
  removeToast: (id: string) => void;
  
  // 加载状态
  isLoading: boolean;
  loadingMessage: string;
  setLoading: (isLoading: boolean, message?: string) => void;
}

// 创建 Store
export const useUIStore = create<UIState>()(
  immer((set, get) => ({
    panels: {
      [PanelType.NODE_LIBRARY]: { visible: true, width: 280 },
      [PanelType.PROPERTY]: { visible: true, width: 320 },
      [PanelType.EXECUTION]: { visible: false, height: 200 },
      [PanelType.TOOLBAR]: { visible: true },
    },
    
    theme: 'light',
    followSystemTheme: false,
    
    canvasSettings: {
      snapToGrid: true,
      gridSize: 10,
      showGrid: true,
      showMinimap: true,
      showControls: true,
      gridType: 'dots',
    },
    
    dragState: {
      isDragging: false,
      type: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    },
    
    contextMenu: {
      visible: false,
      x: 0,
      y: 0,
      targetType: null,
      targetId: null,
    },

    togglePanel: (panel) =>
      set((state) => {
        state.panels[panel].visible = !state.panels[panel].visible;
      }),

    setPanelVisible: (panel, visible) =>
      set((state) => {
        state.panels[panel].visible = visible;
      }),
    
    setPanelWidth: (panel, width) =>
      set((state) => {
        if (state.panels[panel]) {
          state.panels[panel].width = Math.max(200, Math.min(500, width));
        }
      }),
    
    setPanelHeight: (panel, height) =>
      set((state) => {
        if (state.panels[panel]) {
          state.panels[panel].height = Math.max(150, Math.min(500, height));
        }
      }),

    setTheme: (theme) =>
      set((state) => {
        state.theme = theme;
      }),
    
    setFollowSystemTheme: (follow) =>
      set((state) => {
        state.followSystemTheme = follow;
      }),

    updateCanvasSettings: (settings) =>
      set((state) => {
        Object.assign(state.canvasSettings, settings);
      }),
    
    setDragState: (dragState) =>
      set((state) => {
        Object.assign(state.dragState, dragState);
      }),
    
    startDrag: (type, x, y) =>
      set((state) => {
        state.dragState.isDragging = true;
        state.dragState.type = type;
        state.dragState.startX = x;
        state.dragState.startY = y;
        state.dragState.currentX = x;
        state.dragState.currentY = y;
      }),
    
    updateDrag: (x, y) =>
      set((state) => {
        state.dragState.currentX = x;
        state.dragState.currentY = y;
      }),
    
    endDrag: () =>
      set((state) => {
        state.dragState.isDragging = false;
        state.dragState.type = null;
      }),
    
    showContextMenu: (x, y, targetType, targetId) =>
      set((state) => {
        state.contextMenu.visible = true;
        state.contextMenu.x = x;
        state.contextMenu.y = y;
        state.contextMenu.targetType = targetType;
        state.contextMenu.targetId = targetId || null;
      }),
    
    hideContextMenu: () =>
      set((state) => {
        state.contextMenu.visible = false;
        state.contextMenu.targetType = null;
        state.contextMenu.targetId = null;
      }),

    showShortcutsHelp: false,
    setShowShortcutsHelp: (show) =>
      set((state) => {
        state.showShortcutsHelp = show;
      }),

    modals: {
      importFlow: false,
      exportFlow: false,
      settings: false,
      keyboardShortcuts: false,
      about: false,
    },

    openModal: (modal) =>
      set((state) => {
        state.modals[modal] = true;
      }),

    closeModal: (modal) =>
      set((state) => {
        state.modals[modal] = false;
      }),
    
    closeAllModals: () =>
      set((state) => {
        Object.keys(state.modals).forEach((key) => {
          state.modals[key as keyof UIState['modals']] = false;
        });
      }),
    
    toasts: [],
    
    addToast: (toast) =>
      set((state) => {
        const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        state.toasts.push({ ...toast, id });
        
        // 自动移除
        if (toast.duration !== 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, toast.duration || 3000);
        }
      }),
    
    removeToast: (id) =>
      set((state) => {
        state.toasts = state.toasts.filter((t) => t.id !== id);
      }),
    
    isLoading: false,
    loadingMessage: '',
    
    setLoading: (isLoading, message = '') =>
      set((state) => {
        state.isLoading = isLoading;
        state.loadingMessage = message;
      }),
  }))
);

export type { UIState };
