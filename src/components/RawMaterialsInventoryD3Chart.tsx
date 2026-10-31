import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RawMaterialStockItem, MaterialQueueRequirement } from '../types';

interface RawMaterialsInventoryD3ChartProps {
  inventory: RawMaterialStockItem[];
  requirements: MaterialQueueRequirement[];
}

export function RawMaterialsInventoryD3Chart({
  inventory,
  requirements,
}: RawMaterialsInventoryD3ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || inventory.length === 0) return;

    // Clear previous elements
    const svgElement = d3.select(svgRef.current);
    svgElement.selectAll('*').remove();

    // Responsive width calculation
    const containerWidth = containerRef.current.clientWidth;
    const height = 240;
    const margin = { top: 25, right: 20, bottom: 45, left: 45 };
    const width = containerWidth - margin.left - margin.right;

    // Setup SVG attributes
    svgElement
      .attr('width', containerWidth)
      .attr('height', height)
      .style('overflow', 'visible');

    const chart = svgElement
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Prepare data
    const chartData = inventory.map((item) => {
      const req = requirements.find((r) => r.materialId === item.id);
      return {
        id: item.id,
        name: item.name.replace(' Rheology & Anti-Foam Additive Package', '').replace(' Additive Package', '').replace(' Package', '').substring(0, 15),
        currentStockKg: item.currentStockKg,
        criticalThresholdKg: item.criticalThresholdKg,
        color: req?.color || '#a855f7',
        status: req?.status || 'optimal',
      };
    });

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(chartData.map((d) => d.name))
      .range([0, width])
      .padding(0.35);

    const maxStock = d3.max(chartData, (d) => Math.max(d.currentStockKg, d.criticalThresholdKg * 1.5)) || 1000;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxStock * 1.1])
      .range([height - margin.top - margin.bottom, 0]);

    // Gridlines (Y axis)
    const yGrid = d3.axisLeft(yScale).tickSize(-width).tickFormat(() => '');
    chart
      .append('g')
      .attr('class', 'y-grid')
      .style('stroke', '#1e293b')
      .style('stroke-dasharray', '2, 2')
      .style('opacity', 0.6)
      .call(yGrid);

    // Axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    // X Axis group
    chart
      .append('g')
      .attr('transform', `translate(0, ${height - margin.top - margin.bottom})`)
      .call(xAxis)
      .selectAll('text')
      .style('fill', '#94a3b8')
      .style('font-family', 'ui-monospace, monospace')
      .style('font-size', '9px')
      .attr('transform', 'rotate(-10)')
      .style('text-anchor', 'end');

    // Y Axis group
    chart
      .append('g')
      .call(yAxis)
      .selectAll('text')
      .style('fill', '#94a3b8')
      .style('font-family', 'ui-monospace, monospace')
      .style('font-size', '9px');

    chart.selectAll('.domain, .tick line').style('stroke', '#334155');

    // Create Tooltip container
    const tooltip = d3
      .select(containerRef.current)
      .append('div')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', '#0f172a')
      .style('border', '1px solid #334155')
      .style('padding', '6px 10px')
      .style('border-radius', '8px')
      .style('font-family', 'ui-monospace, monospace')
      .style('font-size', '10px')
      .style('color', '#f1f5f9')
      .style('pointer-events', 'none')
      .style('box-shadow', '0 4px 12px rgba(0,0,0,0.5)')
      .style('z-index', '10');

    // Draw Bars (Current stock)
    chart
      .selectAll('.bar-current')
      .data(chartData)
      .enter()
      .append('rect')
      .attr('class', 'bar-current')
      .attr('x', (d) => xScale(d.name) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', height - margin.top - margin.bottom) // Start from bottom for transition
      .attr('height', 0)
      .attr('rx', 3)
      .style('fill', (d) => {
        if (d.status === 'critical') return '#ef4444'; // Red
        if (d.status === 'warning') return '#f59e0b'; // Amber
        return '#10b981'; // Emerald
      })
      .style('opacity', 0.85)
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        d3.select(this).style('opacity', 1).style('stroke', '#6366f1').style('stroke-width', '1.5px');
        tooltip
          .html(
            `<div class="font-bold text-white mb-1">${d.name}</div>
             <div class="flex justify-between gap-4"><span>Current:</span> <strong style="color: ${d.status === 'critical' ? '#ef4444' : d.status === 'warning' ? '#f59e0b' : '#10b981'}">${d.currentStockKg} kg</strong></div>
             <div class="flex justify-between gap-4"><span>Threshold:</span> <strong class="text-amber-400">${d.criticalThresholdKg} kg</strong></div>`
          )
          .style('visibility', 'visible');
      })
      .on('mousemove', function (event) {
        const [x, y] = d3.pointer(event, containerRef.current);
        tooltip.style('left', `${x + 15}px`).style('top', `${y - 45}px`);
      })
      .on('mouseout', function () {
        d3.select(this).style('opacity', 0.85).style('stroke', 'none');
        tooltip.style('visibility', 'hidden');
      })
      .transition()
      .duration(800)
      .ease(d3.easeCubicOut)
      .attr('y', (d) => yScale(d.currentStockKg))
      .attr('height', (d) => height - margin.top - margin.bottom - yScale(d.currentStockKg));

    // Draw safety threshold markers (dash lines)
    chart
      .selectAll('.threshold-line')
      .data(chartData)
      .enter()
      .append('line')
      .attr('class', 'threshold-line')
      .attr('x1', (d) => xScale(d.name) || 0)
      .attr('x2', (d) => (xScale(d.name) || 0) + xScale.bandwidth())
      .attr('y1', (d) => yScale(d.criticalThresholdKg))
      .attr('y2', (d) => yScale(d.criticalThresholdKg))
      .style('stroke', '#f43f5e') // Rose red for threshold
      .style('stroke-width', '2px')
      .style('stroke-dasharray', '3, 2')
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        tooltip
          .html(`<div>Critical Threshold: <strong class="text-rose-400">${d.criticalThresholdKg} kg</strong></div>`)
          .style('visibility', 'visible');
      })
      .on('mousemove', function (event) {
        const [x, y] = d3.pointer(event, containerRef.current);
        tooltip.style('left', `${x + 15}px`).style('top', `${y - 30}px`);
      })
      .on('mouseout', function () {
        tooltip.style('visibility', 'hidden');
      });

    // Handle cleanups
    return () => {
      tooltip.remove();
    };
  }, [inventory, requirements]);

  // Observe container size to re-render chart on layout resize
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      // Trigger state change or effect re-run by referencing width
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden bg-slate-950 p-3 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
          Real-Time Inventory Levels vs Safety Thresholds
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-1.5 bg-emerald-500 rounded-sm" />
            <span className="text-slate-400">Current Stock</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-rose-500" />
            <span className="text-slate-400">Threshold</span>
          </div>
        </div>
      </div>
      <svg ref={svgRef} className="mx-auto" />
    </div>
  );
}
