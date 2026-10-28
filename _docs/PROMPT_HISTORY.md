# Prompt History

This document logs the user prompts that shaped Verb 'em all, in the order they were given.
Responses are not recorded.

> **Gap:** the Cosmos (constellation) tab, the procedural sound engine and the Claude theme
> were built in sessions whose prompts were not logged. Later sessions resume the log below.

---

## Session 1 — 2026-04-01

**Prompt 1**
> I want to create a small Electron app that should run on my mac and be something like a small "Catch 'em all" app for specific words I came across during development.
> The app should be minimal in design, use dark backgrounds and bright highlight colors (similar to Neo-brutal style).
> The features should be limited for the first version.
> - The list of words that will be "chased" will be hardcoded for this first version
> - The app should have a search box where the user can type the word they came across. If the word is one of these that can be "chased", it should show up as a result. If while typing multiple words match the entered text, then all of them should show as results (thus having a live search ability)
> - The app should allow the user to mark a word as "caught" and prompt them to enter a small text note
> - The app should maintain at a local and persistent storage the found/chased words while maintaining the specific date, time and any notes the user has entered when marking it as "caught"
> - The app should have 2 tabs with the "caught" and still not "caught" words
> - The app should allow more complex structure for a "chased" item, i.e. not just text but also an emoji, image or related description (this needing to use indices for marking what is caught or not). Also, a counter of how many times each item has been "caught" should also be maintained
> - The app should have simple sections with information about "How to use", "About the developer", and other commonly used menu items
>
> Regarding the development of the app, I want you to add documents that describe the architecture and overview of the app, information about how to compile and run the app for both Mac and Windows, and finally create a CLAUDE.md document with all needed and commonly stored at such a document information and a final document that keeps a story of all the prompts that we will use during the development of this project. Remember to update that last document right after each prompting I do (no need to store the responses).
>
> Let's do this!

**Prompt 2**
> Use these words instead as the ones to be "caught": Accomplishing    Finishing a task or goal.
> Actioning    Putting a plan or request into motion.
> Actualizing    Making something a reality.
> [... 187 words total with descriptions provided ...]
> Zigzagging    Moving in a sharp, back-and-forth pattern.

**Prompt 3**
> Nice job! Now let's do a few adjustments: -Make the app title bigger and more bold. Also make sure that the 3-dots menu of the OS don't cover the title -Move the entry point for the "How to use" and "About me" items to a menu item at the right side of the app title bar -Change the drop shadow of the neobrutal design to a darker variant so it is not so heavy in the eye -Make the title and subtitle of each "catchable" item larger by 15% - Make the list of the items dynamic so it can adjust dynamically to be either single-column or with two columns if the user changes the width of the window over a specific size -Add a celebration animation when a verb is "caught" and make it an "in your face" celebration -Add ability to sort by title, type (at the chase list) and by title, type and amount of catches at the "Caught" tab -Make the counter text for the caught/not caught items larger by 20%

**Prompt 4**
> And a few more features: -Make it possible to set an already caught verb as not caught -Add a menu bar entry for the app when it runs on mac that allows to directly set an item as "caught". How would you recommend to handle the actions of selecting an item as caught and opening the whole app from that menu bar entry? How should we register that functionality of accessing the menu bar at our mac app?

**Prompt 5**
> Nice! Now for the "crazy" feature: Can we make this app monitor sessions with Claude, either at the TUI or the native app or at VS code and see the fancy texts that show up when Claude is thinking? It would be great if we could hook up with it and automatically detect some of the found words!

**Prompt 6**
> Let's brainstorm ideas about what other features we could add. I want you to be bold, creative, innovative and weird in your suggestions! Let me see what you can do :)

**Prompt 7**
> Wow, amazing ideas! Save all of them in a document so I can revisit them later. And implement the 'Tamagotchi' one! Rename the digital creature to 'Verbagotchi' and use ASCII art to animate it. Surprise me with your creativity :)

**Prompt 8**
> Let's implement now the 'Statistics Dashboard' feature from the IDEAS.md. Add an entry point to the screen that holds all that information and place that entry point next to the entry point for the information about the developer and how to use the app. Also, fix the build error

**Prompt 9**
> I get this error when trying to start the project: App threw an error during load Error [ERR_REQUIRE_ESM]: require() of ES Module .../node_modules/chokidar/index.js...

**Prompt 10**
> Update all the modules used in the app to their latest stable versions, rebuild the project and verify that everything works as expected afterwards

**Prompt 11**
> Verify that everything compiles, builds and run properly please

**Prompt 12**
> Now let's do a few easy features. I want you to implement the 'Share Card Generator', the 'Customizable Accent Color' and the 'History Timeline' ideas. Once done, verify that everything builds correctly and update the documentation across the whole project to reflect all the new features

---

## Session 2 — 2026-04-19

