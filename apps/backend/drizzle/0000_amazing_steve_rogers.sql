CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"watchroom_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"series_tmdb_id" integer NOT NULL,
	"justification" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_favorite_series" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"series_tmdb_id" integer NOT NULL,
	"preference_level" varchar(16) DEFAULT 'like' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_ignored_series" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"series_tmdb_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"current_refresh_hash" text NOT NULL,
	"prev_refresh_hash" text,
	"prev_usable_until" timestamp,
	"last_rotated_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_current_refresh_hash_unique" UNIQUE("current_refresh_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "watchroom_participants" (
	"id" uuid PRIMARY KEY NOT NULL,
	"watchroom_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchrooms" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL,
	"description" varchar(256),
	"owner_id" uuid NOT NULL,
	"public_link_id" varchar(21) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "watchrooms_public_link_id_unique" UNIQUE("public_link_id")
);
--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_watchroom_id_watchrooms_id_fk" FOREIGN KEY ("watchroom_id") REFERENCES "public"."watchrooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorite_series" ADD CONSTRAINT "user_favorite_series_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ignored_series" ADD CONSTRAINT "user_ignored_series_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchroom_participants" ADD CONSTRAINT "watchroom_participants_watchroom_id_watchrooms_id_fk" FOREIGN KEY ("watchroom_id") REFERENCES "public"."watchrooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchroom_participants" ADD CONSTRAINT "watchroom_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchrooms" ADD CONSTRAINT "watchrooms_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_recommendations_watchroom_id" ON "recommendations" USING btree ("watchroom_id");--> statement-breakpoint
CREATE INDEX "idx_recommendations_series_tmdb_id" ON "recommendations" USING btree ("series_tmdb_id");--> statement-breakpoint
CREATE INDEX "idx_recommendations_request_id" ON "recommendations" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "idx_user_favorite_series_user_id" ON "user_favorite_series" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_favorite_series_user_series_tmdb_id" ON "user_favorite_series" USING btree ("user_id","series_tmdb_id");--> statement-breakpoint
CREATE INDEX "idx_user_favorite_series_preference_level" ON "user_favorite_series" USING btree ("user_id","preference_level");--> statement-breakpoint
CREATE INDEX "idx_user_ignored_series_user_id" ON "user_ignored_series" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_ignored_series_user_series_tmdb_id" ON "user_ignored_series" USING btree ("user_id","series_tmdb_id");--> statement-breakpoint
CREATE INDEX "idx_user_sessions_user_id" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_watchroom_participants_watchroom_id" ON "watchroom_participants" USING btree ("watchroom_id");--> statement-breakpoint
CREATE INDEX "idx_watchroom_participants_user_id" ON "watchroom_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_watchroom_participants_watchroom_user" ON "watchroom_participants" USING btree ("watchroom_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_watchrooms_owner_id" ON "watchrooms" USING btree ("owner_id");