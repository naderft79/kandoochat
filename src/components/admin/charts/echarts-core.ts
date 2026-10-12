// هسته ECharts با ماژول های لازم فقط (تری شیک برای کاهش حجم بسته نهایی)
import { init, use as registerEcharts, type ECharts, type EChartsCoreOption } from "echarts/core";
import { LineChart, BarChart, PieChart, FunnelChart, GaugeChart, HeatmapChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  VisualMapComponent,
  GraphicComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

registerEcharts([
  LineChart,
  BarChart,
  PieChart,
  FunnelChart,
  GaugeChart,
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  VisualMapComponent,
  GraphicComponent,
  CanvasRenderer,
]);

export { init };
export type { ECharts, EChartsCoreOption };
