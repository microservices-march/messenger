export const BASE_USERS = [
  {
    name: "Ramecankt Snickledog",
  },
  {
    name: "Troubleduck Biggensplain",
  },
  {
    name: "Floamcake Corkwaddler",
  },
];

export const createUser = async (query, name) => {
  const {
    rows: [result],
  } = await query("INSERT INTO users(name) VALUES($1) RETURNING id, name", [
    name,
  ]);

  return result;
};

export const createConversation = async (query, user_id_one, user_id_two) => {
  const {
    rows: [conversation],
  } = await query(
    "INSERT INTO channels DEFAULT VALUES RETURNING id, inserted_at",
    []
  );

  for (let userId of [user_id_one, user_id_two]) {
    await query(
      "INSERT INTO users_channels(channel_id, user_id) VALUES ($1, $2)",
      [conversation.id, userId]
    );
  }
  return conversation;
};

export const createMessageInConversation = async (
  query,
  conversationId,
  userId,
  content
) => {
  // Don't worry about any locking here since we are just doing this in test
  const { rows } = await query(
    "SELECT MAX(index) as current_index FROM messages WHERE channel_id = $1",
    [conversationId]
  );
  let nextIndex = 1;
  if (rows[0].current_index !== null) {
    nextIndex = parseInt(rows[0].current_index) + 1;
  }

  const {
    rows: [{ id: messageId, inserted_at: insertedAt, index }],
  } = await query(
    "INSERT INTO messages(content, user_id, channel_id, index) VALUES($1, $2, $3, $4) RETURNING id, inserted_at, index",
    [content, userId, conversationId, nextIndex]
  );

  return {
    content,
    id: messageId,
    inserted_at: insertedAt,
    index,
  };
};
