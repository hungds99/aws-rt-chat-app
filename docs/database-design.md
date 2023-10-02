### Access patterns

- Single DynamoDB table design
  - PK: `PK`
  - SK: `SK`
  - GSI1PK: `GSI1PK`
  - GSI1SK: `GSI1SK`
  - Attributes: `attr1`, `attr2`, `attr3`

#### User

- Table Partition Info:

  - Entity: `user`
  - Attributes: `userId`, `email`, `username`, `password`, `createdAt`, `updatedAt`

- Access Patterns
  - Get user info by userId
    - Type: `Table`
    - Condition: `PK = USER#userId and SK = INFO`
    - Example: `PK = USER#123 and SK = INFO`
  - Get user info by email
    - Type: `Table`
    - Condition: `PK = USER#email and SK = EMAIL`
    - Example: `pk = USER#example@gmail.com and SK = EMAIL`
  - Get users
    - Type: `GSI1`
    - Condition: `GSI1PK = USERS and GSI1SK = CREATED_AT#DESC`
    - Example: `GSI1PK = USERS and GSI1SK begins_with CREATED_AT#`

### Room

- Table Partition Info:
  - Entity: `room`
  - Attributes: `roomId`, `title`, `ownerId`, `members`, `imageUrl`, `createdAt`, `updatedAt`
- Access Patterns

  - Get room info by roomId
    - Type: `Table`
    - Condition: `PK = ROOM#roomId and SK = INFO`
    - Example: `PK = ROOM#123 and SK = INFO`
  - Get list of users in room by roomId
    - Type: `Table`
    - Condition: `PK = ROOM#roomId and SK begins_with USER#`
    - Example: `PK = ROOM#123 and SK begins_with USER#`
  - Get rooms by userId and sort by last message timestamp
    - Type: `GSI1`
    - Condition: `GSI1PK = USER#userId and GSI1SK begins_with LAST_MESSAGE#`
    - Example: `GSI1PK = USER#123 and GSI1SK begins_with LAST_MESSAGE#123#hello`

- Table Design
  - PK: `roomId`
  - SK: `room`
  - GSI1PK: `userId`
  - GSI1SK: `room`
  - Attributes: `roomId`, `roomName`, `ownerId`, `members`, `createdAt`, `updatedAt`

### Message

- Create new message
- Get messages by roomId and sort by timestamp
