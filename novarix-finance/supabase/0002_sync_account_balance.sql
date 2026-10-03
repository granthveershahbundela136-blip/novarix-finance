-- OPTIONAL. Keeps accounts.balance in step with transactions (income adds, expense subtracts).
-- Without it, balance stays at the opening balance entered when the account was created.
-- Runs as the invoking user, so row-level security still limits it to that user's own accounts.
create or replace function public.apply_transaction_to_balance()
returns trigger
language plpgsql
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update public.accounts
       set balance = balance - case when old.type = 'income' then old.amount else -old.amount end
     where id = old.account_id;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    update public.accounts
       set balance = balance + case when new.type = 'income' then new.amount else -new.amount end
     where id = new.account_id;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger transactions_sync_balance
after insert or update or delete on public.transactions
for each row execute function public.apply_transaction_to_balance();
