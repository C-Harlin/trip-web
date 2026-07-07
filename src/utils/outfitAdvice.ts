import type { Activity } from '../types/itinerary'
import type { DayWeather } from '../services/weather'

interface OutfitAdvice {
  summary: string
  tags: string[]
}

export function getOutfitAdvice(weather: DayWeather, activities: Activity[]): OutfitAdvice {
  const hasNature = activities.some(a => a.type === 'nature')
  const hasAttraction = activities.some(a => a.type === 'attraction')
  const hasTransport = activities.some(a => a.type === 'transport')
  const hasFood = activities.some(a => a.type === 'food')
  const rainy = weather.precipitationProbability >= 40 || weather.precipitationSum >= 1
  const windy = weather.windSpeedMax >= 25
  const highUv = weather.uvIndexMax >= 6
  const coolMorning = weather.apparentMin <= 12
  const mildDay = weather.apparentMax >= 18 && weather.apparentMax <= 25
  const warmDay = weather.apparentMax > 25

  const tags: string[] = []
  const pieces: string[] = []

  if (coolMorning) {
    pieces.push('早晚用短款风衣、牛仔外套或薄针织叠一层')
    tags.push('薄外套')
  } else if (mildDay) {
    pieces.push('白天可以短袖、衬衫或轻薄连衣裙，外搭一件开衫更稳')
    tags.push('轻薄叠穿')
  } else if (warmDay) {
    pieces.push('选择透气上衣、半裙或轻薄长裤，版型清爽一点拍照更精神')
    tags.push('清爽透气')
  } else {
    pieces.push('用长袖上衣配轻便外套，保留一点春季层次感')
    tags.push('长袖外套')
  }

  if (rainy) {
    pieces.push('包里放折叠伞，鞋子避开不耐水的浅色麂皮')
    tags.push('折叠伞', '防水友好')
  }

  if (windy) {
    pieces.push('海边或观景点风会明显，裙装建议配安全裤，外套选防风面料')
    tags.push('防风外套')
  }

  if (highUv) {
    pieces.push('加墨镜、帽子和高倍防晒，妆面选轻薄持久型')
    tags.push('防晒', '墨镜')
  }

  if (hasNature || hasAttraction) {
    pieces.push('鞋子优先舒适好走的小白鞋、德训鞋或轻徒步鞋')
    tags.push('好走的鞋')
  }

  if (hasTransport) {
    pieces.push('有转场时用斜挎包或小背包，证件和充电宝拿取更顺')
    tags.push('斜挎包')
  }

  if (hasFood && !rainy) {
    tags.push('拍照友好')
  }

  return {
    summary: dedupeSentences(pieces).join('；') + '。',
    tags: dedupeSentences(tags).slice(0, 5),
  }
}

function dedupeSentences(items: string[]): string[] {
  return Array.from(new Set(items))
}
