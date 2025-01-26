# Petition Masters Website

## Summary
Petition Masters is a full-stack web application I developed using ExpressJS for the backend API and React for the frontend UI. To easily view the API endpoints, copy and paste the `/express-back-end/api_spec.yaml` file into [Swagger Editor](https://editor.swagger.io/).

The frontend integrates seamlessly with the backend API, offering comprehensive CRUD functionality through an aesthetically pleasing interface. Users can effortlessly:
- Log in and log out.
- edit profile including a profile image
- Browse petitions with filters.
- Create, edit, and delete petitions, with image integration.
- Support other users' petitions.

---

# ExpressJS Backend

This is the backend service for the application, built using ExpressJS. Follow the instructions below to set up and run the project locally.

---

## Running Locally

1. Install the required packages by running:
   ```bash
   npm install
   ```

2. Create a file named `.env` in the root directory. Follow the instructions in the [`.env` file](#env-file) section below.

3. Set up the database:
   - Create a new database with the name specified in your `.env` file.
   - Use a tool like `phpMyAdmin` for database creation.

4. Start the server:
   - For normal execution:
     ```bash
     npm run start
     ```
   - For debugging:
     ```bash
     npm run debug
     ```

5. Populate the database:
   - Connect your database to Postman.
   - Load the provided Postman folder into Postman.
   - Run the `POST /reload` request to populate the database with initial data.

6. The backend server will now be accessible at:
   ```
   http://localhost:4941
   ```

---

### `.env` File Configuration

Create a `.env` file in the root directory of the project with the following information:

```plaintext
SENG365_MYSQL_HOST={your database host}
SENG365_MYSQL_USER={your usercode}
SENG365_MYSQL_PASSWORD={your password}
SENG365_MYSQL_DATABASE={a database starting with your usercode then an underscore}
```

#### Example `.env` File:
```plaintext
SENG365_MYSQL_HOST=db2.csse.canterbury.ac.nz
SENG365_MYSQL_USER=abc123
SENG365_MYSQL_PASSWORD=password
SENG365_MYSQL_DATABASE=abc123_s365
```

**Note:** Ensure you create the database mentioned in the `.env` file before running the backend.

---

## Status Code Overview

The API follows standard HTTP status codes to indicate the outcome of requests. Below is a summary of key status codes:

| Status Code | Status Message        | Description                                                                   | Example                                          |
|-------------|-----------------------|-------------------------------------------------------------------------------|-------------------------------------------------|
| 200         | OK                    | The request was successfully completed.                                       | Fetching petitions successfully.               |
| 201         | Created               | The resource was successfully created.                                        | Creating a petition.                            |
| 400         | Bad Request           | The request failed due to a client-side error.                                | Missing required fields when creating a petition. |
| 401         | Unauthorized          | The request failed due to invalid authorization credentials.                  | Attempting to create a petition without an authorization header. |
| 403         | Forbidden             | The server refused the request.                                               | Attempting to delete another user's petition.   |
| 500         | Internal Server Error | The server encountered an error while processing the request.                 | An unexpected error occurred.                   |
| 501         | Not Implemented       | The requested functionality is not yet implemented.                          | A placeholder for unimplemented features.       |

### Additional Notes:

- In some cases, multiple status codes may be acceptable. For example:
  - Attempting a forbidden action on a non-existent resource might return either:
    - `403 Forbidden` if permissions are checked first.
    - `404 Not Found` if the resource is validated first.
- Consider which response is most appropriate for your application and avoids exposing unnecessary system details.

---

# React Frontend

This is the frontend of the application, which interacts with the ExpressJS backend.

---

## Running Locally

1. Create a `.env` file in the root directory of the frontend project. Follow a similar format to the backend `.env` file.

2. Start the backend server before running the frontend.

3. Run the frontend using:
   ```bash
   npm start
   ```

4. The frontend will be accessible at:
   ```
   http://localhost:<port>
   ```
   (Replace `<port>` with the port defined in your frontend project configuration.)

---
