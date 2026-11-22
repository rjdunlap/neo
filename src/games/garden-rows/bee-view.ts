import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { beeLayout, CHECK_W, GATE_SIZE, PREVIEW_H, PREVIEW_W } from './bee-layout';
import { sightline, type BeePuzzle } from './logic';

const HEIGHT = [23, 49, 75];
const COLORS = [swatch.white, swatch.pink, swatch.purple];

function label(words: string, size: number) {
  const text = new Text({
    text: words,
    style: { fill: ink, fontFamily: 'sans-serif', fontSize: size, fontWeight: 'bold', align: 'center' },
  });
  text.anchor.set(0.5);
  text.eventMode = 'none';
  return text;
}

function button(w: number, h: number, words: string, size: number, action: () => void) {
  const node = new Container();
  const face = new Graphics();
  const title = label(words, size);
  node.addChild(face, title);
  node.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
  onTap(node, action);
  return { node, face, title };
}

export function drawHeight(g: Graphics, x: number, y: number, height: number, alpha = 1, scale = 1) {
  const top = y - HEIGHT[height] * scale;
  const color = COLORS[height];
  g.moveTo(x, y)
    .lineTo(x, top)
    .stroke({ width: 5 * scale, color: swatch.green.line, alpha });
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    g.circle(x + Math.cos(angle) * 8 * scale, top + Math.sin(angle) * 8 * scale, 6 * scale);
  }
  g.fill({ color: color.fill, alpha }).stroke({ width: 2 * scale, color: color.line, alpha });
  g.circle(x, top, 5 * scale).fill({ color: swatch.yellow.fill, alpha });
  return top;
}

function drawBee(g: Graphics, x: number, y: number) {
  g.ellipse(x - 7, y - 9, 9, 5).fill(swatch.blue.light);
  g.ellipse(x, y, 14, 9).fill(swatch.yellow.fill).stroke({ width: 2, color: ink });
  g.moveTo(x - 5, y - 8)
    .lineTo(x - 5, y + 8)
    .stroke({ width: 3, color: ink });
  g.circle(x + 7, y - 2, 2).fill(ink);
}

const SAMPLE = [1, 0, 2];

export class BeeGardenView extends Container {
  readonly gates;
  readonly check;
  readonly sampleEnds;
  private readonly art = new Graphics();
  private readonly legend = label('', 22);
  private readonly bee = new Graphics();

  constructor(
    readonly puzzle: BeePuzzle,
    open: (id: number) => void,
    check: () => void,
    sample: (side: number) => void,
  ) {
    super();
    this.gates = puzzle.gates.map(({ goal }, id) =>
      button(GATE_SIZE, GATE_SIZE, String(goal), 38, () => open(id)),
    );
    this.check = button(CHECK_W, GATE_SIZE, 'Ask the bee', 27, check);
    this.sampleEnds = [0, 1].map((side) =>
      button(GATE_SIZE, GATE_SIZE, String(side === 0 ? 2 : 1), 38, () => sample(side)),
    );
    for (const graphic of [this.art, this.bee]) graphic.eventMode = 'none';
    drawBee(this.bee, 0, 0);
    this.bee.visible = false;
    this.addChild(
      this.art,
      this.legend,
      ...this.gates.map((g) => g.node),
      this.check.node,
      ...this.sampleEnds.map((g) => g.node),
      this.bee,
    );
  }

  place(view: View, sampleSide: number | null) {
    const l = beeLayout(view);
    this.gates.forEach(({ node }, id) => node.position.set(l.gates[id].x, l.gates[id].y));
    this.check.node.position.set(l.check.x, l.check.y);
    const preview = sampleSide === null ? l.preview : { x: l.board.x + 150, y: l.board.y + 150 };
    this.art.position.set(preview.x, preview.y);
    this.legend.position.set(preview.x, preview.y - 46);
    this.sampleEnds.forEach(({ node }, side) =>
      node.position.set(preview.x + (side === 0 ? -200 : 200), preview.y),
    );
  }

  draw(
    flowers: readonly (number | null)[],
    selected: number | null,
    hint: readonly number[],
    ready: boolean,
    sampleSide: number | null,
  ) {
    const sample = sampleSide !== null;
    const viewer = selected === null && !sample ? [] : flowers;
    const { visible, count } = sightline(viewer);
    this.legend.text =
      viewer.length === 0 ? 'Tap a gate' : count === null ? 'Bee’s view' : `Bee sees ${count}`;
    const g = this.art.clear();
    g.roundRect(-PREVIEW_W / 2, -PREVIEW_H / 2, PREVIEW_W, PREVIEW_H, 20)
      .fill(cream)
      .stroke({ width: 4, color: wood.line });
    g.moveTo(-121, 49).lineTo(124, 49).stroke({ width: 3, color: wood.line });
    const right = sampleSide === 1;
    // In the example the bed stays put and the bee changes ends.
    drawBee(g, right ? 116 : -116, 28);
    for (let i = 0; i < 3; i++) {
      const x = -73 + 73 * i;
      const fromGate = right ? 2 - i : i;
      const flower = viewer[fromGate];
      if (flower === undefined || flower === null) {
        g.ellipse(x, 46, 10, 4).fill({ color: wood.line, alpha: 0.3 });
        continue;
      }
      const top = drawHeight(g, x, 49, flower, visible[fromGate] ? 1 : 0.28, 0.91);
      if (visible[fromGate]) g.circle(x, top, 15).stroke({ width: 2.5, color: swatch.teal.line });
    }
    this.gates.forEach((gate, id) => {
      gate.node.visible = !sample;
      const active = id === selected;
      const highlighted = hint.includes(id);
      this.drawGate(gate.face, active, highlighted);
      const y = active ? 19 : 0;
      gate.title.position.set(0, y);
      if (active) drawBee(gate.face, 0, -20);
    });
    this.sampleEnds.forEach((gate, side) => {
      gate.node.visible = sample;
      this.drawGate(gate.face, side === sampleSide, false);
    });
    this.check.title.text = sample ? 'Plant the bed' : 'Ask the bee';
    this.check.node.alpha = ready || sample ? 1 : 0.48;
    this.check.node.eventMode = ready || sample ? 'static' : 'none';
    this.check.face
      .clear()
      .roundRect(-CHECK_W / 2, -50, CHECK_W, 100, 24)
      .fill(swatch.yellow.light)
      .stroke({ width: 4, color: wood.line });
  }

  private drawGate(face: Graphics, active: boolean, hint: boolean) {
    face
      .clear()
      .roundRect(-44, -44, 88, 88, 19)
      .fill(active ? swatch.teal.light : cream)
      .stroke({ width: hint ? 7 : active ? 5 : 3, color: hint ? swatch.orange.line : wood.line });
    if (hint) face.roundRect(-37, -37, 74, 74, 13).stroke({ width: 2, color: ink });
  }

  sampleLine(side: number) {
    return side === 0 ? SAMPLE : [...SAMPLE].reverse();
  }

  celebrate(t: number) {
    const first = this.gates[0].node;
    const last = this.gates[11].node;
    this.bee.visible = true;
    this.bee.position.set(first.x + (last.x - first.x) * t, first.y + 70 + 85 * Math.sin(t * Math.PI * 2));
  }
}
