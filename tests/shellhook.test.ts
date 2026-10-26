import { describe, it, expect } from 'vitest'
import { SHELL_HOOK, hasShellHook, addShellHook, removeShellHook } from '../src/shared/shellhook'

const profile = 'export PATH="$HOME/bin:$PATH"\nalias ll="ls -l"\n'

describe('shell hook', () => {
  it('appends the block after a blank line', () => {
    expect(addShellHook(profile)).toBe(profile + '\n' + SHELL_HOOK + '\n')
    expect(hasShellHook(addShellHook(profile))).toBe(true)
  })

  it('removing restores the original profile', () => {
    expect(removeShellHook(addShellHook(profile))).toBe(profile)
    expect(removeShellHook(addShellHook(''))).toBe('')
  })

  it('never adds a second copy', () => {
    const twice = addShellHook(addShellHook(profile))
    expect(twice.split('# >>> verb-em-all >>>')).toHaveLength(2)
    expect(twice).toBe(addShellHook(profile))
  })

  it('keeps lines the user wrote after the block', () => {
    const edited = addShellHook(profile) + 'export EDITOR=vim\n'
    expect(removeShellHook(edited)).toBe(profile + 'export EDITOR=vim\n')
  })

  it('leaves a profile without the block untouched', () => {
    expect(hasShellHook(profile)).toBe(false)
    expect(removeShellHook(profile)).toBe(profile)
  })
})
