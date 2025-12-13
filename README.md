# Face Attendance System

A biometric attendance tracking application that leverages facial recognition technology to securely log user attendance. This system consists of a React-based frontend for capturing facial data and an Express backend for managing attendance records and user profiles.

## Technologies Used

-   **Frontend**: React (Vite), face-api.js for browser-based facial recognition.
-   **Backend**: Node.js, Express.
-   **Database**: SQLite (via `better-sqlite3`).

## Facial Recognition Models

This project utilizes specific pre-trained models from the `face-api.js` library, located in `client/public/models`. These models are essential for the biometric verification process:

*   **`tiny_face_detector`**: A lightweight, fast, and efficient model designed for real-time face detection in the browser. It balances performance and accuracy, making it suitable for live video feeds.
*   **`face_landmark_68`**: This model detects 68 specific points on a face (jawline, eyebrows, nose, etc.). These landmarks are critical for face alignment, ensuring the face is properly oriented before recognition.
*   **`face_recognition_model`**: A ResNet-34 based architecture that computes a unique 128-dimensional descriptor (embedding) for each face. This descriptor is what distinguishes one individual from another.

## Installation and Setup

### Client (Frontend)

1.  Navigate to the client directory:
    ```bash
    cd client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

### Server (Backend)

1.  Navigate to the server directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the backend server:
    ```bash
    node index.js
    ```
    *Alternatively, you can use `npx nodemon` for development auto-restarts.*

## Project Structure

-   `/client`: Frontend source code and assets.
-   `/server`: Backend API and database logic.
