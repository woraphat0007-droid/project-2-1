create table public.products (
  id text primary key,
  name text not null,
  price numeric(10, 2) not null check (price >= 0),
  emoji text not null default '🍕',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  recipient_name text not null,
  phone text not null,
  address_line text not null,
  subdistrict text not null,
  district text not null,
  province text not null,
  postal_code text not null,
  created_at timestamptz not null default now()
);

create index addresses_user_id_idx on public.addresses (user_id);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  user_id uuid references auth.users (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'completed', 'cancelled')),
  fulfillment text not null check (fulfillment in ('pickup', 'delivery')),
  customer_name text not null,
  customer_phone text not null,
  address_id uuid references public.addresses (id) on delete set null,
  address_snapshot jsonb,
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  delivery_fee numeric(10, 2) not null check (delivery_fee >= 0),
  total numeric(10, 2) not null check (total = subtotal + delivery_fee),
  currency text not null default 'THB' check (currency = 'THB'),
  created_at timestamptz not null default now(),
  check (
    (fulfillment = 'delivery' and address_snapshot is not null)
    or (fulfillment = 'pickup' and address_snapshot is null)
  )
);

create index orders_user_id_created_at_idx on public.orders (user_id, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id text not null references public.products (id),
  product_name text not null,
  quantity integer not null check (quantity between 1 and 99),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  line_total numeric(10, 2) not null check (line_total = unit_price * quantity)
);

create index order_items_order_id_idx on public.order_items (order_id);

insert into public.products (id, name, price, emoji) values
  ('hero-party-cheese', 'ปาร์ตี้ พิซซ่าชีสเยิ้ม', 299, '🍕🧀'),
  ('hero-pepperoni-bogo', 'เปปเปอโรนี 1 แถม 1', 229, '🍕🌶️'),
  ('hero-seafood-pizza', 'พิซซ่าซีฟู้ด', 159, '🍕🦐'),
  ('hero-pair-set', 'ชุดคู่ 349', 349, '🍕🍗🥤'),
  ('reward-app-deal-four', 'ดีลแอป 4 ชิ้น', 119, '🍕'),
  ('deal-box-signature', 'พิซซ่าชีสเยิ้ม เดอะบอกซ์ ซิกเนเจอร์', 159, '🍕🥤'),
  ('small-pizza-drink', 'พิซซ่าถาดเล็ก + น้ำ', 89, '🍕'),
  ('pizza-size-s', 'พิซซ่าไซส์ S ราคาพิเศษ', 59, '🍕'),
  ('seafood-cheese-share', 'ซีฟู้ดแชร์ ทีมชีส', 99, '🦐'),
  ('chicken-pop-share', 'ไก่ป๊อปแชร์ ทีมกรอบ', 99, '🍗'),
  ('egg-tart-six-plus-two', 'ทาร์ตไข่ 6 ชิ้น ฟรี 2 ชิ้น', 175, '🥧'),
  ('egg-tart-three-plus-one', 'ทาร์ตไข่ 3 ชิ้น ฟรี 1 ชิ้น', 94, '🥧'),
  ('chef-special-sauce', 'ซอสพิเศษสูตรเชฟ', 15, '🍅'),
  ('party-box-four', 'ปาร์ตี้ บ็อกซ์ 4 คน', 449, '🍕🍗🥤'),
  ('juzai-box', 'จุใจ บ็อกซ์', 349, '🍕🍟'),
  ('all-in-one-box', 'ออลอินวัน บ็อกซ์', 299, '🍕🍗'),
  ('crispy-box', 'คริสปี้ บ็อกซ์', 199, '🍗'),
  ('value-set-two', 'ชุดอิ่มคุ้ม 2', 159, '🍕🥤'),
  ('margherita', 'มาร์การิตา', 189, '🍕'),
  ('pepperoni-cheese', 'เปปเปอโรนี ชีสเยิ้ม', 229, '🍕🌶️'),
  ('hawaiian', 'ฮาวายเอี้ยน', 219, '🍍'),
  ('seafood-super', 'ซีฟู้ดซุปเปอร์', 259, '🦐'),
  ('truffle-mushroom', 'เห็ดทรัฟเฟิล', 279, '🍄'),
  ('double-cheese-four', 'ดับเบิลชีส 4 อย่าง', 249, '🧀'),
  ('sharing-set-two', 'ชุดแชร์ 2 คน', 349, '🍕🥤'),
  ('family-set-four', 'ชุดครอบครัว 4 คน', 599, '🍕🍗'),
  ('party-set-six', 'ชุดปาร์ตี้ 6 คน', 899, '🍕🍕🍗'),
  ('fried-chicken-wings-six', 'ปีกไก่ทอด 6 ชิ้น', 119, '🍗'),
  ('french-fries', 'เฟรนช์ฟรายส์', 49, '🍟'),
  ('fresh-salad', 'สลัดผักสด', 69, '🥗'),
  ('garlic-bread', 'ขนมปังกระเทียม', 59, '🥖'),
  ('soft-drink', 'น้ำอัดลม', 25, '🥤'),
  ('thai-iced-tea', 'ชาเย็น', 35, '🧋'),
  ('drinking-water', 'น้ำเปล่า', 15, '💧'),
  ('egg-tart', 'ทาร์ตไข่', 35, '🥧'),
  ('vanilla-ice-cream', 'ไอศกรีมวานิลลา', 45, '🍨'),
  ('chocolate-cake', 'เค้กช็อกโกแลต', 79, '🍰')
