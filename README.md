
# Hire Up - Placement Cell Communication Portal

Hire Up is a full-stack web application built to streamline communication between a college placement cell (Admins) and the student body. It provides a robust, real-time platform for managing and disseminating placement-related information, ensuring students are always informed and well-prepared.

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Live Demo](#2-live-demo)
3. [Technology Stack](#3-technology-stack)
4. [Core Architecture & Data Flow](#4-core-architecture--data-flow)
5. [Key Features](#5-key-features)
6. [Local Setup & Configuration](#6-local-setup--configuration)
7. [Firestore Database Schema](#7-firestore-database-schema)
8. [UML Diagram Guidance](#8-uml-diagram-guidance)

---

### 1. Project Overview

**Purpose:** To serve as a centralized hub where placement cell administrators can post announcements, targeted notifications, and preparation resources for students. The system ensures information is delivered reliably through both a web portal and direct email notifications.

**User Roles:**

*   **Admin:** Staff members of the placement cell. They can register using a special code, log in, and manage all content.
*   **Student:** Enrolled students. They can register for their specific course, log in to view updates, and manage their profile.

### 2. Live Demo
*(This section can be updated with a link to your deployed application)*

**Admin Login:** `admin@example.com` / `password123`
**Student Login:** `student@example.com` / `password123`

---

### 3. Technology Stack

*   **Framework:** **Next.js 14+** (using the App Router) for a hybrid web application that leverages both Server and Client Components.
*   **Language:** **TypeScript** for type safety and improved developer experience.
*   **Database:** **Google Firestore** (a NoSQL, document-based database) for storing all application data.
*   **Authentication:** **Firebase Authentication** for handling secure user registration and login for both Admins and Students.
*   **UI Components:** **ShadCN UI** for a pre-built, accessible, and customizable component library.
*   **Styling:** **Tailwind CSS** for a utility-first approach to styling, with custom themes defined in `src/app/globals.css`.
*   **Form Management:** **React Hook Form** for performant form state management and **Zod** for schema validation.
*   **Email Service:** **Nodemailer** for sending emails programmatically from the server, using a Gmail account as the transport service.

---

### 4. Core Architecture & Data Flow

The application follows a modern, server-centric model using **Next.js Server Actions**. This architecture is secure and efficient, as sensitive operations (like database writes and sending emails) occur on the server, while the UI remains interactive and responsive on the client.

*   **Client Components (`"use client"`):** Used for pages that require interactivity and browser-side hooks (e.g., forms, dashboards with real-time updates).
*   **Server Actions (`"use server"`):** Functions that are defined on the server but can be called directly from Client Components. This is the primary mechanism for all backend operations, eliminating the need for traditional API endpoints.
*   **Real-time Updates:** The application uses `onSnapshot` from the Firebase SDK to listen for real-time changes in the Firestore database, ensuring dashboards and lists are always up-to-date without needing a page refresh.

---

### 5. Key Features

#### **Admin Portal (`/admin/**`)**
-   **Secure Registration:** Admins register with a secret code, ensuring only authorized personnel can create an account.
-   **Dashboard:** Displays key statistics in real-time (Total Students, Notifications Sent, etc.) and provides "Quick Action" buttons.
-   **Announcements & Notifications:** Admins can compose and publish announcements/notifications. Publishing triggers a bulk email to all registered students. The UI provides detailed feedback on email dispatch status.
-   **Resource Management:** Admins can upload links to preparation materials (e.g., PDF documents, video links). This also triggers an email notification to all students.
-   **Student Data Management:** Admins can view a list of all registered students, filter by course, search, and export the list to an Excel file.
-   **Profile Management:** Admins can update their own profile information.

#### **Student Portal (`/student/**`)**
-   **Course-Specific Registration:** Students register by providing their name, roll number, and course. The system prevents duplicate registrations based on email or roll number.
-   **Personalized Dashboard:** Displays a summary of the most recent notifications, announcements, and resources relevant to the student.
-   **Content Viewing:** Students can view a full, searchable history of all announcements and resources. Clicking an item opens a detailed view in a dialog.
-   **Profile Management:** Students can view their details and update their name and mobile number.

---

### 6. Local Setup & Configuration

To run this project locally, follow these steps:

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Firebase Setup:**
    *   Create a new project in the [Firebase Console](https://console.firebase.google.com/).
    *   In your project, create a new **Web App**.
    *   Copy the `firebaseConfig` object provided by Firebase.
    *   Paste this object into `src/lib/firebase.ts`, replacing the existing placeholder config.
    *   In the Firebase Console, go to **Authentication** -> **Sign-in method** and enable **Email/Password**.
    *   Go to **Firestore Database** and create a new database in production mode.

4.  **Email Service Setup:**
    *   Create a file named `.env.local` in the root of your project.
    *   Generate a **Gmail App Password** for your Google account. See: [Google's Guide on App Passwords](https://support.google.com/accounts/answer/185833). A regular password will not work.
    *   Add your credentials to the `.env.local` file:
        ```
        GMAIL_EMAIL="your-email@gmail.com"
        GMAIL_APP_PASSWORD="your-16-character-app-password"
        ```

5.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

---

### 7. Firestore Database Schema

*   `Admins/{adminEmail}`
    -   Stores information for an admin user.
*   `Students-list/Course/{courseName}/{studentUID}`
    -   Primary, partitioned storage for detailed student profiles.
*   `student-emails/{studentUID}`
    -   A flat collection for efficiently fetching all student emails for bulk notifications.
*   `notifications/{notificationId}`
    -   Stores individual notification records.
*   `announcements/{announcementId}`
    -   Stores individual announcement records.
*   `resources/{resourceId}`
    -   Stores individual resource records.

---

### 8. UML Diagram Guidance

This documentation can be used as a source for creating UML diagrams:

*   **Use Case Diagram:** Identify the actors (Admin, Student) and their interactions with the system (e.g., "Admin posts announcement," "Student views resources"). The Key Features section provides a good list of use cases.
*   **Class Diagram:** Model the main entities of the system: `Admin`, `Student`, `Notification`, `Announcement`, `Resource`. The attributes for each class can be derived from the Firestore Schema section.
*   **Sequence Diagram:** Model the flow of interactions for key processes. For example, a sequence diagram for "Send Notification" would show the flow: `Admin (UI) -> New Notification Page -> Server Action (sendBulkNotification) -> Firestore (fetch emails) -> Nodemailer (sendEmail) -> Student (receives email)`.
*   **Activity Diagram:** Model the logic for registration or content posting, showing conditions like "Is email already registered?" or "Are email credentials configured?".
