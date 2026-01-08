import { useMemo } from "react";

interface HeatmapData {
  date: string;
  count: number;
}

interface ActivityHeatmapProps {
  data: HeatmapData[];
  title?: string;
}

export function ActivityHeatmap({ data, title = "學習活動熱力圖" }: ActivityHeatmapProps) {
  // Generate last 12 weeks of dates
  const weeks = useMemo(() => {
    const weeks: (HeatmapData | null)[][] = [];
    const today = new Date();

    for (let w = 0; w < 12; w++) {
      const week: (HeatmapData | null)[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (w * 7 + d));
        const dateStr = date.toISOString().split("T")[0];
        const entry = data.find((d) => d.date === dateStr);
        week.push(entry || { date: dateStr, count: 0 });
      }
      weeks.unshift(week);
    }

    return weeks;
  }, [data]);

  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-100 dark:bg-gray-800";
    if (count < 2) return "bg-green-100 dark:bg-green-900";
    if (count < 5) return "bg-green-300 dark:bg-green-700";
    if (count < 10) return "bg-green-500 dark:bg-green-600";
    return "bg-green-700 dark:bg-green-500";
  };

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="overflow-x-auto">
        <div className="inline-flex gap-1">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1">
              {week.map((day, dayIdx) => (
                <div
                  key={`${weekIdx}-${dayIdx}`}
                  className={`heatmap-cell ${getColor(day?.count || 0)}`}
                  title={`${day?.date}: ${day?.count || 0} 次活動`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>少</span>
        <div className="flex gap-1">
          <div className="heatmap-cell bg-gray-100 dark:bg-gray-800" />
          <div className="heatmap-cell bg-green-100 dark:bg-green-900" />
          <div className="heatmap-cell bg-green-300 dark:bg-green-700" />
          <div className="heatmap-cell bg-green-500 dark:bg-green-600" />
          <div className="heatmap-cell bg-green-700 dark:bg-green-500" />
        </div>
        <span>多</span>
      </div>
    </div>
  );
}
