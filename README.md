# Instagram Follow Request Canceller

A Node.js script that automates cancelling pending Instagram follow requests using Puppeteer.  
It logs into your Instagram account, visits profiles from a list, and cancels sent follow requests.

## Features

- Automates Instagram login
- Reads usernames from a `username-list.json` file
- Cancels pending follow requests on each profile
- Saves cancelled users list as an Excel file on your Desktop

## Warning (2FA Auth)

If your account uses Two-Factor Authentication (2FA), please temporarily disable it to run this script successfully.

## Note on Instagram Login

Since Instagram login is performed via AJAX and the page behaves like a Single Page Application (SPA) with URL and content changes without a full reload, `waitForNavigation` may sometimes proceed before login is fully completed. If you encounter this, avoid retrying the login immediately and try again after a short delay.

## Usage

1. Clone or download the project files.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a username-list.json file in the project folder with usernames array, for instagram username example:
   `["user1", "user2", "user3"]`
4. Set your Instagram credentials in the script:
   `const INSTAGRAM_USERNAME = 'your_username'`
   `const INSTAGRAM_PASSWORD = 'your_password'`
5. Run the script:
   `node index.js`
