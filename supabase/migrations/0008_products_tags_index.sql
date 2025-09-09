-- GIN index on products.tags for fast collection filters
create index if not exists products_tags_gin_idx on public.products using GIN (tags);