on conflict (id) do update
set name = excluded.name,
    price = excluded.price,
    emoji = excluded.emoji,
    active = true;

alter table public.products enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

grant select on public.products to anon, authenticated;
grant select, insert, update, delete on public.addresses to authenticated;
grant select on public.orders, public.order_items to authenticated;

create policy "Active products are readable"
  on public.products for select
  to anon, authenticated
  using (active);

create policy "Users can read their own addresses"
  on public.addresses for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can add their own addresses"
  on public.addresses for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own addresses"
  on public.addresses for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own addresses"
  on public.addresses for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can read their own orders"
  on public.orders for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can read items from their own orders"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

create or replace function public.place_order(
  p_request_id uuid,
  p_user_id uuid,
  p_fulfillment text,
  p_customer_name text,
  p_customer_phone text,
  p_address_id uuid,
  p_new_address jsonb,
  p_save_address boolean,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item jsonb;
  v_product public.products%rowtype;
  v_address public.addresses%rowtype;
  v_address_snapshot jsonb;
  v_address_id uuid;
  v_order_id uuid;
  v_quantity integer;
  v_subtotal numeric(10, 2) := 0;
  v_delivery_fee numeric(10, 2) := 0;
  v_total numeric(10, 2);
  v_order_lines jsonb := '[]'::jsonb;
  v_existing_items jsonb;
  v_line jsonb;
  v_customer_name text;
  v_customer_phone text;
begin
  if p_request_id is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;

  select * into v_order
  from public.orders
  where request_id = p_request_id;

  if found then
    if v_order.user_id is distinct from p_user_id then
      raise exception using errcode = '22023', message = 'idempotency_key_conflict';
    end if;

    select coalesce(
      jsonb_agg(jsonb_build_object(
        'product_id', order_items.product_id,
        'name', order_items.product_name,
        'quantity', order_items.quantity,
        'unit_price', order_items.unit_price,
        'line_total', order_items.line_total
      ) order by order_items.product_name),
      '[]'::jsonb
    )
    into v_existing_items
    from public.order_items
    where order_items.order_id = v_order.id;

    return jsonb_build_object(
      'order_id', v_order.id,
      'status', v_order.status,
      'fulfillment', v_order.fulfillment,
      'items', v_existing_items,
      'subtotal', v_order.subtotal,
      'delivery_fee', v_order.delivery_fee,
      'total', v_order.total,
      'currency', v_order.currency,
      'address_id', v_order.address_id,
      'duplicate', true
    );
  end if;

  if p_fulfillment not in ('pickup', 'delivery') then
    raise exception using errcode = '22023', message = 'invalid_fulfillment';
  end if;

  if jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) < 1
    or jsonb_array_length(p_items) > 50 then
    raise exception using errcode = '22023', message = 'invalid_items';
  end if;

  if p_fulfillment = 'delivery' then
    if p_address_id is not null then
      if p_user_id is null then
        raise exception using errcode = '22023', message = 'guest_address_id_not_allowed';
      end if;

      select * into v_address
      from public.addresses
      where id = p_address_id and user_id = p_user_id;

      if not found then
        raise exception using errcode = 'P0002', message = 'address_not_found';
      end if;

      v_address_id := v_address.id;
      v_address_snapshot := jsonb_build_object(
        'label', v_address.label,
        'recipient_name', v_address.recipient_name,
        'phone', v_address.phone,
        'address_line', v_address.address_line,
        'subdistrict', v_address.subdistrict,
        'district', v_address.district,
        'province', v_address.province,
        'postal_code', v_address.postal_code
      );
    else
      if jsonb_typeof(p_new_address) <> 'object'
        or nullif(trim(p_new_address->>'recipient_name'), '') is null
        or nullif(trim(p_new_address->>'phone'), '') is null
        or nullif(trim(p_new_address->>'address_line'), '') is null
        or nullif(trim(p_new_address->>'subdistrict'), '') is null
        or nullif(trim(p_new_address->>'district'), '') is null
        or nullif(trim(p_new_address->>'province'), '') is null
        or nullif(trim(p_new_address->>'postal_code'), '') is null then
        raise exception using errcode = '22023', message = 'delivery_address_required';
      end if;

      v_address_snapshot := jsonb_build_object(
        'label', coalesce(nullif(trim(p_new_address->>'label'), ''), 'ที่อยู่จัดส่ง'),
        'recipient_name', trim(p_new_address->>'recipient_name'),
        'phone', trim(p_new_address->>'phone'),
        'address_line', trim(p_new_address->>'address_line'),
        'subdistrict', trim(p_new_address->>'subdistrict'),
        'district', trim(p_new_address->>'district'),
        'province', trim(p_new_address->>'province'),
        'postal_code', trim(p_new_address->>'postal_code')
      );

      if p_user_id is not null and p_save_address then
        insert into public.addresses (
          user_id, label, recipient_name, phone, address_line,
          subdistrict, district, province, postal_code
        )
        values (
          p_user_id,
          v_address_snapshot->>'label',
          v_address_snapshot->>'recipient_name',
          v_address_snapshot->>'phone',
          v_address_snapshot->>'address_line',
          v_address_snapshot->>'subdistrict',
          v_address_snapshot->>'district',
          v_address_snapshot->>'province',
          v_address_snapshot->>'postal_code'
        )
        returning id into v_address_id;
      end if;
    end if;

    v_customer_name := v_address_snapshot->>'recipient_name';
    v_customer_phone := v_address_snapshot->>'phone';
    v_delivery_fee := 40;
  else
    if p_address_id is not null or p_new_address is not null or coalesce(p_save_address, false) then
      raise exception using errcode = '22023', message = 'address_not_allowed_for_pickup';
    end if;
    v_customer_name := nullif(trim(p_customer_name), '');
    v_customer_phone := nullif(trim(p_customer_phone), '');
  end if;

  if v_customer_name is null or v_customer_phone is null then
    raise exception using errcode = '22023', message = 'customer_contact_required';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if jsonb_typeof(v_item) <> 'object'
      or nullif(trim(v_item->>'product_id'), '') is null
      or coalesce(v_item->>'quantity', '') !~ '^[0-9]+$' then
      raise exception using errcode = '22023', message = 'invalid_order_item';
    end if;

    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity < 1 or v_quantity > 99 then
      raise exception using errcode = '22023', message = 'invalid_quantity';
    end if;

    select * into v_product
    from public.products
    where id = trim(v_item->>'product_id') and active;

    if not found then
      raise exception using errcode = 'P0002', message = 'product_not_found';
    end if;

    v_subtotal := v_subtotal + v_product.price * v_quantity;
    v_order_lines := v_order_lines || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'quantity', v_quantity,
      'unit_price', v_product.price,
      'line_total', v_product.price * v_quantity
    ));
  end loop;

  if p_fulfillment = 'delivery' and v_subtotal >= 350 then
    v_delivery_fee := 0;
  end if;

  v_total := v_subtotal + v_delivery_fee;

  insert into public.orders (
    request_id, user_id, fulfillment, customer_name, customer_phone,
    address_id, address_snapshot, subtotal, delivery_fee, total
  )
  values (
    p_request_id, p_user_id, p_fulfillment, v_customer_name, v_customer_phone,
    v_address_id, v_address_snapshot, v_subtotal, v_delivery_fee, v_total
  )
  returning id into v_order_id;

  for v_line in select value from jsonb_array_elements(v_order_lines)
  loop
    insert into public.order_items (
      order_id, product_id, product_name, quantity, unit_price, line_total
    )
    values (
      v_order_id,
      v_line->>'product_id',
      v_line->>'product_name',
      (v_line->>'quantity')::integer,
      (v_line->>'unit_price')::numeric,
      (v_line->>'line_total')::numeric
    );
  end loop;

  return jsonb_build_object(
    'order_id', v_order_id,
    'status', 'pending',
    'fulfillment', p_fulfillment,
    'items', v_order_lines,
    'subtotal', v_subtotal,
    'delivery_fee', v_delivery_fee,
    'total', v_total,
    'currency', 'THB',
    'address_id', v_address_id,
    'duplicate', false
  );
