ALTER TABLE "emails" ADD COLUMN "language" varchar(2) DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "language" varchar(2) DEFAULT 'en' NOT NULL;