export type Tool = 'select' | 'shape' | 'eraser' | 'hand'

export type ShapeType = 'sticky' | 'rect' | 'circle'

export interface SceneObject {
  id: string
  type: ShapeType
  x: number
  y: number
  preciseX: number
  preciseY: number
  width: number
  height: number
  preciseWidth: number
  preciseHeight: number
  color: string
  text?: string
  isSelected: boolean
}
