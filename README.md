# My Checklist

My Checklist is a simple checklist app for organizing trips, shopping, and everyday tasks.

## Open the app

Use [My Checklist](https://l-plake.github.io/ChecklistApp/) in your browser. You can also add it to your device's home screen from your browser's install or share menu.

## Use your checklists

- Create checklists, give each one a name and icon, and add items, notes, and completed ticks.
- Your checklists are saved in this browser on this device. No account is needed. They are not automatically synced to your other devices, so export a backup before clearing browser data or switching devices.
- After opening the app once while online, you can use it offline. Reconnect to the internet to use sharing.
- Choose **Appearance** from the menu to use your device's theme, light mode, dark mode, or high contrast.

## Share or back up

- **Share snapshot link** shares a copy of the open checklist. **Share snapshot of all lists** in the checklist library shares copies of all your checklists. These snapshots do not include future changes. The recipient can import the lists into their own app without replacing their existing checklists.
- **Enable live sharing** in an open checklist creates a link that lets anyone with the link view and edit that checklist as changes happen. It requires an internet connection. Choose **Stop live sharing** to invalidate the link; your checklist stays in your library.
- Treat live links as public to anyone who receives them. Do not put sensitive information in a live-shared checklist.
- Live checklists allow up to 200 items. Anonymous sign-in is used for database access; the link is a bearer capability, not an account-level permission. Anyone who obtains a live link can edit or delete the shared record, and anyone authenticated to the database who also obtains its ID can access it. Review and deploy [database.rules.json](./database.rules.json) in Firebase Realtime Database; this repository cannot update the deployed rules automatically.
- Use **Export as JSON** for the open checklist or **Export backup** in the library for all checklists. To restore a backup, choose **Import backup** in the library and select the JSON file.
- Backups are limited to 32 MB. Live-shared checklists are limited to 200 items to match the Realtime Database rules. Snapshot links are limited to 8,000 encoded characters; export a backup instead if a snapshot is too large. If saved data cannot be read, the app will not overwrite it until a valid backup is imported.

## Checks

Run `node --test tests/*.test.mjs` with Node.js to test checklist normalization and snapshot links. The deployment workflow runs the same checks before publishing.
