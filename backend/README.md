# StudySync Backend

A Spring Boot backend application for collaborative study sessions with real-time features.

## Tech Stack

- Spring Boot 3.2.0
- Spring Security with JWT Authentication
- WebSocket (STOMP) for real-time communication
- MySQL Database
- JPA/Hibernate
- BCrypt Password Encoding
- Maven

## Features

- User Registration & Login with JWT
- Room Management (Create & Join)
- Private Notes per user per room
- Shared Notes per room
- Session Management & Archiving
- Real-time WebSocket communication for:
  - Notes updates
  - Cursor positions
  - Doubts/questions
  - Whiteboard
  - Pomodoro timer

## Project Structure

```
com.studysync
├── config          # Configuration classes
├── controller      # REST controllers
├── service         # Business logic
├── repository      # Data access layer
├── model           # Entity models
├── dto             # Data transfer objects
├── security        # Security & JWT
├── websocket       # WebSocket handlers
└── exception       # Exception handling
```

## Database Setup

1. Create MySQL database:
```sql
CREATE DATABASE studysync;
```

2. Update `application.properties` with your database credentials:
```properties
spring.datasource.username=your_username
spring.datasource.password=your_password
```

## Running the Application

1. Build the project:
```bash
mvn clean install
```

2. Run the application:
```bash
mvn spring-boot:run
```

The application will start on `http://localhost:8080`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Rooms
- `POST /api/rooms` - Create room (requires auth)
- `POST /api/rooms/join` - Join room by code (requires auth)
- `GET /api/rooms/code/{code}` - Get room by code
- `GET /api/rooms/my-rooms` - Get user's rooms (requires auth)

### Notes
- `POST /api/notes/private` - Save private note (requires auth)
- `GET /api/notes/private/{roomId}` - Get private note (requires auth)
- `GET /api/notes/shared/{roomId}` - Get shared note (requires auth)
- `PUT /api/notes/shared` - Update shared note (requires auth)

### Sessions
- `POST /api/sessions/start/{roomId}` - Start session (requires auth)
- `POST /api/sessions/archive` - Archive session (requires auth)
- `GET /api/sessions/room/{roomId}` - Get room sessions (requires auth)

## WebSocket

### Endpoint
- `/ws` - WebSocket endpoint (use SockJS)

### Topics
- `/topic/notes/{roomId}` - Notes updates
- `/topic/cursor/{roomId}` - Cursor positions
- `/topic/doubt/{roomId}` - Doubts/questions
- `/topic/whiteboard/{roomId}` - Whiteboard updates
- `/topic/pomodoro/{roomId}` - Pomodoro timer

### Authentication
Include JWT token in WebSocket connection headers:
```
Authorization: Bearer <token>
```

## Security

- All endpoints except `/api/auth/**` require JWT authentication
- JWT tokens are stateless and expire after 24 hours (configurable)
- WebSocket connections require JWT authentication via Authorization header
- Passwords are encrypted using BCrypt

## Configuration

Key configuration in `application.properties`:
- `jwt.secret` - Secret key for JWT (change in production)
- `jwt.expiration` - Token expiration in milliseconds (default: 86400000 = 24 hours)

## License

MIT
