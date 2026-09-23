# Personal Expense Manager

A modern, responsive web application for tracking expenses, managing budgets, viewing analytics, and exporting expense data.

## Features

* User sign-up and login with email and password
* Multiple local user accounts with unique User IDs
* Personal or Business account selection
* Expense management with add, edit, delete, search, and filtering
* Budget management and budget tracking
* Dashboard with expense and budget summaries
* Analytics with statistical insights and visual summaries
* CSV export for expense data
* Contact / Review page
* User details sheet showing:

  * User Name
  * User ID
  * Gmail / Email
  * Application usage type (Personal or Business)
* Responsive design for desktop and mobile screens
* Light and dark theme support
* Local data storage using browser `localStorage`

## Tech Stack

* HTML5
* CSS3
* JavaScript (Vanilla JS)
* Browser `localStorage`

No backend or Firebase connection is required for the current version.

## Project Structure

```text
expense-tracker-dashboard/
├── index.html          # Sign Up / Login page
├── dashboard.html      # Main expense dashboard
├── analytics.html      # Analytics and statistics
├── download.html       # Data export / CSV download
├── contact.html        # Contact and review page
├── style.css           # Application styling and themes
├── script.js           # Dashboard logic and expense management
├── auth.js             # Authentication and user account logic
└── README.md           # Project documentation
```

## Getting Started

This project is a client-side web application, so no server setup is required.

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/expense-tracker-dashboard.git
```

### 2. Open the project

Open `index.html` in a modern web browser.

For the best development experience, you can also run the project with a local development server such as VS Code Live Server.

## How It Works

After creating an account, the user can log in and access the application dashboard. Expenses and budgets are stored locally in the browser, allowing the application to work without a remote database.

The dashboard provides tools to manage expenses and budgets, while the Analytics page presents useful summaries of spending activity. Expense data can be exported as a CSV file from the Download page.

The user profile area also provides a quick view of the signed-in user's account details without opening a separate profile page.

## Data Storage

The current application uses browser `localStorage` for account, expense, and budget data.

This means:

* Data is stored locally in the browser.
* Data is tied to the browser/device where it was created.
* Clearing browser storage can remove application data.
* The application does not currently use a cloud database or server-side authentication.

## Main Pages

| Page             | Purpose                                      |
| ---------------- | -------------------------------------------- |
| `index.html`     | Sign up and login                            |
| `dashboard.html` | Add, manage, and review expenses and budgets |
| `analytics.html` | View spending analytics and statistics       |
| `download.html`  | Export expense data as CSV                   |
| `contact.html`   | Contact and review section                   |

## Screenshots

Add screenshots of your application here, for example:

```markdown
![Login Page](screenshots/login.png)
![Dashboard](screenshots/dashboard.png)
![Analytics](screenshots/analytics.png)
```

## Future Improvements

Possible future improvements include cloud synchronization, stronger server-side authentication, database support, recurring expenses, advanced reports, and additional export formats.

## Disclaimer

This application is provided for expense calculation and personal use only.

## Author

**Nandlal Gupta**

Created as a web-based expense tracking and dashboard project.


