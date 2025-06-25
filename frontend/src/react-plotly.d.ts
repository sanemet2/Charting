declare module 'react-plotly.js' {
  import { Component } from 'react';
  
  export interface PlotParams {
    data: any[];
    layout?: any;
    config?: any;
    style?: React.CSSProperties;
    useResizeHandler?: boolean;
    onInitialized?: (figure: any, graphDiv: HTMLDivElement) => void;
    onUpdate?: (figure: any, graphDiv: HTMLDivElement) => void;
    onPurge?: (figure: any, graphDiv: HTMLDivElement) => void;
    onError?: (err: any) => void;
    debug?: boolean;
    onRedraw?: () => void;
    onRelayout?: (eventData: any) => void;
    onRestyle?: (eventData: any) => void;
    onHover?: (eventData: any) => void;
    onUnhover?: (eventData: any) => void;
    onClick?: (eventData: any) => void;
    onDoubleClick?: (eventData: any) => void;
    onSelected?: (eventData: any) => void;
    onDeselect?: () => void;
    onAnimatingFrame?: (eventData: any) => void;
    onAnimated?: () => void;
    revision?: number;
    divId?: string;
    className?: string;
  }

  export default class Plot extends Component<PlotParams> {}
} 