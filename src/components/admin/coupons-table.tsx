"use client";

import { useState } from "react";
import type { Coupon } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { formatDate, formatPrice } from "@/lib/utils/format";
import { AdminTable } from "./admin-ui";

const usage: Record<string, number> = { TRAYLBORN10: 142, SUMMER30: 38, FIRSTTRAIL: 96, WINTER15: 21, MONSOON20: 57 };

export function CouponsTable({ coupons }: { coupons: Coupon[] }) {
  const [rows, setRows] = useState(coupons);
  return (
    <AdminTable label="Coupons">
      <thead>
        <tr><th>Code</th><th>Discount</th><th>Conditions</th><th>Used</th><th>Expires</th><th>Active</th></tr>
      </thead>
      <tbody>
        {rows.map((c) => (
          <tr key={c.code}>
            <td><span className="rounded-md border border-dashed border-pine-300 px-2 py-1 font-mono text-xs font-bold text-pine-800">{c.code}</span></td>
            <td className="font-semibold">{c.type === "percent" ? `${c.value}%` : `${formatPrice(c.value)} / person`}</td>
            <td className="text-muted-foreground">{c.minParticipants ? `${c.minParticipants}+ travellers` : "Any booking"}</td>
            <td>{usage[c.code] ?? 0}</td>
            <td className="whitespace-nowrap">{formatDate(c.expiresOn)}</td>
            <td>
              <Switch
                checked={c.active}
                onCheckedChange={(v) => setRows((rs) => rs.map((r) => (r.code === c.code ? { ...r, active: v } : r)))}
                aria-label={`${c.active ? "Deactivate" : "Activate"} ${c.code}`}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </AdminTable>
  );
}
