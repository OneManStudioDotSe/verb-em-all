import React, { useState, useEffect, useMemo, useCallback } from 'react'
import type { WordViewModel, ClaudeStatus } from '../../shared/types'
import { WORDS } from './data/words'
import { findAccentEntry } from './data/palette'
import { useStorage } from './hooks/useStorage'
import { useSoundEngine } from './hooks/useSoundEngine'
import { useSearch } from './hooks/useSearch'
import { SearchBox } from './components/SearchBox'
import { TabBar, type TabId } from './components/TabBar'
import { WordList } from './components/WordList'
import { CatchModal } from './components/CatchModal'
import { CelebrationOverlay } from './components/CelebrationOverlay'
import { SortBar, type SortConfig } from './components/SortBar'
import { AppMenuButton } from './components/AppMenuButton'
import { DetectionPanel } from './components/DetectionPanel'
import { Verbagotchi } from './components/Verbagotchi'
import { TimelineView } from './components/TimelineView'
import { ConstellationView } from './components/ConstellationView'
import { HowToUseModal } from './components/modals/HowToUseModal'
import { AboutModal } from './components/modals/AboutModal'
import { StatsModal } from './components/modals/StatsModal'
import { ShareCardModal } from './components/modals/ShareCardModal'
import { ColorPickerModal } from './components/modals/ColorPickerModal'
import { ClaudeHelpModal } from './components/modals/ClaudeHelpModal'

const CLAUDE_STATUS_INTERVAL_MS = 30_000

function sortWords(words: WordViewModel[], config: SortConfig): WordViewModel[] {
  return [...words].sort((a, b) => {
    let cmp = 0
    if (config.field === 'title') {
      cmp = a.word.localeCompare(b.word)
    } else if (config.field === 'category') {
      cmp = a.category.localeCompare(b.category) || a.word.localeCompare(b.word)
    } else if (config.field === 'catches') {
      cmp = b.catchCount - a.catchCount || a.word.localeCompare(b.word)
    }
    return config.dir === 'asc' ? cmp : -cmp
  })
}

function applyAccentColor(color: string): void {
  const entry = findAccentEntry(color)
  document.documentElement.style.setProperty('--accent-y', entry.color)
  document.documentElement.style.setProperty('--shadow-y', entry.shadow)
}

