# ChecklistApp

## App version

The app version is shown in the page footer. On each push to `main`, the GitHub Pages deployment workflow updates the version in its temporary deployment copy of `index.html`, then deploys the site. The version is based on the workflow run number with an offset to continue above the existing version. No version-bump commit is pushed to the repository.

When the app detects a newer deployment, the footer shows an **Update available** button (including the new version when detected). Select it to reload and use the newer version; until then, the current page remains open.

## Live checklist sharing

Open a checklist and choose **Enable live sharing**. The app creates a Realtime Database record and copies a live link based on `https://l-plake.github.io/ChecklistApp/`, regardless of the URL used to open the app. Anyone who opens the link can see live changes and edit the checklist; edits to its name, icon, tasks, and notes sync between connected users. Use **Stop live sharing** to remove the record and invalidate its link. Use **Copy live link** to copy it again while sharing is on.

From an open checklist, choose **Share snapshot link** to share a one-time copy containing only that checklist. Future changes will not sync through this link, and recipients can import it without changing their existing checklists. Choose **Export this list** to download a JSON backup of only the open checklist; **Export backup** in the library still exports all lists.

The **Share all lists** action in the library still creates a snapshot link containing all checklists. Live sharing is separate and only shares the checklist currently open.

### Firebase setup

The app's Firebase configuration is in `firebase-share.js` and already points to the project's Realtime Database. In the Firebase console for that project:

1. Under **Authentication > Sign-in method**, enable **Anonymous**. The app uses anonymous sign-in for database access; link recipients do not need accounts.
2. Under **Realtime Database > Rules**, replace the rules with the following and publish them:

   ```json
   {
     "rules": {
       ".read": false,
       ".write": false,
       "sharedLists": {
         "$shareId": {
           ".read": "auth != null",
           ".write": "auth != null",
           ".validate": "newData.hasChildren(['title', 'icon', 'notes'])",
           "title": {
             ".validate": "newData.isString() && newData.val().length <= 80"
           },
           "icon": {
             ".validate": "newData.isString() && newData.val().length <= 16"
           },
           "notes": {
             ".validate": "newData.isString() && newData.val().length <= 4000"
           },
           "tasks": {
             "$taskId": {
               ".validate": "newData.hasChildren(['id', 'text', 'done'])",
               "id": {
                 ".validate": "newData.isString() && newData.val().length <= 80"
               },
               "text": {
                 ".validate": "newData.isString() && newData.val().length <= 240"
               },
               "done": {
                 ".validate": "newData.isBoolean()"
               },
               "$other": {
                 ".validate": false
               }
             }
           },
           "$other": {
             ".validate": false
           }
         }
       }
     }
   }
   ```

   This keeps the database root and the list of share IDs private while allowing signed-in clients to read and write a known shared-list path. The app creates hard-to-guess IDs for links. The rules validate each field and reject unrecognized fields. The app limits shared lists to 200 tasks.
3. Deploy the updated app files to GitHub Pages before sharing. The live-link URL points to `https://l-plake.github.io/ChecklistApp/`; the recipients need the deployed version that understands the `live` query parameter. Links created by the earlier local-preview version start with `file://` and cannot be used by other people; turn sharing on again to copy a web link.

**Link access is the permission:** anyone who gets a live link can view and edit that list, and anyone who can edit it can stop its sharing. Do not put sensitive information in a shared list. Stopping sharing deletes its database record, so the old link no longer works.
