import React, { useMemo } from "react";
import * as d3 from "d3";
import { Link2, Trash2, HelpCircle } from "lucide-react";

interface KeywordGroup {
  original: string;
  zhSynonyms: string[];
  enSynonyms: string[];
}

interface VisualQueryTreeProps {
  keywords: KeywordGroup[];
  isModelB: boolean;
  activeIndex: number;
  selectedWords: Record<string, boolean>;
  onToggleWord: (isModelB: boolean, groupIdx: number, word: string) => void;
  operatorStyle: "OR" | "Space";
  uiLang: "zh" | "mix";
}

export default function VisualQueryTree({
  keywords,
  isModelB,
  activeIndex,
  selectedWords,
  onToggleWord,
  operatorStyle,
  uiLang
}: VisualQueryTreeProps) {
  // 1. Build the logical hierarchy tree data
  const { treeData, totalLeaves } = useMemo(() => {
    if (!keywords || keywords.length === 0) {
      return { treeData: null, totalLeaves: 0 };
    }

    let leafCount = 0;

    const children = keywords.map((group, groupIdx) => {
      const allTerms = Array.from(
        new Set([
          group.original,
          ...(Array.isArray(group.zhSynonyms) ? group.zhSynonyms : []),
          ...(Array.isArray(group.enSynonyms) ? group.enSynonyms : [])
        ])
      ).filter(Boolean) as string[];

      const activeTerms = allTerms.map(term => {
        const key = `${activeIndex}:${isModelB ? "B" : "A"}:${groupIdx}:${term}`;
        const isSelected = selectedWords[key] !== false;
        if (isSelected) {
          leafCount++;
        }
        return {
          term,
          isSelected,
          isOriginal: term === group.original
        };
      });

      return {
        id: `or-group-${groupIdx}`,
        name: group.original || `概念 ${groupIdx + 1}`,
        groupIdx,
        terms: activeTerms
      };
    });

    return {
      treeData: {
        id: "and-root",
        name: operatorStyle === "Space" ? "AND (Space)" : "AND (逻辑与)",
        children
      },
      totalLeaves: leafCount
    };
  }, [keywords, isModelB, activeIndex, selectedWords, operatorStyle]);

  // Dimensions of the visualization (with reactive viewBox scaling)
  const width = 680;
  const height = Math.max(180, totalLeaves * 28 + 60);

  // 2. Compute Layout using D3 Hierarchy
  const d3Tree = useMemo(() => {
    if (!treeData) return null;

    // We represent tree where:
    // Level 0: Root (AND)
    // Level 1: Concept OR Groups
    // Level 2: Individual Synonym terms (leaves)
    interface D3Node {
      id: string;
      name: string;
      groupIdx?: number;
      term?: string;
      isSelected?: boolean;
      isOriginal?: boolean;
      terms?: { term: string; isSelected: boolean; isOriginal: boolean; }[];
      children?: D3Node[];
    }

    // Flatten to a standard hierarchy structure
    const hierarchicalData: D3Node = {
      id: "root-node",
      name: operatorStyle === "Space" ? "AND" : "AND",
      children: treeData.children.map(g => ({
        id: g.id,
        name: g.name,
        groupIdx: g.groupIdx,
        // The children are only the active terms
        children: g.terms
          .filter(t => t.isSelected)
          .map(t => ({
            id: `leaf-${g.groupIdx}-${t.term}`,
            name: t.term,
            groupIdx: g.groupIdx,
            isSelected: t.isSelected,
            isOriginal: t.isOriginal
          }))
      }))
    };

    const root = d3.hierarchy<D3Node>(hierarchicalData);
    
    // Left-to-right layout: We set size where:
    // x dimensions corresponds to vertical layout (height)
    // y dimensions corresponds to horizontal layout (width)
    const treeLayout = d3.tree<D3Node>().size([height - 50, width - 240]);
    treeLayout(root);

    return root;
  }, [treeData, height, width, operatorStyle]);

  if (!keywords || keywords.length === 0) {
    return null;
  }

  // Draw links as graceful cubic bezier curves
  const links = d3Tree ? d3Tree.links() : [];
  const nodes = d3Tree ? d3Tree.descendants() : [];

  return (
    <div className="w-full bg-slate-950/45 border border-cyan-500/10 rounded-xl p-4 mt-4 animate-fade-in text-left">
      {/* Visual Header */}
      <div className="flex justify-between items-center mb-3 border-b border-white/5 pb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></div>
          <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest font-mono">
            {uiLang === "zh" || uiLang === "mix" ? "布尔逻辑树状图" : "BULLET LOGIC VISUAL TREE"}
          </span>
        </div>
        <div className="text-[9px] text-slate-500 flex items-center gap-1 font-mono">
          <span>{uiLang === "zh" || uiLang === "mix" ? "💡 点击叶子节点可直接剔除对应同义词" : "💡 Click leaf synonym to exclude it"}</span>
        </div>
      </div>

      {/* SVG Canvas with aspect ratio container */}
      <div className="w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[600px] flex justify-center">
          <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="overflow-visible"
          >
            {/* Background glowing gradients */}
            <defs>
              <linearGradient id="cyan-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="purple-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#d946ef" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Bezier Connective lines */}
            <g>
              {links.map((link, i) => {
                // Offset horizontal position to add padding spacing
                const x0 = link.source.y + 40;
                const y0 = link.source.x + 25;
                const x1 = link.target.y + 40;
                const y1 = link.target.x + 25;

                // Simple left-to-right cubic curve
                const d = `M ${x0} ${y0} C ${(x0 + x1) / 2} ${y0}, ${(x0 + x1) / 2} ${y1}, ${x1} ${y1}`;
                
                // Color differs based on target depth
                const isGroupLevel = link.source.depth === 0;

                return (
                  <path
                    key={`link-${i}`}
                    d={d}
                    fill="none"
                    stroke={isGroupLevel ? "#06b6d4" : "#a855f7"}
                    strokeOpacity={isGroupLevel ? 0.35 : 0.25}
                    strokeWidth={isGroupLevel ? 1.8 : 1.2}
                    className="transition-all duration-300"
                  />
                );
              })}
            </g>

            {/* Structured Nodes rendering */}
            <g>
              {nodes.map((node, i) => {
                const cx = node.y + 40;
                const cy = node.x + 25;
                const depth = node.depth;

                // Root Node: AND Operator
                if (depth === 0) {
                  return (
                    <g key={`node-${node.data.id || i}`} transform={`translate(${cx}, ${cy})`}>
                      <rect
                        x="-30"
                        y="-14"
                        width="60"
                        height="28"
                        rx="8"
                        fill="#083344"
                        stroke="#06b6d4"
                        strokeWidth="1.5"
                        className="shadow-lg filter drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                      />
                      <text
                        textAnchor="middle"
                        dy="4"
                        fill="#22d3ee"
                        className="text-[11px] font-black font-mono tracking-widest"
                      >
                        {operatorStyle === "Space" ? "AND" : "AND"}
                      </text>
                    </g>
                  );
                }

                // Intermediate Level Nodes: OR Operator groups
                if (depth === 1) {
                  const groupIdx = node.data.groupIdx ?? 0;
                  const label = node.data.name;
                  const termsLength = node.data.children?.length ?? 0;

                  return (
                    <g key={`node-${node.data.id || i}`} transform={`translate(${cx}, ${cy})`}>
                      <rect
                        x="-70"
                        y="-15"
                        width="140"
                        height="30"
                        rx="6"
                        fill="#1e1b4b"
                        stroke="#6366f1"
                        strokeWidth="1"
                        strokeDasharray={termsLength === 0 ? "3 3" : undefined}
                      />
                      <text
                        textAnchor="middle"
                        dy="-2"
                        className="text-[9px] font-bold fill-indigo-200 truncate max-w-[120px]"
                      >
                        {label.length > 15 ? label.slice(0, 14) + "..." : label}
                      </text>
                      <text
                        textAnchor="middle"
                        dy="9"
                        className="text-[8px] font-mono fill-indigo-400 font-extrabold uppercase tracking-wider"
                      >
                        {operatorStyle === "Space" ? `复合组 [OR]` : `OR 逻辑组 (${termsLength}词)`}
                      </text>
                    </g>
                  );
                }

                // Leaf nodes: Synonym terms
                if (depth === 2) {
                  const label = node.data.name;
                  const groupIdx = node.data.groupIdx ?? 0;
                  const isOriginal = node.data.isOriginal ?? false;

                  return (
                    <g 
                      key={`node-${node.data.id || i}`} 
                      transform={`translate(${cx}, ${cy})`}
                      onClick={() => onToggleWord(isModelB, groupIdx, label)}
                      className="cursor-pointer group select-none"
                    >
                      {/* Leaf Hover indicator background */}
                      <rect
                        x="-10"
                        y="-12"
                        width="110"
                        height="24"
                        rx="4"
                        fill="#020617"
                        stroke={isOriginal ? "#22d3ee" : "#a855f7"}
                        strokeWidth="1"
                        className="group-hover:fill-red-950/20 group-hover:stroke-red-500/50 transition-all"
                      />
                      {/* Original keyword pill indicator */}
                      {isOriginal && (
                        <circle
                          cx="-3"
                          cy="0"
                          r="3"
                          fill="#22d3ee"
                          className="animate-pulse"
                        />
                      )}
                      
                      <text
                        x={isOriginal ? "6" : "2"}
                        y="4"
                        className={`text-[9px] font-mono font-medium group-hover:fill-red-300 transition-all ${
                          isOriginal ? "fill-cyan-300 font-bold" : "fill-slate-300"
                        }`}
                      >
                        {label.length > 14 ? label.slice(0, 12) + "..." : label}
                      </text>

                      {/* Exclude / Delete micro icon on Hover */}
                      <g className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <rect
                          x="82"
                          y="-8"
                          width="14"
                          height="16"
                          rx="3"
                          fill="#ef4444"
                        />
                        <text
                          x="89"
                          y="4"
                          textAnchor="middle"
                          fill="#ffffff"
                          className="text-[8px] font-black"
                        >
                          ×
                        </text>
                      </g>
                    </g>
                  );
                }

                return null;
              })}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
