// 数値の表示/丸めヘルパー。

/** 小数第1位に丸める（重量・体組成など）。 */
export function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** 0..1 の割合を 0..100 の整数パーセントに変換。 */
export function toPct(fraction: number): number {
  return Math.round(fraction * 100)
}
