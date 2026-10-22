import { fieldBoxInPdf, textBaselinesInBox } from './coordinates';

describe('fieldBoxInPdf', () => {
  const W = 595;
  const H = 842;

  it('maps editor top-left box to PDF bottom-left image rect', () => {
    const box = fieldBoxInPdf({ x: 0.1, y: 0.2, width: 0.3, height: 0.1 }, W, H);
    expect(box.left).toBeCloseTo(59.5);
    expect(box.width).toBeCloseTo(178.5);
    expect(box.height).toBeCloseTo(84.2);
    expect(box.bottom).toBeCloseTo(H - (0.2 + 0.1) * H);
    expect(box.top).toBeCloseTo(H - 0.2 * H);
  });
});

describe('textBaselinesInBox', () => {
  it('centers single line vertically in box', () => {
    const baselines = textBaselinesInBox(100, 50, 1, 12);
    expect(baselines[0]).toBeGreaterThan(100);
    expect(baselines[0]).toBeLessThan(150);
  });

  it('orders multiple lines top to bottom in PDF coordinates', () => {
    const baselines = textBaselinesInBox(100, 50, 2, 12);
    expect(baselines[0]).toBeGreaterThan(baselines[1]);
  });
});
