ALTER TABLE "advert" ADD COLUMN "creator_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "advert" ADD CONSTRAINT "advert_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;