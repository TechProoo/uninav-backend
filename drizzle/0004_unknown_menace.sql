ALTER TABLE "moderator" ADD COLUMN "department_id" uuid;--> statement-breakpoint
ALTER TABLE "moderator" ADD CONSTRAINT "moderator_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE set null ON UPDATE no action;