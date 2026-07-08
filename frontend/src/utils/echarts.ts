import type { TooltipComponentOption } from 'echarts'

/** 让 Tooltip 挂载到 body，避免被分栏 overflow:hidden 裁剪 */
export function overflowTooltip(options: TooltipComponentOption = {}): TooltipComponentOption {
  return {
    confine: false,
    appendTo: () => document.body,
    className: 'echarts-tooltip-portal',
    extraCssText: 'z-index:10001;pointer-events:none;',
    ...options,
  }
}
