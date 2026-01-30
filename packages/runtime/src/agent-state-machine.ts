/**
 * Agent 状态机实现
 * 
 * 状态转换图:
 * 
 *   ┌─────────┐
 *   │  idle   │◄──────────────┐
 *   └────┬────┘               │
 *        │ start              │ terminate
 *        ▼                    │
 *   ┌─────────┐    pause   ┌─────────┐
 *   │ running │───────────►│ paused  │
 *   └────┬────┘◄───────────┴────┬────┘
 *        │ resume                │
 *        │ error                 │
 *        ▼                       │
 *   ┌─────────┐                 │
 *   │  error  │─────────────────┘
 *   └────┬────┘
 *        │ terminate
 *        ▼
 *   ┌───────────┐
 *   │terminated │
 *   └───────────┘
 */

export type AgentState = "idle" | "running" | "paused" | "error" | "terminated";

interface StateTransition {
  from: AgentState;
  to: AgentState;
  action?: () => void | Promise<void>;
}

export class AgentStateMachine {
  private currentState: AgentState = "idle";
  private transitions: Map<string, StateTransition> = new Map();
  private onStateChange?: (from: AgentState, to: AgentState) => void;

  constructor(onStateChange?: (from: AgentState, to: AgentState) => void) {
    this.onStateChange = onStateChange;
    this.setupTransitions();
  }

  private setupTransitions(): void {
    // 定义有效状态转换
    const validTransitions: StateTransition[] = [
      { from: "idle", to: "running" },
      { from: "running", to: "paused" },
      { from: "running", to: "error" },
      { from: "running", to: "terminated" },
      { from: "paused", to: "running" },
      { from: "paused", to: "terminated" },
      { from: "error", to: "terminated" },
    ];

    for (const transition of validTransitions) {
      const key = `${transition.from}:${transition.to}`;
      this.transitions.set(key, transition);
    }
  }

  /**
   * 获取当前状态
   */
  getState(): AgentState {
    return this.currentState;
  }

  /**
   * 检查是否可以转换到目标状态
   */
  canTransition(to: AgentState): boolean {
    if (this.currentState === to) return true;
    const key = `${this.currentState}:${to}`;
    return this.transitions.has(key);
  }

  /**
   * 执行状态转换
   */
  async transition(to: AgentState): Promise<void> {
    if (this.currentState === to) return;

    const key = `${this.currentState}:${to}`;
    const transition = this.transitions.get(key);

    if (!transition) {
      throw new Error(
        `Invalid state transition from ${this.currentState} to ${to}`
      );
    }

    const fromState = this.currentState;

    // 执行转换动作
    if (transition.action) {
      await transition.action();
    }

    // 更新状态
    this.currentState = to;

    // 触发状态变更回调
    if (this.onStateChange) {
      this.onStateChange(fromState, to);
    }

    console.log(`[StateMachine] ${fromState} -> ${to}`);
  }

  /**
   * 快捷方法：启动
   */
  async start(): Promise<void> {
    await this.transition("running");
  }

  /**
   * 快捷方法：暂停
   */
  async pause(): Promise<void> {
    await this.transition("paused");
  }

  /**
   * 快捷方法：恢复
   */
  async resume(): Promise<void> {
    await this.transition("running");
  }

  /**
   * 快捷方法：标记错误
   */
  async error(): Promise<void> {
    await this.transition("error");
  }

  /**
   * 快捷方法：终止
   */
  async terminate(): Promise<void> {
    await this.transition("terminated");
  }

  /**
   * 检查是否处于运行状态
   */
  isRunning(): boolean {
    return this.currentState === "running";
  }

  /**
   * 检查是否已终止
   */
  isTerminated(): boolean {
    return this.currentState === "terminated";
  }
}
