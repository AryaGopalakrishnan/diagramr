import { createContext, useContext } from 'react'

export const DiagramStyleContext = createContext('sketch')
export const useDiagramStyle = () => useContext(DiagramStyleContext)
