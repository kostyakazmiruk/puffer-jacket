import { useRef, useState } from 'react'

export const JACKET_TRANSITION_SECONDS = 1.2
export type JacketFlight = { x: number; y: number; scale: number; backwards: boolean }

/** Measure the actual preview so the flight also follows the mobile layout. */
export function useJacketTransition(initialVariant = 0) {
  const [variant, setVariant] = useState(initialVariant)
  const [isFlying, setIsFlying] = useState(false)
  const [flight, setFlight] = useState<JacketFlight>({ x: 0, y: 0, scale: 1, backwards: false })
  const stageRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLSpanElement>(null)
  const locked = useRef(false)

  function selectVariant(target: number, backwards = false) {
    if (locked.current || target === variant) return
    const stage = stageRef.current?.getBoundingClientRect()
    const preview = previewRef.current?.getBoundingClientRect()
    if (stage && preview) {
      setFlight({
        x: preview.left + preview.width / 2 - (stage.left + stage.width / 2),
        y: preview.top + preview.height / 2 - (stage.top + stage.height / 2),
        scale: Math.min(preview.width, preview.height) / Math.min(stage.width, stage.height),
        backwards,
      })
    }
    locked.current = true
    setIsFlying(true)
    setVariant(target)
  }

  function finishFlight() {
    locked.current = false
    setIsFlying(false)
  }

  return { variant, flight, isFlying, stageRef, previewRef, selectVariant, finishFlight }
}
