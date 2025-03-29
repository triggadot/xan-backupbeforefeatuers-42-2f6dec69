export interface AutoTableStyles {
  fontSize?: number
  cellPadding?: number | { top?: number; right?: number; bottom?: number; left?: number }
  textColor?: number[]
  lineColor?: number[]
  lineWidth?: number
  fontStyle?: string
  halign?: string
  valign?: string
  fillColor?: number[]
  minCellHeight?: number
  font?: string
  cellWidth?: number | 'auto'
}

export interface AutoTableCell {
  text?: string
  content?: string
  colSpan?: number
  rowSpan?: number
  styles?: AutoTableStyles
}

export interface CellHookData {
  cell: {
    text: string
    styles: AutoTableStyles & {
      [key: string]: unknown
    }
  }
  row: {
    raw: unknown[]
    index: number
    section: 'head' | 'body' | 'foot'
  }
  column: {
    dataKey: number | string
    index: number
  }
  section: 'head' | 'body' | 'foot'
  pageNumber: number
  pageCount: number
  settings: unknown
  doc: unknown
  cursor: {
    x: number
    y: number
  }
}

export interface AutoTableOptions {
  startY?: number
  head?: (string | AutoTableCell)[][]
  body?: (string | AutoTableCell)[][]
  foot?: (string | AutoTableCell)[][]
  margin?: { 
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
  styles?: AutoTableStyles
  headStyles?: AutoTableStyles
  bodyStyles?: AutoTableStyles
  footStyles?: AutoTableStyles
  alternateRowStyles?: AutoTableStyles
  columnStyles?: {
    [key: number]: AutoTableStyles
  }
  theme?: string
  didParseCell?: (data: CellHookData) => void
}
