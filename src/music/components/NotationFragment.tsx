import { useEffect, useRef } from 'react';

export function NotationFragment({ keys = ['c/4', 'eb/4'] }: { keys?: string[] }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    void import('vexflow').then(({ Formatter, Renderer, Stave, StaveNote }) => {
      if (!active || !host.current) return;
      host.current.replaceChildren();
      const renderer = new Renderer(host.current, Renderer.Backends.SVG);
      renderer.resize(250, 120);
      const context = renderer.getContext();
      const stave = new Stave(8, 8, 230).addClef('treble');
      stave.setContext(context).draw();
      const notes = keys.map((key) => new StaveNote({ keys: [key], duration: 'q' }));
      Formatter.FormatAndDraw(context, stave, notes);
    });
    return () => {
      active = false;
    };
  }, [keys]);
  return <div className="notation-fragment" ref={host} aria-label="Kort nodeeksempel" />;
}
