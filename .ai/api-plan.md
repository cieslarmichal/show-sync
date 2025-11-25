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
- **Path**: `/users/refresh-token`
- **Description**: Issues a new access token using a valid refresh token (sent via secure, HTTP-only cookie). Implements token rotation for enhanced security.
- **Response Body**:

  ```json
  {
    "accessToken": "new-jwt-access-token"
  }
  ```

- **Success Codes**: `200 OK`
- **Error Codes**: `401 Unauthorized` (Invalid or expired refresh token)

#### Change password

- **Method**: `PATCH`
- **Path**: `/users/me/password`
- **Description**: Changes the password for the currently authenticated user.
- **Authentication**: Required.
- **Request Body**:

  ```json
  {
    "currentPassword": "old-password",
    "newPassword": "new-strong-password"
  }
  ```

- **Response Body**:

  ```json
  {
    "message": "Password changed successfully"
  }
  ```

- **Success Codes**: `200 OK`
- **Error Codes**: `400 Bad Request` (Invalid input), `401 Unauthorized`, `403 Forbidden` (Current password incorrect)

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
- **Description**: Retrieves the profile of the currently authenticated user.
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

#### Get rated series

- **Method**: `GET`
- **Path**: `/series/ratings`
- **Description**: Retrieves the user's list of rated series.
- **Authentication**: Required.
- **Query Parameters**:
  - `page` (integer, optional, default: 1): The page number for pagination.
  - `pageSize` (integer, optional, default: 20): The number of items per page.
  - `rating` (string, optional): Filter by rating level ("dislike", "like", or "love").
- **Response Body**:

  ```json
  {
    "data": [
      {
        "seriesTmdbId": 1396,
        "rating": "love"
      }
    ],
    "metadata": {
      "total": 1
    }
  }
  ```

- **Success Codes**: `200 OK`
- **Error Codes**: `401 Unauthorized`

#### Add a series rating

- **Method**: `POST`
- **Path**: `/series/ratings`
- **Description**: Adds a series to the user's list of rated series with a rating (dislike/like/love).
- **Authentication**: Required.
- **Request Body**:

  ```json
  {
    "seriesTmdbId": 1399,
    "rating": "love"
  }
  ```

- **Response Body**:

  ```json
  {
    "seriesTmdbId": 1399,
    "rating": "love"
  }
  ```

- **Success Codes**: `201 Created`
- **Error Codes**: `400 Bad Request` (Invalid ID or rating), `401 Unauthorized`, `409 Conflict` (Series already rated)

#### Remove a series rating

- **Method**: `DELETE`
- **Path**: `/series/ratings/:seriesTmdbId`
- **Description**: Removes a series from the user's list of rated series.
- **Authentication**: Required.
- **URL Parameters**:
  - `seriesTmdbId` (integer): The TMDB ID of the series to remove.
- **Success Codes**: `204 No Content`
- **Error Codes**: `401 Unauthorized`, `404 Not Found` (Series not rated)

#### Update series rating

- **Method**: `PATCH`
- **Path**: `/series/ratings/:seriesTmdbId`
- **Description**: Updates the rating (dislike/like/love) for a series in the user's rated series.
- **Authentication**: Required.
- **URL Parameters**:
  - `seriesTmdbId` (integer): The TMDB ID of the series to update.
- **Request Body**:

  ```json
  {
    "rating": "love"
  }
  ```

- **Response Body**:

  ```json
  {
    "seriesTmdbId": 1399,
    "rating": "love"
  }
  ```

- **Success Codes**: `200 OK`
- **Error Codes**: `400 Bad Request` (Invalid rating), `401 Unauthorized`, `404 Not Found` (Series not rated)

#### Get watchlist series

- **Method**: `GET`
- **Path**: `/series/watchlist`
- **Description**: Retrieves the user's watchlist of series with type information.
- **Authentication**: Required.
- **Query Parameters**:
  - `page` (integer, optional, default: 1): The page number for pagination.
  - `pageSize` (integer, optional, default: 20): The number of items per page.
  - `type` (string, optional): Filter by watchlist type ("notInterested" or "wantToWatch").
- **Response Body**:

  ```json
  {
    "data": [
      {
        "seriesTmdbId": 1402,
        "type": "notInterested",
        "createdAt": "iso-8601-date-string"
      }
    ],
    "metadata": {
      "total": 15
    }
  }
  ```

- **Success Codes**: `200 OK`
- **Error Codes**: `401 Unauthorized`

#### Add a series to watchlist

