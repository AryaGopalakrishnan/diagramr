import { useState, useCallback } from 'react'

const STORAGE_KEY = 'diagramr_diagrams'
const CURRENT_KEY = 'diagramr_current'

export function useDiagramStorage() {
  const [currentDiagramId, setCurrentDiagramId] = useState(() => {
    return localStorage.getItem(CURRENT_KEY) || null
  })

  const saveDiagram = useCallback((id, name, nodes, edges, diagramType) => {
    const diagrams = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    diagrams[id] = {
      id,
      name,
      nodes,
      edges,
      diagramType,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(diagrams))
    localStorage.setItem(CURRENT_KEY, id)
    setCurrentDiagramId(id)
    return id
  }, [])

  const loadDiagram = useCallback((id) => {
    const diagrams = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    if (diagrams[id]) {
      localStorage.setItem(CURRENT_KEY, id)
      setCurrentDiagramId(id)
      return diagrams[id]
    }
    return null
  }, [])

  const getDiagrams = useCallback(() => {
    const diagrams = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return Object.values(diagrams).sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
  }, [])

  const deleteDiagram = useCallback((id) => {
    const diagrams = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    delete diagrams[id]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(diagrams))
    if (currentDiagramId === id) {
      setCurrentDiagramId(null)
      localStorage.removeItem(CURRENT_KEY)
    }
  }, [currentDiagramId])

  const createNewDiagram = useCallback(() => {
    const id = `diagram-${Date.now()}`
    return id
  }, [])

  return {
    saveDiagram,
    loadDiagram,
    getDiagrams,
    deleteDiagram,
    createNewDiagram,
    currentDiagramId,
  }
}
