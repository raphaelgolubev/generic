export type Tool = 'select' | 'shape' | 'arrow' | 'eraser' | 'hand'

export type ShapeType = 'sticky' | 'rect' | 'circle'

export type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br' | null

interface BaseObject {
  id: string
  color: string
  isSelected?: boolean
}

export interface SceneObject extends BaseObject {
  type: ShapeType
  x: number
  y: number
  width: number
  height: number
  preciseX?: number
  preciseY?: number
  preciseWidth?: number
  preciseHeight?: number
  text?: string
}

export type ArrowHead = 'none' | 'arrow' | 'triangle' | 'dot'
export type ArrowMode = 'straight' | 'orthogonal' | 'bezier'

export interface ArrowObject extends BaseObject {
  type: 'arrow'
  mode: ArrowMode
  midFactor?: number // коэффициент изгиба (от 0 до 1)
  start: { x: number; y: number }
  end: { x: number; y: number }
  startHead: 'none' | 'arrow' | 'triangle'
  endHead: 'none' | 'arrow' | 'triangle'
}

export type CanvasObject = SceneObject | ArrowObject
