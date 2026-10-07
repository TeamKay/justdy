import prisma from "@/lib/prisma";
import { requireAdminPage } from "@/lib/investments/admin";
import GoalManager from "@/app/_components/investments/GoalManager";

export default async function GoalsPage() {
  const user = await requireAdminPage();
  const goals = await prisma.investmentGoal.findMany({ where: { userId: user.id }, orderBy: [{ isActive: "desc" }, { targetDate: "asc" }] });
  return <GoalManager initialGoals={goals.map((g) => ({ id: g.id, name: g.name, targetAmount: g.targetAmount.toString(), startingAmount: g.startingAmount.toString(), currency: g.currency, targetDate: g.targetDate.toISOString(), expectedAnnualReturn: g.expectedAnnualReturn?.toString() ?? null, notes: g.notes }))} />;
}
