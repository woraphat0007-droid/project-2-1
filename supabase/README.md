# Pizza Pao checkout API

This Supabase Edge Function creates pickup or delivery orders. It does not charge
customers or expose a public order lookup endpoint.

## API

`POST /functions/v1/checkout`

The function accepts either an anonymous guest request or a Supabase access token
in the `Authorization` header. Every request must include a fresh UUID
in `idempotency_key`; reuse the same key only when retrying that same checkout.
Prices are read from `public.products`, never from the request.
The `products` table is readable by anonymous and authenticated clients under
RLS, so the storefront can load the catalog and submit the returned product IDs.

### Guest delivery

```json
{
  "idempotency_key": "2ba1c1dc-3cb8-4e26-9bf7-20d8bc50f328",
  "fulfillment": "delivery",
  "items": [{ "product_id": "pepperoni-cheese", "quantity": 2 }],
  "address": {
    "recipient_name": "Example Customer",
    "phone": "0812345678",
    "address_line": "99 Example Road",
    "subdistrict": "Example",
    "district": "Example",
    "province": "Bangkok",
    "postal_code": "10110"
  }
}
```

Guest orders require delivery contact and address data. Guest addresses are stored
as an order snapshot and are not added to a member address book.

### Member delivery with a saved address

Send the same request with a valid access token and replace `address` with
`address_id` belonging to the authenticated user.

### Member delivery with a new address

Send a valid access token and `address`. Set `save_address` to `true` to add the
address to that member's address book, or `false` to use it only for this order.

### Pickup

```json
{
  "idempotency_key": "2ba1c1dc-3cb8-4e26-9bf7-20d8bc50f328",
  "fulfillment": "pickup",
  "customer": { "name": "Example Customer", "phone": "0812345678" },
  "items": [{ "product_id": "deal-box-signature", "quantity": 1 }]
}
```

### Success response

New orders return `201`; a retry with the same idempotency key returns `200`.

```json
{
  "order": {
    "order_id": "0e2f0e69-c8f3-46b3-830e-64035d402619",
    "status": "pending",
    "fulfillment": "delivery",
    "items": [
      {
        "product_id": "pepperoni-cheese",
        "name": "เปปเปอโรนี ชีสเยิ้ม",
        "quantity": 2,
        "unit_price": 229,
        "line_total": 458
      }
    ],
    "subtotal": 458,
    "delivery_fee": 0,
    "total": 458,
    "currency": "THB",
    "address_id": null,
    "duplicate": false
  }
}
```

Delivery costs ฿40 and is free when the server-calculated subtotal is at least
฿350. Product name and price are snapshotted into each order item at checkout.
The initial catalog includes all current menu and homepage/reward offer buttons;
the IDs for homepage offers are `hero-party-cheese`, `hero-pepperoni-bogo`,
`hero-seafood-pizza`, `hero-pair-set`, `truffle-mushroom`, and
`reward-app-deal-four`.

## Local setup

1. Install the Supabase CLI and Docker.
2. Run `supabase start` from the project root (the directory containing `supabase/`).
3. Apply the schema and product catalog with `supabase db reset`.
4. Copy the local API URL and anon key printed by `supabase start` into
   `SUPABASE_URL` and `SUPABASE_ANON_KEY` in the root `supabase-client.js`.
   The anon key is intended for browser use; never put the service role key there.
5. Start the function with `supabase functions serve checkout`.
6. Set `CHECKOUT_ALLOWED_ORIGINS` to the exact browser origins used by the site.
   The default allows ports 5500 and 5501 on localhost and 127.0.0.1.
7. Serve the website on an allowed origin, such as `http://localhost:5500`.
   The frontend loads Supabase JS from jsDelivr, so a network connection is needed.
8. Send requests to `http://127.0.0.1:54321/functions/v1/checkout` with
   `Content-Type: application/json` and the local Supabase `apikey`.

For a hosted project, link this Supabase project, apply the migration, and deploy
the `checkout` function. Set the hosted project URL and anon key in
`supabase-client.js`, configure the exact website origin in
`CHECKOUT_ALLOWED_ORIGINS`, and add the website URL to Supabase Auth's redirect
URL allow list for email confirmation and password recovery. Enable email signup
and configure the email provider in Supabase Auth. Supabase injects `SUPABASE_URL`
and `SUPABASE_SERVICE_ROLE_KEY` into Edge Functions; the service role key must
never be placed in browser code.

The cart permits guest checkout by collecting pickup contact details or a
delivery address. Signed-in members can select a saved address or enter a new
one and optionally save it. Registration stores the member's name and phone in
Auth user metadata for pickup orders. The cart sends product IDs and quantities;
the Edge Function remains responsible for validating products and calculating
prices. Checkout creates an order but does not process payment.

Before opening guest checkout to the public internet, configure request rate
limits at the hosting/API gateway and add operational monitoring. The function
validates every order and uses idempotency keys, but does not itself implement
IP-based throttling or payment processing.
