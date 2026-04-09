import { useMemo } from "react";

interface HeatmapData {
  date: string;
  count: number;
}

interface ActivityHeatmapProps {
  data: HeatmapData[];
  title?: string;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ActivityHeatmap({
  data,
  title = "Study activity in the last 12 weeks",
}: ActivityHeatmapProps) {
  const weeks = useMemo(() => {
    const dateMap = new Map(data.map((entry) => [entry.date, entry.count]));
    const result: HeatmapData[][] = [];
    const today = new Date();

    for (let weekIndex = 0; weekIndex < 12; weekIndex++) {
      const week: HeatmapData[] = [];

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (11 - weekIndex) * 7 - dayIndex);
        const key = formatDateKey(date);
        week.push({
          date: key,
          count: dateMap.get(key) ?? 0,
        });
      }

      result.push(week.reverse());
    }

    return result;
  }, [data]);

  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-100 dark:bg-gray-800";
    if (count < 2) return "bg-green-100 dark:bg-green-900";
    if (count < 5) return "bg-green-300 dark:bg-green-700";
    if (count < 10) return "bg-green-500 dark:bg-green-600";
    return "bg-green-700 dark:bg-green-500";
  };

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
                  className={`heatmap-cell ${getColor(day.count)}`}
                  title={`${day.date}: ${day.count} activities`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="heatmap-cell bg-gray-100 dark:bg-gray-800" />
          <div className="heatmap-cell bg-green-100 dark:bg-green-900" />
          <div className="heatmap-cell bg-green-300 dark:bg-green-700" />
          <div className="heatmap-cell bg-green-500 dark:bg-green-600" />
          <div className="heatmap-cell bg-green-700 dark:bg-green-500" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
