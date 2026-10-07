import prisma from "@/lib/prisma";
import { requireAdminPage } from "@/lib/investments/admin";
import PerformanceChart from "@/app/_components/investments/PerformanceChart";
import SnapshotButton from "@/app/_components/investments/SnapshotButton";
import { calculatePerformance } from "@/lib/investments/performance";

const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(n);
export default async function PerformancePage(){
 const user=await requireAdminPage();
 const snapshots=await prisma.investmentPortfolioSnapshot.findMany({where:{userId:user.id,reportingCurrency:"USD"},orderBy:{snapshotDate:"asc"},take:365});
 const performance=await calculatePerformance(user.id);
 const contributions=snapshots.reduce((s,r)=>s+Number(r.contributions),0), withdrawals=snapshots.reduce((s,r)=>s+Number(r.withdrawals),0);
 const last=snapshots.at(-1); const end=Number(last?.totalValue??0);
 const netFlow=contributions-withdrawals;
 const twrValue=performance.twr===null?"—":`${(performance.twr*100).toFixed(2)}%`;
 const mwrValue=performance.mwr===null?"—":`${(performance.mwr*100).toFixed(2)}%`;
 return <div className="space-y-7"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-muted-foreground">Portfolio history</p><h1 className="text-3xl font-semibold tracking-tight">Performance</h1><p className="mt-1 text-sm text-muted-foreground">Track portfolio value, cash flows and return over captured snapshots.</p></div><SnapshotButton/></div>
 <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Stat label="Latest value" value={money(end)}/><Stat label="Net contributions" value={money(netFlow)}/><Stat label="Time-weighted return" value={twrValue}/><Stat label="Money-weighted return" value={mwrValue}/><Stat label="Snapshots" value={String(snapshots.length)}/></div>
 <section className="rounded-2xl border bg-card p-5 shadow-sm"><div className="mb-5"><h2 className="font-semibold">Portfolio value</h2><p className="text-xs text-muted-foreground">Daily values from saved snapshots</p></div><PerformanceChart data={snapshots.map(s=>({date:s.snapshotDate.toISOString(),value:Number(s.totalValue)}))}/></section>
 <p className="text-xs text-muted-foreground">TWR isolates portfolio performance from external cash flows. MWR reflects the timing of your contributions and withdrawals. Both depend on the quality and frequency of captured snapshots and transaction data.</p></div>
}
function Stat({label,value}:{label:string;value:string}){return <div className="rounded-2xl border bg-card p-5 shadow-sm"><div className="text-xs font-medium text-muted-foreground">{label}</div><div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div></div>}
