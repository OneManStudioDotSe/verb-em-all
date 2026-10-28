// The block the app adds to the user's shell profile (with consent) to catch spinner verbs.
// Interactive `claude` sessions always run through the app's relay, which records screen
// output only while the app is monitoring, so a session started while the app is closed is
// caught once it opens. Without the relay (the app removed it) this is plain `claude`.
export const SHELL_HOOK = `# >>> verb-em-all >>>
# Added by Verb 'em all to catch Claude Code spinner verbs.
claude() {
  if [ -t 0 ] && [ -t 1 ] && [ -f ~/.verb-em-all/relay.exp ]; then
    expect -f ~/.verb-em-all/relay.exp claude "$@"
  else
    command claude "$@"
  fi
}
# <<< verb-em-all <<<`

const HOOK_BLOCK = /\n?# >>> verb-em-all >>>\n[\s\S]*?\n# <<< verb-em-all <<<\n?/g

export function hasShellHook(profile: string): boolean {
  return profile.includes('# >>> verb-em-all >>>')
}

/** True only for this version of the block; an older one is offered as an update. */
export function hasCurrentShellHook(profile: string): boolean {
  return profile.includes(SHELL_HOOK)
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
