alter table integrations drop constraint if exists integrations_provider_check;
alter table integrations add constraint integrations_provider_check
  check (provider in ('ebay', 'etsy'));
