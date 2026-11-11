import { forwardRef } from 'react';
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string; absoluteStrokeWidth?: boolean };
/** Shared 24-unit sharp outline family: square terminals, mitered corners, no rounded boxes. */
function icon(name: string, paths: string[]) {
  const Icon = forwardRef<SVGSVGElement, IconProps>(function SharpIcon(
    { size = 24, width, height, strokeWidth = 1.5, absoluteStrokeWidth, className = '', children, ...props }, ref,
  ) {
    return <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      width={width ?? size} height={height ?? size} fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="butt" strokeLinejoin="miter"
      aria-hidden="true" className={`sharp-icon sharp-icon-${name} ${className}`} {...props}>
      {paths.map((d, i) => <path key={i} d={d} vectorEffect={absoluteStrokeWidth ? 'non-scaling-stroke' : undefined} />)}
      {children}
    </svg>;
  });
  Icon.displayName = name;
  return Icon;
}
const octagon = 'M8 3H16L21 8V16L16 21H8L3 16V8Z';
export const Compass = icon('compass', [octagon, 'M16 8L13.5 13.5L8 16L10.5 10.5Z']);
export const Target = icon('target', ['M3 3H21V21H3Z','M7 7H17V17H7Z','M10 10H14V14H10Z']);
export const ShieldCheck = icon('shield-check', ['M12 2L21 6V14L17 19L12 22L7 19L3 14V6Z','M7 11L10.5 14.5L17 8']);
export const ScanLine = icon('scan', ['M3 8V3H8M16 3H21V8M21 16V21H16M8 21H3V16M5 12H19']);
export const MessageSquareText = icon('message', ['M3 3H21V17H8L3 22Z','M7 7H17M7 11H15']);
export const Layers3 = icon('layers', ['M12 2L22 7L12 12L2 7Z','M2 12L12 17L22 12M2 17L12 22L22 17']);
export const Landmark = icon('landmark', ['M2 8L12 2L22 8Z','M4 11V19M9 11V19M15 11V19M20 11V19M2 22H22']);
export const Cpu = icon('cpu', ['M5 5H19V19H5Z','M9 9H15V15H9Z','M8 1V5M12 1V5M16 1V5M8 19V23M12 19V23M16 19V23M1 8H5M1 12H5M1 16H5M19 8H23M19 12H23M19 16H23']);
export const CircleDollarSign = icon('currency', [octagon,'M16 7H9L7 9V10L9 12H15L17 14V15L15 17H7M12 4V20']);
export const Gauge = icon('gauge', ['M3 18V9L8 4H16L21 9V18','M12 17L17 9M6 18H18']);
export const UsersRound = icon('users', ['M6 3H12V9H6Z','M3 21V15L6 12H12L15 15V21M16 3H21V9H16M18 12L22 15V21']);
export const UserRound = icon('user', ['M8 3H16V11H8Z','M3 22V17L7 13H17L21 17V22']);
export const Workflow = icon('workflow', ['M2 2H8V8H2ZM16 16H22V22H16ZM5 8V19H16M8 5H19V16']);
export const Scale = icon('scale', ['M12 2V21M7 22H17M3 7L21 4M5 7L1 15H9ZM19 5L15 13H23Z']);
export const Timer = icon('timer', ['M8 1H16M12 1V5M18 5L21 2', 'M8 5H16L21 10V17L16 22H8L3 17V10Z','M12 8V14H17']);
export const ChartNoAxesCombined = icon('chart', ['M3 21V14M8 21V11M13 21V13M18 21V7','M2 10L8 5L13 8L22 2M16 2H22V8']);
export const BarChart3 = icon('bars', ['M3 2V21H22M7 17V10M12 17V5M17 17V8']);
export const TrendingUp = icon('trend', ['M2 17L9 10L14 14L22 5M16 5H22V11']);
export const Wallet = icon('wallet', ['M3 6V3H19V6M2 6H22V21H2ZM16 11H22V16H16Z']);
export const Globe2 = icon('globe', [octagon,'M3 9H21M3 15H21M10 3L7 9V15L10 21M14 3L17 9V15L14 21']);
export const GitBranch = icon('branch', ['M3 2H9V8H3ZM15 2H21V8H15ZM3 16H9V22H3ZM6 8V16M18 8V11L13 16H6']);
export const CheckCircle2 = icon('checked', [octagon,'M7 12L10.5 15.5L17 9']);
export const Rocket = icon('rocket', ['M9 6L15 2H22V9L18 15L9 6ZM9 6L3 9L2 15L8 13M18 15L15 21L9 22L11 16M7 17L2 22M16 6H18V8H16Z']);
export const Building2 = icon('building', ['M3 22V3H14V22M14 9H21V22M7 7H10M7 11H10M7 15H10M17 13H18M17 17H18M1 22H23']);
export const BriefcaseBusiness = icon('briefcase', ['M8 6V2H16V6M2 6H22V21H2ZM2 11L8 15H16L22 11M10 12H14V17H10Z']);
export const Mail = icon('mail', ['M2 4H22V20H2ZM2 4L12 13L22 4']);
export const Grid2X2 = icon('grid', ['M3 3H10V10H3ZM14 3H21V10H14ZM3 14H10V21H3ZM14 14H21V21H14Z']);
export const FileText = icon('file', ['M4 2H14L20 8V22H4ZM14 2V8H20M8 12H16M8 16H16']);
export const Mic = icon('mic', ['M9 2H15V14H9ZM5 10V15L9 19H15L19 15V10M12 19V23M8 23H16']);
export const Headphones = icon('headphones', ['M3 15V7L8 2H16L21 7V15M3 12H7V22H3ZM17 12H21V22H17Z']);
export const ChevronDownIcon = icon('chevron-down', ['M5 8L12 15L19 8']);
export const ChevronUpIcon = icon('chevron-up', ['M5 16L12 9L19 16']);
export const ChevronLeftIcon = icon('chevron-left', ['M16 5L9 12L16 19']);
export const ChevronRightIcon = icon('chevron-right', ['M8 5L15 12L8 19']);
export const CheckIcon = icon('check', ['M4 12L9 17L21 5']);
export const XIcon = icon('close', ['M5 5L19 19M19 5L5 19']);
export const MinusIcon = icon('minus', ['M4 12H20']);
export const ArrowDownIcon = icon('arrow-down', ['M12 2V21M4 13L12 21L20 13']);
export const MoreHorizontalIcon = icon('more', ['M3 11H5V13H3ZM11 11H13V13H11ZM19 11H21V13H19Z']);
export const SearchIcon = icon('search', ['M5 2H12L16 6V13L12 17H5L1 13V6ZM15 16L22 23']);
export const PanelLeftIcon = icon('panel', ['M2 3H22V21H2ZM8 3V21']);
export const Loader2Icon = icon('loading', ['M12 2H17L22 7V12M22 16L17 22H7L2 17V7L7 2']);
export const CircleCheckIcon = CheckCircle2;
export const CircleCheck = CheckCircle2;
export const InfoIcon = icon('info', [octagon,'M12 10V17M12 6V8']);
export const TriangleAlertIcon = icon('alert', ['M12 2L23 22H1Z','M12 9V15M12 17V19']);
export const OctagonXIcon = icon('error', [octagon,'M8 8L16 16M16 8L8 16']);
