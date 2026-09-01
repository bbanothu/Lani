-- A product page the extension has already captured must never be scraped
-- into a second row. The extension dedupes locally (lani_seen_product_urls),
-- but that state is per-browser -- a reinstall or a second device would lose
-- it and re-insert. This makes "one row per (user, url)" a database
-- guarantee; revisiting an already-captured page only reorders its
-- dashboard card (see bumpProduct in the extension background worker).

-- Collapse any duplicates that already exist, keeping the most recently
-- added row for each (user_id, url). list_products / cart_items rows that
-- point at a dropped duplicate cascade away with it.
delete from products p
using products newer
where p.user_id = newer.user_id
  and p.url = newer.url
  and p.id <> newer.id
  and (p.added_at, p.id) < (newer.added_at, newer.id);

create unique index if not exists products_user_url_unique on products (user_id, url);
