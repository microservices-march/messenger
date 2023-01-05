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
