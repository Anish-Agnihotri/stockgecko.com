/**
 * Echarts export w/ tree-shaking setup
 */
import { Chart } from "svelte-echarts";
import { init, use } from "echarts/core";
import { ScatterChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components";

// Register used modules
use([ScatterChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

// Re-export
export { init, Chart };
