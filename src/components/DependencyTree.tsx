import { useEffect, useId, useMemo, useRef, useState } from "react";
import { arcIsHot, brightNodes, type CardFocus } from "../lib/focus";
import { posGloss, relationFamily, relationGloss } from "../lib/glossary";
import { layoutGraph, type ArcGeom, type LeafFace } from "../lib/layout";
import { useI18n } from "../lib/i18n/I18nContext";
import type { GraphNode, SyntaxGraph, Word } from "../lib/types";

interface Props {
  graph: SyntaxGraph;
  index: number;
  total: number;
  sura: number;
  verse: number;
  words: Word[];
  selectedWord?: number;
  selectedSegment?: number;
  frozen: boolean;
  current?: boolean;
  onSelectWord: (sura: number, verse: number, word: number, segment?: number) => void;
}

export function DependencyTree({
  graph,
  index,
  total,
  sura,
  verse,
  words,
  selectedWord,
  selectedSegment,
  frozen,
  current = false,
  onSelectWord,
}: Props) {
  const { locale, t } = useI18n();
  const [fontsReady, setFontsReady] = useState(false);
  const [fit, setFit] = useState(1);
  const rendered = fit;
  const [folded, setFolded] = useState<ReadonlySet<number>>(new Set());
  const [hover, setHover] = useState<CardFocus | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const scope = `${sura}:${verse}:${frozen}`;
  const [seen, setSeen] = useState(scope);
  if (seen !== scope) {
    setSeen(scope);
    setHover(null);
    setPinned(null);
  }
  const scroller = useRef<HTMLDivElement>(null);
  const arrowId = useId().replace(/:/g, "");

  useEffect(() => {
    let cancel = false;
    document.fonts.ready.then(() => {
      if (!cancel) setFontsReady(true);
    });
    return () => {
      cancel = true;
    };
  }, []);

  const measure = useMemo(() => {
    return (text: string, caption: boolean) => {
      const context = document.createElement("canvas").getContext("2d");
      if (!context) return text.length * (caption ? 7 : 16);
      const wordFace = fontsReady ? '"Scheherazade New", serif' : "serif";
      const labelFace = fontsReady ? '"Noto Sans Arabic", sans-serif' : "sans-serif";
      context.font = caption ? `400 14px ${labelFace}` : `400 30px ${wordFace}`;
      return context.measureText(text).width;
    };
  }, [fontsReady]);

  const face = useMemo(() => {
    return (node: GraphNode): LeafFace => leafFace(node, words, sura, verse);
  }, [words, sura, verse]);

  const layout = useMemo(
    () => layoutGraph(graph, { sura, verse }, measure, face, folded),
    [graph, sura, verse, measure, face, folded],
  );

  useEffect(() => {
    setFolded(new Set());
  }, [graph, sura, verse]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const apply = () => {
      const available = el.clientWidth;
      if (!available || !layout.width) return;
      const usable = Math.max(100, available - 16);
      setFit(Math.max(0.35, Math.min(3.5, usable / layout.width)));
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => observer.disconnect();
  }, [layout.width]);

  const [overflow, setOverflow] = useState({ left: false, right: false });
  const updateOverflow = () => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setOverflow({
      left: el.scrollLeft > 12,
      right: max - el.scrollLeft > 12,
    });
  };

  const reveal = (x1: number, x2: number) => {
    const el = scroller.current;
    if (!el) return;
    const left = Math.min(x1, x2) * rendered;
    const right = Math.max(x1, x2) * rendered;
    const viewLeft = el.scrollLeft;
    const viewRight = viewLeft + el.clientWidth;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    if (left >= viewLeft + 8 && right <= viewRight - 8) return;
    const span = right - left;
    const target = span > el.clientWidth - 24
      ? right - el.clientWidth + 20
      : left < viewLeft
        ? left - 16
        : right - el.clientWidth + 16;
    el.scrollTo({ left: Math.max(0, Math.min(max, target)), behavior: "smooth" });
  };

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
    updateOverflow();
  }, [layout.width, rendered]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.addEventListener("scroll", updateOverflow, { passive: true });
    return () => {
      el.removeEventListener("scroll", updateOverflow);
    };
  }, []);

  const focus: CardFocus | null = frozen ? null : pinned !== null ? { kind: "edge", edge: pinned } : hover;
  const bright = focus ? brightNodes(graph, focus) : null;
  const arcHot = (arc: ArcGeom) => {
    if (frozen) {
      return (
        selectedWord !== undefined &&
        arc.ends.some((nodeIndex) => {
          const node = graph.nodes[nodeIndex];
          return node?.s === sura && node.v === verse && node.w === selectedWord;
        })
      );
    }
    if (!focus) return false;
    return arcIsHot(graph, arc.source, arc.dependent, arc.head, focus);
  };
  const isolating = frozen ? selectedWord !== undefined : focus !== null;
  const focusedEdge = focus?.kind === "edge" ? layout.arcs.find((arc) => arc.source === focus.edge) : undefined;
  const explanation = focusedEdge ? relationGloss(focusedEdge.rel, locale) : null;
  useEffect(() => {
    if (!focusedEdge) return;
    reveal(focusedEdge.x1, focusedEdge.x2);
  }, [focusedEdge]);
  const enterEdge = (source: number) => {
    if (frozen) return;
    setHover({ kind: "edge", edge: source });
  };
  const leaveEdge = () => {
    if (!frozen) setHover(null);
  };
  const pinEdge = (source: number) => {
    if (frozen) return;
    setPinned((current) => (current === source ? null : source));
  };
  const nodeDim = (nodeIndex: number | undefined) => Boolean(bright && nodeIndex !== undefined && !bright.has(nodeIndex));
  const orderedArcs = layout.arcs.map((arc, edgeIndex) => ({ arc, edgeIndex })).sort((a, b) => a.arc.paint - b.arc.paint);

  return (
    <section className={`clause${current ? " is-current" : ""}`} id={`clause-${index}`}>
      <header className="clause-head" dir="rtl">
        <h3 lang="ar">{t.verse.clauseCount(index, total)}</h3>
        {graph.x ? <p dir="auto">{t.verse.clauseNoteContinues}</p> : null}
      </header>
      <div className={`tree-scroll${overflow.left ? " fades-left" : ""}${overflow.right ? " fades-right" : ""}`} ref={scroller}>
        {overflow.left ? <span className="tree-more is-left" aria-hidden="true">‹</span> : null}
        {overflow.right ? <span className="tree-more is-right" aria-hidden="true">›</span> : null}
        <div className="tree-scale" style={{ width: layout.width * rendered, height: layout.height * rendered }}>
          <svg
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            width={layout.width * rendered}
            height={layout.height * rendered}
            role="img"
            aria-label={t.verse.clauseCount(index, total)}
          >
            <defs>
              <marker id={arrowId} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M0 0 L8 4 L0 8 Z" fill="context-stroke" />
              </marker>
            </defs>
            {layout.phrases.map((phrase) => (
              <path
                key={`bracket-${phrase.nodeIndex}`}
                className={`phrase-bracket${nodeDim(phrase.nodeIndex) ? " is-dim" : ""}`}
                d={`M ${phrase.x1} ${phrase.y + 8} V ${phrase.y} H ${phrase.x2} V ${phrase.y + 8}`}
              />
            ))}
            {orderedArcs.map(({ arc, edgeIndex }) => {
              const hot = arcHot(arc);
              const family = relationFamily(arc.rel);
              const dim = isolating && !hot;
              return (
                <g
                  key={`${arc.rel}-${edgeIndex}`}
                  data-arc={`${index}-${arc.source}`}
                  className={`arc-group family-${family}${hot ? " is-hot" : ""}${dim ? " is-dim" : ""}`}
                >
                  <path d={arc.path} className="arc-halo" />
                  <path d={arc.path} className="arc" markerEnd={`url(#${arrowId})`} />
                  <path
                    d={arc.path}
                    className="arc-hit"
                    onClick={() => pinEdge(arc.source)}
                    onMouseEnter={() => enterEdge(arc.source)}
                    onMouseLeave={leaveEdge}
                  />
                </g>
              );
            })}
            {orderedArcs.map(({ arc, edgeIndex }) => {
              const dim = isolating && !arcHot(arc);
              const family = relationFamily(arc.rel);
              return (
                <g
                  key={`label-${arc.rel}-${edgeIndex}`}
                  data-arc={`${index}-${arc.source}`}
                  className={`arc-group arc-label-group family-${family}${dim ? " is-dim" : ""}`}
                  tabIndex={0}
                  role="button"
                  aria-label={arc.name}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      pinEdge(arc.source);
                    }
                  }}
                  onClick={() => pinEdge(arc.source)}
                  onMouseEnter={() => enterEdge(arc.source)}
                  onMouseLeave={leaveEdge}
                >
                  <rect
                    className="label-hit"
                    x={arc.labelX - Math.max(arc.labelWidth, 48) / 2}
                    y={arc.labelY - 28}
                    width={Math.max(arc.labelWidth, 48)}
                    height={48}
                    fill="transparent"
                  />
                  <rect
                    className="label-chip"
                    x={arc.labelX - arc.labelWidth / 2}
                    y={arc.labelY - 14}
                    width={arc.labelWidth}
                    height={20}
                    rx={8}
                  />
                  <text x={arc.labelX} y={arc.labelY} textAnchor="middle" className="arc-label rtl-label">
                    {arc.name}
                  </text>
                </g>
              );
            })}
            {layout.phrases.map((phrase) => (
              <g
                key={`badge-${phrase.nodeIndex}`}
                className={`phrase${nodeDim(phrase.nodeIndex) ? " is-dim" : ""}`}
                onClick={() =>
                  setFolded((current) => {
                    const next = new Set(current);
                    if (next.has(phrase.nodeIndex)) next.delete(phrase.nodeIndex);
                    else next.add(phrase.nodeIndex);
                    return next;
                  })
                }
              >
                <rect
                  className="label-chip"
                  x={phrase.cx - phrase.labelWidth / 2}
                  y={phrase.badgeTop}
                  width={phrase.labelWidth}
                  height={20}
                  rx={8}
                />
                <text x={phrase.cx} y={phrase.badgeTop + 14} textAnchor="middle" className="rtl-label">
                  {phrase.label}
                </text>
              </g>
            ))}
            {layout.boxes.map((box) => {
              const selected =
                selectedWord === box.word &&
                box.verse === verse &&
                box.sura === sura &&
                box.kind === "word" &&
                (selectedSegment === undefined || box.segment === selectedSegment);
              return (
                <g
                  key={`${box.kind}-${box.x}`}
                  data-node={box.phrase ?? box.anchors[0]?.index}
                  className={`node-box kind-${box.kind}${selected ? " is-selected" : ""}${box.outside ? " is-outside" : ""}${nodeDim(box.phrase ?? box.anchors[0]?.index) ? " is-dim" : ""}`}
                  onMouseEnter={() => {
                    if (frozen) return;
                    const nodeIndex = box.phrase ?? box.anchors[0]?.index;
                    if (nodeIndex === undefined) return;
                    setHover({ kind: "node", node: nodeIndex });
                  }}
                  onMouseLeave={() => {
                    if (!frozen) setHover(null);
                  }}
                  onClick={() => {
                    if (box.kind === "card" && box.phrase !== undefined) {
                      setFolded((current) => {
                        const next = new Set(current);
                        next.delete(box.phrase as number);
                        return next;
                      });
                      return;
                    }
                    if (box.sura && box.verse && box.word) onSelectWord(box.sura, box.verse, box.word, box.anchors[0]?.si);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${box.text}${box.caption ? `، ${box.caption}` : ""}`}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && box.sura && box.verse && box.word) {
                      onSelectWord(box.sura, box.verse, box.word, box.anchors[0]?.si);
                    }
                  }}
                >
                  <rect x={box.x} y={box.y} width={box.width} height={box.height} rx={14} />
                  <text x={box.x + box.width / 2} y={box.y + 46} textAnchor="middle" className="node-arabic">
                    {box.text}
                  </text>
                  {box.caption ? (
                    <text x={box.x + box.width / 2} y={box.y + 76} textAnchor="middle" className="node-caption rtl-label">
                      {box.caption}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      {explanation ? (
        <p className="clause-note">
          <strong lang="ar" dir="rtl">{explanation.name}</strong> {explanation.about}
        </p>
      ) : null}
    </section>
  );
}

function leafFace(node: GraphNode, words: Word[], sura: number, verse: number): LeafFace {
  if (node.t === "elide") return { text: node.a || "—", caption: "مقدَّر" };
  const piece = pieceText(node, words, sura, verse);
  if (node.t === "ref") return { text: piece || node.a || "…", caption: "سابق" };
  const word = node.s === sura && node.v === verse ? words.find((item) => item.n === node.w) : undefined;
  const segment = node.si !== undefined ? word?.s[node.si] : undefined;
  return { text: piece || node.a || "·", caption: segment ? posGloss(segment.p).name : "" };
}

function pieceText(node: GraphNode, words: Word[], sura: number, verse: number): string {
  if (node.s !== sura || node.v !== verse || node.w === undefined || node.si === undefined) return "";
  const word = words.find((item) => item.n === node.w);
  if (!word) return "";
  let start = node.si;
  while (start > 0 && word.s[start - 1]?.p === "DET") start -= 1;
  return word.s.slice(start, node.si + 1).map((segment) => segment.a).join("");
}