export default function App(): React.JSX.Element {
  const { caughtMap, catchWord, uncatchWord, isLoading } = useStorage()
  const soundEngine = useSoundEngine()
  const [activeTab, setActiveTab] = useState<TabId>('notCaught')
  const [searchQuery, setSearchQuery] = useState('')
  const [catchingWord, setCatchingWord] = useState<WordViewModel | null>(null)
  const [celebratingWord, setCelebratingWord] = useState<WordViewModel | null>(null)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'title', dir: 'asc' })
  const [showHowToUse, setShowHowToUse] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showShareCard, setShowShareCard] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [accentColor, setAccentColor] = useState('#f5e642')
  const [theme, setTheme] = useState('dark')
  const [hideDock, setHideDock] = useState(false)
  const [claudeStatus, setClaudeStatus] = useState<ClaudeStatus | null>(null)
  const [showClaudeHelp, setShowClaudeHelp] = useState(false)
  const isMac = window.electronAPI.platform === 'darwin'

  // Monitoring
  const [monitoringEnabled, setMonitoringEnabled] = useState(false)
  const [detectedIds, setDetectedIds] = useState<string[]>([])

  // Set data-platform on <html> for CSS targeting of macOS traffic lights
  useEffect(() => {
    document.documentElement.dataset.platform = window.electronAPI.platform
  }, [])

  // Load accent color and apply CSS variables
  useEffect(() => {
    window.electronAPI.getAccentColor().then((color) => {
      setAccentColor(color)
      applyAccentColor(color)
    })
  }, [])

  // Load theme and apply data-theme attribute
  useEffect(() => {
    window.electronAPI.getTheme().then((t) => {
      setTheme(t)
      document.documentElement.dataset.theme = t
    })
  }, [])

  // Load initial monitoring state
  useEffect(() => {
    window.electronAPI.isMonitoringEnabled().then(setMonitoringEnabled)
  }, [])

  // Dock visibility (macOS)
  useEffect(() => {
    window.electronAPI.getHideDock().then(setHideDock)
  }, [])

  // Can we see Claude Code transcripts? Re-check periodically.
  const refreshClaudeStatus = useCallback(() => {
    window.electronAPI.getClaudeStatus().then(setClaudeStatus)
  }, [])

  useEffect(() => {
    refreshClaudeStatus()
    const id = setInterval(refreshClaudeStatus, CLAUDE_STATUS_INTERVAL_MS)
    return () => clearInterval(id)
  }, [refreshClaudeStatus])

  // Listen for words detected by the session/clipboard watcher
  useEffect(() => {
    window.electronAPI.onWordsDetected((ids) => {
      setDetectedIds((prev) => {
        const incoming = ids.filter((id) => !prev.includes(id))
        return incoming.length > 0 ? [...prev, ...incoming] : prev
      })
    })
    return () => window.electronAPI.removeAllListeners('words:detected')
  }, [])

  // Register menu event listeners
  useEffect(() => {
    window.electronAPI.onShowHowToUse(() => setShowHowToUse(true))
    window.electronAPI.onShowAbout(() => setShowAbout(true))
    return () => {
      window.electronAPI.removeAllListeners('menu:showHowToUse')
      window.electronAPI.removeAllListeners('menu:showAbout')
    }
  }, [])

  async function toggleMonitoring(): Promise<void> {
    const next = await window.electronAPI.setMonitoringEnabled(!monitoringEnabled)
    setMonitoringEnabled(next)
    if (!next) setDetectedIds([]) // clear panel when disabling
  }

  async function handleHideDockToggle(): Promise<void> {
    const next = await window.electronAPI.setHideDock(!hideDock)
    setHideDock(next)
  }

  function handleThemeToggle(): void {
    const next = theme === 'dark' ? 'claude' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    window.electronAPI.setTheme(next)
  }

  function handleAccentColorSelect(color: string, shadow: string): void {
    document.documentElement.style.setProperty('--accent-y', color)
    document.documentElement.style.setProperty('--shadow-y', shadow)
    setAccentColor(color)
    window.electronAPI.setAccentColor(color)
  }

  function handleTabChange(tab: TabId): void {
    setActiveTab(tab)
    setSearchQuery('')
    if (tab === 'notCaught' && sortConfig.field === 'catches') {
      setSortConfig({ field: 'title', dir: 'asc' })
    }
  }

  // Derive view models
  const allViewModels: WordViewModel[] = useMemo(() => {
    return WORDS.map((word) => {
      const record = caughtMap[word.id]
      return {
        ...word,
        isCaught: !!record && record.catchCount > 0,
        catchCount: record?.catchCount ?? 0,
        latestCatchDate: record?.history.at(-1)?.caughtAt,
        history: record?.history ?? []
      }
    })
  }, [caughtMap])

  const viewModelMap = useMemo(() => {
    return Object.fromEntries(allViewModels.map((w) => [w.id, w]))
  }, [allViewModels])

  const caughtWords = useMemo(() => allViewModels.filter((w) => w.isCaught), [allViewModels])
  const notCaughtWords = useMemo(() => allViewModels.filter((w) => !w.isCaught), [allViewModels])

  // Total timeline events for tab badge
  const totalEvents = useMemo(
    () => Object.values(caughtMap).reduce((sum, r) => sum + r.history.length, 0),
    [caughtMap]
  )

  const activeWords = activeTab === 'caught' ? caughtWords : notCaughtWords
  const filteredWords = useSearch(activeWords, searchQuery)
  const sortedWords = useMemo(() => sortWords(filteredWords, sortConfig), [filteredWords, sortConfig])

  // Detected words resolved to full view models (filter to only those in the word list)
  const detectedViewModels = useMemo(
    () => detectedIds.map((id) => viewModelMap[id]).filter(Boolean) as WordViewModel[],
    [detectedIds, viewModelMap]
  )

  async function handleConfirmCatch(note: string): Promise<void> {
    if (!catchingWord) return
    const wasNew = !catchingWord.isCaught
    soundEngine.playCatch(catchingWord)
    await catchWord(catchingWord.id, note)
    const caught = catchingWord
    setCatchingWord(null)
    // Remove from detection panel on catch
    setDetectedIds((prev) => prev.filter((id) => id !== caught.id))
    setCelebratingWord(caught)
    if (wasNew && activeTab !== 'constellation') setActiveTab('caught')
  }

  async function handleCatchAll(words: WordViewModel[]): Promise<void> {
    const newWords = words.filter((w) => !w.isCaught)
    for (const word of newWords) {
      await catchWord(word.id, '')
    }
    setDetectedIds((prev) => prev.filter((id) => !newWords.some((w) => w.id === id)))
    if (newWords.length > 0) setActiveTab('caught')
  }

  if (isLoading) {
    return <div className="loading">Loading...</div>
  }

  const isTimeline = activeTab === 'timeline'
  const isConstellation = activeTab === 'constellation'

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          verb<span>'em all</span>
        </div>
        <div className="app-header-right">
          <span className="app-catch-progress">
            {caughtWords.length}/{WORDS.length} caught
          </span>
          <div className="monitor-group">
            <button
              className={`monitor-toggle${monitoringEnabled ? ' active' : ''}`}
              onClick={toggleMonitoring}
              title={monitoringEnabled ? 'Monitoring active — click to disable' : 'Enable Claude session monitoring'}
            >
              {monitoringEnabled ? '◉' : '○'}
            </button>
            <button
              className={`claude-indicator${claudeStatus?.found ? ' found' : ' missing'}`}
              onClick={() => setShowClaudeHelp(true)}
              title={
                claudeStatus === null
                  ? 'Checking for Claude Code…'
                  : claudeStatus.found
                    ? 'Claude Code transcripts found — sessions can be monitored'
                    : 'Claude Code not detected — click for help'
              }
            >
              <span className="claude-indicator-dot" />
              claude
            </button>
          </div>
          <button
            className={`sound-toggle${soundEngine.enabled ? ' active' : ''}`}
            onClick={soundEngine.toggle}
            title={soundEngine.enabled ? 'Sound on — click to mute' : 'Enable sound signatures'}
          >
            {soundEngine.enabled ? '♫' : '♪'}
          </button>
          <AppMenuButton
            onShowHowToUse={() => setShowHowToUse(true)}
            onShowAbout={() => setShowAbout(true)}
            onShowStats={() => setShowStats(true)}
            onShowShareCard={() => setShowShareCard(true)}
            onShowColorPicker={() => setShowColorPicker(true)}
            onToggleTheme={handleThemeToggle}
            currentTheme={theme}
            hideDock={hideDock}
            onToggleHideDock={isMac ? handleHideDockToggle : undefined}
          />
        </div>
      </header>

      <main className="app-body">
        <div className="app-content">
          <div className="app-top-row">
            <div className="app-top-left">
              <div className={`search-collapse${isConstellation ? ' search-collapse--hidden' : ''}`}>
                <div>
                  <SearchBox value={searchQuery} onChange={setSearchQuery} />
                </div>
              </div>
              <TabBar
                activeTab={activeTab}
                onTabChange={handleTabChange}
                caughtCount={caughtWords.length}
                notCaughtCount={notCaughtWords.length}
                totalEvents={totalEvents}
              />
            </div>
            <div className="app-right-col">
              <Verbagotchi caughtMap={caughtMap} onUncatch={uncatchWord} />
            </div>
          </div>

          <div className="app-word-section" key={activeTab}>
            {isTimeline ? (
              <TimelineView caughtMap={caughtMap} searchQuery={searchQuery} />
            ) : isConstellation ? (
              <ConstellationView
                words={allViewModels}
                onCatch={(word) => setCatchingWord(word)}
                onHover={soundEngine.playHover}
                setAmbientCategory={soundEngine.setAmbientCategory}
              />
            ) : (
              <>
                <SortBar config={sortConfig} activeTab={activeTab} onChange={setSortConfig} />

                {monitoringEnabled && (
                  <DetectionPanel
                    detectedWords={detectedViewModels}
                    onCatch={(word) => setCatchingWord(word)}
                    onCatchAll={handleCatchAll}
                    onDismiss={(id) => setDetectedIds((prev) => prev.filter((x) => x !== id))}
                    onDismissAll={() => setDetectedIds([])}
                  />
                )}

                <WordList
                  words={sortedWords}
                  onCatch={(word) => setCatchingWord(word)}
                  onUncatch={(word) => uncatchWord(word.id)}
                  onHover={soundEngine.playHover}
                  emptyMessage={
                    searchQuery
                      ? `No verbs match "${searchQuery}"`
                      : activeTab === 'caught'
                        ? 'Nothing caught yet — go hunt some verbs!'
                        : "All verbs have been caught. You're a legend."
                  }
                />
              </>
            )}
          </div>
        </div>
      </main>

      <CatchModal
        word={catchingWord}
        onConfirm={handleConfirmCatch}
        onClose={() => setCatchingWord(null)}
      />

      {celebratingWord && (
        <CelebrationOverlay
          word={celebratingWord}
          onDismiss={() => setCelebratingWord(null)}
        />
      )}

      {showHowToUse && <HowToUseModal onClose={() => setShowHowToUse(false)} />}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showStats && <StatsModal caughtMap={caughtMap} onClose={() => setShowStats(false)} />}
      {showShareCard && (
        <ShareCardModal
          caughtMap={caughtMap}
          accentColor={accentColor}
          onClose={() => setShowShareCard(false)}
        />
      )}
      {showColorPicker && (
        <ColorPickerModal
          currentColor={accentColor}
          onSelect={handleAccentColorSelect}
          onClose={() => setShowColorPicker(false)}
        />
      )}
      {showClaudeHelp && claudeStatus && (
        <ClaudeHelpModal
          status={claudeStatus}
          onRecheck={refreshClaudeStatus}
          onClose={() => setShowClaudeHelp(false)}
        />
      )}
    </div>
  )
}
