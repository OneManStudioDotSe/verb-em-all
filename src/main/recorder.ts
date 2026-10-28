// The expect script that relays `claude` sessions (see SHELL_HOOK in src/shared/shellhook.ts).
// Kept free of Electron imports so tests can run it.

// Spinner verbs are only drawn on screen, never written to transcripts. The `claude` shell
// function (SHELL_HOOK) always runs Claude Code through this expect script (relay.exp, kept
// while the function is installed), which relays the session through a pseudo-terminal,
// forwards window resizes and appends the output to tty/<pid>.log while the app is
// monitoring. The app reads and empties those logs. Every second the relay checks for
// record.exp, which exists only while monitoring is on: it stops logging when the app stops
// and resumes when it starts again, so sessions started or left open while the app was
// closed are caught once it opens, and nothing is recorded in between. record.exp holds the
// same script so shells still using the previous function (which ran record.exp) keep working.
export const RECORDER_SCRIPT = `# Written by Verb 'em all while monitoring is on; removed when it stops.
set dir [file join $env(HOME) .verb-em-all]
set log [file join $dir tty "[pid].log"]
log_user 0
proc follow {} {
  global dir log
  catch {
    if {![file exists [file join $dir record.exp]]} {
      log_file
    } elseif {![file exists $log]} {
      file mkdir [file dirname $log]
      log_file
      log_file -a $log
    }
  }
  after 1000 follow
}
follow
set stty_init "rows [stty rows] columns [stty columns]"
spawn -noecho {*}$argv
trap { stty rows [stty rows] columns [stty columns] < $spawn_out(slave,name) } WINCH
interact
catch wait result
log_file
file delete $log
exit [lindex $result 3]
`
