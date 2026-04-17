import React, { useCallback } from 'react'
import { ReactFlow, MiniMap, Controls, Background, Node, Edge, useNodesState, useEdgesState, BackgroundVariant } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useOrgTree } from '@/hooks/useEmployees'
import { PageHeader } from '@/shared/components/PageHeader'
import { Avatar } from '@/shared/components/Avatar'
import { Badge } from '@/shared/components/Badge'
import { EmptyState } from '@/shared/components/EmptyState'
import { Skeleton } from '@/shared/components/Skeleton'
import { Network } from 'lucide-react'

function OrgNode({ data }: { data: any }) {
  return (
    <div style={{ width: 200, padding: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-center gap-2">
        <Avatar name={data.name} src={data.avatarUrl} size="sm" />
        <div className="overflow-hidden">
          <div className="text-sm font-medium text-text-base truncate">{data.name}</div>
          <div className="text-xs text-text-muted truncate">{data.jobTitle}</div>
        </div>
      </div>
      {data.department && (
        <div className="mt-2">
          <Badge variant="neutral">{data.department}</Badge>
        </div>
      )}
    </div>
  )
}

const nodeTypes = { orgNode: OrgNode }

function buildLayout(flat: any[]) {
  const LEVEL_H = 140
  const NODE_W = 220
  const nodes: Node[] = []
  const edges: Edge[] = []

  const childrenMap: Record<string, any[]> = {}
  const roots: any[] = []

  flat.forEach(n => {
    if (!n.managerId) roots.push(n)
    else {
      if (!childrenMap[n.managerId]) childrenMap[n.managerId] = []
      childrenMap[n.managerId].push(n)
    }
  })

  let xOffset = 0

  function placeNode(node: any, level: number, x: number): number {
    const children = childrenMap[node.id] ?? []
    let width = children.length === 0 ? NODE_W : 0

    const childXs: number[] = []
    children.forEach(child => {
      const w = placeNode(child, level + 1, xOffset)
      childXs.push(xOffset - w / 2)
      if (children.length > 0) width += w
      xOffset += w
    })

    const myX = childXs.length === 0 ? xOffset++ * NODE_W : (childXs[0] + childXs[childXs.length - 1]) / 2

    nodes.push({
      id: node.id,
      type: 'orgNode',
      position: { x: myX, y: level * LEVEL_H },
      data: { name: node.name, jobTitle: node.jobTitle, department: node.department, avatarUrl: node.avatarUrl },
    })

    if (node.managerId) {
      edges.push({ id: `${node.managerId}-${node.id}`, source: node.managerId, target: node.id, style: { stroke: 'var(--color-border)' } })
    }

    return Math.max(NODE_W, width)
  }

  roots.forEach(r => placeNode(r, 0, xOffset))
  return { nodes, edges }
}

export default function OrgChartPage() {
  const { data, isLoading } = useOrgTree()
  const flat = data?.data ?? []

  const { nodes: initNodes, edges: initEdges } = buildLayout(flat)
  const [nodes, , onNodesChange] = useNodesState(initNodes)
  const [edges, , onEdgesChange] = useEdgesState(initEdges)

  if (isLoading) return <Skeleton variant="rect" height="600px" />

  return (
    <div>
      <PageHeader title="Org Chart" subtitle="Company organisational structure" />
      {flat.length === 0 ? (
        <EmptyState icon={Network} title="No employees yet" description="Add employees to see the org chart." />
      ) : (
        <div className="card" style={{ height: 600, padding: 0, overflow: 'hidden' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
          >
            <MiniMap style={{ background: 'var(--color-surface-offset)' }} />
            <Controls style={{ background: 'var(--color-surface)' }} />
            <Background variant={BackgroundVariant.Dots} color="var(--color-border)" />
          </ReactFlow>
        </div>
      )}
    </div>
  )
}
