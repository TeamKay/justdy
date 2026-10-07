import prisma from "@/lib/prisma";
import { requireAdminPage } from "@/lib/investments/admin";
import ValuationControls from "@/app/_components/investments/ValuationControls";
import MarketDataRefresh from "@/app/_components/investments/MarketDataRefresh";
export default async function InvestmentSettingsPage(){
 const user=await requireAdminPage();
 const [assets,fx]=await Promise.all([
  prisma.investmentAsset.findMany({where:{userId:user.id,active:true},orderBy:{name:"asc"},include:{prices:{orderBy:{asOf:"desc"},take:1}}}),
  prisma.investmentFXRate.findFirst({where:{userId:user.id,base:"USD",quote:"GHS"},orderBy:{asOf:"desc"}}),
 ]);
 const rows=assets.map(a=>({id:a.id,name:a.name,symbol:a.symbol??a.tickerOrSymbol,currency:a.currency,latest:a.prices[0]?{price:a.prices[0].price.toString(),asOf:a.prices[0].asOf.toISOString(),source:a.prices[0].source}:null}));
 return <div className="space-y-7"><div><p className="text-sm text-muted-foreground">Portfolio configuration</p><h1 className="text-3xl font-semibold tracking-tight">Valuation settings</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Keep market prices and currency conversion inputs current. Provider refresh is optional and does not replace the manual valuation controls.</p></div><section className="rounded-2xl border bg-card p-5 shadow-sm"><div><h2 className="font-semibold">Market data</h2><p className="mt-1 text-sm text-muted-foreground">Refresh supported assets and the USD/GHS rate from the configured provider. Manual prices remain available as a fallback.</p></div><div className="mt-4"><MarketDataRefresh /></div></section><ValuationControls assets={rows}/><section className="rounded-2xl border bg-card p-5 shadow-sm"><h2 className="font-semibold">Latest USD / GHS rate</h2><p className="mt-1 text-2xl font-semibold">{fx?Number(fx.rate).toLocaleString(undefined,{maximumFractionDigits:6}):"Not set"}</p>{fx&&<p className="mt-1 text-xs text-muted-foreground">1 USD = {Number(fx.rate).toLocaleString()} GHS · {fx.source} · {fx.asOf.toLocaleString()}</p>}</section></div>;
}
