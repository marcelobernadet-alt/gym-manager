-- Atomic order creation: validates stock, inserts the order + line items,
-- and decrements stock in a single transaction so concurrent checkouts can't
-- oversell a product.
create or replace function create_order(
  p_items jsonb, -- [{"product_id": "...", "quantity": 2}, ...]
  p_client_id uuid,
  p_payment_method text,
  p_source text,
  p_notes text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_total numeric(10, 2) := 0;
  v_item jsonb;
  v_product products;
  v_qty int;
  v_created_by uuid := current_profile_id();
begin
  if v_created_by is null then
    raise exception 'not authenticated';
  end if;

  -- Only the client themself, or the owner (in-person / assigned sale), may place this order.
  if p_client_id is not null and p_client_id <> v_created_by and not is_owner(v_created_by) then
    raise exception 'not allowed';
  end if;

  insert into orders (client_id, created_by, total, status, payment_method, source, notes)
  values (p_client_id, v_created_by, 0, 'paid', p_payment_method, p_source, p_notes)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item ->> 'quantity')::int;
    if v_qty is null or v_qty <= 0 then
      raise exception 'invalid quantity';
    end if;

    select * into v_product from products where id = (v_item ->> 'product_id')::uuid for update;
    if v_product.id is null then
      raise exception 'product not found';
    end if;
    if v_product.stock < v_qty then
      raise exception 'insufficient stock for %', v_product.name;
    end if;

    update products set stock = stock - v_qty where id = v_product.id;

    insert into order_items (order_id, product_id, quantity, unit_price)
    values (v_order_id, v_product.id, v_qty, v_product.price);

    v_total := v_total + (v_product.price * v_qty);
  end loop;

  update orders set total = v_total where id = v_order_id;

  return v_order_id;
end;
$$;

grant execute on function create_order(jsonb, uuid, text, text, text) to authenticated;
