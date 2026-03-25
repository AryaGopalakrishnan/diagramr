import { useState, useCallback } from 'react'

export function useHistory(initialState) {
  const [history, setHistory] = useState([initialState])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDirty, setIsDirty] = useState(false)

  const state = history[currentIndex]

  const setState = useCallback((newState) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, currentIndex + 1)
      newHistory.push(newState)
      return newHistory
    })
    setCurrentIndex((prev) => prev + 1)
    setIsDirty(true)
  }, [currentIndex])

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }, [currentIndex])

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }, [currentIndex, history.length])

  const canUndo = currentIndex > 0
  const canRedo = currentIndex < history.length - 1

  const clearHistory = useCallback(() => {
    setHistory([state])
    setCurrentIndex(0)
    setIsDirty(false)
  }, [state])

  return { state, setState, undo, redo, canUndo, canRedo, isDirty, setIsDirty, clearHistory }
}