- **Method**: `POST`
- **Path**: `/series/watchlist`
- **Description**: Adds a series to the user's watchlist with a type (notInterested/wantToWatch).
- **Authentication**: Required.
- **Request Body**:

  ```json
  {
    "seriesTmdbId": 1402,
    "type": "notInterested"
  }
  ```

- **Response Body**:

  ```json
  {
    "seriesTmdbId": 1402,
    "type": "notInterested",
    "createdAt": "iso-8601-date-string"
  }
  ```

- **Success Codes**: `201 Created`
- **Error Codes**: `400 Bad Request` (Invalid ID or type), `401 Unauthorized`, `409 Conflict` (Series already in watchlist)

#### Remove a series from watchlist

- **Method**: `DELETE`
- **Path**: `/series/watchlist/:seriesTmdbId`
- **Description**: Removes a series from the user's watchlist.
- **Authentication**: Required.
- **URL Parameters**:
  - `seriesTmdbId` (integer): The TMDB ID of the series to remove.
- **Success Codes**: `204 No Content`
- **Error Codes**: `401 Unauthorized`, `404 Not Found` (Series not in watchlist)

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

#### Get series batch details

- **Method**: `GET`
- **Path**: `/series/batch/details`
- **Description**: Retrieves detailed information about multiple TV series from TMDB in a single request.
- **Authentication**: Required.
- **Query Parameters**:
  - `ids` (string, required): Comma-separated list of TMDB IDs (e.g., "1399,1402,456").
- **Response Body**:

  ```json
  {
    "data": [
      {
        "id": 1399,
        "name": "Game of Thrones",
        "posterPath": "/u3bZgnGQ9T01sWNhyveQz0wz0IL.jpg",
        "overview": "Seven noble families fight...",
        "firstAirDate": "2011-04-17",
        "genres": ["Sci-Fi & Fantasy", "Drama"],
        "voteAverage": 8.4
      },
      {
        "id": 1402,
        "name": "The Walking Dead",
        "posterPath": "/xf9wuDcqlUPWABZNeDKPbZUjWx0.jpg",
        "overview": "Sheriff Deputy Rick Grimes...",
        "firstAirDate": "2010-10-31",
        "genres": ["Action & Adventure", "Drama"],
        "voteAverage": 8.1
      }
    ]
  }
  ```

- **Success Codes**: `200 OK`
- **Error Codes**: `400 Bad Request` (Invalid IDs), `401 Unauthorized`, `502 Bad Gateway` (TMDB API error)

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

#### Delete a watchroom

- **Method**: `DELETE`
- **Path**: `/watchrooms/:watchroomId`
- **Description**: Deletes a watchroom. Only the owner can delete their watchroom.
- **Authentication**: Required. User must be the owner.
- **URL Parameters**:
  - `watchroomId` (string): The UUID of the watchroom to delete.
- **Success Codes**: `204 No Content`
- **Error Codes**: `401 Unauthorized`, `403 Forbidden` (Not the owner), `404 Not Found`

#### Leave a watchroom

- **Method**: `POST`
- **Path**: `/watchrooms/:watchroomId/leave`
- **Description**: Allows the currently authenticated user to leave a watchroom they are participating in.
- **Authentication**: Required. User must be a participant.
- **URL Parameters**:
  - `watchroomId` (string): The UUID of the watchroom to leave.
- **Success Codes**: `204 No Content`
- **Error Codes**: `401 Unauthorized`, `403 Forbidden` (Not a participant or is the owner), `404 Not Found`

#### Remove a participant from a watchroom

- **Method**: `DELETE`
- **Path**: `/watchrooms/:watchroomId/participants/:participantId`
- **Description**: Removes a participant from a watchroom.
- **Authentication**: Required. User must be the owner.
- **URL Parameters**:
  - `watchroomId` (string): The UUID of the watchroom.
  - `participantId` (string): The UUID of the participant to remove.
- **Success Codes**: `204 No Content`
- **Error Codes**: `401 Unauthorized`, `403 Forbidden` (Not the owner), `404 Not Found`

---

### Recommendations

#### Generate recommendations

- **Method**: `POST`
- **Path**: `/watchrooms/:watchroomId/recommendations/generate`
- **Description**: Triggers the AI to generate new recommendations for the watchroom based on the participants' rated series (prioritizing "love" ratings) and excluding series in watchlist. This action creates a new recommendation request and starts an asynchronous generation process. Can only be performed by the watchroom owner.
- **Authentication**: Required. User must be the owner.
- **URL Parameters**:
  - `watchroomId` (string): The UUID of the watchroom.
- **Request Body**: (Empty)
- **Response Body**:

  ```json
  {
    "recommendationRequestId": "uuid-v7-string"
  }
  ```

