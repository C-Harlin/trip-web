import type { BookingRequirement, BookingStatus } from '../types/itinerary'

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  todo: '待预订',
  booked: '已预订',
  optional: '可选',
  not_needed: '无需预订',
}

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  todo: '#E11D48',
  booked: '#059669',
  optional: '#7C3AED',
  not_needed: '#64748B',
}

export const bookingRequirements: Record<string, BookingRequirement> = {
  'syd-d2-a1': {
    activityId: 'syd-d2-a1',
    status: 'todo',
    label: '歌剧院导览',
    bookingUrl: 'https://www.sydneyoperahouse.com/',
    sourceName: 'Sydney Opera House',
    deadline: '建议出发前 2-4 周',
    note: '官网显示 Sydney Opera House Tour 和中文导览均为 Daily，建议提前锁定语言与场次。',
  },
  'syd-d3-a3': {
    activityId: 'syd-d3-a3',
    status: 'todo',
    label: '塔龙加动物园门票',
    bookingUrl: 'https://www.taronga.org.au/',
    sourceName: 'Taronga Zoo Sydney',
    deadline: '建议出发前 1-2 周',
    note: '官网提供 Buy tickets 入口，适合提前买票并和渡轮时间一起规划。',
  },
  'syd-d4-a1': {
    activityId: 'syd-d4-a1',
    status: 'todo',
    label: '蓝山包车/一日游',
    deadline: '建议出发前 2-4 周',
    note: '私人包车需要确认接送地点、车型、回程时间和是否包含 Scenic World 门票。',
  },
  'syd-d4-a5': {
    activityId: 'syd-d4-a5',
    status: 'todo',
    label: '蓝山 Scenic World',
    bookingUrl: 'https://www.scenicworld.com.au/tickets',
    sourceName: 'Scenic World',
    deadline: '建议出发前 1-2 周',
    note: '官网提供 Tickets / Day Passes，页面显示常规开放时间为 9 AM - 5 PM。',
  },
  'syd-d5-a1': {
    activityId: 'syd-d5-a1',
    status: 'todo',
    label: '悉尼观鲸船',
    deadline: '建议出发前 1-2 周',
    note: '需要按当天海况和码头位置选择运营商；建议选可改期/退票条款清晰的班次。',
  },
  'syd-d5-a6': {
    activityId: 'syd-d5-a6',
    status: 'optional',
    label: '悉尼塔眼',
    bookingUrl: 'https://www.sydneytowereye.com.au/tickets-passes/',
    sourceName: 'Sydney Tower Eye',
    deadline: '当天或前 1 天',
    note: '官网写明 Book Online To Guarantee Entry，可作为购物日天气好时的可选项目。',
  },
  'gor-d1-a2': {
    activityId: 'gor-d1-a2',
    status: 'todo',
    label: '悉尼飞墨尔本航班',
    deadline: '建议尽早确认',
    note: '确认托运行李额度、抵达机场和取车时间之间的缓冲。',
  },
  'gor-d1-a3': {
    activityId: 'gor-d1-a3',
    status: 'todo',
    label: '墨尔本租车',
    deadline: '建议出发前 2-4 周',
    note: '确认取还车门店、保险、异地/市区还车规则和驾驶证材料。',
  },
  'gor-d1-a8': {
    activityId: 'gor-d1-a8',
    status: 'todo',
    label: '阿波罗湾住宿',
    deadline: '建议尽早确认',
    note: '大洋路沿线房源有限，建议预留可取消方案。',
  },
  'gor-d2-a2': {
    activityId: 'gor-d2-a2',
    status: 'optional',
    label: '奥特威角灯塔',
    bookingUrl: 'https://www.capeotwaylightstation.com.au/',
    sourceName: 'Cape Otway Lightstation',
    deadline: '当天或前 1 天',
    note: '若天气和时间允许再进入；否则保留给十二门徒沿线。',
  },
  'gor-d2-a7': {
    activityId: 'gor-d2-a7',
    status: 'todo',
    label: '坎贝尔港住宿',
    deadline: '建议尽早确认',
    note: '为了看十二门徒日出，住宿位置越靠近 Port Campbell / Princetown 越稳。',
  },
  'gor-d3-a7': {
    activityId: 'gor-d3-a7',
    status: 'todo',
    label: '墨尔本住宿',
    deadline: '建议尽早确认',
    note: '确认停车、入住时间和后续菲利普岛一日线的出发便利性。',
  },
  'mel-d2-a4': {
    activityId: 'mel-d2-a4',
    status: 'optional',
    label: '丘吉尔岛传统农场',
    bookingUrl: 'https://www.penguins.org.au/',
    sourceName: 'Phillip Island Nature Parks',
    deadline: '前 1-3 天',
    note: '官网将 Churchill Island Heritage Farm 列为 Phillip Island Nature Parks 旗下景点。',
  },
  'mel-d2-a5': {
    activityId: 'mel-d2-a5',
    status: 'optional',
    label: '考拉保护区',
    bookingUrl: 'https://www.penguins.org.au/',
    sourceName: 'Phillip Island Nature Parks',
    deadline: '前 1-3 天',
    note: '官网将 Koala Conservation Reserve 列为 Phillip Island Nature Parks 旗下景点。',
  },
  'mel-d2-a8': {
    activityId: 'mel-d2-a8',
    status: 'todo',
    label: '企鹅归巢',
    bookingUrl: 'https://www.penguins.org.au/',
    sourceName: 'Phillip Island Nature Parks',
    deadline: '建议出发前 2-4 周',
    note: '官网有 Buy Tickets 入口，并显示企鹅到达倒计时；热门场次建议提前订。',
  },
  'mel-d3-a1': {
    activityId: 'mel-d3-a1',
    status: 'not_needed',
    label: 'NGV 常设展',
    bookingUrl: 'https://www.ngv.vic.gov.au/plan-your-visit/',
    sourceName: 'NGV',
    note: '官网显示 NGV International 和 Ian Potter Centre 均为 free entry，特殊展览可能另收费。',
  },
}

export function getBookingRequirement(activityId: string) {
  return bookingRequirements[activityId]
}

export function getBookingRequirements() {
  return Object.values(bookingRequirements)
}
