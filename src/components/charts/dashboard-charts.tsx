"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { STATUS_LABELS, type BookStatus } from "@/lib/constants";

const STATUS_COLORS: Record<BookStatus, string> = {
  NAO_LIDO: "#94a3b8",
  LENDO: "#f59e0b",
  LIDO: "#10b981",
};

export function StatusPieChart({
  data,
}: {
  data: { status: BookStatus; count: number }[];
}) {
  const filtered = data.filter((d) => d.count > 0);
  if (filtered.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        Adicione livros para ver a distribuição por status.
      </div>
    );
  }
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filtered}
            dataKey="count"
            nameKey="status"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
          >
            {filtered.map((entry) => (
              <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, _name, item) => [
              value,
              STATUS_LABELS[item.payload.status as BookStatus],
            ]}
          />
          <Legend
            formatter={(value) =>
              STATUS_LABELS[value as BookStatus] ?? String(value)
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GenreBarChart({
  data,
}: {
  data: { genre: string; count: number }[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        Cadastre gêneros nos livros para ver a distribuição.
      </div>
    );
  }
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis dataKey="genre" fontSize={12} interval={0} angle={-20} dy={10} />
          <YAxis allowDecimals={false} fontSize={12} />
          <Tooltip />
          <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