- **Success Codes**: `202 Accepted`
- **Error Codes**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden` (Not the owner), `404 Not Found`

#### Check recommendation request status

- **Method**: `GET`
- **Path**: `/watchrooms/:watchroomId/recommendations/status/:recommendationRequestId`
- **Description**: Checks the status of a recommendation generation request. Returns 'pending', 'completed', or 'failed'.
- **Authentication**: Required. User must be a participant.
- **URL Parameters**:
  - `watchroomId` (string): The UUID of the watchroom.
  - `recommendationRequestId` (string): The UUID of the recommendation request.
- **Response Body**:

  ```json
  {
    "status": "completed"
  }
  ```

- **Success Codes**: `200 OK`
- **Error Codes**: `401 Unauthorized`, `403 Forbidden` (Not a participant), `404 Not Found`

#### Get recommendations

- **Method**: `GET`
- **Path**: `/watchrooms/:watchroomId/recommendations`
- **Description**: Retrieves the recommendations for the latest completed recommendation request in the watchroom.
- **Authentication**: Required. User must be a participant.
- **URL Parameters**:
  - `watchroomId` (string): The UUID of the watchroom.
- **Response Body**:

  ```json
  [
    {
      "id": "uuid-v7-string",
      "seriesTmdbId": 1399,
      "justification": "Based on your group's love for complex political dramas and fantasy elements, Game of Thrones offers..."
    },
    {
      "id": "uuid-v7-string",
      "seriesTmdbId": 1402,
      "justification": "For fans of intense survival scenarios and character-driven narratives..."
    }
  ]
  ```

- **Success Codes**: `200 OK`
- **Error Codes**: `401 Unauthorized`, `403 Forbidden` (Not a participant), `404 Not Found`

#### Submit recommendation feedback

- **Method**: `POST`
- **Path**: `/watchrooms/:watchroomId/recommendations/feedback`
- **Description**: Allows a participant to submit feedback on a recommendation request, including a rating (1-5), whether they found something to watch, and an optional comment. Each user can only submit one feedback per recommendation request.
- **Authentication**: Required. User must be a participant.
- **URL Parameters**:
  - `watchroomId` (string): The UUID of the watchroom.
- **Request Body**:

  ```json
  {
    "recommendationRequestId": "uuid-v7-string",
    "rating": 4,
    "foundSomething": true,
    "comment": "Great recommendations! We decided to watch the first one."
  }
  ```

- **Response Body**:

  ```json
  {
    "id": "uuid-v7-string",
    "recommendationRequestId": "uuid-v7-string",
    "rating": 4,
    "foundSomething": true,
    "createdAt": "iso-8601-date-string"
  }
  ```

- **Success Codes**: `201 Created`
- **Error Codes**: `400 Bad Request` (Invalid input), `401 Unauthorized`, `403 Forbidden` (Not a participant), `404 Not Found`, `409 Conflict` (Feedback already submitted)

## Implementation plan

1. User Module
This module handles everything related to user accounts and authentication.
Endpoints:
POST /users/register
POST /users/login
POST /users/refresh-token
POST /users/logout
GET /users/me
DELETE /users/me
PATCH /users/me/password

2. Series Module
This module handles all operations related to series including ratings, watchlist, and acts as a proxy to the external TMDB API.
Endpoints:
GET /series/search
GET /series/:seriesTmdbId
GET /series/:seriesTmdbId/external-ids
GET /series/batch/details
GET /series/ratings
POST /series/ratings
DELETE /series/ratings/:seriesTmdbId
PATCH /series/ratings/:seriesTmdbId
GET /series/watchlist
POST /series/watchlist
DELETE /series/watchlist/:seriesTmdbId

3. Watchroom Module
This module would be responsible for all operations related to watchrooms, including creation, management, and participant actions.
Endpoints:
POST /watchrooms
GET /watchrooms
GET /watchrooms/by-link/:publicLinkId
POST /watchrooms/by-link/:publicLinkId/participants
GET /watchrooms/:watchroomId
PATCH /watchrooms/:watchroomId
DELETE /watchrooms/:watchroomId
DELETE /watchrooms/:watchroomId/participants/:participantId
POST /watchrooms/:watchroomId/leave

4. Recommendation Module
This module handles the asynchronous generation of AI-powered recommendations, status checking, and feedback collection.
Endpoints:
POST /watchrooms/:watchroomId/recommendations/generate
GET /watchrooms/:watchroomId/recommendations/status/:recommendationRequestId
GET /watchrooms/:watchroomId/recommendations
POST /watchrooms/:watchroomId/recommendations/feedback
