import { requireAdminPage } from "@/lib/investments/admin";
import prisma from "@/lib/prisma";
import TransactionsClient from "@/app/_components/investments/TransactionsClient";

export default async function TransactionsPage() {
  const user = await requireAdminPage();

  const [accounts, assets, transactions] = await Promise.all([
    prisma.investmentAccount.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      orderBy: {
        institution: "asc",
      },
      select: {
        id: true,
        institution: true,
        accountName: true,
        currency: true,
      },
    }),
    prisma.investmentAsset.findMany({
      where: {
        userId: user.id,
        active: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        symbol: true,
        currency: true,
      },
    }),
    prisma.investmentTransaction.findMany({
      where: {
        userId: user.id,
      },
      include: {
        asset: {
          select: {
            name: true,
            symbol: true,
          },
        },
        account: {
          select: {
            institution: true,
          },
        },
      },
      orderBy: {
        transactionDate: "desc",
      },
      take: 50,
    }),
  ]);

  const serializedTransactions = transactions.map((transaction) => ({
    ...transaction,
    transactionDate: transaction.transactionDate.toISOString(),
    quantity: transaction.quantity?.toString() ?? null,
    price: transaction.price?.toString() ?? null,
    grossAmount: transaction.grossAmount?.toString() ?? null,
    netAmount: transaction.netAmount?.toString() ?? null,
    fees: transaction.fees.toString(),
    taxes: transaction.taxes.toString(),
  }));

  return (
    <TransactionsClient
      accounts={accounts}
      assets={assets}
      initialTransactions={serializedTransactions}
    />
  );
}
