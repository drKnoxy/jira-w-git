# Shoving GitHub PRs into JIRA UI
1. Create a private GitHub access token here; https://github.com/settings/tokens

    - give it repo permissions, the first set of checkboxes
    - copy into a clipboard

2. Install tampermonkey on your browser https://www.google.com/search?q=tampermonkey&oq=tamper&aqs=chrome.0.0j69i57j0l4.1831j0j1&sourceid=chrome&ie=UTF-8
3. Navigate to the jira kanban style board
4. Click the "tamper monkey" icon > "create a new script"
5. Update the name field to something descriptive
6. Update the match field to match your jira URL, be sure to truncate after RapidBoard.jspa

    Example
    ```js
    // @name         Jira w/ Github
    // @match        https://jira.lets-point.com:8443/secure/RapidBoard.jspa*
    ```

6. Paste in the code from build/main.js

7. Update the fields at the top of the pasted file

    - username - Your GitHub username
    - key - The access token from step 1
    - repo - The `org/repo` you want to match against, ie. `drKnox/lets-point`
    - prTitleRegex - How the ticket title should be scraped to find a JIRA ticket identifier
