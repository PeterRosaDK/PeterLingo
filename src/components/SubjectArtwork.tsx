import { useId } from 'react';
import type { DisciplineId } from '../learning/types';

/** Original local vector artwork: decorative, theme-aware and available offline. */
export function SubjectArtwork({ id }: { id: Exclude<DisciplineId, 'roux'> }) {
  const gradient = useId();
  return (
    <svg className="subject-artwork" viewBox="0 0 320 180" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradient} x2="1" y2="1">
          <stop stopColor="currentColor" stopOpacity=".28" />
          <stop offset="1" stopColor="currentColor" stopOpacity=".03" />
        </linearGradient>
      </defs>
      <rect x="12" y="8" width="296" height="164" rx="30" fill={`url(#${gradient})`} />
      <circle cx="270" cy="32" r="45" fill="currentColor" opacity=".08" />
      <g
        className="art-ink"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {id === 'doomsday' && (
          <g transform="rotate(-7 160 90)">
            <rect className="art-paper" x="90" y="24" width="140" height="134" rx="16" />
            <path d="M90 60h140M120 16v20M200 16v20" />
            <text
              x="160"
              y="112"
              textAnchor="middle"
              fontSize="46"
              stroke="none"
              fill="currentColor"
            >
              {new Date().getDate()}
            </text>
            <path d="M122 136h18m14 0h18m14 0h12" opacity=".4" />
            <circle cx="252" cy="124" r="22" className="art-paper" />
            <path d="m242 124 7 7 14-16" />
          </g>
        )}
        {id === 'cards' && (
          <g>
            <g transform="rotate(-14 130 90)">
              <rect className="art-paper" x="70" y="22" width="95" height="132" rx="12" />
              <text x="88" y="51" fontSize="22" stroke="none" fill="currentColor">
                7
              </text>
              <path d="m115 66 16 25-16 25-16-25Z" fill="currentColor" />
            </g>
            <g transform="rotate(12 195 90)">
              <rect className="art-paper" x="151" y="25" width="95" height="132" rx="12" />
              <text x="167" y="53" fontSize="22" stroke="none" fill="currentColor">
                5
              </text>
              <path
                d="M198 78c-17-22-38 4 0 29 38-25 17-51 0-29Z"
                fill="currentColor"
                stroke="none"
              />
            </g>
          </g>
        )}
        {id === 'pi' && (
          <g>
            <circle cx="160" cy="91" r="58" strokeDasharray="2 9" opacity=".5" />
            <path d="M46 132c35-88 53 26 88-22s56-63 140-13" opacity=".3" />
            <text
              x="160"
              y="113"
              textAnchor="middle"
              fontSize="88"
              fontFamily="Georgia,serif"
              stroke="none"
              fill="currentColor"
            >
              π
            </text>
            <text x="235" y="45" fontSize="16" stroke="none" fill="currentColor">
              3.14159
            </text>
          </g>
        )}
        {id === 'music-ear' && (
          <g>
            {[55, 68, 81, 94, 107].map((y) => (
              <path key={y} d={`M40 ${y}h240`} opacity=".18" />
            ))}
            <path d="M125 101V41l73-14v61M125 55l73-14" strokeWidth="6" />
            <ellipse cx="112" cy="105" rx="15" ry="10" fill="currentColor" />
            <ellipse cx="185" cy="92" rx="15" ry="10" fill="currentColor" />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <rect
                key={i}
                className="art-paper"
                x={59 + i * 25}
                y="128"
                width="24"
                height="31"
                rx="3"
              />
            ))}
          </g>
        )}
        {id === 'elements' && (
          <g>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <rect
                key={i}
                x={37 + i * 40}
                y={i < 2 ? 57 : 105}
                width="30"
                height="30"
                rx="6"
                opacity=".3"
              />
            ))}
            <g transform="rotate(-6 173 80)">
              <rect className="art-paper" x="120" y="23" width="103" height="106" rx="16" />
              <text x="135" y="48" fontSize="15" stroke="none" fill="currentColor">
                26
              </text>
              <text
                x="171"
                y="91"
                textAnchor="middle"
                fontSize="42"
                stroke="none"
                fill="currentColor"
              >
                Fe
              </text>
              <text
                x="172"
                y="114"
                textAnchor="middle"
                fontSize="13"
                stroke="none"
                fill="currentColor"
              >
                JERN
              </text>
            </g>
            <path d="M63 34h22m-11-11v22M247 57l9-9m-9 0 9 9" opacity=".5" />
          </g>
        )}
        {id === 'morse' && (
          <g>
            <rect className="art-paper" x="55" y="38" width="210" height="115" rx="22" />
            <path d="m215 38 21-23" />
            <circle cx="218" cy="98" r="22" />
            <path d="m218 98 12-11" />
            <path d="M76 66h91" opacity=".4" />
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <path
                key={i}
                d={`M${80 + i * 11} ${98 - Math.sin(i * 1.9) ** 2 * 19}v${12 + Math.sin(i * 1.9) ** 2 * 30}`}
                strokeWidth="4"
              />
            ))}
            <path d="M78 138h10m14 0h28m14 0h10" strokeWidth="5" />
          </g>
        )}
        {id === 'flashcards' && (
          <g>
            <rect
              x="77"
              y="35"
              width="140"
              height="119"
              rx="16"
              transform="rotate(-10 147 94)"
              opacity=".4"
            />
            <rect
              className="art-paper"
              x="100"
              y="23"
              width="142"
              height="125"
              rx="18"
              transform="rotate(5 171 85)"
            />
            <text
              x="171"
              y="93"
              textAnchor="middle"
              fontSize="51"
              stroke="none"
              fill="currentColor"
            >
              学
            </text>
            <path d="M149 117h44" opacity=".35" />
            <path d="M52 90a30 30 0 0 1 25-29m-9-5 10 5-6 10M263 98a30 30 0 0 1-21 31m10 5-11-4 4-11" />
          </g>
        )}
        {id === 'phonetics' && (
          <g>
            <rect className="art-paper" x="45" y="39" width="231" height="108" rx="15" />
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((i) => (
              <g key={i} opacity={0.15 + (i % 5) * 0.12}>
                <path d={`M${62 + i * 14} 119v-${18 + ((i * 17) % 49)}`} strokeWidth="7" />
                <path d={`M${62 + i * 14} 63v-${5 + ((i * 7) % 17)}`} strokeWidth="7" />
              </g>
            ))}
            <circle cx="226" cy="61" r="36" className="art-paper" />
            <text
              x="226"
              y="77"
              textAnchor="middle"
              fontSize="48"
              stroke="none"
              fill="currentColor"
            >
              ə
            </text>
          </g>
        )}
        {id === 'python_output' && (
          <g>
            <rect className="art-paper" x="47" y="24" width="227" height="135" rx="18" />
            <path d="M47 52h227" opacity=".3" />
            {[65, 77, 89].map((x) => (
              <circle key={x} cx={x} cy="39" r="3" fill="currentColor" stroke="none" />
            ))}
            <path d="m74 76 11 9-11 9m24-18 11 9-11 9M126 84h70M126 100h47M75 125h65" />
            <rect x="151" y="117" width="9" height="15" fill="currentColor" stroke="none" />
          </g>
        )}
      </g>
    </svg>
  );
}
