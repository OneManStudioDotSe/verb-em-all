# Prompt History

This document logs all user prompts used during the development of Verb 'em all.
Responses are not recorded — only the prompts that shaped the project.

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

---

**Prompt 5**
> Nice! Now for the "crazy" feature: Can we make this app monitor sessions with Claude, either at the TUI or the native app or at VS code and see the fancy texts that show up when Claude is thinking? It would be great if we could hook up with it and automatically detect some of the found words!

---

**Prompt 4**
> And a few more features: -Make it possible to set an already caught verb as not caught -Add a menu bar entry for the app when it runs on mac that allows to directly set an item as "caught". How would you recommend to handle the actions of selecting an item as caught and opening the whole app from that menu bar entry? How should we register that functionality of accessing the menu bar at our mac app?

---

**Prompt 3**
> Nice job! Now let's do a few adjustments: -Make the app title bigger and more bold. Also make sure that the 3-dots menu of the OS don't cover the title -Move the entry point for the "How to use" and "About me" items to a menu item at the right side of the app title bar -Change the drop shadow of the neobrutal design to a darker variant so it is not so heavy in the eye -Make the title and subtitle of each "catchable" item larger by 15% - Make the list of the items dynamic so it can adjust dynamically to be either single-column or with two columns if the user changes the width of the window over a specific size -Add a celebration animation when a verb is "caught" and make it an "in your face" celebration -Add ability to sort by title, type (at the chase list) and by title, type and amount of catches at the "Caught" tab -Make the counter text for the caught/not caught items larger by 20%

---

**Prompt 2**
> Use these words instead as the ones to be "caught": Accomplishing    Finishing a task or goal.
> Actioning    Putting a plan or request into motion.
> Actualizing    Making something a reality.
> [... 187 words total with descriptions provided ...]
> Zigzagging    Moving in a sharp, back-and-forth pattern.

---

**Prompt 6**
> Let's brainstorm ideas about what other features we could add. I want you to be bold, creative, innovative and weird in your suggestions! Let me see what you can do :)

---

**Prompt 7**
> Wow, amazing ideas! Save all of them in a document so I can revisit them later. And implement the 'Tamagotchi' one! Rename the digital creature to 'Verbagotchi' and use ASCII art to animate it. Surprise me with your creativity :)

---

**Prompt 8**
> Let's implement now the 'Statistics Dashboard' feature from the IDEAS.md. Add an entry point to the screen that holds all that information and place that entry point next to the entry point for the information about the developer and how to use the app. Also, fix the build error

---

**Prompt 9**
> I get this error when trying to start the project: App threw an error during load Error [ERR_REQUIRE_ESM]: require() of ES Module /Users/sotiris/Documents/Repos/Mine/verb-em-all/node_modules/chokidar/index.js...

---

**Prompt 10**
> Update all the modules used in the app to their latest stable versions, rebuild the project and verify that everything works as expected afterwards

---

**Prompt 11**
> Verify that everything compiles, builds and run properly please

---

**Prompt 12**
> Now let's do a few easy features. I want you to implement the 'Share Card Generator', the 'Customizable Accent Color' and the 'History Timeline' ideas. Once done, verify that everything builds correctly and update the documentation across the whole project to reflect all the new features
