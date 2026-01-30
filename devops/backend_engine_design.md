# AI Agent 可视化编排工具 - 后端执行引擎设计文档

## 目录
1. [执行引擎架构](#1-执行引擎架构)
2. [Agent生命周期管理](#2-agent生命周期管理)
3. [工作流执行机制](#3-工作流执行机制)
4. [动态调度实现](#4-动态调度实现)
5. [上下文管理](#5-上下文管理)
6. [错误处理](#6-错误处理)
7. [核心类设计](#7-核心类设计)

---

## 1. 执行引擎架构

### 1.1 总体架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          执行引擎 (Execution Engine)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   API层     │  │  编排定义层  │  │  调度控制层  │  │  执行运行时   │        │
│  │  REST/WS   │  │  DSL/JSON   │  │  Scheduler  │  │  Executor   │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │               │
│         └────────────────┴────────────────┴────────────────┘               │
│                                   │                                         │
│                    ┌──────────────┴──────────────┐                        │
│                    │      核心服务层              │                        │
│  ┌─────────────────┼─────────────────────────────┼─────────────────┐      │
│  │  ┌───────────┐  │  ┌───────────┐  ┌─────────┐ │  ┌───────────┐  │      │
│  │  │ 工作流引擎 │  │  │ 状态机引擎 │  │ 事件总线 │ │  │ 上下文管理 │  │      │
│  │  │ Workflow  │  │  │  State    │  │  Event  │ │  │  Context  │  │      │
│  │  └───────────┘  │  └───────────┘  └─────────┘ │  └───────────┘  │      │
│  │  ┌───────────┐  │  ┌───────────┐  ┌─────────┐ │  ┌───────────┐  │      │
│  │  │ Agent管理  │  │  │ 调度器    │  │ 资源管理 │ │  │ 错误处理   │  │      │
│  │  │  Manager  │  │  │Scheduler  │  │ Resource│ │  │  Handler  │  │      │
│  │  └───────────┘  │  └───────────┘  └─────────┘ │  └───────────┘  │      │
│  └─────────────────┴─────────────────────────────┴─────────────────┘      │
│                                   │                                         │
│                    ┌──────────────┴──────────────┐                        │
│                    │      存储与持久化层          │                        │
│  ┌─────────────────┼─────────────────────────────┼─────────────────┐      │
│  │  ┌───────────┐  │  ┌───────────┐  ┌─────────┐ │  ┌───────────┐  │      │
│  │  │ 状态存储   │  │  │ 工作流存储 │  │ 日志存储 │ │  │ 检查点存储 │  │      │
│  │  │  State    │  │  │ Workflow  │  │  Log    │ │  │ Checkpoint│  │      │
│  │  └───────────┘  │  └───────────┘  └─────────┘ │  └───────────┘  │      │
│  └─────────────────┴─────────────────────────────┴─────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 核心模块划分

| 模块 | 职责 | 核心组件 |
|------|------|----------|
| **调度器 (Scheduler)** | 决定下一个执行的节点，管理执行顺序 | ExecutionScheduler, PriorityQueue, DependencyResolver |
| **执行器 (Executor)** | 执行节点逻辑，管理Agent运行 | NodeExecutor, AgentRunner, TaskExecutor |
| **状态机 (StateMachine)** | 管理工作流和Agent状态转换 | WorkflowStateMachine, AgentStateMachine |
| **事件总线 (EventBus)** | 处理事件订阅、发布和路由 | EventBus, EventRouter, EventHandler |
| **上下文管理 (Context)** | 管理执行上下文和变量作用域 | ExecutionContext, ScopeManager, VariableStore |
| **资源管理 (Resource)** | 管理Agent池、资源配额 | AgentPool, ResourceQuota, ResourceMonitor |

### 1.3 调度器设计

#### 1.3.1 调度器架构

```
┌─────────────────────────────────────────────────────────────┐
│                    调度器 (Scheduler)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  调度策略    │    │  依赖解析器  │    │  优先级队列  │     │
│  │  Strategy   │◄──►│  Resolver   │◄──►│   Queue     │     │
│  └──────┬──────┘    └─────────────┘    └──────┬──────┘     │
│         │                                       │            │
│         └────────────────┬──────────────────────┘            │
│                          │                                   │
│                   ┌──────┴──────┐                          │
│                   │  调度引擎    │                          │
│                   │   Engine    │                          │
│                   └──────┬──────┘                          │
│                          │                                   │
│         ┌────────────────┼────────────────┐                 │
│         ▼                ▼                ▼                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ 顺序调度器   │  │ 并行调度器   │  │ 事件驱动调度 │         │
│  │  Sequential │  │  Parallel   │  │   Event     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

#### 1.3.2 调度策略

**1. 顺序调度 (Sequential)**
- 按拓扑排序顺序执行节点
- 适合线性工作流

**2. 并行调度 (Parallel)**
- 识别无依赖节点并行执行
- 支持最大并发度控制

**3. 事件驱动调度 (Event-Driven)**
- 节点订阅特定事件触发
- 支持动态条件触发

**4. 优先级调度 (Priority-Based)**
- 根据节点优先级排序
- 支持抢占式调度

#### 1.3.3 调度算法伪代码

```python
class ExecutionScheduler:
    def __init__(self):
        self.dependency_resolver = DependencyResolver()
        self.priority_queue = PriorityQueue()
        self.running_tasks = set()
        self.max_concurrency = 10
    
    def schedule(self, workflow_graph, execution_context):
        # 1. 解析依赖关系
        ready_nodes = self.dependency_resolver.get_ready_nodes(workflow_graph)
        
        # 2. 按优先级排序
        for node in ready_nodes:
            priority = self.calculate_priority(node, execution_context)
            self.priority_queue.enqueue(node, priority)
        
        # 3. 调度可执行任务
        while (len(self.running_tasks) < self.max_concurrency and 
               not self.priority_queue.is_empty()):
            node = self.priority_queue.dequeue()
            self.execute_node(node, execution_context)
    
    def calculate_priority(self, node, context):
        # 优先级计算因素：
        # 1. 节点定义的优先级权重
        # 2. 下游依赖节点数量（影响更多节点的优先）
        # 3. 预计执行时间（短任务优先）
        # 4. 截止时间（紧急任务优先）
        base_priority = node.config.priority
        downstream_count = len(node.downstream_nodes)
        urgency = self.calculate_urgency(node, context)
        
        return base_priority + downstream_count * 10 + urgency
    
    def on_node_complete(self, node, result):
        self.running_tasks.remove(node.id)
        # 通知依赖解析器更新状态
        self.dependency_resolver.mark_completed(node)
        # 触发下游节点
        for downstream in node.downstream_nodes:
            if self.dependency_resolver.is_ready(downstream):
                priority = self.calculate_priority(downstream, result.context)
                self.priority_queue.enqueue(downstream, priority)
```

### 1.4 执行器设计

#### 1.4.1 执行器架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      执行器 (Executor)                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │   节点执行器     │    │   Agent执行器    │    │  任务执行器  │ │
│  │  NodeExecutor   │    │  AgentExecutor  │    │ TaskExecutor│ │
│  └────────┬────────┘    └────────┬────────┘    └──────┬──────┘ │
│           │                      │                     │        │
│           └──────────────────────┼─────────────────────┘        │
│                                  │                              │
│                         ┌────────┴────────┐                     │
│                         │   执行运行时     │                     │
│                         │ ExecutionRuntime│                     │
│                         └────────┬────────┘                     │
│                                  │                              │
│  ┌───────────────────────────────┼───────────────────────────┐ │
│  │                               ▼                           │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │ LLM调用  │  │ 工具调用  │  │ 代码执行  │  │ 子图执行  │  │ │
│  │  │ LLMCall  │  │ToolCall  │  │CodeExec  │  │SubGraph  │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.4.2 节点执行流程

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  开始   │───►│ 预处理  │───►│ 执行    │───►│ 后处理  │───►│  完成   │
│  Start  │    │ Prepare │    │ Execute │    │ Post    │    │  End    │
└─────────┘    └────┬────┘    └────┬────┘    └────┬────┘    └─────────┘
                    │              │              │
                    ▼              ▼              ▼
            ┌──────────┐   ┌──────────┐   ┌──────────┐
            │变量替换  │   │Agent调用 │   │结果存储  │
            │条件检查  │   │工具调用  │   │事件触发  │
            │权限验证  │   │代码执行  │   │日志记录  │
            └──────────┘   └──────────┘   └──────────┘
```

### 1.5 状态机设计

#### 1.5.1 工作流状态机

```
                    ┌─────────────┐
         ┌─────────►│   PENDING   │◄────────┐
         │          │  (等待中)    │         │
         │          └──────┬──────┘         │
         │                 │ start           │
         │                 ▼                 │
    cancel│          ┌─────────────┐         │ retry
         │          │   RUNNING   │         │
         │    ┌────►│  (运行中)    │────┐    │
         │    │     └──────┬──────┘    │    │
         │    │            │           │    │
         │    │     ┌──────┴──────┐    │    │
         │    │     │             │    │    │
         │ pause  complete      fail  │    │
         │    │     │             │    │    │
         │    │     ▼             ▼    │    │
         │    │  ┌─────────┐   ┌──────────┐ │
         │    └──┤COMPLETED│   │  FAILED  │─┘
         │       │ (已完成) │   │ (失败)   │
         │       └─────────┘   └──────────┘
         │
         └────────────────────────────────────┘
```

#### 1.5.2 Agent状态机

```
                         ┌─────────────┐
              ┌─────────►│   CREATED   │◄────────┐
              │          │  (已创建)    │         │
              │          └──────┬──────┘         │
              │                 │ initialize     │
              │                 ▼                │
              │          ┌─────────────┐         │
              │     ┌───►│ INITIALIZING│         │
              │     │    │  (初始化中)  │         │
              │     │    └──────┬──────┘         │
              │     │           │ ready          │
              │     │           ▼                │
    ┌─────────┼─────┼────┐ ┌─────────────┐       │
    │         │     │    │ │    IDLE     │       │
    │         │     │    │ │  (空闲)      │       │
    │         │     │    │ └──────┬──────┘       │
    │         │     │    │        │ activate     │
    │         │     │    │        ▼              │
    │    ┌────┴─────┴────┴──►┌─────────────┐    │
    │    │                    │  EXECUTING  │────┘
    │    │   TERMINATING      │  (执行中)    │
    │    │   ◄───────────────┤             │
    │    │        terminate   └──────┬──────┘
    │    │                    ┌──────┴──────┐
    │    │               suspend│        │complete
    │    │                    ▼        ▼
    │    │               ┌─────────┐ ┌─────────┐
    │    │               │SUSPENDED│ │COMPLETED│
    │    │               │(已暂停) │ │(已完成) │
    │    │               └────┬────┘ └─────────┘
    │    │                    │ resume
    │    └────────────────────┘
    │
    └────────────────────────────────────────►┌─────────┐
                                              │TERMINATED│
                                              │(已终止)  │
                                              └─────────┘
```

---

## 2. Agent生命周期管理

### 2.1 Agent工厂/构建器设计

#### 2.1.1 工厂模式架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent工厂模式                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐         ┌─────────────┐                  │
│   │  Agent定义   │────────►│ AgentBuilder │                  │
│   │  Definition │         │   构建器     │                  │
│   └─────────────┘         └──────┬──────┘                  │
│                                  │                          │
│                                  ▼                          │
│                         ┌─────────────┐                     │
│                         │  Agent工厂   │                     │
│                         │   Factory   │                     │
│                         └──────┬──────┘                     │
│                                │                            │
│           ┌────────────────────┼────────────────────┐       │
│           ▼                    ▼                    ▼       │
│    ┌─────────────┐      ┌─────────────┐      ┌─────────────┐│
│    │ LLM Agent   │      │ Tool Agent  │      │ Code Agent  ││
│    │  (对话型)   │      │  (工具型)   │      │  (代码型)   ││
│    └─────────────┘      └─────────────┘      └─────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 2.1.2 Agent构建器设计

```python
class AgentBuilder:
    """Agent构建器 - 使用Builder模式构建Agent实例"""
    
    def __init__(self):
        self._config = AgentConfig()
    
    def with_name(self, name: str) -> 'AgentBuilder':
        self._config.name = name
        return self
    
    def with_role(self, role: str) -> 'AgentBuilder':
        self._config.role = role
        return self
    
    def with_llm(self, llm_config: LLMConfig) -> 'AgentBuilder':
        self._config.llm = llm_config
        return self
    
    def with_tools(self, tools: List[Tool]) -> 'AgentBuilder':
        self._config.tools.extend(tools)
        return self
    
    def with_memory(self, memory_config: MemoryConfig) -> 'AgentBuilder':
        self._config.memory = memory_config
        return self
    
    def with_system_prompt(self, prompt: str) -> 'AgentBuilder':
        self._config.system_prompt = prompt
        return self
    
    def build(self) -> Agent:
        # 根据配置创建对应的Agent类型
        if self._config.agent_type == AgentType.LLM:
            return LLMAgent(self._config)
        elif self._config.agent_type == AgentType.TOOL:
            return ToolAgent(self._config)
        elif self._config.agent_type == AgentType.CODE:
            return CodeAgent(self._config)
        else:
            raise ValueError(f"Unknown agent type: {self._config.agent_type}")

# 使用示例
agent = (AgentBuilder()
    .with_name("Researcher")
    .with_role("research_assistant")
    .with_llm(LLMConfig(model="gpt-4", temperature=0.7))
    .with_tools([web_search_tool, document_reader_tool])
    .with_memory(MemoryConfig(max_tokens=4000))
    .with_system_prompt("You are a research assistant...")
    .build())
```

### 2.2 状态转换管理

#### 2.2.1 状态转换控制器

```python
class AgentStateMachine:
    """Agent状态机 - 管理Agent状态转换"""
    
    # 定义有效的状态转换
    VALID_TRANSITIONS = {
        AgentState.CREATED: [AgentState.INITIALIZING, AgentState.TERMINATING],
        AgentState.INITIALIZING: [AgentState.IDLE, AgentState.TERMINATING, AgentState.FAILED],
        AgentState.IDLE: [AgentState.EXECUTING, AgentState.TERMINATING],
        AgentState.EXECUTING: [AgentState.IDLE, AgentState.SUSPENDED, AgentState.COMPLETED, 
                               AgentState.FAILED, AgentState.TERMINATING],
        AgentState.SUSPENDED: [AgentState.EXECUTING, AgentState.TERMINATING],
        AgentState.COMPLETED: [AgentState.TERMINATING],
        AgentState.FAILED: [AgentState.INITIALIZING, AgentState.TERMINATING],  # 支持重试
        AgentState.TERMINATING: [AgentState.TERMINATED],
        AgentState.TERMINATED: []  # 终态
    }
    
    def __init__(self, agent: Agent):
        self.agent = agent
        self._state = AgentState.CREATED
        self._lock = asyncio.Lock()
        self._state_listeners = []
    
    @property
    def state(self) -> AgentState:
        return self._state
    
    async def transition_to(self, new_state: AgentState, context: dict = None):
        """执行状态转换"""
        async with self._lock:
            if new_state not in self.VALID_TRANSITIONS[self._state]:
                raise InvalidStateTransitionError(
                    f"Cannot transition from {self._state} to {new_state}"
                )
            
            old_state = self._state
            self._state = new_state
            
            # 记录状态转换日志
            logger.info(f"Agent {self.agent.id}: {old_state} -> {new_state}")
            
            # 触发状态变更事件
            await self._notify_state_change(old_state, new_state, context)
            
            # 执行状态进入动作
            await self._on_enter_state(new_state, context)
    
    async def _on_enter_state(self, state: AgentState, context: dict):
        """状态进入时的处理逻辑"""
        handlers = {
            AgentState.INITIALIZING: self._on_initializing,
            AgentState.IDLE: self._on_idle,
            AgentState.EXECUTING: self._on_executing,
            AgentState.SUSPENDED: self._on_suspended,
            AgentState.TERMINATING: self._on_terminating,
        }
        
        handler = handlers.get(state)
        if handler:
            await handler(context)
    
    async def _on_initializing(self, context):
        """初始化状态处理"""
        # 加载模型、初始化内存、注册工具
        await self.agent.initialize()
    
    async def _on_executing(self, context):
        """执行状态处理"""
        task = context.get('task')
        if task:
            await self.agent.execute(task)
    
    async def _on_suspended(self, context):
        """暂停状态处理 - 保存检查点"""
        checkpoint = await self.agent.create_checkpoint()
        await self.agent.store_checkpoint(checkpoint)
    
    async def _on_terminating(self, context):
        """终止状态处理 - 清理资源"""
        await self.agent.cleanup()
```

### 2.3 并发控制

#### 2.3.1 并发控制架构

```python
class ConcurrencyController:
    """并发控制器 - 管理Agent并发执行"""
    
    def __init__(self, max_concurrent: int = 100):
        self.max_concurrent = max_concurrent
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._agent_locks = {}  # Agent级别的锁
        self._global_lock = asyncio.Lock()
    
    async def acquire_execution_slot(self, agent_id: str) -> bool:
        """获取执行槽位"""
        try:
            await asyncio.wait_for(
                self._semaphore.acquire(),
                timeout=30.0
            )
            return True
        except asyncio.TimeoutError:
            return False
    
    def release_execution_slot(self):
        """释放执行槽位"""
        self._semaphore.release()
    
    async def acquire_agent_lock(self, agent_id: str):
        """获取Agent级别的锁（防止同一Agent并发执行）"""
        async with self._global_lock:
            if agent_id not in self._agent_locks:
                self._agent_locks[agent_id] = asyncio.Lock()
        
        await self._agent_locks[agent_id].acquire()
    
    def release_agent_lock(self, agent_id: str):
        """释放Agent级别的锁"""
        if agent_id in self._agent_locks:
            self._agent_locks[agent_id].release()

class AgentExecutionPool:
    """Agent执行池 - 管理Agent执行上下文"""
    
    def __init__(self):
        self._executions = {}  # agent_id -> ExecutionContext
        self._lock = asyncio.Lock()
    
    async def start_execution(self, agent_id: str, task: Task) -> ExecutionContext:
        """开始新的执行"""
        async with self._lock:
            if agent_id in self._executions:
                raise AgentBusyError(f"Agent {agent_id} is already executing")
            
            context = ExecutionContext(agent_id=agent_id, task=task)
            self._executions[agent_id] = context
            return context
    
    async def end_execution(self, agent_id: str):
        """结束执行"""
        async with self._lock:
            if agent_id in self._executions:
                del self._executions[agent_id]
    
    def get_execution(self, agent_id: str) -> Optional[ExecutionContext]:
        """获取执行上下文"""
        return self._executions.get(agent_id)
```

### 2.4 资源管理

#### 2.4.1 资源配额管理

```python
@dataclass
class ResourceQuota:
    """资源配额定义"""
    max_agents: int = 100           # 最大Agent数量
    max_memory_mb: int = 4096       # 最大内存(MB)
    max_tokens_per_minute: int = 100000  # 每分钟最大Token数
    max_execution_time_sec: int = 300    # 最大执行时间(秒)
    max_concurrent_tasks: int = 10       # 最大并发任务数

class ResourceManager:
    """资源管理器 - 管理Agent资源配额和回收"""
    
    def __init__(self, quota: ResourceQuota):
        self.quota = quota
        self._usage = ResourceUsage()
        self._agent_pool = AgentPool()
        self._monitor = ResourceMonitor()
    
    async def allocate_resources(self, agent_config: AgentConfig) -> ResourceAllocation:
        """为Agent分配资源"""
        # 检查配额
        if not self._check_quota(agent_config):
            raise ResourceExhaustedError("Resource quota exceeded")
        
        # 分配资源
        allocation = ResourceAllocation(
            memory_mb=agent_config.memory_limit,
            token_quota=agent_config.token_limit,
            execution_timeout=agent_config.timeout
        )
        
        self._usage.add(allocation)
        return allocation
    
    def _check_quota(self, config: AgentConfig) -> bool:
        """检查是否超出配额"""
        return (
            self._usage.agent_count < self.quota.max_agents and
            self._usage.memory_mb + config.memory_limit <= self.quota.max_memory_mb
        )
    
    async def release_resources(self, agent_id: str):
        """释放Agent资源"""
        allocation = self._usage.get_allocation(agent_id)
        if allocation:
            self._usage.remove(allocation)
            await self._agent_pool.release(agent_id)

class AgentPool:
    """Agent池 - 实现Agent复用"""
    
    def __init__(self, max_idle: int = 20, ttl_seconds: int = 300):
        self.max_idle = max_idle
        self.ttl_seconds = ttl_seconds
        self._idle_agents = {}  # agent_id -> (agent, last_used_time)
        self._lock = asyncio.Lock()
    
    async def acquire(self, agent_config: AgentConfig) -> Optional[Agent]:
        """从池中获取Agent"""
        async with self._lock:
            # 查找匹配的闲置Agent
            for agent_id, (agent, _) in list(self._idle_agents.items()):
                if self._is_compatible(agent, agent_config):
                    del self._idle_agents[agent_id]
                    return agent
        return None
    
    async def release(self, agent: Agent):
        """将Agent归还到池中"""
        async with self._lock:
            if len(self._idle_agents) >= self.max_idle:
                # 淘汰最久未使用的Agent
                self._evict_oldest()
            
            agent.reset()  # 重置Agent状态
            self._idle_agents[agent.id] = (agent, time.time())
    
    async def cleanup_expired(self):
        """清理过期Agent"""
        async with self._lock:
            current_time = time.time()
            expired = [
                agent_id for agent_id, (_, last_used) in self._idle_agents.items()
                if current_time - last_used > self.ttl_seconds
            ]
            for agent_id in expired:
                agent, _ = self._idle_agents.pop(agent_id)
                await agent.terminate()
```

---

## 3. 工作流执行机制

### 3.1 工作流解析和加载

#### 3.1.1 工作流定义结构

```python
@dataclass
class WorkflowDefinition:
    """工作流定义"""
    id: str
    name: str
    version: str
    nodes: List[NodeDefinition]
    edges: List[EdgeDefinition]
    variables: Dict[str, VariableDefinition]
    config: WorkflowConfig

@dataclass
class NodeDefinition:
    """节点定义"""
    id: str
    type: NodeType  # AGENT, CONDITION, LOOP, PARALLEL, SUBGRAPH, etc.
    config: Dict[str, Any]
    inputs: List[InputMapping]
    outputs: List[OutputMapping]
    retry_policy: RetryPolicy
    timeout: int

@dataclass
class EdgeDefinition:
    """边定义"""
    id: str
    source: str
    target: str
    condition: Optional[Condition]  # 条件边
    type: EdgeType  # NORMAL, CONDITIONAL, ERROR, etc.
```

#### 3.1.2 工作流解析器

```python
class WorkflowParser:
    """工作流解析器 - 将DSL/JSON解析为内部表示"""
    
    def parse(self, workflow_json: dict) -> WorkflowDefinition:
        """解析工作流定义"""
        # 1. 验证Schema
        self._validate_schema(workflow_json)
        
        # 2. 解析节点
        nodes = [self._parse_node(n) for n in workflow_json.get('nodes', [])]
        
        # 3. 解析边
        edges = [self._parse_edge(e) for e in workflow_json.get('edges', [])]
        
        # 4. 构建依赖图
        dependency_graph = self._build_dependency_graph(nodes, edges)
        
        # 5. 检测循环
        if self._detect_cycle(dependency_graph):
            raise WorkflowValidationError("Workflow contains cycle")
        
        # 6. 验证连通性
        self._validate_connectivity(nodes, edges)
        
        return WorkflowDefinition(
            id=workflow_json['id'],
            name=workflow_json['name'],
            version=workflow_json.get('version', '1.0'),
            nodes=nodes,
            edges=edges,
            variables=self._parse_variables(workflow_json.get('variables', {})),
            config=self._parse_config(workflow_json.get('config', {}))
        )
    
    def _parse_node(self, node_json: dict) -> NodeDefinition:
        """解析节点定义"""
        node_type = NodeType(node_json['type'])
        
        parser = self._get_node_parser(node_type)
        return parser.parse(node_json)
    
    def _get_node_parser(self, node_type: NodeType) -> NodeParser:
        """获取节点解析器"""
        parsers = {
            NodeType.AGENT: AgentNodeParser(),
            NodeType.CONDITION: ConditionNodeParser(),
            NodeType.LOOP: LoopNodeParser(),
            NodeType.PARALLEL: ParallelNodeParser(),
            NodeType.SUBGRAPH: SubgraphNodeParser(),
            NodeType.START: StartNodeParser(),
            NodeType.END: EndNodeParser(),
        }
        return parsers.get(node_type, DefaultNodeParser())
    
    def _build_dependency_graph(self, nodes: List[NodeDefinition], 
                                 edges: List[EdgeDefinition]) -> Dict[str, Set[str]]:
        """构建依赖图"""
        graph = {node.id: set() for node in nodes}
        
        for edge in edges:
            if edge.type == EdgeType.NORMAL:
                graph[edge.target].add(edge.source)
        
        return graph
    
    def _detect_cycle(self, graph: Dict[str, Set[str]]) -> bool:
        """检测图中是否有环（使用DFS）"""
        visited = set()
        rec_stack = set()
        
        def dfs(node):
            visited.add(node)
            rec_stack.add(node)
            
            for neighbor in graph.get(node, []):
                if neighbor not in visited:
                    if dfs(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True
            
            rec_stack.remove(node)
            return False
        
        for node in graph:
            if node not in visited:
                if dfs(node):
                    return True
        return False
```

### 3.2 节点执行顺序控制

#### 3.2.1 拓扑排序执行器

```python
class TopologicalExecutor:
    """拓扑排序执行器 - 按依赖顺序执行节点"""
    
    def __init__(self, workflow: WorkflowDefinition):
        self.workflow = workflow
        self.execution_order = self._compute_execution_order()
        self.completed_nodes = set()
        self.failed_nodes = set()
    
    def _compute_execution_order(self) -> List[List[str]]:
        """
        计算执行顺序，返回分层结构
        同层节点可以并行执行
        """
        # 构建入度表
        in_degree = {node.id: 0 for node in self.workflow.nodes}
        adjacency = {node.id: [] for node in self.workflow.nodes}
        
        for edge in self.workflow.edges:
            if edge.type == EdgeType.NORMAL:
                adjacency[edge.source].append(edge.target)
                in_degree[edge.target] += 1
        
        # Kahn算法分层
        layers = []
        current_layer = [node_id for node_id, degree in in_degree.items() if degree == 0]
        
        while current_layer:
            layers.append(current_layer)
            next_layer = []
            
            for node_id in current_layer:
                for neighbor in adjacency[node_id]:
                    in_degree[neighbor] -= 1
                    if in_degree[neighbor] == 0:
                        next_layer.append(neighbor)
            
            current_layer = next_layer
        
        return layers
    
    async def execute(self, context: ExecutionContext) -> ExecutionResult:
        """执行工作流"""
        for layer in self.execution_order:
            # 同层节点并行执行
            tasks = [
                self._execute_node(node_id, context)
                for node_id in layer
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # 检查执行结果
            for node_id, result in zip(layer, results):
                if isinstance(result, Exception):
                    self.failed_nodes.add(node_id)
                    # 根据错误处理策略决定是否继续
                    if not self._should_continue_on_error(node_id, result):
                        raise WorkflowExecutionError(f"Node {node_id} failed: {result}")
                else:
                    self.completed_nodes.add(node_id)
        
        return ExecutionResult(
            status=ExecutionStatus.COMPLETED,
            completed_nodes=self.completed_nodes,
            context=context
        )
```

### 3.3 条件分支处理

#### 3.3.1 条件评估引擎

```python
class ConditionEvaluator:
    """条件评估引擎 - 评估条件表达式"""
    
    def __init__(self, context: ExecutionContext):
        self.context = context
        self.operators = self._register_operators()
    
    def _register_operators(self) -> Dict[str, Callable]:
        """注册条件操作符"""
        return {
            # 比较操作符
            'eq': lambda a, b: a == b,
            'ne': lambda a, b: a != b,
            'gt': lambda a, b: a > b,
            'gte': lambda a, b: a >= b,
            'lt': lambda a, b: a < b,
            'lte': lambda a, b: a <= b,
            
            # 逻辑操作符
            'and': lambda a, b: a and b,
            'or': lambda a, b: a or b,
            'not': lambda a: not a,
            
            # 包含操作符
            'in': lambda a, b: a in b,
            'contains': lambda a, b: b in a,
            
            # 正则匹配
            'matches': lambda a, b: re.match(b, a) is not None,
            
            # 类型检查
            'is_null': lambda a: a is None,
            'is_empty': lambda a: not a,
        }
    
    def evaluate(self, condition: Condition) -> bool:
        """评估条件"""
        if condition.type == ConditionType.SIMPLE:
            return self._evaluate_simple(condition)
        elif condition.type == ConditionType.COMPOUND:
            return self._evaluate_compound(condition)
        elif condition.type == ConditionType.EXPRESSION:
            return self._evaluate_expression(condition)
        else:
            raise ValueError(f"Unknown condition type: {condition.type}")
    
    def _evaluate_simple(self, condition: Condition) -> bool:
        """评估简单条件"""
        # 获取变量值
        left_value = self._resolve_variable(condition.left)
        right_value = self._resolve_value(condition.right)
        
        # 执行操作符
        operator = self.operators.get(condition.operator)
        if not operator:
            raise ValueError(f"Unknown operator: {condition.operator}")
        
        return operator(left_value, right_value)
    
    def _evaluate_compound(self, condition: Condition) -> bool:
        """评估复合条件"""
        results = [self.evaluate(c) for c in condition.conditions]
        
        if condition.logical_op == 'AND':
            return all(results)
        elif condition.logical_op == 'OR':
            return any(results)
        else:
            raise ValueError(f"Unknown logical operator: {condition.logical_op}")
    
    def _evaluate_expression(self, condition: Condition) -> bool:
        """评估表达式条件"""
        # 使用安全的表达式求值
        expression = condition.expression
        
        # 替换变量引用
        def replace_var(match):
            var_name = match.group(1)
            value = self._resolve_variable(var_name)
            return repr(value)
        
        expression = re.sub(r'\$\{(\w+)\}', replace_var, expression)
        
        # 安全求值
        try:
            result = ast.literal_eval(expression)
            return bool(result)
        except Exception as e:
            raise ConditionEvaluationError(f"Failed to evaluate expression: {expression}") from e
    
    def _resolve_variable(self, var_path: str) -> Any:
        """解析变量路径获取值"""
        # 支持嵌套路径: context.user.name
        parts = var_path.split('.')
        value = self.context.variables
        
        for part in parts:
            if isinstance(value, dict):
                value = value.get(part)
            else:
                value = getattr(value, part, None)
            
            if value is None:
                break
        
        return value

class ConditionalRouter:
    """条件路由器 - 根据条件选择执行路径"""
    
    def __init__(self, evaluator: ConditionEvaluator):
        self.evaluator = evaluator
    
    def route(self, node_id: str, edges: List[EdgeDefinition]) -> List[str]:
        """根据条件选择目标节点"""
        matching_targets = []
        
        for edge in edges:
            if edge.source != node_id:
                continue
            
            # 无条件边直接匹配
            if edge.type == EdgeType.NORMAL:
                matching_targets.append(edge.target)
            
            # 条件边需要评估
            elif edge.type == EdgeType.CONDITIONAL:
                if edge.condition and self.evaluator.evaluate(edge.condition):
                    matching_targets.append(edge.target)
            
            # 错误边在失败时匹配
            elif edge.type == EdgeType.ERROR:
                # 错误边在错误处理阶段处理
                pass
        
        return matching_targets
```

### 3.4 并行执行处理

#### 3.4.1 并行执行器

```python
class ParallelExecutor:
    """并行执行器 - 管理并行节点执行"""
    
    def __init__(self, max_concurrency: int = 10):
        self.max_concurrency = max_concurrency
        self.semaphore = asyncio.Semaphore(max_concurrency)
    
    async def execute_parallel(self, nodes: List[NodeDefinition], 
                               context: ExecutionContext) -> Dict[str, NodeResult]:
        """并行执行多个节点"""
        results = {}
        
        async def execute_with_limit(node: NodeDefinition):
            async with self.semaphore:
                result = await self._execute_node(node, context)
                results[node.id] = result
                return result
        
        # 创建所有任务
        tasks = [execute_with_limit(node) for node in nodes]
        
        # 等待所有完成
        await asyncio.gather(*tasks, return_exceptions=True)
        
        return results
    
    async def execute_parallel_with_aggregation(self, 
                                                 nodes: List[NodeDefinition],
                                                 context: ExecutionContext,
                                                 aggregation_strategy: AggregationStrategy) -> AggregationResult:
        """并行执行并聚合结果"""
        results = await self.execute_parallel(nodes, context)
        
        # 聚合结果
        aggregator = ResultAggregator(aggregation_strategy)
        aggregated = aggregator.aggregate(results)
        
        return aggregated

class ResultAggregator:
    """结果聚合器 - 聚合并行执行结果"""
    
    def __init__(self, strategy: AggregationStrategy):
        self.strategy = strategy
    
    def aggregate(self, results: Dict[str, NodeResult]) -> AggregationResult:
        """根据策略聚合结果"""
        if self.strategy == AggregationStrategy.ALL:
            return self._aggregate_all(results)
        elif self.strategy == AggregationStrategy.ANY:
            return self._aggregate_any(results)
        elif self.strategy == AggregationStrategy.MAJORITY:
            return self._aggregate_majority(results)
        elif self.strategy == AggregationStrategy.FIRST:
            return self._aggregate_first(results)
        elif self.strategy == AggregationStrategy.CUSTOM:
            return self._aggregate_custom(results)
        else:
            raise ValueError(f"Unknown aggregation strategy: {self.strategy}")
    
    def _aggregate_all(self, results: Dict[str, NodeResult]) -> AggregationResult:
        """所有结果必须成功"""
        successful = {k: v for k, v in results.items() if v.status == NodeStatus.SUCCESS}
        failed = {k: v for k, v in results.items() if v.status == NodeStatus.FAILED}
        
        if failed:
            return AggregationResult(
                status=AggregationStatus.PARTIAL_SUCCESS,
                results=successful,
                failures=failed
            )
        
        return AggregationResult(
            status=AggregationStatus.SUCCESS,
            results=successful
        )
```

### 3.5 子图嵌套执行

#### 3.5.1 子图执行器

```python
class SubgraphExecutor:
    """子图执行器 - 执行嵌套子工作流"""
    
    def __init__(self, workflow_loader: WorkflowLoader):
        self.workflow_loader = workflow_loader
        self.subgraph_cache = {}
    
    async def execute_subgraph(self, node: SubgraphNode, 
                               context: ExecutionContext) -> SubgraphResult:
        """执行子图节点"""
        # 1. 加载子工作流
        subgraph_def = await self._load_subgraph(node.subgraph_id)
        
        # 2. 创建子图执行上下文
        subgraph_context = self._create_subgraph_context(node, context)
        
        # 3. 创建子图执行器
        executor = WorkflowExecutor(subgraph_def)
        
        # 4. 执行子工作流
        result = await executor.execute(subgraph_context)
        
        # 5. 映射输出
        output = self._map_outputs(node, result, context)
        
        return SubgraphResult(
            status=result.status,
            output=output,
            subgraph_result=result
        )
    
    def _create_subgraph_context(self, node: SubgraphNode, 
                                  parent_context: ExecutionContext) -> ExecutionContext:
        """创建子图执行上下文"""
        # 继承父上下文的部分变量
        subgraph_variables = {}
        
        # 映射输入变量
        for mapping in node.input_mappings:
            parent_value = self._resolve_path(parent_context.variables, mapping.source)
            self._set_path(subgraph_variables, mapping.target, parent_value)
        
        # 创建隔离的子上下文
        return ExecutionContext(
            workflow_id=node.subgraph_id,
            parent_context=parent_context,
            variables=subgraph_variables,
            depth=parent_context.depth + 1
        )
    
    async def _load_subgraph(self, subgraph_id: str) -> WorkflowDefinition:
        """加载子图定义"""
        if subgraph_id not in self.subgraph_cache:
            self.subgraph_cache[subgraph_id] = await self.workflow_loader.load(subgraph_id)
        return self.subgraph_cache[subgraph_id]

class RecursiveWorkflowExecutor:
    """递归工作流执行器 - 支持任意深度的嵌套"""
    
    MAX_DEPTH = 10  # 最大嵌套深度
    
    def __init__(self):
        self.subgraph_executor = SubgraphExecutor(WorkflowLoader())
    
    async def execute(self, workflow: WorkflowDefinition, 
                      context: ExecutionContext) -> ExecutionResult:
        """递归执行工作流"""
        if context.depth > self.MAX_DEPTH:
            raise MaxDepthExceededError(f"Max workflow nesting depth exceeded: {self.MAX_DEPTH}")
        
        # 执行当前层
        for node in workflow.nodes:
            if isinstance(node, SubgraphNode):
                # 递归执行子图
                result = await self.subgraph_executor.execute_subgraph(node, context)
            else:
                # 执行普通节点
                result = await self._execute_node(node, context)
            
            # 更新上下文
            context.set_node_result(node.id, result)
        
        return ExecutionResult(status=ExecutionStatus.COMPLETED, context=context)
```

---

## 4. 动态调度实现

### 4.1 事件总线设计

#### 4.1.1 事件总线架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                         事件总线 (Event Bus)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐     ┌─────────────────────────────────────┐       │
│  │   事件发布   │────►│           事件路由器                 │       │
│  │  Publisher  │     │            Event Router              │       │
│  └─────────────┘     └──────────────────┬──────────────────┘       │
│                                         │                          │
│                    ┌────────────────────┼────────────────────┐     │
│                    ▼                    ▼                    ▼     │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────┐│
│  │   主题路由 (Topic)   │  │   类型路由 (Type)    │  │  条件路由     ││
│  │   /agent/created    │  │   AgentEvent        │  │  Conditional ││
│  │   /task/completed   │  │   TaskEvent         │  │              ││
│  └──────────┬──────────┘  └──────────┬──────────┘  └──────┬───────┘│
│             │                        │                    │        │
│             └────────────────────────┼────────────────────┘        │
│                                      ▼                             │
│                         ┌─────────────────────┐                    │
│                         │    订阅者管理器      │                    │
│                         │   SubscriberMgr     │                    │
│                         └──────────┬──────────┘                    │
│                                    │                               │
│         ┌──────────────────────────┼──────────────────────────┐    │
│         ▼                          ▼                          ▼    │
│  ┌─────────────┐            ┌─────────────┐            ┌──────────┐│
│  │  Agent A    │            │  Agent B    │            │ Scheduler││
│  │  Handler    │            │  Handler    │            │ Handler  ││
│  └─────────────┘            └─────────────┘            └──────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 4.1.2 事件总线实现

```python
@dataclass
class Event:
    """事件定义"""
    id: str
    type: str
    topic: str
    payload: Dict[str, Any]
    timestamp: datetime
    source: str
    correlation_id: Optional[str] = None
    priority: int = 0

class EventBus:
    """事件总线 - 处理事件的发布和订阅"""
    
    def __init__(self):
        self._subscribers: Dict[str, Set[EventHandler]] = defaultdict(set)
        self._type_subscribers: Dict[str, Set[EventHandler]] = defaultdict(set)
        self._pattern_subscribers: List[Tuple[Pattern, EventHandler]] = []
        self._event_queue = asyncio.PriorityQueue()
        self._running = False
    
    def subscribe(self, topic: str, handler: EventHandler):
        """订阅特定主题的事件"""
        self._subscribers[topic].add(handler)
        logger.info(f"Handler {handler} subscribed to topic: {topic}")
    
    def subscribe_by_type(self, event_type: str, handler: EventHandler):
        """按事件类型订阅"""
        self._type_subscribers[event_type].add(handler)
    
    def subscribe_by_pattern(self, pattern: str, handler: EventHandler):
        """按正则模式订阅"""
        compiled_pattern = re.compile(pattern)
        self._pattern_subscribers.append((compiled_pattern, handler))
    
    def unsubscribe(self, topic: str, handler: EventHandler):
        """取消订阅"""
        if topic in self._subscribers:
            self._subscribers[topic].discard(handler)
    
    async def publish(self, event: Event):
        """发布事件"""
        # 添加到优先级队列
        await self._event_queue.put((event.priority, time.time(), event))
    
    async def start(self):
        """启动事件处理循环"""
        self._running = True
        while self._running:
            try:
                _, _, event = await asyncio.wait_for(
                    self._event_queue.get(),
                    timeout=1.0
                )
                await self._dispatch(event)
            except asyncio.TimeoutError:
                continue
    
    async def _dispatch(self, event: Event):
        """分发事件到订阅者"""
        handlers = set()
        
        # 1. 主题匹配
        handlers.update(self._subscribers.get(event.topic, set()))
        
        # 2. 类型匹配
        handlers.update(self._type_subscribers.get(event.type, set()))
        
        # 3. 模式匹配
        for pattern, handler in self._pattern_subscribers:
            if pattern.match(event.topic):
                handlers.add(handler)
        
        # 4. 异步调用所有处理器
        if handlers:
            await asyncio.gather(
                *[self._safe_handle(handler, event) for handler in handlers],
                return_exceptions=True
            )
    
    async def _safe_handle(self, handler: EventHandler, event: Event):
        """安全地调用事件处理器"""
        try:
            await handler.handle(event)
        except Exception as e:
            logger.error(f"Event handler error: {e}", exc_info=True)

class EventDrivenScheduler:
    """事件驱动调度器 - 基于事件触发Agent执行"""
    
    def __init__(self, event_bus: EventBus, agent_manager: AgentManager):
        self.event_bus = event_bus
        self.agent_manager = agent_manager
        self._event_triggers: Dict[str, List[EventTrigger]] = defaultdict(list)
    
    def register_trigger(self, trigger: EventTrigger):
        """注册事件触发器"""
        self._event_triggers[trigger.event_type].append(trigger)
        
        # 订阅对应事件
        self.event_bus.subscribe_by_type(
            trigger.event_type,
            EventTriggerHandler(trigger, self)
        )
    
    async def on_event(self, event: Event):
        """处理触发事件"""
        triggers = self._event_triggers.get(event.type, [])
        
        for trigger in triggers:
            # 评估触发条件
            if trigger.condition and not self._evaluate_condition(trigger.condition, event):
                continue
            
            # 创建或唤醒Agent
            if trigger.action == TriggerAction.CREATE:
                await self._create_agent(trigger, event)
            elif trigger.action == TriggerAction.WAKEUP:
                await self._wakeup_agent(trigger, event)
            elif trigger.action == TriggerAction.BROADCAST:
                await self._broadcast(trigger, event)
    
    async def _create_agent(self, trigger: EventTrigger, event: Event):
        """根据触发器创建Agent"""
        agent_config = self._build_agent_config(trigger, event)
        agent = await self.agent_manager.create_agent(agent_config)
        
        # 启动Agent执行任务
        await self.agent_manager.activate_agent(agent.id, event.payload)
```

### 4.2 条件评估引擎

```python
class ConditionEngine:
    """条件评估引擎 - 评估复杂条件表达式"""
    
    def __init__(self, context_provider: ContextProvider):
        self.context_provider = context_provider
        self.evaluators = self._register_evaluators()
    
    def _register_evaluators(self) -> Dict[str, ConditionEvaluator]:
        """注册条件评估器"""
        return {
            'variable': VariableConditionEvaluator(),
            'expression': ExpressionConditionEvaluator(),
            'time': TimeConditionEvaluator(),
            'event': EventConditionEvaluator(),
            'composite': CompositeConditionEvaluator(),
        }
    
    async def evaluate(self, condition: Condition, context: dict = None) -> bool:
        """评估条件"""
        evaluator = self.evaluators.get(condition.type)
        if not evaluator:
            raise ValueError(f"Unknown condition type: {condition.type}")
        
        ctx = context or await self.context_provider.get_context()
        return await evaluator.evaluate(condition, ctx)

class TimeConditionEvaluator(ConditionEvaluator):
    """时间条件评估器"""
    
    async def evaluate(self, condition: Condition, context: dict) -> bool:
        condition_type = condition.config.get('time_type')
        
        if condition_type == 'cron':
            return self._evaluate_cron(condition)
        elif condition_type == 'interval':
            return self._evaluate_interval(condition)
        elif condition_type == 'range':
            return self._evaluate_time_range(condition)
        elif condition_type == 'delay':
            return self._evaluate_delay(condition)
        
        return False
    
    def _evaluate_cron(self, condition: Condition) -> bool:
        """评估Cron表达式"""
        cron_expr = condition.config.get('cron')
        last_triggered = condition.config.get('last_triggered')
        
        # 使用croniter检查是否应该触发
        itr = croniter(cron_expr, last_triggered or datetime.now())
        next_trigger = itr.get_next(datetime)
        
        return datetime.now() >= next_trigger
```

### 4.3 触发器管理

```python
@dataclass
class Trigger:
    """触发器定义"""
    id: str
    name: str
    type: TriggerType  # EVENT, SCHEDULE, CONDITION, MANUAL
    condition: Condition
    action: TriggerAction
    target: TriggerTarget
    config: Dict[str, Any]
    enabled: bool = True
    last_triggered: Optional[datetime] = None
    trigger_count: int = 0
    max_triggers: Optional[int] = None

class TriggerManager:
    """触发器管理器 - 管理所有触发器"""
    
    def __init__(self, condition_engine: ConditionEngine, event_bus: EventBus):
        self.condition_engine = condition_engine
        self.event_bus = event_bus
        self._triggers: Dict[str, Trigger] = {}
        self._scheduler = AsyncIOScheduler()
    
    def register(self, trigger: Trigger):
        """注册触发器"""
        self._triggers[trigger.id] = trigger
        
        if trigger.type == TriggerType.SCHEDULE:
            self._schedule_trigger(trigger)
        elif trigger.type == TriggerType.EVENT:
            self._register_event_trigger(trigger)
        elif trigger.type == TriggerType.CONDITION:
            self._register_condition_trigger(trigger)
    
    def _schedule_trigger(self, trigger: Trigger):
        """调度定时触发器"""
        cron_expr = trigger.config.get('cron')
        if cron_expr:
            self._scheduler.add_job(
                self._on_trigger,
                CronTrigger.from_crontab(cron_expr),
                args=[trigger.id],
                id=trigger.id
            )
    
    async def _on_trigger(self, trigger_id: str):
        """触发器触发"""
        trigger = self._triggers.get(trigger_id)
        if not trigger or not trigger.enabled:
            return
        
        # 检查触发次数限制
        if trigger.max_triggers and trigger.trigger_count >= trigger.max_triggers:
            trigger.enabled = False
            return
        
        # 执行触发动作
        await self._execute_action(trigger)
        
        # 更新触发统计
        trigger.last_triggered = datetime.now()
        trigger.trigger_count += 1
    
    async def _execute_action(self, trigger: Trigger):
        """执行触发动作"""
        action = trigger.action
        target = trigger.target
        
        if action == TriggerAction.START_WORKFLOW:
            await self._start_workflow(target, trigger.config.get('input', {}))
        elif action == TriggerAction.ACTIVATE_AGENT:
            await self._activate_agent(target, trigger.config.get('input', {}))
        elif action == TriggerAction.PUBLISH_EVENT:
            await self._publish_event(target, trigger.config.get('payload', {}))
```

### 4.4 Agent池化管理

```python
class PooledAgentManager:
    """池化Agent管理器 - 实现Agent复用"""
    
    def __init__(self, config: PoolConfig):
        self.config = config
        self._pools: Dict[str, AgentPool] = {}  # pool_key -> AgentPool
        self._agent_metadata: Dict[str, AgentMetadata] = {}
    
    async def acquire(self, agent_config: AgentConfig) -> Agent:
        """获取Agent（优先从池中获取）"""
        pool_key = self._get_pool_key(agent_config)
        
        # 获取或创建池
        pool = self._get_or_create_pool(pool_key, agent_config)
        
        # 尝试从池中获取
        agent = await pool.acquire()
        if agent:
            logger.info(f"Reused agent {agent.id} from pool {pool_key}")
            return agent
        
        # 池为空，创建新Agent
        agent = await self._create_agent(agent_config)
        self._agent_metadata[agent.id] = AgentMetadata(
            pool_key=pool_key,
            created_at=datetime.now(),
            use_count=0
        )
        
        return agent
    
    async def release(self, agent: Agent):
        """释放Agent（归还到池或销毁）"""
        metadata = self._agent_metadata.get(agent.id)
        if not metadata:
            await agent.terminate()
            return
        
        pool = self._pools.get(metadata.pool_key)
        if not pool:
            await agent.terminate()
            return
        
        # 检查Agent是否还可以复用
        if self._is_agent_reusable(agent, metadata):
            await pool.release(agent)
            metadata.use_count += 1
            logger.info(f"Agent {agent.id} returned to pool")
        else:
            await agent.terminate()
            del self._agent_metadata[agent.id]
            logger.info(f"Agent {agent.id} terminated")
    
    def _is_agent_reusable(self, agent: Agent, metadata: AgentMetadata) -> bool:
        """检查Agent是否可复用"""
        # 检查使用次数
        if metadata.use_count >= self.config.max_reuse_count:
            return False
        
        # 检查Agent状态
        if agent.state not in [AgentState.IDLE, AgentState.COMPLETED]:
            return False
        
        # 检查Agent健康
        if not agent.is_healthy():
            return False
        
        return True
    
    async def cleanup(self):
        """清理过期Agent"""
        current_time = datetime.now()
        
        for pool_key, pool in self._pools.items():
            expired_agents = []
            
            for agent_id, metadata in self._agent_metadata.items():
                if metadata.pool_key != pool_key:
                    continue
                
                # 检查空闲超时
                idle_time = (current_time - metadata.last_used).total_seconds()
                if idle_time > self.config.idle_timeout_seconds:
                    expired_agents.append(agent_id)
            
            for agent_id in expired_agents:
                await pool.remove(agent_id)
                del self._agent_metadata[agent_id]
```

---

## 5. 上下文管理

### 5.1 执行上下文数据结构

```python
@dataclass
class ExecutionContext:
    """执行上下文 - 维护执行状态和数据"""
    workflow_id: str
    execution_id: str
    variables: VariableStore
    parent_context: Optional['ExecutionContext'] = None
    depth: int = 0
    
    # 执行状态
    node_results: Dict[str, NodeResult] = field(default_factory=dict)
    current_node_id: Optional[str] = None
    start_time: datetime = field(default_factory=datetime.now)
    
    # 元数据
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def get_variable(self, path: str) -> Any:
        """获取变量值（支持嵌套路径）"""
        # 首先在当前上下文查找
        value = self.variables.get(path)
        if value is not None:
            return value
        
        # 递归在父上下文查找
        if self.parent_context:
            return self.parent_context.get_variable(path)
        
        return None
    
    def set_variable(self, path: str, value: Any, scope: VariableScope = VariableScope.LOCAL):
        """设置变量值"""
        if scope == VariableScope.LOCAL:
            self.variables.set(path, value)
        elif scope == VariableScope.PARENT and self.parent_context:
            self.parent_context.set_variable(path, value, scope)
        elif scope == VariableScope.GLOBAL:
            # 找到根上下文
            root = self
            while root.parent_context:
                root = root.parent_context
            root.variables.set(path, value)
    
    def create_child_context(self, workflow_id: str) -> 'ExecutionContext':
        """创建子上下文"""
        return ExecutionContext(
            workflow_id=workflow_id,
            execution_id=generate_id(),
            variables=VariableStore(),
            parent_context=self,
            depth=self.depth + 1
        )

class VariableStore:
    """变量存储 - 支持嵌套路径和类型安全"""
    
    def __init__(self):
        self._data: Dict[str, Any] = {}
        self._types: Dict[str, VariableType] = {}
        self._lock = asyncio.Lock()
    
    def get(self, path: str) -> Any:
        """获取变量值"""
        parts = path.split('.')
        value = self._data
        
        for part in parts:
            if isinstance(value, dict):
                value = value.get(part)
            elif hasattr(value, part):
                value = getattr(value, part)
            else:
                return None
            
            if value is None:
                break
        
        return value
    
    def set(self, path: str, value: Any, var_type: VariableType = None):
        """设置变量值"""
        parts = path.split('.')
        target = self._data
        
        # 创建嵌套路径
        for part in parts[:-1]:
            if part not in target:
                target[part] = {}
            target = target[part]
        
        # 设置值
        target[parts[-1]] = value
        
        # 记录类型
        if var_type:
            self._types[path] = var_type
    
    def merge(self, other: 'VariableStore', prefix: str = None):
        """合并另一个变量存储"""
        for key, value in other._data.items():
            full_key = f"{prefix}.{key}" if prefix else key
            self.set(full_key, value)
```

### 5.2 变量作用域

```python
class VariableScopeManager:
    """变量作用域管理器"""
    
    def __init__(self, context: ExecutionContext):
        self.context = context
        self._scope_stack: List[Scope] = [GlobalScope()]
    
    def push_scope(self, scope_type: ScopeType, node_id: str = None):
        """压入新作用域"""
        if scope_type == ScopeType.NODE:
            scope = NodeScope(node_id)
        elif scope_type == ScopeType.LOOP:
            scope = LoopScope()
        elif scope_type == ScopeType.CONDITION:
            scope = ConditionScope()
        else:
            scope = LocalScope()
        
        self._scope_stack.append(scope)
    
    def pop_scope(self):
        """弹出当前作用域"""
        if len(self._scope_stack) > 1:
            return self._scope_stack.pop()
        return None
    
    def resolve_variable(self, name: str) -> Tuple[Any, Scope]:
        """解析变量（按作用域链查找）"""
        # 从内到外查找
        for scope in reversed(self._scope_stack):
            if scope.contains(name):
                return scope.get(name), scope
        
        # 在上下文中查找
        value = self.context.get_variable(name)
        if value is not None:
            return value, GlobalScope()
        
        return None, None
    
    def set_variable(self, name: str, value: Any, scope_hint: ScopeType = None):
        """设置变量"""
        if scope_hint:
            # 在指定作用域设置
            for scope in reversed(self._scope_stack):
                if scope.type == scope_hint:
                    scope.set(name, value)
                    return
        
        # 在当前作用域设置
        self._scope_stack[-1].set(name, value)
```

### 5.3 数据传递机制

```python
class DataFlowManager:
    """数据流管理器 - 管理节点间数据传递"""
    
    def __init__(self, context: ExecutionContext):
        self.context = context
    
    def map_inputs(self, node: NodeDefinition, 
                   upstream_results: Dict[str, NodeResult]) -> Dict[str, Any]:
        """映射节点输入"""
        inputs = {}
        
        for mapping in node.inputs:
            source_value = self._resolve_source(mapping.source, upstream_results)
            
            # 类型转换
            if mapping.target_type:
                source_value = self._convert_type(source_value, mapping.target_type)
            
            # 应用转换函数
            if mapping.transform:
                source_value = self._apply_transform(source_value, mapping.transform)
            
            inputs[mapping.target] = source_value
        
        return inputs
    
    def map_outputs(self, node: NodeDefinition, 
                    execution_result: Any) -> Dict[str, Any]:
        """映射节点输出"""
        outputs = {}
        
        for mapping in node.outputs:
            value = self._extract_value(execution_result, mapping.source)
            outputs[mapping.target] = value
        
        return outputs
    
    def _resolve_source(self, source: str, 
                        upstream_results: Dict[str, NodeResult]) -> Any:
        """解析数据源"""
        # 格式: "node_id.output_name" 或 "variable_name"
        if '.' in source:
            parts = source.split('.')
            node_id = parts[0]
            output_path = '.'.join(parts[1:])
            
            result = upstream_results.get(node_id)
            if result:
                return self._extract_value(result.output, output_path)
        
        # 从上下文变量查找
        return self.context.get_variable(source)
    
    def _extract_value(self, data: Any, path: str) -> Any:
        """从数据结构中提取值"""
        parts = path.split('.')
        value = data
        
        for part in parts:
            if isinstance(value, dict):
                value = value.get(part)
            elif isinstance(value, list) and part.isdigit():
                value = value[int(part)]
            elif hasattr(value, part):
                value = getattr(value, part)
            else:
                return None
        
        return value
    
    def _convert_type(self, value: Any, target_type: str) -> Any:
        """类型转换"""
        converters = {
            'string': str,
            'integer': int,
            'float': float,
            'boolean': bool,
            'array': list,
            'object': dict,
        }
        
        converter = converters.get(target_type)
        if converter:
            return converter(value)
        
        return value
```

---

## 6. 错误处理

### 6.1 异常分类

```python
class WorkflowException(Exception):
    """工作流异常基类"""
    def __init__(self, message: str, node_id: str = None, 
                 error_code: str = None, details: dict = None):
        super().__init__(message)
        self.node_id = node_id
        self.error_code = error_code or "UNKNOWN_ERROR"
        self.details = details or {}
        self.timestamp = datetime.now()

class NodeExecutionError(WorkflowException):
    """节点执行错误"""
    pass

class AgentExecutionError(NodeExecutionError):
    """Agent执行错误"""
    pass

class ConditionEvaluationError(WorkflowException):
    """条件评估错误"""
    pass

class ResourceExhaustedError(WorkflowException):
    """资源耗尽错误"""
    pass

class TimeoutError(WorkflowException):
    """超时错误"""
    pass

class ValidationError(WorkflowException):
    """验证错误"""
    pass

class StateTransitionError(WorkflowException):
    """状态转换错误"""
    pass

# 错误分类映射
ERROR_CATEGORIES = {
    # 可重试错误
    'RETRYABLE': [
        'NETWORK_ERROR',
        'RATE_LIMIT_ERROR',
        'TEMPORARY_UNAVAILABLE',
        'TIMEOUT',
    ],
    # 不可重试错误
    'NON_RETRYABLE': [
        'VALIDATION_ERROR',
        'PERMISSION_DENIED',
        'NOT_FOUND',
        'INVALID_INPUT',
    ],
    # 需要人工介入
    'MANUAL_INTERVENTION': [
        'BUSINESS_RULE_VIOLATION',
        'APPROVAL_REQUIRED',
        'AMBIGUOUS_INPUT',
    ]
}
```

### 6.2 重试机制

```python
@dataclass
class RetryPolicy:
    """重试策略"""
    max_attempts: int = 3
    initial_delay: float = 1.0
    max_delay: float = 60.0
    backoff_strategy: BackoffStrategy = BackoffStrategy.EXPONENTIAL
    retryable_errors: List[str] = field(default_factory=list)
    on_retry_callback: Optional[Callable] = None

class RetryExecutor:
    """重试执行器"""
    
    def __init__(self, policy: RetryPolicy):
        self.policy = policy
    
    async def execute(self, operation: Callable, *args, **kwargs) -> Any:
        """带重试的执行"""
        last_exception = None
        
        for attempt in range(1, self.policy.max_attempts + 1):
            try:
                return await operation(*args, **kwargs)
            except Exception as e:
                last_exception = e
                
                # 检查是否可重试
                if not self._is_retryable(e):
                    raise
                
                # 最后一次尝试，直接抛出
                if attempt == self.policy.max_attempts:
                    break
                
                # 计算延迟
                delay = self._calculate_delay(attempt)
                
                # 执行回调
                if self.policy.on_retry_callback:
                    await self.policy.on_retry_callback(attempt, e, delay)
                
                logger.warning(f"Retry {attempt}/{self.policy.max_attempts} "
                              f"after {delay}s due to: {e}")
                
                await asyncio.sleep(delay)
        
        raise last_exception
    
    def _is_retryable(self, error: Exception) -> bool:
        """检查错误是否可重试"""
        error_code = getattr(error, 'error_code', 'UNKNOWN')
        return error_code in ERROR_CATEGORIES['RETRYABLE']
    
    def _calculate_delay(self, attempt: int) -> float:
        """计算重试延迟"""
        if self.policy.backoff_strategy == BackoffStrategy.FIXED:
            return self.policy.initial_delay
        
        elif self.policy.backoff_strategy == BackoffStrategy.LINEAR:
            return self.policy.initial_delay * attempt
        
        elif self.policy.backoff_strategy == BackoffStrategy.EXPONENTIAL:
            delay = self.policy.initial_delay * (2 ** (attempt - 1))
            return min(delay, self.policy.max_delay)
        
        elif self.policy.backoff_strategy == BackoffStrategy.JITTER:
            delay = self.policy.initial_delay * (2 ** (attempt - 1))
            delay = min(delay, self.policy.max_delay)
            # 添加随机抖动
            return delay * (0.5 + random.random())
        
        return self.policy.initial_delay
```

### 6.3 补偿事务

```python
@dataclass
class CompensationAction:
    """补偿动作"""
    action: Callable
    params: Dict[str, Any]
    description: str
    max_attempts: int = 3

class CompensationManager:
    """补偿事务管理器"""
    
    def __init__(self):
        self._compensation_stack: List[CompensationAction] = []
        self._executed_compensations: List[CompensationResult] = []
    
    def register(self, action: CompensationAction):
        """注册补偿动作"""
        self._compensation_stack.append(action)
    
    async def compensate(self, error: Exception) -> CompensationResult:
        """执行补偿"""
        results = []
        
        # 按LIFO顺序执行补偿
        while self._compensation_stack:
            action = self._compensation_stack.pop()
            
            try:
                result = await self._execute_compensation_action(action)
                results.append(result)
            except Exception as comp_error:
                # 补偿失败，记录并继续
                logger.error(f"Compensation failed: {comp_error}")
                results.append(CompensationResult(
                    action=action,
                    success=False,
                    error=comp_error
                ))
        
        return CompensationResult(
            original_error=error,
            compensation_results=results,
            success=all(r.success for r in results)
        )
    
    async def _execute_compensation_action(self, action: CompensationAction) -> CompensationResult:
        """执行单个补偿动作"""
        retry_executor = RetryExecutor(RetryPolicy(max_attempts=action.max_attempts))
        
        result = await retry_executor.execute(
            action.action,
            **action.params
        )
        
        return CompensationResult(
            action=action,
            success=True,
            result=result
        )

class SagaOrchestrator:
    """Saga编排器 - 实现长事务的补偿模式"""
    
    def __init__(self):
        self.compensation_manager = CompensationManager()
        self._saga_log = []
    
    async def execute_saga(self, saga: SagaDefinition, context: ExecutionContext) -> SagaResult:
        """执行Saga"""
        executed_steps = []
        
        try:
            for step in saga.steps:
                # 执行步骤
                result = await self._execute_step(step, context)
                executed_steps.append((step, result))
                
                # 记录到Saga日志
                self._saga_log.append({
                    'step': step.id,
                    'action': 'EXECUTE',
                    'result': result,
                    'timestamp': datetime.now()
                })
                
                # 注册补偿动作
                if step.compensation:
                    self.compensation_manager.register(step.compensation)
            
            return SagaResult(status=SagaStatus.COMPLETED, steps=executed_steps)
        
        except Exception as e:
            logger.error(f"Saga failed at step, starting compensation: {e}")
            
            # 执行补偿
            compensation_result = await self.compensation_manager.compensate(e)
            
            return SagaResult(
                status=SagaStatus.COMPENSATED if compensation_result.success else SagaStatus.FAILED,
                steps=executed_steps,
                error=e,
                compensation_result=compensation_result
            )
```

### 6.4 失败恢复

```python
class CheckpointManager:
    """检查点管理器 - 保存和恢复执行状态"""
    
    def __init__(self, storage: CheckpointStorage):
        self.storage = storage
    
    async def create_checkpoint(self, context: ExecutionContext) -> Checkpoint:
        """创建检查点"""
        checkpoint = Checkpoint(
            id=generate_id(),
            execution_id=context.execution_id,
            workflow_id=context.workflow_id,
            timestamp=datetime.now(),
            state={
                'variables': context.variables.to_dict(),
                'node_results': {
                    node_id: result.to_dict()
                    for node_id, result in context.node_results.items()
                },
                'current_node_id': context.current_node_id,
                'metadata': context.metadata
            }
        )
        
        # 持久化检查点
        await self.storage.save(checkpoint)
        
        return checkpoint
    
    async def restore_from_checkpoint(self, checkpoint_id: str) -> ExecutionContext:
        """从检查点恢复"""
        checkpoint = await self.storage.load(checkpoint_id)
        
        # 重建执行上下文
        context = ExecutionContext(
            workflow_id=checkpoint.workflow_id,
            execution_id=checkpoint.execution_id,
            variables=VariableStore.from_dict(checkpoint.state['variables']),
            metadata=checkpoint.state.get('metadata', {})
        )
        
        # 恢复节点结果
        for node_id, result_dict in checkpoint.state['node_results'].items():
            context.node_results[node_id] = NodeResult.from_dict(result_dict)
        
        context.current_node_id = checkpoint.state.get('current_node_id')
        
        return context

class FailureRecoveryManager:
    """故障恢复管理器"""
    
    def __init__(self, checkpoint_manager: CheckpointManager):
        self.checkpoint_manager = checkpoint_manager
        self._recovery_strategies = self._register_strategies()
    
    def _register_strategies(self) -> Dict[str, RecoveryStrategy]:
        """注册恢复策略"""
        return {
            'RESTART': RestartRecoveryStrategy(),
            'RESUME': ResumeRecoveryStrategy(self.checkpoint_manager),
            'SKIP': SkipRecoveryStrategy(),
            'ALTERNATE': AlternatePathRecoveryStrategy(),
        }
    
    async def recover(self, error: Exception, context: ExecutionContext,
                      workflow: WorkflowDefinition) -> RecoveryResult:
        """执行故障恢复"""
        # 确定恢复策略
        strategy_type = self._determine_strategy(error, context)
        strategy = self._recovery_strategies.get(strategy_type)
        
        if not strategy:
            raise RecoveryError(f"No recovery strategy found for: {strategy_type}")
        
        # 执行恢复
        return await strategy.recover(error, context, workflow)
    
    def _determine_strategy(self, error: Exception, 
                            context: ExecutionContext) -> str:
        """确定恢复策略"""
        # 如果有检查点，优先恢复
        if context.metadata.get('last_checkpoint'):
            return 'RESUME'
        
        # 根据错误类型选择策略
        error_code = getattr(error, 'error_code', 'UNKNOWN')
        
        if error_code in ['TIMEOUT', 'NETWORK_ERROR']:
            return 'RESTART'
        
        if error_code in ['NODE_SKIPPABLE']:
            return 'SKIP'
        
        if error_code in ['ALTERNATE_PATH_AVAILABLE']:
            return 'ALTERNATE'
        
        return 'RESTART'

class ResumeRecoveryStrategy(RecoveryStrategy):
    """恢复策略 - 从检查点恢复"""
    
    def __init__(self, checkpoint_manager: CheckpointManager):
        self.checkpoint_manager = checkpoint_manager
    
    async def recover(self, error: Exception, context: ExecutionContext,
                      workflow: WorkflowDefinition) -> RecoveryResult:
        """从检查点恢复执行"""
        checkpoint_id = context.metadata.get('last_checkpoint')
        
        if not checkpoint_id:
            raise RecoveryError("No checkpoint available for resume")
        
        # 恢复上下文
        restored_context = await self.checkpoint_manager.restore_from_checkpoint(
            checkpoint_id
        )
        
        # 标记恢复点
        restored_context.metadata['recovered_from'] = checkpoint_id
        restored_context.metadata['recovery_attempts'] = \
            restored_context.metadata.get('recovery_attempts', 0) + 1
        
        return RecoveryResult(
            success=True,
            strategy='RESUME',
            restored_context=restored_context,
            resume_from_node=restored_context.current_node_id
        )
```

---

## 7. 核心类设计

### 7.1 类图（文字描述）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              核心类图                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐         ┌─────────────────────┐                   │
│  │   ExecutionEngine   │◄────────│   WorkflowEngine    │                   │
│  │   (执行引擎主类)     │         │   (工作流引擎)       │                   │
│  ├─────────────────────┤         ├─────────────────────┤                   │
│  │ - scheduler         │         │ - parser            │                   │
│  │ - executor          │         │ - executor          │                   │
│  │ - state_machine     │         │ - checkpoint_mgr    │                   │
│  │ - event_bus         │         │ - error_handler     │                   │
│  └─────────────────────┘         └─────────────────────┘                   │
│           │                                │                                │
│           │         ┌──────────────────────┘                                │
│           │         │                                                       │
│           ▼         ▼                                                       │
│  ┌─────────────────────┐         ┌─────────────────────┐                   │
│  │ ExecutionScheduler  │         │  WorkflowExecutor   │                   │
│  │   (执行调度器)       │         │  (工作流执行器)      │                   │
│  ├─────────────────────┤         ├─────────────────────┤                   │
│  │ + schedule()        │         │ + execute()         │                   │
│  │ + on_node_complete()│         │ + pause()           │                   │
│  │ + calculate_priority│         │ + resume()          │                   │
│  └─────────────────────┘         │ + cancel()          │                   │
│                                  └─────────────────────┘                   │
│                                                                             │
│  ┌─────────────────────┐         ┌─────────────────────┐                   │
│  │   AgentManager      │◄────────│    AgentFactory     │                   │
│  │   (Agent管理器)      │         │    (Agent工厂)       │                   │
│  ├─────────────────────┤         ├─────────────────────┤                   │
│  │ - pool              │         │ + create_agent()    │                   │
│  │ - lifecycle_mgr     │         │ + build_from_config │                   │
│  │ - resource_mgr      │         │ + register_builder  │                   │
│  │ + spawn()           │         └─────────────────────┘                   │
│  │ + terminate()       │                                                   │
│  │ + suspend()         │         ┌─────────────────────┐                   │
│  │ + resume()          │◄────────│   AgentStateMachine │                   │
│  └─────────────────────┘         │   (Agent状态机)      │                   │
│                                  ├─────────────────────┤                   │
│  ┌─────────────────────┐         │ - state             │                   │
│  │    EventBus         │         │ + transition_to()   │                   │
│  │    (事件总线)        │         │ + get_state()       │                   │
│  ├─────────────────────┤         │ + on_enter_state()  │                   │
│  │ - subscribers       │         └─────────────────────┘                   │
│  │ - event_queue       │                                                   │
│  │ + subscribe()       │         ┌─────────────────────┐                   │
│  │ + publish()         │◄────────│  ExecutionContext   │                   │
│  │ + dispatch()        │         │  (执行上下文)        │                   │
│  └─────────────────────┘         ├─────────────────────┤                   │
│                                  │ - variables         │                   │
│  ┌─────────────────────┐         │ - node_results      │                   │
│  │   ContextManager    │         │ - parent_context    │                   │
│  │   (上下文管理器)     │         │ + get_variable()    │                   │
│  ├─────────────────────┤         │ + set_variable()    │                   │
│  │ - scope_stack       │         │ + create_child()    │                   │
│  │ + push_scope()      │         └─────────────────────┘                   │
│  │ + pop_scope()       │                                                   │
│  │ + resolve_variable  │         ┌─────────────────────┐                   │
│  └─────────────────────┘         │   ErrorHandler      │                   │
│                                  │   (错误处理器)       │                   │
│  ┌─────────────────────┐         ├─────────────────────┤                   │
│  │   TriggerManager    │         │ - retry_executor    │                   │
│  │   (触发器管理器)     │         │ - compensation_mgr  │                   │
│  ├─────────────────────┤         │ - recovery_mgr      │                   │
│  │ - triggers          │         │ + handle_error()    │                   │
│  │ - scheduler         │         │ + retry()           │                   │
│  │ + register()        │         │ + compensate()      │                   │
│  │ + unregister()      │         │ + recover()         │                   │
│  └─────────────────────┘         └─────────────────────┘                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 关键接口定义

```python
# ============================================
# 核心接口定义
# ============================================

# 1. 执行引擎接口
class IExecutionEngine(ABC):
    """执行引擎接口"""
    
    @abstractmethod
    async def start(self) -> None:
        """启动引擎"""
        pass
    
    @abstractmethod
    async def stop(self) -> None:
        """停止引擎"""
        pass
    
    @abstractmethod
    async def submit_workflow(self, workflow: WorkflowDefinition, 
                              input_data: dict) -> ExecutionHandle:
        """提交工作流执行"""
        pass
    
    @abstractmethod
    async def get_execution_status(self, execution_id: str) -> ExecutionStatus:
        """获取执行状态"""
        pass

# 2. 调度器接口
class IScheduler(ABC):
    """调度器接口"""
    
    @abstractmethod
    def schedule(self, nodes: List[NodeDefinition], 
                 context: ExecutionContext) -> List[SchedulingDecision]:
        """调度节点执行"""
        pass
    
    @abstractmethod
    def on_node_complete(self, node_id: str, result: NodeResult):
        """节点完成回调"""
        pass

# 3. 执行器接口
class IExecutor(ABC):
    """执行器接口"""
    
    @abstractmethod
    async def execute_node(self, node: NodeDefinition, 
                           context: ExecutionContext) -> NodeResult:
        """执行节点"""
        pass
    
    @abstractmethod
    async def cancel_execution(self, execution_id: str) -> bool:
        """取消执行"""
        pass

# 4. Agent接口
class IAgent(ABC):
    """Agent接口"""
    
    @property
    @abstractmethod
    def id(self) -> str:
        pass
    
    @property
    @abstractmethod
    def state(self) -> AgentState:
        pass
    
    @abstractmethod
    async def initialize(self) -> None:
        """初始化Agent"""
        pass
    
    @abstractmethod
    async def execute(self, task: Task, context: ExecutionContext) -> AgentResult:
        """执行任务"""
        pass
    
    @abstractmethod
    async def suspend(self) -> Checkpoint:
        """暂停Agent"""
        pass
    
    @abstractmethod
    async def resume(self, checkpoint: Checkpoint) -> None:
        """恢复Agent"""
        pass
    
    @abstractmethod
    async def terminate(self) -> None:
        """终止Agent"""
        pass

# 5. 事件处理器接口
class IEventHandler(ABC):
    """事件处理器接口"""
    
    @abstractmethod
    async def handle(self, event: Event) -> None:
        """处理事件"""
        pass
    
    @abstractmethod
    def can_handle(self, event: Event) -> bool:
        """是否能处理该事件"""
        pass

# 6. 条件评估器接口
class IConditionEvaluator(ABC):
    """条件评估器接口"""
    
    @abstractmethod
    async def evaluate(self, condition: Condition, context: dict) -> bool:
        """评估条件"""
        pass

# 7. 持久化接口
class ICheckpointStorage(ABC):
    """检查点存储接口"""
    
    @abstractmethod
    async def save(self, checkpoint: Checkpoint) -> None:
        """保存检查点"""
        pass
    
    @abstractmethod
    async def load(self, checkpoint_id: str) -> Checkpoint:
        """加载检查点"""
        pass
    
    @abstractmethod
    async def delete(self, checkpoint_id: str) -> None:
        """删除检查点"""
        pass
```

### 7.3 核心算法伪代码

```python
# ============================================
# 核心算法伪代码
# ============================================

# 算法1: 工作流执行主循环
async def workflow_execution_loop(workflow, context, scheduler, executor):
    """
    工作流执行主循环
    """
    # 初始化
    completed_nodes = set()
    failed_nodes = set()
    running_tasks = {}
    
    while not is_workflow_complete(workflow, completed_nodes):
        # 1. 获取就绪节点
        ready_nodes = get_ready_nodes(workflow, completed_nodes, failed_nodes)
        
        # 2. 调度节点
        decisions = scheduler.schedule(ready_nodes, context)
        
        # 3. 执行节点
        for decision in decisions:
            if decision.action == Action.EXECUTE:
                task = asyncio.create_task(
                    executor.execute_node(decision.node, context)
                )
                running_tasks[decision.node.id] = task
        
        # 4. 等待至少一个任务完成
        if running_tasks:
            done, pending = await asyncio.wait(
                running_tasks.values(),
                return_when=asyncio.FIRST_COMPLETED
            )
            
            # 5. 处理完成的任务
            for task in done:
                node_id = get_node_id(task)
                result = await task
                
                if result.status == NodeStatus.SUCCESS:
                    completed_nodes.add(node_id)
                    context.node_results[node_id] = result
                    scheduler.on_node_complete(node_id, result)
                else:
                    failed_nodes.add(node_id)
                    
                    # 错误处理
                    if not handle_node_failure(node_id, result, context):
                        raise WorkflowExecutionError(f"Node {node_id} failed")
                
                del running_tasks[node_id]
    
    return ExecutionResult(status=ExecutionStatus.COMPLETED)


# 算法2: 动态调度算法
function dynamic_schedule(workflow_graph, execution_context):
    """
    动态调度算法 - 基于优先级和依赖关系调度
    """
    priority_queue = PriorityQueue()
    in_degree = calculate_in_degree(workflow_graph)
    
    # 初始化：将入度为0的节点加入队列
    for node in workflow_graph.nodes:
        if in_degree[node.id] == 0:
            priority = calculate_priority(node, execution_context)
            priority_queue.enqueue(node, priority)
    
    execution_order = []
    
    while not priority_queue.is_empty():
        # 获取优先级最高的节点
        node = priority_queue.dequeue()
        execution_order.append(node)
        
        # 更新相邻节点的入度
        for neighbor in workflow_graph.get_neighbors(node):
            in_degree[neighbor.id] -= 1
            
            if in_degree[neighbor.id] == 0:
                # 所有依赖已完成，计算优先级并入队
                priority = calculate_priority(neighbor, execution_context)
                priority_queue.enqueue(neighbor, priority)
    
    return execution_order


# 算法3: 事件驱动调度
async def event_driven_scheduler(event_bus, agent_manager, trigger_manager):
    """
    事件驱动调度器
    """
    # 注册事件处理器
    event_bus.subscribe("agent.request", handle_agent_request)
    event_bus.subscribe("task.completed", handle_task_completed)
    event_bus.subscribe("condition.met", handle_condition_met)
    
    while True:
        # 等待事件
        event = await event_bus.next_event()
        
        # 获取相关触发器
        triggers = trigger_manager.get_triggers_for_event(event)
        
        for trigger in triggers:
            # 评估触发条件
            if not trigger.evaluate(event):
                continue
            
            # 执行触发动作
            if trigger.action == Action.CREATE_AGENT:
                agent = await agent_manager.spawn(trigger.agent_config)
                await agent.execute(trigger.task)
                
            elif trigger.action == Action.WAKEUP_AGENT:
                agent = await agent_manager.get_agent(trigger.agent_id)
                await agent.resume()
                
            elif trigger.action == Action.SCHEDULE_TASK:
                scheduler.schedule_task(trigger.task, trigger.priority)


# 算法4: 带超时的Agent执行
async def execute_agent_with_timeout(agent, task, timeout_seconds, retry_policy):
    """
    带超时和重试的Agent执行
    """
    retry_count = 0
    
    while retry_count <= retry_policy.max_attempts:
        try:
            # 创建超时任务
            result = await asyncio.wait_for(
                agent.execute(task),
                timeout=timeout_seconds
            )
            return result
            
        except asyncio.TimeoutError:
            retry_count += 1
            
            if retry_count > retry_policy.max_attempts:
                raise TimeoutError(f"Agent execution timeout after {retry_count} retries")
            
            # 计算退避延迟
            delay = calculate_backoff(retry_count, retry_policy)
            await asyncio.sleep(delay)
            
        except Exception as e:
            if not is_retryable_error(e):
                raise
            
            retry_count += 1
            if retry_count > retry_policy.max_attempts:
                raise


# 算法5: 并行执行与结果聚合
async def parallel_execution_with_aggregation(nodes, context, aggregation_strategy):
    """
    并行执行节点并聚合结果
    """
    # 创建执行任务
    tasks = [
        execute_node_with_semaphore(node, context)
        for node in nodes
    ]
    
    # 并行执行
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # 处理异常
    successful_results = []
    failed_results = []
    
    for node, result in zip(nodes, results):
        if isinstance(result, Exception):
            failed_results.append((node, result))
        else:
            successful_results.append((node, result))
    
    # 根据策略聚合结果
    if aggregation_strategy == AggregationStrategy.ALL:
        if failed_results:
            raise PartialFailureError(failed_results)
        return aggregate_all(successful_results)
    
    elif aggregation_strategy == AggregationStrategy.ANY:
        if successful_results:
            return aggregate_any(successful_results)
        raise AllFailedError(failed_results)
    
    elif aggregation_strategy == AggregationStrategy.MAJORITY:
        if len(successful_results) > len(nodes) / 2:
            return aggregate_majority(successful_results)
        raise MajorityFailedError


# 算法6: 状态机转换
function state_transition(current_state, event, transition_table):
    """
    状态机转换
    """
    # 查找有效的转换
    valid_transitions = transition_table.get(current_state, [])
    
    for transition in valid_transitions:
        if transition.event == event.type:
            # 检查守卫条件
            if transition.guard and not evaluate_guard(transition.guard, event):
                continue
            
            # 执行退出动作
            execute_exit_action(current_state, event)
            
            # 转换到新状态
            new_state = transition.target_state
            
            # 执行进入动作
            execute_entry_action(new_state, event)
            
            # 执行转换动作
            if transition.action:
                execute_transition_action(transition.action, event)
            
            return new_state
    
    # 没有匹配的转换
    raise InvalidTransitionError(current_state, event.type)


# 算法7: 上下文变量解析
function resolve_variable(context, path):
    """
    解析变量（支持嵌套路径和跨作用域查找）
    """
    parts = path.split('.')
    current_context = context
    
    while current_context:
        # 在当前上下文中查找
        value = current_context.variables
        found = True
        
        for part in parts:
            if isinstance(value, dict) and part in value:
                value = value[part]
            elif hasattr(value, part):
                value = getattr(value, part)
            else:
                found = False
                break
        
        if found:
            return value
        
        # 在父上下文中查找
        current_context = current_context.parent_context
    
    return None
```

---

## 8. 总结

### 8.1 架构特点

1. **模块化设计**：各组件职责清晰，便于扩展和维护
2. **事件驱动**：支持动态调度和响应式执行
3. **状态机管理**：确保Agent和工作流状态转换的可靠性
4. **容错机制**：完善的错误处理、重试和恢复策略
5. **资源管理**：池化复用和配额控制，提高资源利用率

### 8.2 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 调度策略 | 优先级+依赖解析 | 平衡效率和灵活性 |
| Agent复用 | 池化+TTL | 平衡性能和资源 |
| 错误恢复 | 检查点+补偿 | 保证数据一致性 |
| 上下文传递 | 作用域链 | 支持嵌套和隔离 |
| 事件处理 | 优先级队列 | 保证重要事件优先处理 |

### 8.3 扩展点

1. **自定义节点类型**：通过NodeParser扩展新节点
2. **自定义调度策略**：实现IScheduler接口
3. **自定义条件评估**：实现IConditionEvaluator接口
4. **自定义存储后端**：实现ICheckpointStorage接口

---

*文档版本: 1.0*  
*创建日期: 2024*  
*作者: AI Agent编排工具开发团队*
