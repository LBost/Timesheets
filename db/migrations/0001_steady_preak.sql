CREATE TABLE "invoice_line_items" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "invoice_line_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"invoice_id" bigint NOT NULL,
	"time_entry_id" bigint NOT NULL,
	"project_id" bigint NOT NULL,
	"order_id" bigint,
	"description" text,
	"work_date" date NOT NULL,
	"hours" integer NOT NULL,
	"unit_rate" integer NOT NULL,
	"line_net" integer NOT NULL,
	"tax_rate_id" bigint NOT NULL,
	"tax_code_snapshot" text NOT NULL,
	"tax_label_snapshot" text NOT NULL,
	"tax_percentage_snapshot" integer NOT NULL,
	"tax_amount" integer NOT NULL,
	"line_gross" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "invoices_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"client_id" bigint NOT NULL,
	"invoice_number" text NOT NULL,
	"status" text DEFAULT 'concept' NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"issue_date" date NOT NULL,
	"subtotal_net" integer NOT NULL,
	"total_tax" integer NOT NULL,
	"total_gross" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"opened_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"credited_at" timestamp with time zone,
	CONSTRAINT "invoices_status_check" CHECK ("invoices"."status" in ('concept', 'proforma', 'open', 'paid', 'credited'))
);
--> statement-breakpoint
CREATE TABLE "tax_rates" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tax_rates_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"percentage" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tax_rates_percentage_check" CHECK ("tax_rates"."percentage" >= 0 and "tax_rates"."percentage" <= 10000)
);
--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "locked_by_invoice_id" bigint;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "locked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_time_entry_id_time_entries_id_fk" FOREIGN KEY ("time_entry_id") REFERENCES "public"."time_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_tax_rate_id_tax_rates_id_fk" FOREIGN KEY ("tax_rate_id") REFERENCES "public"."tax_rates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_user_invoice_number_unique" ON "invoices" USING btree ("user_id","invoice_number");--> statement-breakpoint
CREATE UNIQUE INDEX "tax_rates_user_code_unique" ON "tax_rates" USING btree ("user_id","code");