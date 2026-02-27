import { useEffect } from 'react';
import * as d3 from 'd3';
import type { RoadmapData, D3NodeData } from './types';

interface UseRoadmapD3Options {
  roadmapData: RoadmapData | null;
  completedItems: Set<string>;
  toggleCompletion: (id: string) => void;
  resolvedTheme: string | undefined;
  svgRef: React.RefObject<SVGSVGElement | null>;
  zoomRef: React.MutableRefObject<d3.ZoomBehavior<SVGSVGElement, unknown> | null>;
  isMobile: boolean;
  setSelectedNode: (node: D3NodeData | null) => void;
  setShowDetails: (v: boolean) => void;
  setShowChatbot: (v: boolean) => void;
  setAutoMessage: (msg: { text: string; nodeTitle?: string } | null) => void;
}

export function useRoadmapD3({
  roadmapData, completedItems, toggleCompletion,
  resolvedTheme, svgRef, zoomRef, isMobile,
  setSelectedNode, setShowDetails, setShowChatbot, setAutoMessage,
}: UseRoadmapD3Options) {
  useEffect(() => {
    if (!roadmapData?.stages?.length || !svgRef.current) return;

    const dark = resolvedTheme === 'dark';

    const palette = {
      spine:        dark ? '#60a5fa' : '#3b82f6',
      stageFill:    dark ? '#1c1a0e' : '#fffbeb',
      stageStroke:  dark ? '#d97706' : '#f59e0b',
      stageAccent:  dark ? '#d97706' : '#f59e0b',
      stageText:    dark ? '#fde68a' : '#1c1917',
      itemFill:     dark ? '#111110' : '#ffffff',
      itemStroke:   dark ? '#44403c' : '#e5e7eb',
      itemText:     dark ? '#e7e5e4' : '#1c1917',
      itemSubText:  dark ? '#a8a29e' : '#78716c',
      doneFill:     dark ? '#052e16' : '#f0fdf4',
      doneStroke:   dark ? '#166534' : '#86efac',
      doneText:     dark ? '#86efac' : '#15803d',
      dot:          dark ? '#60a5fa' : '#3b82f6',
      topicText:    '#f97316',
      canvasBg:     dark ? '#0a0a0a' : '#f8fafc',
    };

    const SVG_W       = 1260;
    const CX          = SVG_W / 2;
    const STAGE_W     = 220;
    const STAGE_H     = 52;
    const STAGE_R     = 10;
    const ITEM_W      = 220;
    const ITEM_H      = 44;
    const ITEM_R      = 8;
    const ITEM_GAP_X  = 340;
    const ITEM_SPACING = 58;
    const STAGE_PAD   = 90;
    const TOP_PAD     = 100;

    const stages = roadmapData.stages;
    const stageYs: number[] = [];
    let curY = TOP_PAD;
    stages.forEach((stage, i) => {
      const fan = ((stage.items.length - 1) / 2) * ITEM_SPACING;
      if (i === 0) {
        curY += fan;
      } else {
        const prevFan = ((stages[i - 1].items.length - 1) / 2) * ITEM_SPACING;
        curY += prevFan + STAGE_PAD + fan;
      }
      stageYs.push(curY);
    });
    const lastFan = ((stages[stages.length - 1].items.length - 1) / 2) * ITEM_SPACING;
    const SVG_H = stageYs[stageYs.length - 1] + lastFan + TOP_PAD;

    const svg = d3.select(svgRef.current!);
    svg.selectAll('*').remove();
    svg.attr('width', SVG_W).attr('height', SVG_H)
       .style('background', palette.canvasBg)
       .style('transition', 'background 0.3s');

    const defs = svg.append('defs');
    defs.append('filter').attr('id', 'shadow-stage')
      .append('feDropShadow')
      .attr('dx', 0).attr('dy', 3).attr('stdDeviation', 6)
      .attr('flood-color', dark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.12)');
    defs.append('filter').attr('id', 'shadow-item')
      .append('feDropShadow')
      .attr('dx', 0).attr('dy', 2).attr('stdDeviation', 4)
      .attr('flood-color', dark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.08)');

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.04, 8])
      .interpolate(d3.interpolateZoom)
      .on('zoom', (event) => { g.attr('transform', event.transform); });
    zoomRef.current = zoom;
    svg.call(zoom as any).on('dblclick.zoom', null);

    const spineTop = stageYs[0] - STAGE_H / 2 - 32;
    const spineBot = stageYs[stageYs.length - 1] + STAGE_H / 2 + 32;

    g.append('line')
      .attr('x1', CX).attr('y1', spineTop)
      .attr('x2', CX).attr('y2', spineBot)
      .attr('stroke', palette.spine)
      .attr('stroke-width', 6)
      .attr('opacity', 0.07);

    g.append('line')
      .attr('x1', CX).attr('y1', spineTop)
      .attr('x2', CX).attr('y2', spineBot)
      .attr('stroke', palette.spine)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '6,4')
      .attr('opacity', 0.45);

    const titleY = spineTop - 16;
    const titleG = g.append('g').attr('transform', `translate(${CX},${titleY})`);
    titleG.append('rect')
      .attr('x', -110).attr('y', -16)
      .attr('width', 220).attr('height', 32)
      .attr('rx', 16)
      .attr('fill', dark ? 'rgba(249,115,22,0.15)' : 'rgba(249,115,22,0.10)')
      .attr('stroke', 'rgba(249,115,22,0.35)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5,3');
    titleG.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '14px').attr('font-weight', '700')
      .attr('letter-spacing', '0.8')
      .attr('fill', palette.topicText)
      .text(roadmapData.topic.length > 26 ? roadmapData.topic.substring(0, 24) + '…' : roadmapData.topic);

    function svgWrapText(
      el: d3.Selection<SVGTextElement, unknown, null, undefined>,
      text: string,
      maxW: number,
      lineH: number,
      maxLines = 2,
    ) {
      const words = text.split(/\s+/);
      let line: string[] = [];
      let lineNum = 0;
      el.text('');
      let tspan = el.append('tspan').attr('x', 0).attr('dy', '0em');
      for (const word of words) {
        line.push(word);
        tspan.text(line.join(' '));
        const node = tspan.node() as SVGTSpanElement | null;
        if (node && node.getComputedTextLength() > maxW && line.length > 1) {
          line.pop();
          tspan.text(line.join(' '));
          line = [word];
          lineNum++;
          if (lineNum >= maxLines) {
            const t = tspan.text();
            if (t.length > 24) tspan.text(t.substring(0, 22) + '…');
            break;
          }
          tspan = el.append('tspan').attr('x', 0).attr('dy', `${lineH}em`);
          tspan.text(word);
        }
      }
    }

    stages.forEach((stage, si) => {
      const stageY      = stageYs[si];
      const side        = si % 2 === 0 ? 1 : -1;
      const itemCX      = CX + side * ITEM_GAP_X;
      const stageEdgeX  = CX + side * (STAGE_W / 2);
      const itemEdgeX   = itemCX - side * (ITEM_W / 2);

      g.append('text')
        .attr('x', CX)
        .attr('y', stageY - STAGE_H / 2 - 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px').attr('font-weight', '500')
        .attr('letter-spacing', '1.5')
        .attr('fill', palette.spine).attr('opacity', 0.5)
        .attr('text-transform', 'uppercase')
        .text(`STAGE ${si + 1}`);

      const stageG = g.append('g')
        .attr('transform', `translate(${CX},${stageY})`)
        .style('cursor', 'pointer')
        .style('transition', 'transform 0.2s');

      stageG.append('rect')
        .attr('x', -STAGE_W / 2).attr('y', -STAGE_H / 2)
        .attr('width', STAGE_W).attr('height', STAGE_H)
        .attr('rx', STAGE_R)
        .attr('fill', palette.stageFill)
        .attr('stroke', palette.stageStroke)
        .attr('stroke-width', 1.8)
        .attr('stroke-dasharray', '7,3')
        .attr('filter', 'url(#shadow-stage)');

      stageG.append('rect')
        .attr('x', -STAGE_W / 2).attr('y', -STAGE_H / 2)
        .attr('width', 5).attr('height', STAGE_H)
        .attr('rx', STAGE_R)
        .attr('fill', palette.stageAccent)
        .attr('opacity', 0.9);

      const stageTxt = stageG.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '13px').attr('font-weight', '700')
        .attr('fill', palette.stageText)
        .attr('pointer-events', 'none');

      const stageWords = stage.title.split(/\s+/);
      let stageLine: string[] = [];
      const stageLines: string[] = [];
      const stageTmpSpan = stageTxt.append('tspan').attr('x', 0).attr('dy', '0em');
      for (const w of stageWords) {
        stageLine.push(w);
        stageTmpSpan.text(stageLine.join(' '));
        const sn = stageTmpSpan.node() as SVGTSpanElement | null;
        if (sn && sn.getComputedTextLength() > STAGE_W - 28 && stageLine.length > 1) {
          stageLine.pop();
          stageLines.push(stageLine.join(' '));
          stageLine = [w];
        }
      }
      if (stageLine.length) stageLines.push(stageLine.join(' '));
      stageTxt.select('tspan').remove();
      stageTxt.text('');
      const stageLH = 1.2;
      const stageOffsetY = -((stageLines.length - 1) * stageLH) / 2;
      stageLines.forEach((l, li) => {
        stageTxt.append('tspan')
          .attr('x', 4)
          .attr('dy', li === 0 ? `${stageOffsetY}em` : `${stageLH}em`)
          .text(l);
      });

      stageG
        .on('mouseenter', function() {
          d3.select(this).raise()
            .select('rect')
            .transition().duration(150)
            .attr('stroke-width', 2.5)
            .attr('filter', `drop-shadow(0 4px 14px ${dark ? 'rgba(217,119,6,0.45)' : 'rgba(245,158,11,0.4)'}`);
        })
        .on('mouseleave', function() {
          d3.select(this).select('rect')
            .transition().duration(150)
            .attr('stroke-width', 1.8)
            .attr('filter', 'url(#shadow-stage)');
        })
        .on('click', () => {
          setSelectedNode({ name: stage.title, type: 'stage', description: stage.description, stageIndex: si });
          setShowDetails(true);
          setShowChatbot(true);
          setAutoMessage({ text: `Tell me about "${stage.title}" in the context of ${roadmapData?.topic ?? 'this topic'}.`, nodeTitle: stage.title });
          if (isMobile) setShowDetails(false);
        });

      stage.items.forEach((item, ii) => {
        const offsetY = (ii - (stage.items.length - 1) / 2) * ITEM_SPACING;
        const itemY   = stageY + offsetY;
        const nodeId  = `${si}-${ii}`;
        const done    = completedItems.has(nodeId);
        const diffColor = '#6366f1';

        const midX = (stageEdgeX + itemEdgeX) / 2;
        g.append('path')
          .attr('d', `M ${stageEdgeX},${stageY} C ${midX},${stageY} ${midX},${itemY} ${itemEdgeX},${itemY}`)
          .attr('fill', 'none')
          .attr('stroke', palette.spine)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4,3')
          .attr('opacity', 0.4);

        g.append('circle').attr('cx', stageEdgeX).attr('cy', stageY)
          .attr('r', 3.5).attr('fill', palette.spine).attr('opacity', 0.6);
        g.append('circle').attr('cx', itemEdgeX).attr('cy', itemY)
          .attr('r', 3.5).attr('fill', palette.spine).attr('opacity', 0.6);

        const itemG = g.append('g')
          .attr('transform', `translate(${itemCX},${itemY})`)
          .style('cursor', 'pointer');

        itemG.append('rect')
          .attr('x', -ITEM_W / 2).attr('y', -ITEM_H / 2)
          .attr('width', ITEM_W).attr('height', ITEM_H)
          .attr('rx', ITEM_R)
          .attr('fill', done ? palette.doneFill : palette.itemFill)
          .attr('stroke', done ? palette.doneStroke : palette.itemStroke)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '6,3')
          .attr('filter', 'url(#shadow-item)');

        itemG.append('rect')
          .attr('x', -ITEM_W / 2).attr('y', -ITEM_H / 2)
          .attr('width', 4).attr('height', ITEM_H)
          .attr('rx', ITEM_R)
          .attr('fill', done ? '#22c55e' : diffColor)
          .attr('opacity', 0.85);

        if (done) {
          itemG.append('text')
            .attr('x', -ITEM_W / 2 + 14).attr('y', 1)
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '11px')
            .attr('fill', palette.doneText)
            .text('✓');
        }

        const itemTxt = itemG.append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', '11px').attr('font-weight', '500')
          .attr('fill', done ? palette.doneText : palette.itemText)
          .attr('pointer-events', 'none');
        svgWrapText(itemTxt as any, item.name, ITEM_W - (done ? 44 : 28), 1.15, 2);

        itemG.append('circle')
          .attr('cx', ITEM_W / 2 - 11).attr('cy', 0)
          .attr('r', 4.5)
          .attr('fill', diffColor)
          .attr('opacity', done ? 0.4 : 0.85);

        itemG
          .on('mouseenter', function() {
            d3.select(this).raise();
            d3.select(this).select('rect')
              .transition().duration(130)
              .attr('stroke-width', 2.2)
              .attr('filter', `drop-shadow(0 3px 12px ${dark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.18)'}`);
          })
          .on('mouseleave', function() {
            d3.select(this).select('rect')
              .transition().duration(130)
              .attr('stroke-width', 1.5)
              .attr('filter', 'url(#shadow-item)');
          })
          .on('click', () => {
            const nodeData: D3NodeData = {
              name: item.name, type: 'item', description: item.description,
              id: nodeId, stageIndex: si, itemIndex: ii,
            };
            setSelectedNode(nodeData);
            setShowDetails(true);
            setShowChatbot(true);
            setAutoMessage({ text: `Explain "${item.name}" in detail.`, nodeTitle: item.name });
            toggleCompletion(nodeId);
            if (isMobile) setShowDetails(false);
          });
      });
    });

    g.attr('opacity', 0);
    g.transition().duration(500).ease(d3.easeCubicOut).attr('opacity', 1);

    const containerEl = svgRef.current!.parentElement!;
    const cW = containerEl.clientWidth  || 800;
    const cH = containerEl.clientHeight || 600;
    const bounds = (g.node() as SVGGElement).getBBox();
    const scale  = Math.min(cW / (bounds.width + 100), cH / (bounds.height + 100)) * 0.88;
    const tx = cW / 2 - (bounds.x + bounds.width  / 2) * scale;
    const ty = cH / 2 - (bounds.y + bounds.height / 2) * scale;

    svg.transition().duration(650).ease(d3.easeCubicInOut).call(
      zoom.transform as any,
      d3.zoomIdentity.translate(tx, ty).scale(scale),
    );
  }, [roadmapData, completedItems, toggleCompletion, resolvedTheme]);
}
