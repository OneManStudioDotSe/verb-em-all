import { useState, useEffect, useCallback } from 'react'
import type { CaughtRecord } from '../../../shared/types'

type CaughtMap = Record<string, CaughtRecord>

interface UseStorageReturn {
  caughtMap: CaughtMap
  catchWord: (wordId: string, note: string) => Promise<void>
  uncatchWord: (wordId: string) => Promise<void>
  isLoading: boolean
}

export function useStorage(): UseStorageReturn {
  const [caughtMap, setCaughtMap] = useState<CaughtMap>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    window.electronAPI.getAllCaught().then((data) => {
      setCaughtMap(data)
      setIsLoading(false)
    })
  }, [])

  // Listen for catches initiated from the macOS tray menu
  useEffect(() => {
    window.electronAPI.onCaughtFromTray((wordId, record) => {
      setCaughtMap((prev) => ({ ...prev, [wordId]: record }))
    })
    return () => window.electronAPI.removeAllListeners('verb:caught-from-tray')
  }, [])

  const catchWord = useCallback(async (wordId: string, note: string) => {
    const updated = await window.electronAPI.catchWord(wordId, note)
    setCaughtMap((prev) => ({ ...prev, [wordId]: updated }))
  }, [])

  const uncatchWord = useCallback(async (wordId: string) => {
    await window.electronAPI.uncatchWord(wordId)
    setCaughtMap((prev) => {
      const next = { ...prev }
      delete next[wordId]
      return next
    })
  }, [])

  return { caughtMap, catchWord, uncatchWord, isLoading }
}
