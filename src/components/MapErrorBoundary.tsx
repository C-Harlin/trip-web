import { Component, type ErrorInfo, type ReactNode } from 'react'
import { MapPinned, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class MapErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Trip map failed to render', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-64 w-full flex-col items-center justify-center gap-3 bg-[#E8F0F2] px-6 text-center text-sm text-slate-600">
          <MapPinned size={34} strokeWidth={1.5} className="text-slate-500" />
          <div>
            <div className="font-semibold text-slate-800">地图暂时无法显示</div>
            <div className="mt-1 text-xs text-slate-500">行程内容仍可正常浏览</div>
          </div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <RotateCcw size={14} />
            重新加载地图
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
