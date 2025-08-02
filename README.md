
# LibraryQR - Admin Web Panel

A powerful, responsive web-based administrative dashboard for the LibraryQR management system. This panel provides librarians and administrators with complete control over the library's catalog, user borrowing activities, and financial records.

This project is built with React and leverages the full power of Google's Firebase suite for authentication, database, and storage, ensuring a real-time, secure, and scalable experience.

-----

### 🎨 UI & Styling

The user interface is designed to be a direct web counterpart to the mobile application, featuring a clean and modern aesthetic.

  * **Color Palette**:
      * **Primary Background**: `#F3FAF8`
      * **Primary Text & Accent**: `#00253A`
      * **Card Background**: `#FFFFFF`
      * **Success/Approval**: `#2E7D32`
      * **Danger/Rejection**: `#E53935`
      * **Info/Action**: `#1976D2`
      * **Warning/Pending**: `#FFA000`
  * **Layout**: A fixed sidebar navigation (converted from the mobile app's drawer) provides easy access to all sections. Content cards use rounded corners (`border-radius: 16px`) and subtle box shadows (`box-shadow: 0 2px 4px rgba(0,0,0,0.08)`) to maintain a consistent look and feel.

-----

## ✨ Core Features

### 1\. Secure Authentication

  * Admin-only login page powered by **Firebase Authentication** (Email & Password).
  * Protected routes to ensure only authenticated admins can access the dashboard.

### 2\. Main Navigation (Navbar)

A persistent vertical navbar on the left provides access to all key administrative areas:

  * Dashboard (Available Books)
  * Pending Borrow Requests
  * Pending Return Requests
  * Processed History
  * Penalty Management
  * Users List
  * Manage Books
  * Logout

### 3\. Dashboard (`AvailableBooksScreen`)

  * **Live View**: A real-time grid or list of all books in the library.
  * **Search**: Instantly search the entire catalog by book title or author.
  * **Stock Status**: Clearly see the number of available copies or an "Out of Stock" status.
  * **Quick Restock**: Add more copies to an "Out of Stock" book directly from the dashboard.

### 4\. Request Management

  * **Pending Borrows (`AdminPendingRequests`):** A dedicated queue to view and process incoming book borrowing requests. Approve or reject requests with a single click.
  * **Pending Returns (`AdminReturnRequestsScreen`):** A queue to manage incoming return requests. The system prevents approving a return if an unpaid penalty exists.
  * **Processed History (`AdminProcessedRequests`):** A complete, filterable log of all past approved and rejected requests for audit and review purposes.

### 5\. Catalog Management (`AdminManageBooksScreen`)

  * **Add New Books**: An intuitive modal form to add a new book to the catalog, including uploading a cover photo to Firebase Storage.
  * **Delete Books**: Permanently remove a book and its records from the library.
  * **Update Inventory**: Add copies to any existing book by its ID.

### 6\. User & Penalty Management

  * **Users List (`AdminUsersListScreen`):** View a searchable list of all users who have borrowed books.
  * **User Drill-Down (`AdminUsersBorrowedBooksScreen`):** Click on any user to see their complete borrowing history, current status, and penalty records.
  * **Direct Alerts**: Send manual, custom alert messages to any user about a specific book (e.g., "Your book is overdue").
  * **Penalty Dashboard (`AdminPenaltyScreen`):** View all outstanding, unpaid penalties. Mark penalties as "Paid" once the fine is collected.

### 7\. Reporting

  * **PDF Export**: Generate and download a comprehensive **"Library Lending & Penalty Report"** in PDF format directly from the Users List screen.

-----

## 🚀 Technology Stack

  * **Frontend**:
      * [React](https://reactjs.org/) (v18+)
      * [React Router](https://reactrouter.com/) for page navigation.
      * [Styled Components](https://styled-components.com/) or [Tailwind CSS](https://tailwindcss.com/) for styling.
      * [Redux Toolkit](https://redux-toolkit.js.org/) or [Zustand](https://github.com/pmndrs/zustand) for global state management.
      * [React-PDF](https://react-pdf.org/) or [jsPDF](https://github.com/parallax/jsPDF) for report generation.
  * **Backend & Database**:
      * [Google Firebase](https://firebase.google.com/)
          * **Firestore**: For the real-time NoSQL database.
          * **Firebase Authentication**: For secure admin login.
          * **Firebase Storage**: For hosting book cover images.

-----

## 🛠️ Setup and Installation

Follow these steps to get the project running on your local machine.

### Prerequisites

  * Node.js (v18 or later)
  * NPM or Yarn
  * A Google Firebase project

### Installation Steps

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/libraryqr-admin-panel.git
    cd libraryqr-admin-panel
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Set up Firebase Environment Variables:**
      * Create a `.env` file in the root of the project.
      * Add your Firebase project's configuration keys to this file. You can find these in your Firebase project settings.
    <!-- end list -->
    ```env
    REACT_APP_FIREBASE_API_KEY="your_api_key"
    REACT_APP_FIREBASE_AUTH_DOMAIN="your_auth_domain"
    REACT_APP_FIREBASE_PROJECT_ID="your_project_id"
    REACT_APP_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
    REACT_APP_FIREBASE_APP_ID="your_app_id"
    ```
4.  **Run the development server:**
    ```bash
    npm start
    # or
    yarn start
    ```
    The application will be available at `http://localhost:3000`.

-----

## \<footer\>

\<div align="center"\>
\<p\>Developed for the LibraryQR System.\</p\>
\<p\>\&copy; 2025 LibraryQR. All Rights Reserved.\</p\>
\</div\>
