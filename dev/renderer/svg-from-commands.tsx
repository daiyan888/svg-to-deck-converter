import { useMemo, type CSSProperties } from 'react';
import type { CommandsItem } from 'svg-to-deck-converter';
import { commandsToInnerMarkup } from './commands-to-markup';

const SVG_NS = 'http://www.w3.org/2000/svg';

interface SvgFromCommandsProps {
  width: number;
  height: number;
  viewBox?: string;
  commands: CommandsItem[];
  className?: string;
  style?: CSSProperties;
}

export function SvgFromCommands({
  width,
  height,
  viewBox,
  commands,
  className,
  style,
}: SvgFromCommandsProps) {
  const innerMarkup = useMemo(() => commandsToInnerMarkup(commands), [commands]);

  return (
    <svg
      xmlns={SVG_NS}
      width={width}
      height={height}
      viewBox={viewBox ?? `0 0 ${width} ${height}`}
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: innerMarkup }}
    />
  );
}
