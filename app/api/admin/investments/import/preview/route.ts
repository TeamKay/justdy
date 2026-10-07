import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/investments/admin";
import {
  parseImportFile,
  suggestMapping,
} from "@/lib/investments/importer";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireAdminApi();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const form = await request.formData();
    const file = form.get("file");
    const accountId = String(
      form.get("accountId") ?? "",
    );

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "A CSV or Excel file is required." },
        { status: 400 },
      );
    }

    if (!accountId) {
      return NextResponse.json(
        { error: "Select an investment account." },
        { status: 400 },
      );
    }

    const account =
      await prisma.investmentAccount.findFirst({
        where: {
          id: accountId,
          userId: user.id,
        },
      });

    if (!account) {
      return NextResponse.json(
        { error: "Investment account not found." },
        { status: 404 },
      );
    }

    const parsed = parseImportFile(
      file.name,
      Buffer.from(await file.arrayBuffer()),
    );

    const mapping = suggestMapping(parsed.headers);

    return NextResponse.json({
      fileName: file.name,
      accountId,
      headers: parsed.headers,
      suggestedMapping: mapping,
      rowCount: parsed.rows.length,
      previewRows: parsed.rows.slice(0, 15),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to preview import.",
      },
      { status: 400 },
    );
  }
}
