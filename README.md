# Mudae Toolkit

Small tools for the [Mudae](https://mudae.net) Discord bot.

Deploy: https://valentin-reboli.github.io/mudae-toolkit/

## Tools

### Embed Color Generator

Picks embed colors for your harem based on each character's image. Based on the colors tool from
[mudae-tools](https://mudae-tools.gustavbylund.se/colors/).

1. Send `$mmysi-c-` in your Mudae channel, Mudae will DM you a list of your characters
2. Paste the list into the page
3. Pick a color option from the sidebar
4. Copy the `$ec` commands one by one, or download the AutoHotkey script to send them all

The AutoHotkey script needs AutoHotkey v2. It sends one command every 2 seconds and stops if you
move the mouse or press a key.

### Sphere Advisor

Tells you which sphere upgrades to buy next, following the upgrade chart (all four columns: Easy,
Medium, Hard and Expert). Ouroperks (`$op`) 9, 5 and 8 and full upgrades go on the wishlist
characters you own, in wishlist order; ouroperk 10 goes on any character. Shop perks (`$shop`) apply
to all characters.

1. Send `$mmsz=z!`, Mudae will DM you the characters with spheres in them; paste the whole DM
2. Send `$shop` and paste the reply (or type the 10 shop perk levels)
3. Send `$wls` and paste it, the ✅ lines are the wishlist characters you own
4. Enter your spheres and how many characters you own

It lists every upgrade you can afford now, click by click, then what to save up for next. Your
pastes are kept in your browser only.
