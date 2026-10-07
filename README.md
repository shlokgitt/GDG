# Event Management API

A robust backend REST API for managing events and registrations, built as a recruitment task.

## Features
- **User Authentication & Authorization**: Secure signup/login using bcrypt and JWT. Differentiates between regular `user` and `admin` roles.
- **Event Management**: Create, view, update, and delete events. Organizers can only edit/delete their own events (unless they are an admin).
- **Event Registration**: Users can register for events. Includes atomic capacity checks, prevents duplicate registrations, and allows users to cancel their registrations.
- **Advanced Search & Filtering**: Filter events by `search` (title/description), `location`, `from`, `to` (date ranges), and `upcoming=true`. Includes pagination (`page` and `limit`).
- **Organizer / Admin Dashboard**: Organizers can view attendees for their events. Admins can view platform-wide stats.

## Tech Stack
- **Node.js** & **Express 5**
- **MongoDB Atlas** & **Mongoose 9**
- **JWT** (jsonwebtoken) & **bcryptjs** for auth
- **Zod** for schema validation
- **Helmet** & **CORS** for security
- **Nodemon** for development

## Setup Instructions
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd event-management-api
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup environment variables:
   Copy the example file to create your own `.env`:
   ```bash
   cp .env.example .env
   ```
   *Update the `.env` file with your actual MongoDB URI and a secure JWT secret.*
4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables
| Variable | Description | Example |
| -------- | ----------- | ------- |
| `PORT` | The port the server runs on | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for signing JWTs | `your_secret_key` |
| `JWT_EXPIRES_IN`| Token expiration time | `7d` |

## API Endpoints

### Auth
| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and receive a JWT |
| GET | `/auth/me` | Get current logged-in user profile |

### Events
| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/events` | List events (Supports `?search`, `?location`, `?from`, `?to`, `?upcoming`, `?page`, `?limit`) |
| GET | `/events/:id` | Get details of a single event |
| POST | `/events` | Create a new event (Auth required) |
| PUT | `/events/:id` | Update an event (Organizer/Admin only) |
| DELETE | `/events/:id` | Delete an event (Organizer/Admin only) |

### Registrations
| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/events/:id/register` | Register for an event (Auth required) |
| DELETE | `/events/:id/register` | Cancel registration (Auth required) |
| GET | `/me/registrations` | List all events the logged-in user is registered for |
| GET | `/events/:id/registrations`| View attendees of an event (Organizer/Admin only) |

### Admin
| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/admin/stats` | Get platform stats (Admin only) |

## How to Make an Admin
By default, all new signups are assigned the `user` role. To promote a user to an admin:
1. Open your MongoDB Atlas dashboard.
2. Navigate to your `event-management` database and open the `users` collection.
3. Find the user document you want to promote.
4. Edit the document and change the `role` field from `"user"` to `"admin"`.

## Deploying on Render
1. Connect your GitHub repository to Render and create a new **Web Service**.
2. Set the **Build Command** to `npm install`.
3. Set the **Start Command** to `npm start`.
4. In the Render dashboard, add your environment variables (`MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`). *Render does not read your local `.env` file.*
5. In your MongoDB Atlas Network Access settings, ensure you have whitelisted `0.0.0.0/0` so Render can connect to your database.
6. Deploy and test the live URL!

## Known Limitations
- Seat-counter rollback after a failed `Registration.create` is not a true MongoDB transaction; a hard crash between the two steps could leave the counter slightly inaccurate.
- Lowering an event's capacity via update can race with a registration happening at the exact same moment.
- Admin role is set manually directly in the database; the API signup always creates a standard `"user"`.

## Challenges Faced
- **Database Connection Issues**: Atlas `mongodb+srv` failed with `querySrv ECONNREFUSED` on my network; fixed this by setting explicit DNS servers (Google/Cloudflare DNS) using `dns.setServers` in `server.js`.
- **Race Conditions**: Encountered a race condition in the "check capacity, then save" registration flow. Fixed this by implementing an atomic conditional update (`$expr` registeredCount < capacity) along with a unique compound index on `userId` + `eventId`.
- **Refactoring Crashes**: Encountered crashes while splitting controllers and utils into separate files (e.g., missing modules, duplicate `canManage` declarations, and a "handler must be a function" error from referencing the wrong controller).
- **Windows Testing Quirks**: Testing on Windows PowerShell was tricky because `curl` is an alias for `Invoke-WebRequest`. I resolved this by explicitly using `curl.exe` or Thunder Client, and properly escaping JSON quotes.
- **Query Parsing Bugs**: Found and fixed a 500 Internal Server Error caused by repeated query parameters (e.g., `?search=a&search=b` parsing as an array). Handled this by strictly casting query parameters to Strings before running regex operations.
