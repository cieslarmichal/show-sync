# REST API Plan

## 1. Resources

- **Users**: Represents user accounts and profiles. Corresponds to the `users` table.
- **Watchrooms**: Represents viewing rooms created by users. Corresponds to the `watchrooms` table.
- **Series**: A virtual resource that acts as a proxy to the external TMDB API for searching series.
- **Recommendations**: Represents AI-generated series recommendations for a room. Corresponds to the `recommendations` table.

## 2. Endpoints

### Users

#### Register a new user

- **Method**: `POST`
- **Path**: `/users/register`
- **Description**: Creates a new user account.
- **Request Body**:

  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "a-strong-password"
  }
  ```

- **Response Body**:

  ```json
  {
    "user": {
      "id": "uuid-v7-string",
      "name": "John Doe",
      "email": "john.doe@example.com"
    },
    "accessToken": "jwt-access-token"
  }
  ```
  
- **Note**: The `refreshToken` is sent as a secure, HTTP-only cookie, not in the response body.
- **Success Codes**: `201 Created`
- **Error Codes**: `400 Bad Request` (Invalid input), `409 Conflict` (Email already exists)

#### Log in a user

- **Method**: `POST`
- **Path**: `/users/login`
- **Description**: Authenticates a user and returns JWTs.
- **Request Body**:

  ```json
  {
    "email": "john.doe@example.com",
    "password": "a-strong-password"
  }
  ```

- **Response Body**:

  ```json
  {
    "user": {
      "id": "uuid-v7-string",
      "name": "John Doe",
      "email": "john.doe@example.com"
    },
    "accessToken": "jwt-access-token"
  }
  ```
  
- **Note**: The `refreshToken` is sent as a secure, HTTP-only cookie, not in the response body.
- **Success Codes**: `200 OK`
- **Error Codes**: `400 Bad Request` (Invalid input), `401 Unauthorized` (Invalid credentials)

#### Refresh access token

- **Method**: `POST`
- **Path**: `/users/refresh`
- **Description**: Issues a new access token using a valid refresh token (sent via secure, HTTP-only cookie).
- **Response Body**:

  ```json
  {
    "accessToken": "new-jwt-access-token"
  }
  ```

- **Success Codes**: `200 OK`
- **Error Codes**: `401 Unauthorized` (Invalid or expired refresh token)

#### Log out a user

- **Method**: `POST`
- **Path**: `/users/logout`
- **Description**: Invalidates the user's session. The refresh token cookie should be cleared by the server.
- **Response Body**:

  ```json
  {
    "message": "Successfully logged out"
  }
  ```

- **Success Codes**: `200 OK`
- **Error Codes**: `401 Unauthorized`

#### Get current user's profile

- **Method**: `GET`
- **Path**: `/users/me`
- **Description**: Retrieves the profile and favorite series of the currently authenticated user.
- **Authentication**: Required.
- **Response Body**:

  ```json
  {
    "id": "uuid-v7-string",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "createdAt": "iso-8601-date-string"
  }
  ```

- **Success Codes**: `200 OK`
- **Error Codes**: `401 Unauthorized`

#### Delete user account

- **Method**: `DELETE`
- **Path**: `/users/me`
- **Description**: Deletes the currently authenticated user's account and all associated data.
- **Authentication**: Required.
- **Success Codes**: `204 No Content`
- **Error Codes**: `401 Unauthorized`

#### Get favorite series

- **Method**: `GET`
- **Path**: `/series/favorites`
- **Description**: Retrieves the user's list of favorite series.
- **Authentication**: Required.
- **Query Parameters**:
  - `page` (integer, optional, default: 1): The page number for pagination.
  - `pageSize` (integer, optional, default: 20): The number of items per page.
- **Response Body**:

  ```json
  {
    "data": [
      {
        "seriesTmdbId": 1396,
      }
    ],
    "metadata": {
      "page": 1,
      "pageSize": 20,
      "total": 1
    }
  }
  ```

- **Success Codes**: `200 OK`
- **Error Codes**: `401 Unauthorized`

#### Add a favorite series

- **Method**: `POST`
- **Path**: `/series/favorites`
- **Description**: Adds a series to the user's list of favorites.
- **Authentication**: Required.
- **Request Body**:

  ```json
  {
    "seriesTmdbId": 1399
  }
  ```

- **Response Body**:

  ```json
  {
    "seriesTmdbId": 1399,
  }
  ```

- **Success Codes**: `201 Created`
- **Error Codes**: `400 Bad Request` (Invalid ID), `401 Unauthorized`, `409 Conflict` (Series already in favorites)

#### Remove a favorite series

- **Method**: `DELETE`
- **Path**: `/series/favorites/:seriesTmdbId`
- **Description**: Removes a series from the user's list of favorites.
- **Authentication**: Required.
- **URL Parameters**:
  - `seriesTmdbId` (integer): The TMDB ID of the series to remove.
- **Success Codes**: `204 No Content`
- **Error Codes**: `401 Unauthorized`, `404 Not Found` (Series not in favorites)

#### Get ignored series

- **Method**: `GET`
- **Path**: `/series/ignored`
- **Description**: Retrieves the user's list of ignored series.
- **Authentication**: Required.
- **Query Parameters**:
  - `page` (integer, optional, default: 1): The page number for pagination.
  - `pageSize` (integer, optional, default: 20): The number of items per page.
- **Response Body**:

  ```json
  {
    "data": [
      {
        "seriesTmdbId": 1402,
        "ignoredAt": "iso-8601-date-string"
      }
    ],
    "metadata": {
      "page": 1,
      "pageSize": 20,
      "total": 15
    }
  }
  ```

- **Success Codes**: `200 OK`
- **Error Codes**: `401 Unauthorized`

#### Add an ignored series

- **Method**: `POST`
- **Path**: `/series/ignored`
- **Description**: Adds a series to the user's list of ignored series.
- **Authentication**: Required.
- **Request Body**:

  ```json
  {
    "seriesTmdbId": 1402
  }
  ```

- **Response Body**:

  ```json
  {
    "seriesTmdbId": 1402,
    "ignoredAt": "iso-8601-date-string"
  }
  ```

- **Success Codes**: `201 Created`
- **Error Codes**: `400 Bad Request` (Invalid ID), `401 Unauthorized`, `409 Conflict` (Series already ignored)

#### Remove an ignored series

- **Method**: `DELETE`
- **Path**: `/series/ignored/:seriesTmdbId`
- **Description**: Removes a series from the user's list of ignored series.
- **Authentication**: Required.
- **URL Parameters**:
  - `seriesTmdbId` (integer): The TMDB ID of the series to remove.
- **Success Codes**: `204 No Content`
- **Error Codes**: `401 Unauthorized`, `404 Not Found` (Series not in ignored list)

---

### Series (TMDB Proxy)

#### Search for series

- **Method**: `GET`
- **Path**: `/series/search`
- **Description**: Searches for TV series by title by proxying the request to the TMDB API.
- **Authentication**: Required.
- **Query Parameters**:
  - `query` (string, required): The search term.
  - `page` (integer, optional, default: 1): The page number of results to fetch.
- **Response Body**:

  ```json
  {
    "data": [
      {
        "id": 1399,
        "name": "Game of Thrones",
        "posterPath": "/u3bZgnGQ9T01sWNhyveQz0wz0IL.jpg",
        "overview": "Seven noble families fight for control of the mythical land of Westeros...",
        "firstAirDate": "2011-04-17",
        "voteAverage": 8.4
      }
    ],
    "metadata": {
      "page": 1,
      "pageSize": 20,
      "total": 198
    }
  }
  ```

- **Success Codes**: `200 OK`
- **Error Codes**: `400 Bad Request` (Missing query), `401 Unauthorized`, `502 Bad Gateway` (TMDB API error)

#### Get series details by ID

- **Method**: `GET`
- **Path**: `/series/:seriesTmdbId`
- **Description**: Retrieves detailed information about a specific TV series from TMDB.
- **Authentication**: Required.
- **URL Parameters**:
  - `seriesTmdbId` (integer): The TMDB ID of the series.
- **Response Body**:

  ```json
  {
    "id": 1399,
    "name": "Game of Thrones",
    "posterPath": "/u3bZgnGQ9T01sWNhyveQz0wz0IL.jpg",
    "backdropPath": "/mUkuc2wyV9dHLG0D0Loaw5pO2s8.jpg",
    "overview": "Seven noble families fight for control of the mythical land of Westeros...",
    "firstAirDate": "2011-04-17",
    "genres": ["Sci-Fi & Fantasy", "Drama", "Action & Adventure"],
    "numberOfSeasons": 8,
    "numberOfEpisodes": 73,
    "status": "Ended",
    "voteAverage": 8.4
  }
  ```

- **Success Codes**: `200 OK`
- **Error Codes**: `401 Unauthorized`, `404 Not Found` (Series not found), `502 Bad Gateway` (TMDB API error)

#### Get series external IDs

- **Method**: `GET`
- **Path**: `/series/:seriesTmdbId/external-ids`
- **Description**: Retrieves external IDs (IMDb, TVDB, etc.) for a specific TV series from TMDB.
- **Authentication**: Required.
- **URL Parameters**:
  - `seriesTmdbId` (integer): The TMDB ID of the series.
- **Response Body**:

  ```json
  {
    "imdbId": "tt0944947",
    "tvdbId": 121361,
    "facebookId": "GameOfThrones",
    "instagramId": "gameofthrones",
    "twitterId": "GameOfThrones"
  }
  ```

- **Success Codes**: `200 OK`
- **Error Codes**: `401 Unauthorized`, `404 Not Found` (Series not found), `502 Bad Gateway` (TMDB API error)

---

### Watchrooms

#### Create a new watchroom

- **Method**: `POST`
- **Path**: `/watchrooms`
- **Description**: Creates a new watchroom, making the creator the owner.
- **Authentication**: Required.
- **Request Body**:

  ```json
  {
    "name": "Weekend Binge",
    "description": "Looking for a gripping mini-series for the weekend."
  }
  ```

- **Response Body**:

  ```json
  {
    "id": "uuid-v7-string",
    "name": "Weekend Binge",
    "description": "Looking for a gripping mini-series for the weekend.",
    "ownerId": "uuid-v7-of-creator",
    "publicLinkId": "unique-nanoid-string"
  }
  ```

- **Success Codes**: `201 Created`
- **Error Codes**: `400 Bad Request`, `401 Unauthorized`

#### Get a list of the user's watchrooms

- **Method**: `GET`
- **Path**: `/watchrooms`
- **Description**: Retrieves a list of all watchrooms the current user is a participant of.
- **Authentication**: Required.
- **Query Parameters**:
  - `page` (integer, optional, default: 1): The page number for pagination.
  - `limit` (integer, optional, default: 20): The number of items per page.
- **Response Body**:

  ```json
  {
    "data": [
      {
        "id": "uuid-v7-string",
        "name": "Weekend Binge",
        "ownerId": "uuid-v7-of-owner",
        "participantCount": 3
      }
    ],
    "metadata": {
      "page": 1,
      "pageSize": 20,
      "total": 5
    }
  }
  ```

- **Success Codes**: `200 OK`
- **Error Codes**: `401 Unauthorized`

#### Get watchroom details by Public Link ID

- **Method**: `GET`
- **Path**: `/watchrooms/by-link/:publicLinkId`
- **Description**: Retrieves public, non-sensitive information about a watchroom using its public invitation link. This allows a user to see what they are joining.
- **Authentication**: Not Required.
- **Response Body**:

  ```json
  {
    "name": "Weekend Binge",
    "description": "Looking for a gripping mini-series for the weekend.",
    "owner": {
        "name": "John Doe"
    },
    "participantCount": 3
  }
  ```

- **Success Codes**: `200 OK`
- **Error Codes**: `404 Not Found`

#### Join a watchroom

- **Method**: `POST`
- **Path**: `/watchrooms/by-link/:publicLinkId/participants`
- **Description**: Adds the currently authenticated user to the list of participants for a watchroom.
- **Authentication**: Required.
- **Success Codes**: `200 OK` (Already a member), `201 Created` (Successfully joined)
- **Error Codes**: `401 Unauthorized`, `404 Not Found` (Invalid link), `409 Conflict` (User is already a participant)

#### Get watchroom details

- **Method**: `GET`
- **Path**: `/watchrooms/:watchroomId`
- **Description**: Retrieves detailed information about a specific watchroom.
- **Authentication**: Required. User must be a participant.
- **Response Body**:

  ```json
  {
    "id": "uuid-v7-string",
    "name": "Weekend Binge",
    "description": "Looking for a gripping mini-series for the weekend.",
    "ownerId": "uuid-v7-of-owner",
    "publicLinkId": "unique-nanoid-string",
    "participants": [
      {
        "id": "uuid-v7-string",
        "name": "John Doe"
      },
      {
        "id": "uuid-v7-string",
        "name": "Jane Smith"
      }
    ],
    "recommendations": [
      {
        "id": "uuid-v7-string",
        "seriesTmdbId": 82856,
        "justification": "Because it's a thrilling mystery that will keep you all on the edge of your seats."
      }
    ]
  }
  ```

- **Success Codes**: `200 OK`
- **Error Codes**: `401 Unauthorized`, `403 Forbidden` (Not a participant), `404 Not Found`

#### Update a watchroom

- **Method**: `PATCH`
- **Path**: `/watchrooms/:watchroomId`
- **Description**: Updates the name or description of a watchroom.
- **Authentication**: Required. User must be the owner.
- **Request Body**:

  ```json
  {
    "name": "New Awesome Name",
    "description": "An updated description."
  }
  ```

- **Response Body**: The updated watchroom object.
- **Success Codes**: `200 OK`
- **Error Codes**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

#### Leave a watchroom

- **Method**: `DELETE`
- **Path**: `/watchrooms/:watchroomId/participants/me`
- **Description**: Removes the currently authenticated user from a watchroom.
- **Authentication**: Required. User must be a participant.
- **Success Codes**: `204 No Content`
- **Error Codes**: `401 Unauthorized`, `403 Forbidden` (Cannot leave if owner), `404 Not Found`

#### Remove a participant from a watchroom

- **Method**: `DELETE`
- **Path**: `/watchrooms/:watchroomId/participants/:userId`
- **Description**: Removes a participant from a watchroom.
- **Authentication**: Required. User must be the owner.
- **Success Codes**: `204 No Content`
- **Error Codes**: `401 Unauthorized`, `403 Forbidden` (Not the owner), `404 Not Found`

---

### Recommendations

#### Generate recommendations

- **Method**: `POST`
- **Path**: `/watchrooms/:watchroomId/recommendations`
- **Description**: Triggers the AI to generate new recommendations for the watchroom based on the participants' favorite series and excluding ignored series. This action can only be performed by the watchroom owner.
- **Authentication**: Required. User must be the owner.
- **Request Body**: (Empty)
- **Response Body**:

  ```json
  {
    "message": "Recommendation generation started. Results will be available shortly."
  }
  ```

- **Success Codes**: `202 Accepted`
- **Error Codes**: `401 Unauthorized`, `403 Forbidden` (Not the owner), `404 Not Found`, `409 Conflict` (Generation already in progress)

#### Ignore a recommendation

- **Method**: `POST`
- **Path**: `/watchrooms/:watchroomId/recommendations/:seriesTmdbId/ignore`
- **Description**: Marks a series as ignored for the current user. The series will be added to the user's personal list of ignored series and will not appear in future recommendations.
- **Authentication**: Required. User must be a participant.
- **URL Parameters**:
  - `seriesTmdbId` (integer): The TMDB ID of the series to ignore.
- **Response Body**:

  ```json
  {
    "message": "Series added to your ignored list."
  }
  ```

- **Success Codes**: `201 Created`
- **Error Codes**: `401 Unauthorized`, `403 Forbidden` (Not a participant), `404 Not Found`, `409 Conflict` (Series already ignored)

## Implementation plan

1. User Module
This module handles everything related to user accounts and authentication.
Endpoints:
POST /users/register
POST /users/login
POST /users/refresh
POST /users/logout
GET /users/me
DELETE /users/me

2. Series Module
This module handles all operations related to series including favorites, ignored series, and acts as a proxy to the external TMDB API.
Endpoints:
GET /series/search
GET /series/:seriesTmdbId
GET /series/:seriesTmdbId/external-ids
GET /series/favorites
POST /series/favorites
DELETE /series/favorites/:seriesTmdbId
GET /series/ignored
POST /series/ignored
DELETE /series/ignored/:seriesTmdbId

3. Watchroom Module
This module would be responsible for all operations related to watchrooms, including creation, management, and participant actions.
Endpoints:
POST /watchrooms
GET /watchrooms
GET /watchrooms/by-link/:publicLinkId
POST /watchrooms/by-link/:publicLinkId/participants
GET /watchrooms/:watchroomId
PATCH /watchrooms/:watchroomId
DELETE /watchrooms/:watchroomId/participants/me
DELETE /watchrooms/:watchroomId/participants/:userId
POST /watchrooms/:watchroomId/recommendations
POST /watchrooms/:watchroomId/recommendations/:seriesTmdbId/ignore
GET /watchrooms/:watchroomId/recommendations
