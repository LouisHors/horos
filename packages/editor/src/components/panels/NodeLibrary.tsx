import React, { useState, useMemo } from 'react';
import { Search, Play, Square, Bot, Wrench, GitBranch } from 'lucide-react';
import { useNodeRegistry } from '../../hooks/useNodeRegistry';
import { NodeDefinition } from '../../types';
import { cn } from '../../utils/cn';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  play: Play,
  square: Square,
  bot: Bot,
  wrench: Wrench,
  'git-branch': GitBranch,
};

interface NodeLibraryProps {
  className?: string;
  onNodeDragStart?: (event: React.DragEvent, nodeType: string) => void;
}

export const NodeLibrary: React.FC<NodeLibraryProps> = ({
  className,
  onNodeDragStart,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const {
    categories,
    allNodes,
    getNodesByCategory,
    searchNodes,
    onDragStart,
  } = useNodeRegistry();

  // Filter nodes based on search and category
  const filteredNodes = useMemo(() => {
    let nodes: NodeDefinition[] = allNodes;

    if (searchQuery) {
      nodes = searchNodes(searchQuery);
    } else if (selectedCategory) {
      nodes = getNodesByCategory(selectedCategory);
    }

    return nodes;
  }, [allNodes, searchQuery, selectedCategory, searchNodes, getNodesByCategory]);

  // Group nodes by category
  const groupedNodes = useMemo(() => {
    const groups: Record<string, NodeDefinition[]> = {};
    
    filteredNodes.forEach((node) => {
      if (!groups[node.category]) {
        groups[node.category] = [];
      }
      groups[node.category].push(node);
    });

    return groups;
  }, [filteredNodes]);

  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    onDragStart(event, nodeType);
    onNodeDragStart?.(event, nodeType);
  };

  return (
    <div
      className={cn(
        'w-72 bg-white border-r border-gray-200 flex flex-col h-full',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Node Library</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'placeholder:text-gray-400'
            )}
          />
        </div>
      </div>

      {/* Category Filter */}
      {!searchQuery && (
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                selectedCategory === null
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                  selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Node List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(groupedNodes).map(([category, nodes]) => (
          <div key={category}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {category}
            </h3>
            <div className="space-y-2">
              {nodes.map((node) => {
                const IconComponent = iconMap[node.icon || ''];
                
                return (
                  <div
                    key={node.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, node.type)}
                    className={cn(
                      'group flex items-center gap-3 p-3 rounded-lg border border-gray-200',
                      'cursor-grab active:cursor-grabbing',
                      'hover:border-blue-300 hover:bg-blue-50/50',
                      'transition-all duration-200'
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        'bg-gray-100 group-hover:bg-white',
                        'transition-colors'
                      )}
                    >
                      {IconComponent ? (
                        <IconComponent className="w-5 h-5 text-gray-600" />
                      ) : (
                        <div className="w-5 h-5 rounded bg-gray-300" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {node.name}
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-1">
                        {node.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredNodes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-sm">No nodes found</div>
            <div className="text-xs mt-1">Try adjusting your search</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          Drag nodes to canvas
        </div>
      </div>
    </div>
  );
};

export default NodeLibrary;