Brainstorm of bold, non-conformist ideas (recorded in `IDEAS.md`), followed by unlogged
sessions that shipped the Cosmos constellation map, the sound engine and the Claude theme.

---

## Session 3 — 2026-10-25

**Prompt 13**
> This project has been partially completed some time ago. I want you to evaluate the status of the project, see what is missing, compare the features of it with the ones specified at its documentation and define a plan with what it is missing in order to finish with it and release it to the public

**Prompt 14**
> Let's work on it. Update the CLAUDE.md to reflect the actual project that the code includes. Fix the packaging so it is ready to be distributed to the public, offer a ready-made app for macOS so that users on the internet can download, clone or simply install the app when downloading the repo. Then remove all placeholder stuff and content. Then go ahead and clean up the whole project by removing stale content. Also, update the documentation to fully reflect the project.

**Prompt 15**
> I want you first to commmit everything in small batches that are related. Then go ahead to bump to the latest version of Electron, deal with any issues that might arise and then push these changes also. Finally, let's see what is left to go live

---

## Session 4 — 2026-10-26

**Prompt 16**
> why do we have both Electron and Electron-vite? Are they both needed? I would like a purely native build. Also, if the 2 categories are empty and not used, please go ahead and clean things up. Finally, add some basic tests. At the end, build a dmg, let me know of the folder and I will try to install and use it and test the core functionality

**Prompt 17**
> ok, I need some fixes to the app:
> - Make the title bigger and move it futher below its current position as it now looks weird being so close to the 3 top left buttons with close/minimize/full-screen. Also, align the title to the left side
> - When opening the info, the modal window doesn't fit in the screen of the app. Make sure that the modal is drawn within the visible viewport of the screen and the content is scrollable. Also position correctly the "X" button that closes the modal
> - Add a small indicator whether the app can detect Claude and therefore monitoring the words from it. If it doesn't make the indicator clickable and show instructions to the user how to fix the issue
> - Add the ability to hide the app from the dock and show only the icon at the top menu bar of the macOS
> - When switching to the "Cosmos" tab, use an animation for showing and hiding UI components so that they don't just look like "jumping" into their new position
> - Make sure that the number (i.e. 7) shows up always next to the text of the button (CAUGHT, TIMELINE, etc)
> - At the "tamagotchi"-style pet at the right side, position its UI elements more aligned and use different font size to indicate the importance of each piece of text

**Prompt 18**
> It seems that things are not working well when I am using iTerm or VSCode's integrated terminal. The verbs shown at the claude sessions are not caught and only "working" is caught, and that when it is shown at the list of tabs inside iterm. Please fix these

**Prompt 19**
> Also, many verbs like "Discombobulating", "Scurrying" and even more are not caught!

**Prompt 20**
> add also the ability to catch verbs that we have seen before. Use a different style of button for that action

**Prompt 21**
> commit with the suggested messages

**Prompt 22**
> please run the new version of the app so I can see the changes in place

**Prompt 23**
> The cards with caught verbs look really bad. Please fix them and make them look similar with the uncaught verbs, but still be distinct enough to differentiate the look-and-feel between caught and uncaught

**Prompt 24**
> commit everything

**Prompt 25**
> ok, now let's do one last search on the internet for any new verbs that have been reported as showing up at Claude code and add them to the list of verbs that we can catch. Report back your findings

**Prompt 26**
> commit everything

**Prompt 27**
> push everything, stop everything, build from scratch and start again the app in production mode

**Prompt 28**
> I saw the verb "Embellishing" showing up at the claude code terminal session but I didn't see it getting caught. Why did this happen?

**Prompt 29**
> I cannot expect the users to do these actions and fiddle with their profiles. Can we do these tasks during the installation of the app?

**Prompt 30**
> ok, these ideas sound good. Go ahead and implement them. Then reinstall/run-again the app so I can verify that it works

**Prompt 31**
> commit your work

**Prompt 32**
> the texts at the cards with the verbs that can be caught or are caught are too big and perhaps could be smaller. What do you think?

**Prompt 33**
> yes, apply the proposed sizes

**Prompt 34**
> I want to finally publish this project online. Please first verify that it looks well, can run properly from a clean installation, persists the user information between restarts, renders properly and efficiently the "Cosmos" visualization even when zoomed in and then take screenshots of the app so I can put them in the repo's README and on Linkedin

**Prompt 35**
> also make sure that the user can toggle the app starting automatically when they start their macbook and also give them information or hints how to start monitoring verbs from Claude

**Prompt 36**
> commit everything

**Prompt 37**
> that 20% cpu usage is horrible so please fix it. 
> Regarding the notarized thingy, what is the easiest and fastest solution that we can do?
> Also, fix the layout issue

**Prompt 38**
> can we make it possible to detect on-going claude sessions when we open the app?

**Prompt 39**
> commit everything
