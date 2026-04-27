export type Id = string;

export type StoreType = "shopify" | "hybrid";

export type ProductCategory =
  | "tops"
  | "shoes"
  | "pants"
  | "hats"
  | "outerwear"
  | "accessories"
  | "other";

export type TaskStatus =
  | "queued"
  | "running"
  | "success"
  | "failed"
  | "paused"
  | "canceled";

export type TaskStep =
  | "init"
  | "discover"
  | "select_variant"
  | "add_to_cart"
  | "shipping"
  | "payment"
  | "submit"
  | "done";

export type Severity = "info" | "warn" | "error" | "success";

export type PaymentType = "card" | "paypal" | "crypto" | "unknown";

export type EventType =
  | "restock"
  | "hat_restock"
  | "task_created"
  | "task_started"
  | "task_progress"
  | "task_success"
  | "task_failed"
  | "task_canceled"
  | "task_retried"
  | "monitor_updated"
  | "monitor_enabled"
  | "monitor_disabled"
  | "profile_created"
  | "profile_updated"
  | "profile_deleted"
  | "proxies_imported"
  | "proxies_tested"
  | "proxy_degraded"
  | "adapter_connected"
  | "adapter_disconnected";

export type AdapterCapability =
  | "product_discovery"
  | "variant_parse"
  | "add_to_cart"
  | "checkout"
  | "anti_bot";

export interface Monitor {
  id: Id;
  store: string;
  storeType: StoreType;
  category: ProductCategory;
  query: string;
  sizes: string[];
  enabled: boolean;
  hitsToday: number;
  lastHitAt?: number;
}

export interface HatAddOn {
  id: Id;
  name: string;
  sku: string;
  color: string;
  priceCents?: number;
  store: string;
  storeType: StoreType;
  enabled: boolean;
  inStock: boolean;
  lastSeenAt?: number;
}

export interface Task {
  id: Id;
  store: string;
  storeType: StoreType;
  target: string;
  size: string;
  addOnIds: Id[];
  profileName: string;
  proxyGroupName: string;
  status: TaskStatus;
  step: TaskStep;
  retries: number;
  lastHttpStatus?: number;
  lastUpdateAt: number;
}

export interface Profile {
  id: Id;
  name: string;
  shippingName: string;
  country: string;
  paymentType: PaymentType;
  isDefault: boolean;
}

export interface ProxyGroup {
  id: Id;
  name: string;
  proxiesCount: number;
  healthyCount: number;
  avgLatencyMs: number;
}

export interface Adapter {
  id: Id;
  name: string;
  type: StoreType;
  connected: boolean;
  capabilities: AdapterCapability[];
  lastSyncAt: number;
}

export interface KswEvent {
  id: Id;
  type: EventType;
  severity: Severity;
  message: string;
  at: number;
}

export interface KswState {
  monitors: Monitor[];
  tasks: Task[];
  hatAddOns: HatAddOn[];
  profiles: Profile[];
  proxies: ProxyGroup[];
  adapters: Adapter[];
  events: KswEvent[];
}

export interface Kpis {
  runningTasks: number;
  successRate24h: number;
  checkoutLatencyP50: number;
  restocksToday: number;
}
