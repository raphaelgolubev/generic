export type Tool = 'select' | 'shape' | 'eraser' | 'hand'

export type ShapeType = 'sticky' | 'rect' | 'circle'

export interface SceneObject {
  id: string
  type: ShapeType
  x: number
  y: number
  width: number
  height: number
  color: string
  text?: string
  isSelected: boolean
}
