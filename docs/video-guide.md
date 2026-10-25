# System demonstration

Target duration: approximately six minutes. Use one document throughout the video.
This guide follows the interface source code. Live browser checks remain incomplete.

## Before the video

1. Start the application with the README commands.
2. Prepare two PDF files with different content for versions 1 and 2.
3. Open two separate browser profiles or one normal window and one private window.
4. Use `admin@docrepo.local` in the first window and `user@docrepo.local` in the second window.
5. Use the demonstration password from the README if the accounts still use the seed data.
6. Keep the regular user at the login page until step 3 of the video.

## Video sequence

1. **Admin: users, departments, and tags (60 seconds).**

   Enter the application. Open **Settings**. Create the department `Demo Contracts`.
   Create the tag `Demo`. Open **Users**. Find `user@docrepo.local`.

   Add `Demo Contracts` to its departments. Save the change.
   Show the role and **Active** controls without changes.

2. **Admin: document upload (50 seconds).**

   Open **Documents**. Upload the first PDF with the title `Demo Contract`.
   Add a description and the tag `Demo`. Disable **Public**.

   Add `Demo Contracts` under **Viewers**. Complete the upload. Copy the document URL.
   Point to the file preview, metadata, and access summary.

3. **Regular user: search and read access (50 seconds).**

   Enter the application. Search for `Demo Contract`.
   Select the `Demo` tag, PDF file type, and admin in **Uploader**.

   Clear the filters. Sort a column. Open the document. Preview the PDF. Download version 1.
   Show that the document has no edit controls.

4. **Admin: grant edit access (20 seconds).**

   Open **Access** on the document. Remove `Demo Contracts` from **Viewers**.
   Add it under **Editors**. Save the change.

5. **Regular user: metadata and version history (60 seconds).**

   Refresh the document page. Open **Edit details**. Change the description. Save the change.

   Select **Upload new version**. Upload the second PDF with a change note.
   Use **Version history** to view version 1. Point to the older-version message.
   Download version 1. Select **Show the latest version**.

6. **Admin: remove access (20 seconds).**

   Open **Access**. Remove `Demo Contracts` from **Editors**.
   Keep **Public** disabled. Save the change.

7. **Regular user: access restriction (20 seconds).**

   Refresh the document URL. Show the access message. Return to **Documents**.

   Search for `Demo Contract`. Show that the document no longer appears.
   Open **Settings**. Show that the user can read the tabs but cannot change the data.

8. **Admin: access and delete (20 seconds).**

   Refresh the document URL. Show that the document still opens.
   Select **Delete**. Confirm the deletion. Show that the document disappears from the list.

Use **Public** to explain access for all users who authenticate.
Keep it disabled for the restriction demonstration.
Use only the demonstration document for the delete action.
