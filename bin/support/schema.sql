CREATE TABLE users (
    id bigserial PRIMARY KEY,
    name text NOT NULL,
    inserted_at timestamp(0) without time zone  NOT NULL DEFAULT CURRENT_TIMESTAMP(0)
);

CREATE TABLE channels (
    id bigserial PRIMARY KEY,
    inserted_at timestamp(0) without time zone  NOT NULL DEFAULT CURRENT_TIMESTAMP(0)
);

CREATE TABLE users_channels (
    channel_id bigint REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
    user_id bigint REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    last_viewed_index bigint NOT NULL DEFAULT 0,
    inserted_at timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP(0)
);

CREATE UNIQUE INDEX users_channels_user_channel_unique_idx ON users_channels(channel_id, user_id);

CREATE TABLE messages (
    id bigserial PRIMARY KEY,
    content text NOT NULL,
    user_id bigint references users(id) ON DELETE CASCADE NOT NULL,
    channel_id bigint references channels(id) ON DELETE CASCADE NOT NULL ,
    index bigint NOT NULL,
    inserted_at timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP(0)
);
