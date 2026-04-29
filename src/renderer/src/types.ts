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

// export interface SceneObject {
//   id: string
//   type: ShapeType
//   x: number
//   y: number
//   preciseX: number
//   preciseY: number
//   width: number
//   height: number
//   preciseWidth: number
//   preciseHeight: number
//   color: string
//   text?: string
//   isSelected: boolean
// }

export type ArrowHead = 'none' | 'arrow' | 'triangle' | 'dot'

export interface ArrowObject extends BaseObject {
  type: 'arrow'
  start: { x: number; y: number }
  end: { x: number; y: number }
  startHead: 'none' | 'arrow' | 'triangle'
  endHead: 'none' | 'arrow' | 'triangle'
}

export type CanvasObject = SceneObject | ArrowObject

// export interface ArrowObject {
//   id: string
//   type: 'arrow'
//   start: { x: number; y: number }
//   end: { x: number; y: number }
//   startHead: ArrowHead
//   endHead: ArrowHead
//   color: string
//   // Опционально: id объектов, которые соединяет стрелка
//   startAttachedId?: string
//   endAttachedId?: string
// }
