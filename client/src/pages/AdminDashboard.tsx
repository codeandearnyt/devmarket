import { BarChart3, BookOpen, Check, ChevronRight, CreditCard, FolderPlus, LayoutDashboard, MessageSquareText, PackagePlus, Settings2, ShieldCheck, Users, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useRealtime } from "@/hooks/useRealtime";
import { money, typeLabel } from "./Home";
import HeaderAvatar from "@/components/HeaderAvatar";
import SiteHeader from "@/components/SiteHeader";
import DevMarketIcon from "@/assets/dev-market-icon.png";
import BlogAdminPanel from "@/components/BlogAdminPanel";
import AdminInsightsPanel from "@/components/AdminInsightsPanel";
import ReviewModerationPanel from "@/components/ReviewModerationPanel";
import ProductImageDropzone from "@/components/ProductImageDropzone";
import ProductForm, { emptyProductDraft, type ProductDraft } from "@/components/ProductForm";

const statusStyles: Record<string, string> = { PENDING: "bg-[#fff4c6] text-[#8a6500]", DELIVERED: "bg-[#c7f76d] text-[#172039]", REJECTED: "bg-[#ffe0d7] text-[#a33e23]" };

function Metric({ label, value, detail, tone = "lime" }: { label: string; value: string; detail: string; tone?: "lime" | "coral" | "cream" }) {
  return (
    <div className={`rounded-2xl border border-[#d7e8eb] p-5 ${tone === "lime" ? "bg-[#c7f76d]" : tone === "coral" ? "bg-[#13b8b0] text-white" : "bg-[#f8ffff]"}`}>
      <p className={`font-mono text-[10px] uppercase tracking-[.16em] ${tone === "coral" ? "text-white/70" : "text-[#53617d]"}`}>{label}</p>
      <p className="mt-5 font-display text-4xl font-semibold tracking-[-.07em]">{value}</p>
      <p className={`mt-2 text-xs ${tone === "coral" ? "text-white/75" : "text-[#53617d]"}`}>{detail}</p>
    </div>
  );
}

