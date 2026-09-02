const FACE_NAMES = ['U', 'R', 'F', 'D', 'L', 'B'] as const;

export function splitFacelets(facelets: string | null): string[][] | null {
  if (!facelets || facelets.length !== 54) return null;
  return FACE_NAMES.map((_, index) => facelets.slice(index * 9, index * 9 + 9).split(''));
}

export function CubeFaceletNet({ facelets }: { facelets: string | null }) {
  const faces = splitFacelets(facelets);
  if (!faces) return <p className="facelet-empty">Afventer en fuld aflæsning fra terningen.</p>;

  return (
    <div className="facelet-net" aria-label="Farver aflæst direkte fra GoCube">
      {faces.map((stickers, index) => (
        <div className={`facelet-face face-${FACE_NAMES[index]}`} key={FACE_NAMES[index]}>
          <strong>{FACE_NAMES[index]}</strong>
          <div>
            {stickers.map((sticker, stickerIndex) => (
              <i
                className={`facelet-color color-${sticker}`}
                key={stickerIndex}
                title={`${FACE_NAMES[index]}${stickerIndex + 1}: ${sticker}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
