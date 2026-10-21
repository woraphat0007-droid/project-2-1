import { createClient } from "npm:@supabase/supabase-js@2";

type AddressInput = {
  label?: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  subdistrict: string;
  district: string;
  province: string;
  postal_code: string;
};

type CheckoutItem = {
  product_id: string;
  quantity: number;
};

type CheckoutBody = {
  idempotency_key: string;
  fulfillment: "pickup" | "delivery";
  items: CheckoutItem[];
  customer?: {
    name: string;
    phone: string;
  };
  address_id?: string;
  address?: AddressInput;
  save_address?: boolean;
};

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const allowedOrigins = (Deno.env.get("CHECKOUT_ALLOWED_ORIGINS") ??
  "http://localhost:5500,http://127.0.0.1:5500")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function corsHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };

  if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  headers: HeadersInit,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...Object.fromEntries(new Headers(headers)), "Content-Type": "application/json" },
  });
}

function requiredText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw new ApiError(`invalid_${field}`, 400);
  }
  const result = value.trim();
  if (!result || result.length > maxLength) {
    throw new ApiError(`invalid_${field}`, 400);
  }
  return result;
}

function validatePhone(value: unknown, field: string): string {
  const phone = requiredText(value, field, 16);
  if (!/^\+?[0-9]{9,15}$/.test(phone)) {
    throw new ApiError(`invalid_${field}`, 400);
  }
  return phone;
}

function validateAddress(value: unknown): AddressInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError("delivery_address_required", 400);
  }

  const address = value as Record<string, unknown>;
  const postalCode = requiredText(address.postal_code, "postal_code", 5);
  if (!/^[0-9]{5}$/.test(postalCode)) {
    throw new ApiError("invalid_postal_code", 400);
  }

  return {
    label: typeof address.label === "string"
      ? requiredText(address.label, "address_label", 60)
      : undefined,
    recipient_name: requiredText(address.recipient_name, "recipient_name", 120),
    phone: validatePhone(address.phone, "phone"),
    address_line: requiredText(address.address_line, "address_line", 250),
    subdistrict: requiredText(address.subdistrict, "subdistrict", 100),
    district: requiredText(address.district, "district", 100),
    province: requiredText(address.province, "province", 100),
    postal_code: postalCode,
  };
}

function validateBody(value: unknown): CheckoutBody {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError("invalid_request_body", 400);
  }

  const body = value as Record<string, unknown>;
  if (body.fulfillment !== "pickup" && body.fulfillment !== "delivery") {
    throw new ApiError("invalid_fulfillment", 400);
  }

  const idempotencyKey = requiredText(body.idempotency_key, "idempotency_key", 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    throw new ApiError("invalid_idempotency_key", 400);
  }

  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) {
    throw new ApiError("invalid_items", 400);
  }

  const quantities = new Map<string, number>();
  for (const value of body.items) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new ApiError("invalid_order_item", 400);
    }
    const item = value as Record<string, unknown>;
    const productId = requiredText(item.product_id, "product_id", 80);
    if (!Number.isInteger(item.quantity) || (item.quantity as number) < 1 || (item.quantity as number) > 99) {
      throw new ApiError("invalid_quantity", 400);
    }
    const quantity = (quantities.get(productId) ?? 0) + (item.quantity as number);
    if (quantity > 99) {
      throw new ApiError("invalid_quantity", 400);
    }
    quantities.set(productId, quantity);
  }

  const items = [...quantities].map(([product_id, quantity]) => ({ product_id, quantity }));
  const result: CheckoutBody = {
    idempotency_key: idempotencyKey,
    fulfillment: body.fulfillment,
    items,
  };

  if (body.fulfillment === "pickup") {
    if (body.address !== undefined || body.address_id !== undefined || body.save_address === true) {
      throw new ApiError("address_not_allowed_for_pickup", 400);
    }
    if (!body.customer || typeof body.customer !== "object" || Array.isArray(body.customer)) {
      throw new ApiError("customer_contact_required", 400);
    }
    const customer = body.customer as Record<string, unknown>;
    result.customer = {
      name: requiredText(customer.name, "customer_name", 120),
      phone: validatePhone(customer.phone, "phone"),
    };
  } else {
    if (body.customer !== undefined) {
      throw new ApiError("customer_contact_is_read_from_address", 400);
    }
    if (body.address_id !== undefined) {
      if (typeof body.address_id !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.address_id)) {
        throw new ApiError("invalid_address_id", 400);
      }
      if (body.address !== undefined || body.save_address === true) {
        throw new ApiError("choose_saved_or_new_address", 400);
      }
      result.address_id = body.address_id;
    } else {
      result.address = validateAddress(body.address);
      if (body.save_address !== undefined && typeof body.save_address !== "boolean") {
        throw new ApiError("invalid_save_address", 400);
      }
      result.save_address = body.save_address === true;
    }
  }

  return result;
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin");
  const headers = corsHeaders(origin);

  if (origin && !allowedOrigins.includes(origin)) {
    return jsonResponse({ error: "origin_not_allowed" }, 403, headers);
  }
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405, headers);
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return jsonResponse({ error: "content_type_must_be_json" }, 415, headers);
  }

  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 64 * 1024) {
      throw new ApiError("request_too_large", 413);
    }

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      throw new ApiError("invalid_json", 400);
    }
    const body = validateBody(parsedBody);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      throw new ApiError("checkout_api_not_configured", 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let userId: string | null = null;
    const authorization = request.headers.get("Authorization");
    if (authorization) {
      const match = authorization.match(/^Bearer\s+(.+)$/i);
      if (!match) {
        throw new ApiError("invalid_authorization_header", 401);
      }
      const { data, error } = await supabase.auth.getUser(match[1]);
      if (error || !data.user) {
        throw new ApiError("invalid_access_token", 401);
      }
      userId = data.user.id;
    }

    if (body.fulfillment === "delivery" && !userId && body.address_id) {
      throw new ApiError("guest_must_provide_delivery_address", 400);
    }
    if (!userId && body.save_address) {
      throw new ApiError("guest_cannot_save_address", 400);
    }

    const { data, error } = await supabase.rpc("place_order", {
      p_request_id: body.idempotency_key,
      p_user_id: userId,
      p_fulfillment: body.fulfillment,
      p_customer_name: body.customer?.name ?? null,
      p_customer_phone: body.customer?.phone ?? null,
      p_address_id: body.address_id ?? null,
      p_new_address: body.address ?? null,
      p_save_address: userId !== null && body.save_address === true,
      p_items: body.items,
    });

    if (error) {
      if (error.code === "P0002") {
        throw new ApiError(
          error.message === "address_not_found" ? "address_not_found" : "product_not_found",
          404,
        );
      }
      if (error.code === "22023") {
        throw new ApiError(error.message, 400);
      }
      throw error;
    }

    const result = data as Record<string, unknown>;
    return jsonResponse(
      { order: result },
      result.duplicate === true ? 200 : 201,
      headers,
    );
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status >= 500) console.error("Checkout API configuration error:", error.message);
      return jsonResponse({ error: error.message }, error.status, headers);
    }

    console.error("Checkout API failed:", error);
    return jsonResponse({ error: "checkout_failed" }, 500, headers);
  }
});