export default function AdminDashboard() {
  useRealtime("admin");
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === "admin";
  const [tab, setTab] = useState("overview");
  const stats = trpc.admin.stats.useQuery(undefined, { enabled: isAdmin });
  const orders = trpc.admin.orders.useQuery(undefined, { enabled: isAdmin });
  const products = trpc.admin.products.useQuery(undefined, { enabled: isAdmin });
  const approve = trpc.admin.approveOrder.useMutation({ onSuccess: () => orders.refetch() });
  const reject = trpc.admin.rejectOrder.useMutation({ onSuccess: () => orders.refetch() });
  const categories = trpc.admin.categories.useQuery(undefined, { enabled: isAdmin });
  const createProduct = trpc.admin.createProduct.useMutation({ onSuccess: () => { products.refetch(); setShowProductForm(false); setEditingProductId(null); } });
  const updateProduct = trpc.admin.updateProduct.useMutation({ onSuccess: () => { products.refetch(); setShowProductForm(false); setEditingProductId(null); } });
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productDraft, setProductDraft] = useState<ProductDraft>(emptyProductDraft);

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="liquid-page min-h-screen bg-[#eef8fa] text-[#172039]">
        <SiteHeader />
        <div className="px-5 py-12">
          <div className="mx-auto max-w-xl rounded-[2rem] border border-[#d7e8eb] bg-[#f8ffff] p-9 text-center">
            <ShieldCheck className="mx-auto text-[#13b8b0]" size={34} />
            <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-.06em]">Admin access only.</h1>
            <p className="mt-3 text-[#53617d]">This command center is protected by role-based access control. Sign in with an admin account to continue.</p>
            <Link href="/login" className="mt-7 inline-flex rounded-full bg-[#172039] px-6 py-3.5 font-semibold text-white">Sign in to continue</Link>
          </div>
        </div>
      </div>
    );
  }

  const pending = orders.data?.filter(({ order }) => order.status === "PENDING" && order.paymentMethod === "MANUAL_QR") ?? [];
  const nav = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={16} /> },
    { id: "insights", label: "Insights", icon: <BarChart3 size={16} /> },
    { id: "reviews", label: "Reviews", icon: <MessageSquareText size={16} /> },
    { id: "queue", label: `Review queue${pending.length ? ` · ${pending.length}` : ""}`, icon: <ShieldCheck size={16} /> },
    { id: "products", label: "Products", icon: <PackagePlus size={16} /> },
    { id: "blog", label: "Blog", icon: <BookOpen size={16} /> },
    { id: "settings", label: "Settings", icon: <Settings2 size={16} /> },
  ];

  return (
    <div className="liquid-page min-h-screen bg-[#eef8fa] text-[#172039]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="admin-glass-nav border-b border-[#d7e8eb] bg-[#172039] text-white lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r lg:border-[#172039]">
          <div className="flex items-center justify-between px-6 py-6 lg:block">
            <Link href="/" className="flex items-center gap-3">
              <img src={DevMarketIcon} alt="DevMarket" className="h-9 w-9 rounded-xl object-contain" />
              <span className="font-display text-xl font-bold tracking-[-.05em]">dev<span className="text-[#13b8b0]">market</span></span>
              <span className="ml-2 rounded-full bg-[#c7f76d] px-2 py-1 font-mono text-[8px] uppercase tracking-[.12em] text-[#172039]">admin</span>
            </Link>
            <span className="hidden font-mono text-[10px] text-white/45 lg:mt-2 lg:block">COMMAND CENTER / 01</span>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:mt-12 lg:block lg:px-4">
            {nav.map(item => (
              <button key={item.id} onClick={() => setTab(item.id)} className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition lg:mb-2 lg:w-full ${tab === item.id ? "bg-[#c7f76d] text-[#172039]" : "text-white/65 hover:bg-white/10 hover:text-white"}`}>
                {item.icon}<span>{item.label}</span>
                {item.id === "queue" && pending.length > 0 ? <span className="ml-auto rounded-full bg-[#13b8b0] px-2 py-0.5 text-[10px] text-white">{pending.length}</span> : null}
              </button>
            ))}
          </nav>
          <div className="hidden px-6 pb-8 lg:block">
            <div className="mt-16 border-t border-white/15 pt-5 text-xs leading-5 text-white/45">
              Secure administration<br />Payment gates active<br />Storage protected
            </div>
          </div>
        </aside>
        <main className="flex-1 px-5 py-7 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-[1180px]">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#13b8b0]">Good morning</p>
                <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-.07em]">{nav.find(item => item.id === tab)?.label.replace(/ · \d+/, "")}</h1>
              </div>
              {isAuthenticated ? (<HeaderAvatar />) : ("")}
            </div>
            <Link href="/" className="hidden items-center gap-2 text-sm font-semibold text-[#53617d] md:flex">View storefront <ChevronRight size={16} /></Link>
          </div>
          {tab === "overview" && <>
            <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Gross revenue" value={money(stats.data?.revenue ?? 0)} detail="Verified paid orders" tone="coral" />
              <Metric label="Total sales" value={String(stats.data?.totalSales ?? 0).padStart(2, "0")} detail="All-time deliveries" />
              <Metric label="Review queue" value={String(stats.data?.pendingApprovals ?? pending.length).padStart(2, "0")} detail="Manual proof approvals" tone="cream" />
              <Metric label="Catalog" value={String(stats.data?.totalProducts ?? products.data?.length ?? 0).padStart(2, "0")} detail="Published products" tone="lime" />
            </div>
            <div className="mt-8 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
              <section className="rounded-2xl border border-[#d7e8eb] bg-[#f8ffff] p-6">
                <div className="flex items-center justify-between">
                  <div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#71809f]">Activity</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-[-.05em]">Recent orders</h2></div>
                  <BarChart3 className="text-[#13b8b0]" />
                </div>
                <div className="mt-7 space-y-3">
                  {orders.data?.slice(0, 5).map(({ order, product, buyer }) => (
                    <div key={order.id} className="flex items-center gap-3 border-t border-[#e9f7f6] py-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9f7f6] font-mono text-xs">{buyer.name?.slice(0, 1) ?? "B"}</div>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{product.title}</p><p className="text-xs text-[#53617d]">{buyer.email ?? "buyer"}</p></div>
                      <div className="text-right"><p className="text-sm font-semibold">{money(order.amount)}</p><span className={`rounded-full px-2 py-1 text-[9px] font-semibold uppercase ${statusStyles[order.status] ?? "bg-[#e9f7f6]"}`}>{order.status}</span></div>
                    </div>
                  ))}
                </div>
              </section>
              <section className="rounded-2xl border border-[#d7e8eb] bg-[#f8ffff] p-6">
                <div className="flex items-center justify-between">
                  <div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#71809f]">Quick actions</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-[-.05em]">Manage</h2></div>
                  <ChevronRight className="text-[#13b8b0]" />
                </div>
                <div className="mt-7 space-y-3">
                  <button onClick={() => setTab("products")} className="flex w-full items-center justify-between rounded-xl border border-[#d7e8eb] bg-[#f8ffff] px-4 py-3 text-sm font-semibold transition hover:border-[#13b8b0]"><span>Add product</span><FolderPlus size={16} className="text-[#13b8b0]" /></button>
                  <button onClick={() => setTab("blog")} className="flex w-full items-center justify-between rounded-xl border border-[#d7e8eb] bg-[#f8ffff] px-4 py-3 text-sm font-semibold transition hover:border-[#13b8b0]"><span>Write blog post</span><BookOpen size={16} className="text-[#13b8b0]" /></button>
                  <button onClick={() => setTab("settings")} className="flex w-full items-center justify-between rounded-xl border border-[#d7e8eb] bg-[#f8ffff] px-4 py-3 text-sm font-semibold transition hover:border-[#13b8b0]"><span>Payment settings</span><Settings2 size={16} className="text-[#13b8b0]" /></button>
                </div>
              </section>
            </div>
          </>}
          {tab === "insights" && <AdminInsightsPanel />}
          {tab === "reviews" && <ReviewModerationPanel />}
          {tab === "queue" && <ReviewModerationPanel />}
          {tab === "products" && <>
            <div className="mb-6 flex items-center justify-between">
              <div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#71809f]">Catalog</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-[-.05em]">Products</h2></div>
              <button onClick={() => { setEditingProductId(null); setProductDraft(emptyProductDraft); setShowProductForm(true); }} className="btn inline-flex items-center rounded-full bg-[#172039] px-4 py-2.5 text-sm font-semibold text-white"><FolderPlus size={16} className="mr-2" /> Add product</button>
            </div>
            {showProductForm && (
              <ProductForm
                draft={productDraft}
                categories={categories.data ?? []}
                pending={createProduct.isPending || updateProduct.isPending}
                submitLabel={editingProductId ? "Save changes" : "Create product"}
                onChange={setProductDraft}
                onSubmit={() => { if (editingProductId) updateProduct.mutate({ id: editingProductId, ...productDraft }); else createProduct.mutate(productDraft); }}
                onCancel={() => { setShowProductForm(false); setEditingProductId(null); }}
              />
            )}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.data?.map(product => (
                <div key={product.id} className="rounded-2xl border border-[#d7e8eb] bg-[#f8ffff] p-5">
                  <div className="flex items-start justify-between">
                    <div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#71809f]">{product.type}</p><h3 className="mt-2 font-display text-xl font-semibold tracking-[-.03em]">{product.title}</h3></div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${product.isPublished ? "bg-[#c7f76d] text-[#172039]" : "bg-[#ffe0d7] text-[#a33e23]"}`}>
                      {product.isPublished ? "Live" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#53617d]">{product.shortDescription}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-[#e9f7f6] pt-4">
                    <span className="font-display text-lg font-semibold">{money(product.price)}</span>
                    <button onClick={() => { setEditingProductId(product.id); setProductDraft({ title: product.title, slug: product.slug, shortDescription: product.shortDescription, description: product.description, type: product.type, categoryId: product.categoryId, price: product.price, thumbnailUrl: product.thumbnailUrl, fileUrl: product.fileUrl, previewImages: (product.previewImages as string[] | null) ?? [] }); setShowProductForm(true); }} className="text-sm font-semibold text-[#13b8b0]">Edit</button>
                  </div>
                </div>
              ))}
            </div>
          </>}
          {tab === "blog" && <BlogAdminPanel />}
          {tab === "settings" && <SettingsPanel />}
        </main>
      </div>
    </div>
  );
}

