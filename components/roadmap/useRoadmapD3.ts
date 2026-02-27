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

    // ── Per-stage color palette ────────────────────────────────────────────
    const STAGE_COLORS = [
      { fill: dark ? '#1e1b4b' : '#eef2ff', stroke: '#818cf8', accent: '#6366f1', text: dark ? '#a5b4fc' : '#4338ca', glow: '99,102,241',   header: dark ? '#312e81' : '#c7d2fe' },
      { fill: dark ? '#431407' : '#fff7ed', stroke: '#fb923c', accent: '#f97316', text: dark ? '#fdba74' : '#c2410c', glow: '249,115,22',   header: dark ? '#7c2d12' : '#fed7aa' },
      { fill: dark ? '#052e16' : '#f0fdf4', stroke: '#34d399', accent: '#10b981', text: dark ? '#6ee7b7' : '#065f46', glow: '16,185,129',  header: dark ? '#064e3b' : '#a7f3d0' },
      { fill: dark ? '#2e1065' : '#faf5ff', stroke: '#c084fc', accent: '#a855f7', text: dark ? '#e9d5ff' : '#7e22ce', glow: '168,85,247',  header: dark ? '#4c1d95' : '#e9d5ff' },
      { fill: dark ? '#0c4a6e' : '#f0f9ff', stroke: '#38bdf8', accent: '#0ea5e9', text: dark ? '#bae6fd' : '#0369a1', glow: '14,165,233',  header: dark ? '#0c4a6e' : '#bae6fd' },
      { fill: dark ? '#422006' : '#fffbeb', stroke: '#fbbf24', accent: '#f59e0b', text: dark ? '#fde68a' : '#92400e', glow: '245,158,11',  header: dark ? '#78350f' : '#fde68a' },
    ];

    // ── Layout constants ───────────────────────────────────────────────────
    const SVG_W        = 1420;
    const CX           = SVG_W / 2;
    const STAGE_W      = 280;
    const STAGE_H      = 76;
    const STAGE_R      = 14;
    const ITEM_W       = 268;
    const ITEM_H       = 70;
    const ITEM_R       = 14;
    const ITEM_GAP_X   = 400;
    const ITEM_SPACING = 80;
    const STAGE_PAD    = 120;
    const TOP_PAD      = 140;

    const stages = roadmapData.stages;

    // ── Compute stage Y positions ──────────────────────────────────────────
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

    // ── SVG setup ──────────────────────────────────────────────────────────
    const svg = d3.select(svgRef.current!);
    svg.selectAll('*').remove();
    svg.attr('width', SVG_W).attr('height', SVG_H)
      .style('background', 'transparent')
      .style('transition', 'background 0.3s');

    // ── Defs: filters + gradients + dot-grid ──────────────────────────────
    const defs = svg.append('defs');

    // Glow filter for active stages
    stages.forEach((_, si) => {
      const sc = STAGE_COLORS[si % STAGE_COLORS.length];
      const flt = defs.append('filter').attr('id', `glow-${si}`);
      flt.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
      const merge = flt.append('feMerge');
      merge.append('feMergeNode').attr('in', 'blur');
      merge.append('feMergeNode').attr('in', 'SourceGraphic');
      // Stage card shadow
      const shdw = defs.append('filter').attr('id', `shade-stage-${si}`);
      shdw.append('feDropShadow').attr('dx', 0).attr('dy', 4).attr('stdDeviation', 10)
        .attr('flood-color', `rgba(${sc.glow},${dark ? '0.55' : '0.20'})`);
    });

    const itemShadow = defs.append('filter').attr('id', 'shade-item');
    itemShadow.append('feDropShadow').attr('dx', 0).attr('dy', 3).attr('stdDeviation', 7)
      .attr('flood-color', dark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.10)');

    // Done shadow
    const doneShadow = defs.append('filter').attr('id', 'shade-done');
    doneShadow.append('feDropShadow').attr('dx', 0).attr('dy', 3).attr('stdDeviation', 7)
      .attr('flood-color', 'rgba(34,197,94,0.35)');

    // Per-stage linear gradients (item + stage card)
    stages.forEach((_, si) => {
      const sc = STAGE_COLORS[si % STAGE_COLORS.length];
      // Item gradient: accent tint on left → neutral on right
      const ig = defs.append('linearGradient').attr('id', `item-grad-${si}`)
        .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%');
      ig.append('stop').attr('offset', '0%')
        .attr('stop-color', sc.accent).attr('stop-opacity', dark ? 0.28 : 0.16);
      ig.append('stop').attr('offset', '42%')
        .attr('stop-color', dark ? '#141414' : '#ffffff').attr('stop-opacity', 1);
      ig.append('stop').attr('offset', '100%')
        .attr('stop-color', dark ? '#141414' : '#ffffff').attr('stop-opacity', 1);
      // Stage gradient
      const sg = defs.append('linearGradient').attr('id', `stage-grad-${si}`)
        .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%');
      sg.append('stop').attr('offset', '0%')
        .attr('stop-color', sc.accent).attr('stop-opacity', dark ? 0.38 : 0.24);
      sg.append('stop').attr('offset', '55%')
        .attr('stop-color', sc.fill).attr('stop-opacity', 1);
      sg.append('stop').attr('offset', '100%')
        .attr('stop-color', sc.fill).attr('stop-opacity', 1);
    });
    // Done item gradient
    const dg = defs.append('linearGradient').attr('id', 'done-grad')
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%');
    dg.append('stop').attr('offset', '0%')
      .attr('stop-color', '#22c55e').attr('stop-opacity', dark ? 0.30 : 0.18);
    dg.append('stop').attr('offset', '45%')
      .attr('stop-color', dark ? '#0a1a10' : '#f0fdf4').attr('stop-opacity', 1);
    dg.append('stop').attr('offset', '100%')
      .attr('stop-color', dark ? '#0a1a10' : '#f0fdf4').attr('stop-opacity', 1);

    // Dot-grid pattern
    const dotSpacing = 24;
    const dotR = dark ? 1.1 : 1.0;
    const dotColor = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
    const pattern = defs.append('pattern')
      .attr('id', 'dot-grid')
      .attr('width', dotSpacing).attr('height', dotSpacing)
      .attr('patternUnits', 'userSpaceOnUse');
    pattern.append('circle')
      .attr('cx', dotSpacing / 2).attr('cy', dotSpacing / 2)
      .attr('r', dotR).attr('fill', dotColor);

    // ── Canvas background rect with dot grid ──────────────────────────────
    svg.insert('rect', ':first-child')
      .attr('width', '100%').attr('height', '100%')
      .attr('fill', dark ? '#0a0a0a' : '#f8fafc');
    svg.insert('rect', ':nth-child(2)')
      .attr('width', '100%').attr('height', '100%')
      .attr('fill', 'url(#dot-grid)');

    // ── Zoom ──────────────────────────────────────────────────────────────
    const g = svg.append('g');
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.04, 8])
      .interpolate(d3.interpolateZoom)
      .on('zoom', (event) => { g.attr('transform', event.transform); });
    zoomRef.current = zoom;
    svg.call(zoom as any).on('dblclick.zoom', null);

    // ── Spine ─────────────────────────────────────────────────────────────
    const spineTop = stageYs[0] - STAGE_H / 2 - 48;
    const spineBot = stageYs[stageYs.length - 1] + STAGE_H / 2 + 48;

    g.append('line')
      .attr('x1', CX).attr('y1', spineTop)
      .attr('x2', CX).attr('y2', spineBot)
      .attr('stroke', dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
      .attr('stroke-width', 8);
    g.append('line')
      .attr('x1', CX).attr('y1', spineTop)
      .attr('x2', CX).attr('y2', spineBot)
      .attr('stroke', dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5,5');

    // ── Topic title badge ─────────────────────────────────────────────────
    const titleY = spineTop - 24;
    const titleG = g.append('g').attr('transform', `translate(${CX},${titleY})`);

    // Outer glow
    titleG.append('rect')
      .attr('x', -130).attr('y', -22).attr('width', 260).attr('height', 44).attr('rx', 22)
      .attr('fill', dark ? 'rgba(249,115,22,0.08)' : 'rgba(249,115,22,0.07)')
      .attr('stroke', 'none');
    // Main pill
    titleG.append('rect')
      .attr('x', -122).attr('y', -18).attr('width', 244).attr('height', 36).attr('rx', 18)
      .attr('fill', dark ? 'rgba(249,115,22,0.18)' : 'rgba(249,115,22,0.12)')
      .attr('stroke', 'rgba(249,115,22,0.45)')
      .attr('stroke-width', 1.5);
    // Dot decorations
    [-108, 108].forEach(x => {
      titleG.append('circle').attr('cx', x).attr('cy', 0).attr('r', 3)
        .attr('fill', 'rgba(249,115,22,0.6)');
    });
    titleG.append('text')
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('font-size', '14px').attr('font-weight', '700')
      .attr('letter-spacing', '0.5')
      .attr('fill', '#f97316')
      .text(roadmapData.topic.length > 28 ? roadmapData.topic.substring(0, 26) + '…' : roadmapData.topic);

    // ── Text wrap helper ──────────────────────────────────────────────────
    function svgWrapText(
      el: d3.Selection<SVGTextElement, unknown, null, undefined>,
      text: string,
      maxW: number,
      lineH: number,
      maxLines = 2,
      xCenter = 0,
    ) {
      const words = text.split(/\s+/);
      let line: string[] = [];
      let lineNum = 0;
      el.text('');
      let tspan = el.append('tspan').attr('x', xCenter).attr('dy', '0em');
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
            if (t.length > 22) tspan.text(t.substring(0, 20) + '…');
            break;
          }
          tspan = el.append('tspan').attr('x', xCenter).attr('dy', `${lineH}em`);
          tspan.text(word);
        }
      }
    }

    // ── Render stages ─────────────────────────────────────────────────────
    stages.forEach((stage, si) => {
      const sc         = STAGE_COLORS[si % STAGE_COLORS.length];
      const stageY     = stageYs[si];
      const side       = si % 2 === 0 ? 1 : -1;
      const itemCX     = CX + side * ITEM_GAP_X;
      const stageEdgeX = CX + side * (STAGE_W / 2 + 4);
      const itemEdgeX  = itemCX - side * (ITEM_W / 2 + 4);
      const staggerMs  = si * 120;

      // ── Bezier connectors (rendered BELOW stage/item groups) ────────────
      stage.items.forEach((_, ii) => {
        const offsetY = (ii - (stage.items.length - 1) / 2) * ITEM_SPACING;
        const itemY   = stageY + offsetY;
        const midX    = (stageEdgeX + itemEdgeX) / 2;

        // Connector glow
        g.append('path')
          .attr('d', `M ${stageEdgeX},${stageY} C ${midX},${stageY} ${midX},${itemY} ${itemEdgeX},${itemY}`)
          .attr('fill', 'none')
          .attr('stroke', sc.accent)
          .attr('stroke-width', 3.5)
          .attr('opacity', 0.08);

        // Connector main line
        g.append('path')
          .attr('d', `M ${stageEdgeX},${stageY} C ${midX},${stageY} ${midX},${itemY} ${itemEdgeX},${itemY}`)
          .attr('fill', 'none')
          .attr('stroke', sc.accent)
          .attr('stroke-width', 1.8)
          .attr('opacity', 0.45);

        // End-cap dots
        g.append('circle').attr('cx', stageEdgeX).attr('cy', stageY)
          .attr('r', 3.5).attr('fill', sc.accent).attr('opacity', 0.6);
        g.append('circle').attr('cx', itemEdgeX).attr('cy', itemY)
          .attr('r', 3.5).attr('fill', sc.accent).attr('opacity', 0.6);
      });

      // ── Stage card ────────────────────────────────────────────────────
      const stageG = g.append('g')
        .attr('transform', `translate(${CX},${stageY})`)
        .style('cursor', 'pointer')
        .attr('opacity', 0);

      // Card body — gradient fill, no header strip
      stageG.append('rect')
        .attr('x', -STAGE_W / 2).attr('y', -STAGE_H / 2)
        .attr('width', STAGE_W).attr('height', STAGE_H)
        .attr('rx', STAGE_R)
        .attr('fill', `url(#stage-grad-${si})`)
        .attr('stroke', sc.stroke)
        .attr('stroke-width', 1.5)
        .attr('filter', `url(#shade-stage-${si})`);

      // Stage number badge — floating above the card, centered on top edge
      const bR = 16; // circle radius
      const badgeOutY = -STAGE_H / 2; // sits centered on top border
      // Badge shadow circle (glow ring)
      stageG.append('circle')
        .attr('cx', 0).attr('cy', badgeOutY)
        .attr('r', bR + 4)
        .attr('fill', sc.accent).attr('opacity', dark ? 0.18 : 0.12);
      // Badge circle
      stageG.append('circle')
        .attr('cx', 0).attr('cy', badgeOutY)
        .attr('r', bR)
        .attr('fill', sc.accent);
      // Inner highlight
      stageG.append('circle')
        .attr('cx', 0).attr('cy', badgeOutY)
        .attr('r', bR - 5)
        .attr('fill', 'rgba(255,255,255,0.20)');
      // Number text
      stageG.append('text')
        .attr('x', 0).attr('y', badgeOutY + 0.5)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('font-size', '12px').attr('font-weight', '900')
        .attr('fill', '#fff').attr('pointer-events', 'none')
        .text(`${si + 1}`);

      // Stage title — truly centered in card
      const stageBodyCY = 4;
      const stageTxt = stageG.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('y', stageBodyCY)
        .attr('font-size', '13.5px').attr('font-weight', '700')
        .attr('fill', sc.text)
        .attr('pointer-events', 'none');

      // Word-wrap stage title
      const stageWords = stage.title.split(/\s+/);
      let stageLine: string[] = [];
      const stageLines: string[] = [];
      const stageTmpSpan = stageTxt.append('tspan').attr('x', 0).attr('dy', '0em');
      for (const w of stageWords) {
        stageLine.push(w);
        stageTmpSpan.text(stageLine.join(' '));
        const sn = stageTmpSpan.node() as SVGTSpanElement | null;
        if (sn && sn.getComputedTextLength() > STAGE_W - 32 && stageLine.length > 1) {
          stageLine.pop();
          stageLines.push(stageLine.join(' '));
          stageLine = [w];
        }
      }
      if (stageLine.length) stageLines.push(stageLine.join(' '));
      stageTxt.select('tspan').remove();
      stageTxt.text('');
      const stageLH = 1.25;
      const stageOffY = -((stageLines.length - 1) * stageLH) / 2;
      stageLines.forEach((l, li) => {
        stageTxt.append('tspan')
          .attr('x', 0)
          .attr('dy', li === 0 ? `${stageOffY}em` : `${stageLH}em`)
          .text(l);
      });

      // Staggered fade-in
      stageG.transition().delay(staggerMs).duration(400).ease(d3.easeCubicOut).attr('opacity', 1);

      stageG
        .on('mouseenter', function () {
          d3.select(this).raise();
          d3.select(this).select('rect')
            .transition().duration(150)
            .attr('stroke-width', 2.5)
            .attr('filter', `drop-shadow(0 6px 18px rgba(${sc.glow},${dark ? '0.60' : '0.35'}))`);
        })
        .on('mouseleave', function () {
          d3.select(this).select('rect')
            .transition().duration(150)
            .attr('stroke-width', 1.5)
            .attr('filter', `url(#shade-stage-${si})`);
        })
        .on('click', () => {
          setSelectedNode({ name: stage.title, type: 'stage', description: stage.description, stageIndex: si });
          setShowDetails(true);
          setShowChatbot(true);
          setAutoMessage({ text: `Tell me about "${stage.title}" in the context of ${roadmapData?.topic ?? 'this topic'}.`, nodeTitle: stage.title });
          if (isMobile) setShowDetails(false);
        });

      // ── Item nodes ───────────────────────────────────────────────────
      stage.items.forEach((item, ii) => {
        const offsetY  = (ii - (stage.items.length - 1) / 2) * ITEM_SPACING;
        const itemY    = stageY + offsetY;
        const nodeId   = `${si}-${ii}`;
        const done     = completedItems.has(nodeId);
        const itemDelay = staggerMs + 60 + ii * 50;

        const itemG = g.append('g')
          .attr('transform', `translate(${itemCX},${itemY})`)
          .style('cursor', 'pointer')
          .attr('opacity', 0);

        // Item card — gradient fill
        itemG.append('rect')
          .attr('x', -ITEM_W / 2).attr('y', -ITEM_H / 2)
          .attr('width', ITEM_W).attr('height', ITEM_H)
          .attr('rx', ITEM_R)
          .attr('fill', done ? 'url(#done-grad)' : `url(#item-grad-${si})`)
          .attr('stroke', done ? '#22c55e' : sc.stroke)
          .attr('stroke-width', done ? 2 : 1.5)
          .attr('filter', done ? 'url(#shade-done)' : 'url(#shade-item)');

        // Left colored circle badge (number or checkmark)
        const badgeCX = -ITEM_W / 2 + 24;
        itemG.append('circle')
          .attr('cx', badgeCX).attr('cy', 0)
          .attr('r', 15)
          .attr('fill', done ? '#22c55e' : sc.accent)
          .attr('opacity', done ? 1 : 0.90);
        // Inner circle for depth
        itemG.append('circle')
          .attr('cx', badgeCX).attr('cy', 0)
          .attr('r', 10)
          .attr('fill', 'rgba(255,255,255,0.18)');
        itemG.append('text')
          .attr('x', badgeCX).attr('y', 0.5)
          .attr('dominant-baseline', 'middle').attr('text-anchor', 'middle')
          .attr('font-size', '11px').attr('font-weight', '800')
          .attr('fill', '#fff').attr('pointer-events', 'none')
          .text(done ? '✓' : `${ii + 1}`);

        // Item title
        const textStartX = -ITEM_W / 2 + 24 + 15 + 10; // right of badge
        const textEndX   = ITEM_W / 2 - 20;             // left of right pill
        const textMaxW   = textEndX - textStartX;
        const textMidX   = textStartX + textMaxW / 2;
        const itemTxt = itemG.append('text')
          .attr('x', textMidX).attr('y', 0)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', '11.5px').attr('font-weight', '600')
          .attr('fill', done ? (dark ? '#86efac' : '#15803d') : (dark ? '#e2e2e2' : '#1c1917'))
          .attr('pointer-events', 'none');
        svgWrapText(itemTxt as any, item.name, textMaxW, 1.2, 2, textMidX);

        // Right status pill
        const pillCX = ITEM_W / 2 - 16;
        itemG.append('circle')
          .attr('cx', pillCX).attr('cy', 0)
          .attr('r', 7)
          .attr('fill', done ? '#22c55e' : (dark ? '#2a2a2a' : sc.header))
          .attr('stroke', done ? '#16a34a' : sc.accent)
          .attr('stroke-width', 1.5)
          .attr('opacity', 1);
        if (done) {
          itemG.append('text')
            .attr('x', pillCX).attr('y', 0.5)
            .attr('dominant-baseline', 'middle').attr('text-anchor', 'middle')
            .attr('font-size', '8px').attr('fill', '#fff').attr('font-weight', '700')
            .attr('pointer-events', 'none').text('✓');
        }

        // Staggered fade-in
        itemG.transition().delay(itemDelay).duration(350).ease(d3.easeCubicOut).attr('opacity', 1);

        itemG
          .on('mouseenter', function () {
            d3.select(this).raise();
            d3.select(this).select('rect')
              .transition().duration(130)
              .attr('stroke-width', done ? 2.5 : 2.2)
              .attr('filter', `drop-shadow(0 4px 14px rgba(${done ? '34,197,94' : sc.glow},${dark ? '0.55' : '0.28'}))`);
          })
          .on('mouseleave', function () {
            d3.select(this).select('rect')
              .transition().duration(130)
              .attr('stroke-width', done ? 1.8 : 1.4)
              .attr('filter', done ? 'url(#shade-done)' : 'url(#shade-item)');
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

    // ── Initial fit-to-screen ──────────────────────────────────────────────
    const containerEl = svgRef.current!.parentElement!;
    const cW = containerEl.clientWidth  || 800;
    const cH = containerEl.clientHeight || 600;
    const bounds = (g.node() as SVGGElement).getBBox();
    const scale  = Math.min(cW / (bounds.width + 120), cH / (bounds.height + 120)) * 0.88;
    const tx = cW / 2 - (bounds.x + bounds.width  / 2) * scale;
    const ty = cH / 2 - (bounds.y + bounds.height / 2) * scale;

    svg.call(zoom.transform as any, d3.zoomIdentity.translate(tx, ty).scale(scale));

  }, [roadmapData, completedItems, toggleCompletion, resolvedTheme]);
}