exception
  when unique_violation then
    select * into v_order
    from public.orders
    where request_id = p_request_id;

    if found then
      if v_order.user_id is distinct from p_user_id then
        raise exception using errcode = '22023', message = 'idempotency_key_conflict';
      end if;

      select coalesce(
        jsonb_agg(jsonb_build_object(
          'product_id', order_items.product_id,
          'name', order_items.product_name,
          'quantity', order_items.quantity,
          'unit_price', order_items.unit_price,
          'line_total', order_items.line_total
        ) order by order_items.product_name),
        '[]'::jsonb
      )
      into v_existing_items
      from public.order_items
      where order_items.order_id = v_order.id;

      return jsonb_build_object(
        'order_id', v_order.id,
        'status', v_order.status,
        'fulfillment', v_order.fulfillment,
        'items', v_existing_items,
        'subtotal', v_order.subtotal,
        'delivery_fee', v_order.delivery_fee,
        'total', v_order.total,
        'currency', v_order.currency,
        'address_id', v_order.address_id,
        'duplicate', true
      );
    end if;

    raise;
end;
$$;

revoke all on function public.place_order(uuid, uuid, text, text, text, uuid, jsonb, boolean, jsonb) from public, anon, authenticated;
grant execute on function public.place_order(uuid, uuid, text, text, text, uuid, jsonb, boolean, jsonb) to service_role;
