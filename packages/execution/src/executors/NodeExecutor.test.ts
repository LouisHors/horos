import { describe, it, expect } from 'vitest';
import { NodeExecutor } from './NodeExecutor';
import { DAGNode, ExecutionContext } from '../types';

class TestExecutor extends NodeExecutor {
  async execute(node: DAGNode, context: ExecutionContext, _engine: unknown) {
    return { test: true };
  }
}

describe('NodeExecutor', () => {
  it('should execute node', async () => {
    const executor = new TestExecutor();
    const node: DAGNode = {
      id: 'test',
      type: 'test',
      data: {},
      inputs: [],
      outputs: [],
    };
    const context: ExecutionContext = {
      executionId: 'exec-1',
      workflowId: 'wf-1',
      variables: new Map(),
      nodeOutputs: new Map(),
      startTime: new Date(),
    };

    const result = await executor.execute(node, context, null);

    expect(result).toEqual({ test: true });
  });

  it('should get and set output data', async () => {
    const executor = new TestExecutor();
    const context: ExecutionContext = {
      executionId: 'exec-1',
      workflowId: 'wf-1',
      variables: new Map(),
      nodeOutputs: new Map([['prev', { value: 42 }]]),
      startTime: new Date(),
    };

    const input = executor['getInputData']('prev', context);
    expect(input).toEqual({ value: 42 });

    executor['setOutputData']('current', { result: 'ok' }, context);
    expect(context.nodeOutputs.get('current')).toEqual({ result: 'ok' });
  });
});
