CREATE INDEX "documents_title_trgm_idx" ON "documents" USING GIN ("title" gin_trgm_ops);
CREATE INDEX "documents_owner_id_idx" ON "documents"("owner_id");
