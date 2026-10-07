import { requireAdminPage } from "@/lib/investments/admin";
import prisma from "@/lib/prisma";
import AssetManager from "@/app/_components/investments/AssetManager";

export default async function AssetsPage() {
  const user = await requireAdminPage();

  const [assets, accounts] = await Promise.all([
    prisma.investmentAsset.findMany({
      where: {
        userId: user.id,
        active: true,
      },
      include: {
        account: {
          select: {
            id: true,
            institution: true,
            accountName: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
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
      },
    }),
  ]);

  return <AssetManager initialAssets={assets} accounts={accounts} />;
}
