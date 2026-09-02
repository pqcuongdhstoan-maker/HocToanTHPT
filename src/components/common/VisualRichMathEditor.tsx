import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ContentNode, TextNode, MathNode, parseContentToNodes, serializeNodesToLatex, generateNodeId } from '../../utils/mathNodeParser';
import { VisualMathEditorModal } from './VisualMathEditorModal';
import { MathText } from '../MathText';
import {
  Edit3,
  Trash2,
  Plus,
  Sparkles,
  Maximize2,
  Minimize2,
  MoveHorizontal,
  Layers,
  HelpCircle,
  Check,
} from 'lucide-react';

export interface VisualRichMathEditorProps {
  value: string;
  onChange: (serializedLatex: string) => void;
  placeholder?: string;
  isSingleLine?: boolean;
  minHeight?: string;
  className?: string;
}

export const VisualRichMathEditor: React.FC<VisualRichMathEditorProps> = ({
  value,
  onChange,
  placeholder = 'Nhập nội dung hoặc bấm "∑ Chèn công thức"...',
  isSingleLine = false,
  minHeight = '90px',
  className = '',
}) => {
  const [nodes, setNodes] = useState<ContentNode[]>(() => parseContentToNodes(value));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeEditingMathNode, setActiveEditingMathNode] = useState<MathNode | null>(null);
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState<boolean>(false);
  const [insertTargetIndex, setInsertTargetIndex] = useState<number | null>(null);

  // Sync internal nodes if external value changes drastically
  const prevValueRef = useRef<string>(value);
  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value;
      const parsed = parseContentToNodes(value);
      setNodes(parsed);
    }
  }, [value]);

  // Update nodes and notify parent
  const updateNodesAndNotify = useCallback((newNodes: ContentNode[]) => {
    // Ensure we don't have empty nodes array
    const cleanNodes = newNodes.length > 0 ? newNodes : [{ id: generateNodeId(), type: 'text' as const, text: '' }];
    setNodes(cleanNodes);
    const serialized = serializeNodesToLatex(cleanNodes);
    prevValueRef.current = serialized;
    onChange(serialized);
  }, [onChange]);

  // Handle text change in a specific text node
  const handleTextChange = (nodeId: string, newText: string) => {
    const updated = nodes.map((n) => (n.id === nodeId ? { ...n, text: newText } : n));
    updateNodesAndNotify(updated);
  };

  // Open formula editor to create new formula
  const handleOpenNewFormulaModal = (targetIdx?: number) => {
    setActiveEditingMathNode(null);
    setInsertTargetIndex(targetIdx !== undefined ? targetIdx : nodes.length);
    setIsFormulaModalOpen(true);
  };

  // Open formula editor to edit existing math node
  const handleEditMathNode = (mathNode: MathNode) => {
    setActiveEditingMathNode(mathNode);
    setSelectedNodeId(mathNode.id);
    setIsFormulaModalOpen(true);
  };

  // Delete a math node
  const handleDeleteNode = (nodeId: string) => {
    const updated = nodes.filter((n) => n.id !== nodeId);
    // Merge consecutive text nodes if any
    const merged: ContentNode[] = [];
    for (const n of updated) {
      if (merged.length > 0 && merged[merged.length - 1].type === 'text' && n.type === 'text') {
        merged[merged.length - 1] = {
          ...merged[merged.length - 1],
          text: (merged[merged.length - 1] as TextNode).text + n.text,
        };
      } else {
        merged.push(n);
      }
    }
    updateNodesAndNotify(merged.length > 0 ? merged : [{ id: generateNodeId(), type: 'text', text: '' }]);
  };

  // Toggle math node display mode (inline vs block)
  const handleToggleMathMode = (nodeId: string) => {
    const updated = nodes.map((n) => {
      if (n.id === nodeId && n.type !== 'text') {
        const nextType = n.type === 'inlineMath' ? ('blockMath' as const) : ('inlineMath' as const);
        return { ...n, type: nextType };
      }
      return n;
    });
    updateNodesAndNotify(updated);
  };

  // Handle formula insertion / update from modal
  const handleFormulaModalSave = (latex: string, displayMode: 'inline' | 'block') => {
    let cleanLatex = latex.trim();
    if (cleanLatex.startsWith('$$') && cleanLatex.endsWith('$$')) {
      cleanLatex = cleanLatex.slice(2, -2).trim();
    } else if (cleanLatex.startsWith('$') && cleanLatex.endsWith('$')) {
      cleanLatex = cleanLatex.slice(1, -1).trim();
    }

    if (!cleanLatex) {
      setIsFormulaModalOpen(false);
      return;
    }

    const mathType = displayMode === 'block' ? 'blockMath' : 'inlineMath';

    if (activeEditingMathNode) {
      // Update existing math node
      const updated = nodes.map((n) =>
        n.id === activeEditingMathNode.id
          ? { ...n, latex: cleanLatex, type: mathType }
          : n
      );
      updateNodesAndNotify(updated);
    } else {
      // Insert new math node at target index
      const newMathNode: MathNode = {
        id: generateNodeId(),
        type: mathType,
        latex: cleanLatex,
        source: 'manual',
        conversionStatus: 'success',
      };

      const idx = insertTargetIndex !== null ? insertTargetIndex : nodes.length;
      const nextNodes = [...nodes];
      nextNodes.splice(idx, 0, newMathNode);

      // Ensure there's a trailing text node if needed
      if (idx === nextNodes.length - 1 || nextNodes[idx + 1]?.type !== 'text') {
        nextNodes.splice(idx + 1, 0, { id: generateNodeId(), type: 'text', text: ' ' });
      }

      updateNodesAndNotify(nextNodes);
    }

    setIsFormulaModalOpen(false);
    setActiveEditingMathNode(null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Visual Canvas Box */}
      <div
        style={{ minHeight }}
        className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-300 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all"
      >
        {/* Visual Nodes Flow */}
        <div className="flex flex-wrap items-center gap-y-2.5 gap-x-1.5 text-xs text-slate-800 leading-relaxed font-sans">
          {nodes.map((node, index) => {
            // RENDER TEXT NODE
            if (node.type === 'text') {
              return (
                <div key={node.id} className="inline-flex items-center min-w-[30px] flex-1 max-w-full">
                  {isSingleLine ? (
                    <input
                      type="text"
                      value={node.text}
                      onChange={(e) => handleTextChange(node.id, e.target.value)}
                      placeholder={nodes.length === 1 ? placeholder : '...'}
                      className="w-full bg-transparent text-xs text-slate-800 focus:outline-none placeholder:text-slate-400 font-sans"
                    />
                  ) : (
                    <textarea
                      rows={1}
                      value={node.text}
                      onChange={(e) => {
                        handleTextChange(node.id, e.target.value);
                        // Auto-adjust height
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      placeholder={nodes.length === 1 ? placeholder : '...'}
                      className="w-full bg-transparent text-xs text-slate-800 focus:outline-none resize-none placeholder:text-slate-400 font-sans leading-relaxed overflow-hidden"
                      style={{ height: 'auto' }}
                    />
                  )}
                </div>
              );
            }

            // RENDER INLINE MATH NODE
            if (node.type === 'inlineMath') {
              const isSelected = selectedNodeId === node.id;
              return (
                <span
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  onDoubleClick={() => handleEditMathNode(node)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl cursor-pointer select-none transition-all group relative ${
                    isSelected
                      ? 'bg-teal-50 border-2 border-teal-500 ring-2 ring-teal-400/30 text-teal-950 shadow-xs'
                      : 'bg-slate-50 hover:bg-teal-50/70 border border-teal-200/80 text-slate-900 hover:border-teal-400 shadow-2xs'
                  }`}
                  title="Bấm đúp để chỉnh sửa công thức trực quan"
                >
                  {/* Visual Render of Formula */}
                  <span className="font-medium text-xs">
                    <MathText inline>{`$${node.latex}$`}</MathText>
                  </span>

                  {/* Inline Action Pills on Hover/Selection */}
                  <span className="inline-flex items-center space-x-1 pl-1 border-l border-teal-200/60 opacity-70 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditMathNode(node);
                      }}
                      className="p-0.5 hover:text-teal-700 hover:bg-teal-100 rounded text-slate-500"
                      title="Chỉnh sửa công thức (MathLive)"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMathMode(node.id);
                      }}
                      className="p-0.5 hover:text-blue-700 hover:bg-blue-100 rounded text-slate-400 text-[9px] font-mono font-bold"
                      title="Chuyển sang công thức khối riêng dòng ($$)"
                    >
                      $$
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNode(node.id);
                      }}
                      className="p-0.5 hover:text-rose-600 hover:bg-rose-100 rounded text-slate-400"
                      title="Xóa công thức này"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                </span>
              );
            }

            // RENDER BLOCK MATH NODE (Display math / Array table)
            if (node.type === 'blockMath') {
              const isSelected = selectedNodeId === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  onDoubleClick={() => handleEditMathNode(node)}
                  className={`w-full my-2.5 p-3 rounded-2xl cursor-pointer select-none transition-all group relative border ${
                    isSelected
                      ? 'bg-teal-50/60 border-2 border-teal-500 ring-2 ring-teal-400/30 shadow-xs'
                      : 'bg-slate-50/80 hover:bg-teal-50/40 border-teal-200 hover:border-teal-400 shadow-2xs'
                  }`}
                  title="Bấm đúp để chỉnh sửa công thức / bảng xét dấu"
                >
                  {/* Top Bar for Block Math */}
                  <div className="flex items-center justify-between text-[10px] text-teal-800 font-bold uppercase tracking-wider mb-1">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-teal-600" />
                      <span>Khối công thức riêng dòng (Display Math):</span>
                    </span>
                    <div className="flex items-center space-x-1.5 opacity-80 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditMathNode(node);
                        }}
                        className="px-2 py-0.5 bg-white hover:bg-teal-100 border border-teal-200 rounded text-teal-900 flex items-center gap-1 font-bold"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Sửa</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleMathMode(node.id);
                        }}
                        className="px-2 py-0.5 bg-white hover:bg-blue-100 border border-blue-200 rounded text-blue-900 font-bold"
                        title="Chuyển thành công thức trong dòng ($)"
                      >
                        Thu gọn ($)
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNode(node.id);
                        }}
                        className="px-2 py-0.5 bg-white hover:bg-rose-100 border border-rose-200 rounded text-rose-700 font-bold"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Rendered Block Formula / Sign Table */}
                  <div className="py-2 text-center overflow-x-auto">
                    <MathText>{`$$\n${node.latex}\n$$`}</MathText>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>

      {/* Visual Math Editor Modal */}
      <VisualMathEditorModal
        isOpen={isFormulaModalOpen}
        initialLatex={activeEditingMathNode?.latex || ''}
        initialDisplayMode={activeEditingMathNode?.type === 'blockMath' ? 'block' : 'inline'}
        onClose={() => {
          setIsFormulaModalOpen(false);
          setActiveEditingMathNode(null);
        }}
        onInsert={(latex, displayMode) => handleFormulaModalSave(latex, displayMode)}
      />
    </div>
  );
};
