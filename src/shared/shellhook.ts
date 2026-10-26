// The block the app adds to the user's shell profile (with consent) to catch spinner verbs.
// It runs `claude` through the app's recorder when it is installed (monitoring on) and the
// session is interactive; otherwise it is plain `claude`, so leaving it in place is harmless.
export const SHELL_HOOK = `# >>> verb-em-all >>>
# Added by Verb 'em all to catch Claude Code spinner verbs.
claude() {
  if [ -t 0 ] && [ -t 1 ] && [ -f ~/.verb-em-all/record.exp ]; then
    expect -f ~/.verb-em-all/record.exp claude "$@"
  else
    command claude "$@"
  fi
}
# <<< verb-em-all <<<`

const HOOK_BLOCK = /\n?# >>> verb-em-all >>>\n[\s\S]*?\n# <<< verb-em-all <<<\n?/g

export function hasShellHook(profile: string): boolean {
  return profile.includes('# >>> verb-em-all >>>')
}

/** Profile text without our block, restoring what was there before it was added. */
export function removeShellHook(profile: string): string {
  return profile.replace(HOOK_BLOCK, '')
}

/** Profile text with exactly one copy of our block, appended after a blank line. */
export function addShellHook(profile: string): string {
  const rest = removeShellHook(profile)
  return (rest === '' || rest.endsWith('\n') ? rest : rest + '\n') + '\n' + SHELL_HOOK + '\n'
}
