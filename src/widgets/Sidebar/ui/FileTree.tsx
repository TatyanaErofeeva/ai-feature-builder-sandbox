'use client';

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import { useUnit } from 'effector-react';
import { $streamingFilePath } from '@/entities/AiSession';
import {
  $activeFilePath,
  $expandedPaths,
  $fileSystem,
  folderToggled,
  rootIds,
  type FileSystemState,
} from '@/entities/FileSystem';
import { fileOpenRequested } from '@/features/EditCodeInline';

export function FileTree() {
  const tree = useUnit($fileSystem);
  const expanded = useUnit($expandedPaths);
  const activePath = useUnit($activeFilePath);
  const streamingPath = useUnit($streamingFilePath);
  const toggleFolder = useUnit(folderToggled);
  const openFile = useUnit(fileOpenRequested);

  return (
    <div className="min-h-0 flex-1 overflow-auto py-2" role="tree" aria-label="File tree">
      <TreeLevel
        ids={rootIds(tree)}
        nodes={tree}
        depth={0}
        expanded={expanded}
        activePath={activePath}
        streamingPath={streamingPath}
        onToggle={toggleFolder}
        onOpen={openFile}
      />
    </div>
  );
}

interface TreeLevelProps {
  ids: string[];
  nodes: FileSystemState;
  depth: number;
  expanded: string[];
  activePath: string | null;
  streamingPath: string | null;
  onToggle: (path: string) => void;
  onOpen: (path: string) => void;
}

function TreeLevel({
  ids,
  nodes,
  depth,
  expanded,
  activePath,
  streamingPath,
  onToggle,
  onOpen,
}: TreeLevelProps) {
  return (
    <>
      {ids.map((id) => {
        const node = nodes[id];
        if (!node) {
          return null;
        }

        const open = node.type === 'folder' && expanded.includes(node.id);
        const selected = node.id === activePath;
        const streaming = node.id === streamingPath;

        return (
          <div
            key={node.id}
            role="treeitem"
            aria-selected={selected}
            aria-expanded={node.type === 'folder' ? open : undefined}
          >
            <button
              type="button"
              title={node.id}
              onClick={() => (node.type === 'folder' ? onToggle(node.id) : onOpen(node.id))}
              className={`flex h-8 w-full items-center gap-1.5 pr-3 text-left text-[13px] ${
                selected ? 'bg-[rgba(62,224,176,0.12)] text-[#3ee0b0]' : 'text-[#d5dee8] hover:bg-white/5'
              }`}
              style={{ paddingLeft: 8 + depth * 14 }}
            >
              {node.type === 'folder' ? (
                <ChevronRightIcon
                  fontSize="small"
                  className={`shrink-0 text-[#8b9aab] transition-transform ${open ? 'rotate-90' : ''}`}
                />
              ) : (
                <span className="w-[18px] shrink-0" />
              )}
              {node.type === 'folder' ? (
                open ? (
                  <FolderOpenOutlinedIcon fontSize="small" className="shrink-0 text-[#e6b35a]" />
                ) : (
                  <FolderOutlinedIcon fontSize="small" className="shrink-0 text-[#e6b35a]" />
                )
              ) : (
                <DescriptionOutlinedIcon fontSize="small" className="shrink-0 text-[#8eb6ff]" />
              )}
              <span className="truncate">{node.name}</span>
              {streaming ? <span className="ml-auto h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[#3ee0b0]" /> : null}
            </button>
            {node.type === 'folder' && open ? (
              <TreeLevel
                ids={node.childrenIds}
                nodes={nodes}
                depth={depth + 1}
                expanded={expanded}
                activePath={activePath}
                streamingPath={streamingPath}
                onToggle={onToggle}
                onOpen={onOpen}
              />
            ) : null}
          </div>
        );
      })}
    </>
  );
}
