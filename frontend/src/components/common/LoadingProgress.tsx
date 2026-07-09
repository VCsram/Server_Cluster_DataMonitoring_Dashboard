import './LoadingProgress.scss'

interface Props {
  visible: boolean
  progress: number
  done: number
  total: number
  currentTask?: string
  hint?: string
}

export default function LoadingProgress({ visible, progress, done, total, currentTask, hint }: Props) {
  if (!visible) return null

  return (
    <div className="loading-progress">
      <div className="loading-progress__header">
        <span className="loading-progress__title">数据加载中</span>
        <span className="loading-progress__count">
          {done}/{total}
        </span>
      </div>
      <div className="loading-progress__bar">
        <div className="loading-progress__fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="loading-progress__meta">
        <span>{progress}%</span>
        {currentTask && <span className="loading-progress__task">{currentTask}</span>}
      </div>
      {hint && <p className="loading-progress__hint">{hint}</p>}
    </div>
  )
}
