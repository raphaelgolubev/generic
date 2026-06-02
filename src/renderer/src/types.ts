export type Tool = 'select' | 'shape' | 'arrow' | 'hand' | 'text'

export type ShapeType = 'rect' | 'roundRect' | 'circle'

export type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br' | 'edge' | null

interface BaseObject {
  id: string
  color: string
  isSelected?: boolean
}

interface BaseRectangleObject extends BaseObject {
  x: number
  y: number
  width: number
  height: number
}

export interface TextObject extends BaseRectangleObject {
  type: 'text'
  text: string
}

export interface SceneObject extends BaseRectangleObject {
  type: ShapeType
  preciseX?: number
  preciseY?: number
  preciseWidth?: number
  preciseHeight?: number
  text?: string
  strokeColor?: string
  strokeWidth?: number
}

export type ArrowHead = 'none' | 'arrow' | 'triangle' | 'dot'
export type ArrowMode = 'straight' | 'orthogonal' | 'bezier'

export interface ArrowObject extends BaseObject {
  type: 'arrow'
  mode: ArrowMode
  waypoints?: { x: number; y: number }
  start: { x: number; y: number }
  end: { x: number; y: number }
  startHead: 'none' | 'arrow' | 'triangle'
  endHead: 'none' | 'arrow' | 'triangle'
  startId?: string
  endId?: string
  orthogonalOffset?: number // смещение центральной линии от середины
}

export type CanvasObject = SceneObject | ArrowObject | TextObject
