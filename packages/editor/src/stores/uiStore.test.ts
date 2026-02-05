import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore, PanelType } from './uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      panels: {
        nodeLibrary: { visible: true, width: 280 },
        property: { visible: true, width: 320 },
        execution: { visible: false, height: 200 },
        toolbar: { visible: true },
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
    });
  });

  describe('initial state', () => {
    it('should have light theme by default', () => {
      const state = useUIStore.getState();
      expect(state.theme).toBe('light');
    });

    it('should have panels configured', () => {
      const state = useUIStore.getState();
      expect(state.panels.nodeLibrary.visible).toBe(true);
      expect(state.panels.property.visible).toBe(true);
      expect(state.panels.execution.visible).toBe(false);
    });
  });

  describe('theme', () => {
    it('should set theme', () => {
      useUIStore.getState().setTheme('dark');
      expect(useUIStore.getState().theme).toBe('dark');
    });
  });

  describe('panel visibility', () => {
    it('should toggle panel', () => {
      const store = useUIStore.getState();
      const initialVisible = store.panels.nodeLibrary.visible;
      
      store.togglePanel(PanelType.NODE_LIBRARY);
      
      expect(useUIStore.getState().panels.nodeLibrary.visible).toBe(!initialVisible);
    });

    it('should set panel visible', () => {
      useUIStore.getState().setPanelVisible(PanelType.EXECUTION, true);
      expect(useUIStore.getState().panels.execution.visible).toBe(true);
    });
  });

  describe('canvas settings', () => {
    it('should update canvas settings', () => {
      useUIStore.getState().updateCanvasSettings({ snapToGrid: false });
      expect(useUIStore.getState().canvasSettings.snapToGrid).toBe(false);
    });

    it('should update grid size', () => {
      useUIStore.getState().updateCanvasSettings({ gridSize: 20 });
      expect(useUIStore.getState().canvasSettings.gridSize).toBe(20);
    });
  });
});
