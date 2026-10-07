import prisma from "@/lib/prisma";
import { requireAdminPage } from "@/lib/investments/admin";
import AccountsClient from "@/app/_components/investments/AccountsClient";
export default async function AccountsPage(){const user=await requireAdminPage();const accounts=await prisma.investmentAccount.findMany({where:{userId:user.id},orderBy:{createdAt:"desc"},include:{_count:{select:{holdings:true,transactions:true}}}});return <AccountsClient initialAccounts={accounts.map(a=>({...a,accountNumber:a.accountNumber.slice(-4)}))}/>}
