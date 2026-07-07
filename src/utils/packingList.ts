import { itinerary } from '../data/itinerary'
import type { Activity } from '../types/itinerary'

export interface PackingItem {
  id: string
  category: string
  label: string
  reason: string
  priority: 'must' | 'recommended'
}

function item(
  id: string,
  category: string,
  label: string,
  reason: string,
  priority: PackingItem['priority'] = 'recommended'
): PackingItem {
  return { id, category, label, reason, priority }
}

export function generatePackingList(): PackingItem[] {
  const activities = itinerary.destinations.flatMap(dest =>
    dest.days.flatMap(day => day.activities)
  )

  const hasType = (type: Activity['type']) => activities.some(activity => activity.type === type)
  const hasTitle = (pattern: RegExp) => activities.some(activity => pattern.test(activity.title + activity.description))

  const items: PackingItem[] = [
    item('passport', '证件与预订', '护照与签证/电子许可确认', '跨境出行核心材料，建议纸质和电子备份各一份。', 'must'),
    item('cards', '证件与预订', '银行卡与少量现金', '门票、押金、交通和临时消费都需要备用支付方式。', 'must'),
    item('booking-files', '证件与预订', '机票/酒店/租车/门票确认单', '预订状态追踪里的待办项目完成后统一收进一个离线文件夹。', 'must'),
    item('adapter', '电子设备', '澳洲转换插头', '澳洲常用 I 型插头，手机、相机和充电宝都要用。', 'must'),
    item('power-bank', '电子设备', '充电宝与充电线', '地图导航、拍照和电子票会明显消耗电量。', 'must'),
    item('day-bag', '随身包', '轻便双肩包或斜挎包', '城市步行、渡轮、海岸步道和一日游都需要随身收纳。', 'recommended'),
    item('walking-shoes', '衣物鞋包', '舒适步行鞋', '每天都有城市步行、观景点或步道，鞋比造型更重要。', 'must'),
    item('layers', '衣物鞋包', '薄外套/针织/防风层', '9月底到10月初是澳洲春季，早晚和海边风感会偏凉。', 'must'),
    item('laundry', '衣物鞋包', '收纳袋与便携洗衣袋', `${itinerary.dateRange} 多城市换住，分装会省很多整理时间。`, 'recommended'),
  ]

  if (hasType('nature') || hasTitle(/海岸|步道|蓝山|十二门徒|企鹅|邦迪|奥特威|诺比司/)) {
    items.push(
      item('sunscreen', '户外与防晒', '防晒霜、墨镜、遮阳帽', '蓝山、大洋路和海岸步道户外时间长，春季紫外线也不能轻敌。', 'must'),
      item('wind-shell', '户外与防晒', '防风外套', '观鲸、海岸线、十二门徒日出和企鹅归巢都容易遇到风。', 'must')
    )
  }

  if (hasTitle(/企鹅|日出|观鲸|海滩|海岸/)) {
    items.push(
      item('warm-night', '户外与防晒', '夜间保暖层', '企鹅归巢和十二门徒日出都不是正午温度，站着等时会更冷。', 'recommended'),
      item('rain-shell', '户外与防晒', '轻便雨衣或折叠伞', '海岸天气变化快，雨具比厚外套更灵活。', 'recommended')
    )
  }

  if (hasTitle(/租车|取车|自驾|大洋路/)) {
    items.push(
      item('drive-docs', '自驾与转场', '驾照材料与租车确认单', '大洋路段涉及取车、自驾和住宿换点，材料要离线可查。', 'must'),
      item('car-kit', '自驾与转场', '车载充电线/手机支架', '长距离导航时能减少手机没电和临时找路的压力。', 'recommended')
    )
  }

  if (hasTitle(/动物园|企鹅|考拉|农场/)) {
    items.push(
      item('camera', '拍照与体验', '相机或足够手机存储空间', '动物园、企鹅岛和大洋路都很吃拍照容量。', 'recommended'),
      item('quiet-layer', '拍照与体验', '深色低调外套', '企鹅归巢这类夜间自然观察更适合低调、保暖的外层。', 'recommended')
    )
  }

  if (hasTitle(/航班|机场|飞行/)) {
    items.push(
      item('flight-pouch', '飞行与酒店', '证件收纳包', '多段机场转场时，把护照、登机牌和确认单集中放最稳。', 'recommended'),
      item('sleep-kit', '飞行与酒店', '眼罩/耳塞', '夜间抵达和换酒店时，保证恢复比多带一套衣服更值。', 'recommended')
    )
  }

  return dedupeItems(items)
}

function dedupeItems(items: PackingItem[]) {
  const seen = new Set<string>()
  return items.filter(item => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}