function SettingsPanel() {
  const settings = trpc.admin.settings.useQuery();
  const mutation = trpc.admin.updateSettings.useMutation({ onSuccess: () => settings.refetch() });
  const [upiId, setUpiId] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const current = settings.data;
  return (
    <section className="mt-9 max-w-2xl rounded-2xl border border-[#d7e8eb] bg-[#f8ffff] p-6">
      <div className="flex items-center gap-3">
        <Settings2 className="text-[#13b8b0]" />
        <div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#71809f]">Checkout configuration</p><h2 className="mt-2 font-display text-2xl font-semibold">Payment settings</h2></div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#53617d]">Keep credentials server-side. This panel controls which verified payment methods buyers can see and the UPI display details they receive.</p>
      <div className="mt-7 space-y-4">
        <label className="block text-sm font-semibold">UPI ID<input value={upiId || current?.upiId || ""} onChange={e => setUpiId(e.target.value)} className="mt-2 w-full rounded-xl border border-[#d7e8eb] bg-transparent px-4 py-3 outline-none focus:border-[#13b8b0]" /></label>
        <label className="block text-sm font-semibold">Payee name<input value={payeeName || current?.payeeName || ""} onChange={e => setPayeeName(e.target.value)} className="mt-2 w-full rounded-xl border border-[#d7e8eb] bg-transparent px-4 py-3 outline-none focus:border-[#13b8b0]" /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-[#e9f7f6] p-4"><p className="text-sm font-semibold">Razorpay</p><p className="mt-1 text-xs text-[#53617d]">Enabled · server verified</p></div>
          <div className="rounded-xl bg-[#e9f7f6] p-4"><p className="text-sm font-semibold">Manual QR</p><p className="mt-1 text-xs text-[#53617d]">Enabled · admin review</p></div>
        </div>
        <button onClick={() => mutation.mutate({ upiId: upiId || current?.upiId || "", payeeName: payeeName || current?.payeeName || "", qrCodeImageUrl: current?.qrCodeImageUrl ?? "", isRazorpayEnabled: current?.isRazorpayEnabled ?? true, isManualQrEnabled: current?.isManualQrEnabled ?? true })} className="btn rounded-full bg-[#172039] px-5 py-3 text-sm font-semibold text-white">Save settings</button>
      </div>
    </section>
  );
}