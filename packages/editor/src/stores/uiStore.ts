import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// UI 面板类型
export enum PanelType {
  NODE_LIBRARY = 'nodeLibrary',
  PROPERTY = 'property',
  EXECUTION = 'execution',
  TOOLBAR = 'toolbar',
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
  theme: 'light' | 'dark';
  
  // 画布设置
  canvasSettings: {
    snapToGrid: boolean;
    gridSize: number;
    showGrid: boolean;
    showMinimap: boolean;
    showControls: boolean;
  };
  
  // 操作
  togglePanel: (panel: PanelType) => void;
  setPanelVisible: (panel: PanelType, visible: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  updateCanvasSettings: (settings: Partial<UIState['canvasSettings']>) => void;
  
  // 快捷键帮助
  showShortcutsHelp: boolean;
  setShowShortcutsHelp: (show: boolean) => void;
  
  // 模态框
  modals: {
    importFlow: boolean;
    exportFlow: boolean;
    settings: boolean;
  };
  openModal: (modal: keyof UIState['modals']) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
}

// 创建 Store
export const useUIStore = create<UIState>()(
  immer((set) => ({
    panels: {
      [PanelType.NODE_LIBRARY]: { visible: true, width: 280 },
      [PanelType.PROPERTY]: { visible: true, width: 320 },
      [PanelType.EXECUTION]: { visible: false, height: 200 },
      [PanelType.TOOLBAR]: { visible: true },
    },
    
    theme: 'light',
    
    canvasSettings: {
      snapToGrid: true,
      gridSize: 10,
      showGrid: true,
      showMinimap: true,
      showControls: true,
    },
    
    showShortcutsHelp: false,
    modals: {
      importFlow: false,
      exportFlow: false,
      settings: false,
    },

    togglePanel: (panel) =>
      set((state) => {
        state.panels[panel].visible = !state.panels[panel].visible;
      }),

    setPanelVisible: (panel, visible) =>
      set((state) => {
        state.panels[panel].visible = visible;
      }),

    setTheme: (theme) =>
      set((state) => {
        state.theme = theme;
      }),

    updateCanvasSettings: (settings) =>
      set((state) => {
        Object.assign(state.canvasSettings, settings);
      }),

    setShowShortcutsHelp: (show) =>
      set((state) => {
        state.showShortcutsHelp = show;
      }),

    openModal: (modal) =>
      set((state) => {
        state.modals[modal] = true;
      }),

    closeModal: (modal) =>
      set((state) => {
        state.modals[modal] = false;
      }),
  }))
);

export type { UIState };
