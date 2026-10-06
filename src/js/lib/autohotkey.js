export function toAhkString(text) {
  return '"' + text.replace(/`/g, "``").replace(/"/g, '`"').replace(/;/g, "`;") + '"';
}

// AutoHotkey v2 script that types each command into Discord. The delay keeps
// Discord from rate limiting us, and touching the mouse/keyboard stops it.
export function buildAhkScript(commands, { delayMs = 2000 } = {}) {
  return `#Requires AutoHotkey v2.0

InstallMouseHook()
InstallKeybdHook()

commandList := [
  ${commands.map(toAhkString).join(",\n  ")}
]

if not WinExist("Discord") {
  MsgBox("Discord not found, exiting")
  return
}

WinActivate()

sleep(2000)

Ptime := A_TimeIdlePhysical
Ktime := A_TimeIdleKeyboard
Mtime := A_TimeIdleMouse
for command in commandList {
  if A_TimeIdlePhysical < Ptime or A_TimeIdleKeyboard < Ktime or A_TimeIdleMouse < Mtime {
    Break
  }
  SendText(command)
  Send("{Enter}")
  sleep(${delayMs})
}
`;
}
